"use strict";

const STORAGE_KEY = "expense-tracker-akshaya-ju-v1";
const form = document.getElementById("transaction-form");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const typeFilter = document.getElementById("type-filter");
const categoryFilter = document.getElementById("category-filter");
const monthInput = document.getElementById("summary-month");
const transactionList = document.getElementById("transaction-list");
const statusMessage = document.getElementById("status-message");
const deleteDialog = document.getElementById("delete-dialog");
const categories = Array.from(categoryInput.options).map(option => option.value).filter(Boolean);
const moneyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
let transactions = [];
let editingId = null;
let deletingId = null;
let storageAvailable = true;

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Money is stored as integer paise to avoid floating-point rounding errors.
function formatMoney(amount) {
  return moneyFormatter.format(amount / 100);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > "2100-12-31") return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validStoredTransaction(item) {
  return item && typeof item.id === "string" && item.id.length > 0
    && ["income", "expense"].includes(item.type)
    && Number.isSafeInteger(item.amount) && item.amount > 0 && item.amount <= 99999999999
    && categories.includes(item.category) && validDate(item.date)
    && typeof item.description === "string" && item.description.trim().length > 0 && item.description.length <= 160;
}

function showStorageError(message) {
  const notice = document.getElementById("storage-error");
  notice.textContent = message;
  notice.hidden = false;
}

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return;
    const data = JSON.parse(saved);
    if (!Array.isArray(data) || !data.every(validStoredTransaction)
      || new Set(data.map(item => item.id)).size !== data.length) {
      throw new Error("Invalid saved data");
    }
    transactions = data;
  } catch {
    storageAvailable = false;
    document.getElementById("transaction-fields").disabled = true;
    showStorageError("Saved transactions could not be loaded. Please allow browser storage and reload. Existing saved data has not been overwritten.");
  }
}

function saveTransactions(updatedTransactions) {
  if (!storageAvailable) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
    transactions = updatedTransactions;
    document.getElementById("storage-error").hidden = true;
    return true;
  } catch {
    showStorageError("Your change could not be saved. Browser storage may be full or blocked. Please free some space or allow storage, then try again.");
    return false;
  }
}

function clearValidation() {
  [amountInput, categoryInput, dateInput, descriptionInput].forEach(input => {
    input.removeAttribute("aria-invalid");
    document.getElementById(`${input.id}-error`).hidden = true;
  });
}

function validateForm() {
  clearValidation();
  const errors = [];
  const amount = amountInput.value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || Number(amount) > 999999999.99) {
    errors.push([amountInput, "Enter an amount from ₹0.01 to ₹99,99,99,999.99, with up to 2 decimal places."]);
  }
  if (!categories.includes(categoryInput.value)) errors.push([categoryInput, "Please choose a category."]);
  if (!validDate(dateInput.value)) errors.push([dateInput, "Choose a valid date between 1900 and 2100."]);
  if (!descriptionInput.value.trim() || descriptionInput.value.trim().length > 160) {
    errors.push([descriptionInput, "Enter a description of 1 to 160 characters."]);
  }
  errors.forEach(([input, message]) => {
    input.setAttribute("aria-invalid", "true");
    const error = document.getElementById(`${input.id}-error`);
    error.textContent = message;
    error.hidden = false;
  });
  if (errors.length) errors[0][0].focus();
  return errors.length === 0;
}

function resetForm() {
  form.reset();
  editingId = null;
  dateInput.value = today();
  document.getElementById("form-title").textContent = "Add transaction";
  document.getElementById("submit-button").textContent = "Add transaction";
  document.getElementById("cancel-edit").hidden = true;
  clearValidation();
}

function renderSummary() {
  let income = 0;
  let expenses = 0;
  transactions.forEach(transaction => {
    if (transaction.type === "income") income += transaction.amount;
    else expenses += transaction.amount;
  });
  document.getElementById("total-income").textContent = formatMoney(income);
  document.getElementById("total-expenses").textContent = formatMoney(expenses);
  document.getElementById("current-balance").textContent = formatMoney(income - expenses);
}

function renderTransactions() {
  const filtered = transactions.filter(transaction =>
    (typeFilter.value === "all" || transaction.type === typeFilter.value)
    && (categoryFilter.value === "all" || transaction.category === categoryFilter.value)
  ).sort((a, b) => b.date.localeCompare(a.date));

  transactionList.replaceChildren();
  document.getElementById("transaction-count").textContent = `${filtered.length} of ${transactions.length} transactions`;
  document.getElementById("empty-state").hidden = filtered.length > 0;
  document.getElementById("table-container").hidden = filtered.length === 0;
  document.getElementById("empty-title").textContent = transactions.length ? "No matching transactions" : "Your transactions start here";
  document.getElementById("empty-description").textContent = transactions.length
    ? "Try a different type or category to see more transactions."
    : "Add your first income or expense using the form.";

  filtered.forEach(transaction => {
    const row = document.createElement("tr");
    const details = row.insertCell();
    details.className = "transaction-cell";
    const description = document.createElement("span");
    description.className = "description-text";
    // textContent displays user input as text, never as executable HTML.
    description.textContent = transaction.description;
    const badge = document.createElement("span");
    badge.className = `type-badge ${transaction.type}`;
    badge.textContent = transaction.type === "income" ? "Income" : "Expense";
    details.append(description, badge);

    const category = row.insertCell();
    category.className = "category-cell";
    category.textContent = transaction.category;
    const date = row.insertCell();
    date.className = "date-cell";
    date.textContent = dateFormatter.format(new Date(`${transaction.date}T00:00:00`));
    const amount = row.insertCell();
    amount.className = `amount-cell ${transaction.type}`;
    amount.textContent = `${transaction.type === "income" ? "+" : "−"}${formatMoney(transaction.amount)}`;

    const actions = row.insertCell();
    actions.className = "actions-cell";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "row-button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${transaction.description}`);
    editButton.addEventListener("click", () => editTransaction(transaction.id));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "row-button delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${transaction.description}`);
    deleteButton.addEventListener("click", () => {
      deletingId = transaction.id;
      document.getElementById("delete-description").textContent = `${transaction.description} · ${formatMoney(transaction.amount)}`;
      deleteDialog.showModal();
    });
    actions.append(editButton, deleteButton);
    transactionList.append(row);
  });
}

function editTransaction(id) {
  const transaction = transactions.find(item => item.id === id);
  if (!transaction) return;
  editingId = id;
  typeInput.value = transaction.type;
  amountInput.value = (transaction.amount / 100).toFixed(2);
  categoryInput.value = transaction.category;
  dateInput.value = transaction.date;
  descriptionInput.value = transaction.description;
  document.getElementById("form-title").textContent = "Edit transaction";
  document.getElementById("submit-button").textContent = "Save changes";
  document.getElementById("cancel-edit").hidden = false;
  statusMessage.textContent = "Update the details, then save your changes.";
  clearValidation();
  form.scrollIntoView({ block: "center" });
  typeInput.focus({ preventScroll: true });
}

function renderMonthlySummary() {
  const expenses = transactions.filter(transaction => transaction.type === "expense" && transaction.date.slice(0, 7) === monthInput.value);
  const total = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryTotals = {};
  expenses.forEach(transaction => {
    categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
  });
  document.getElementById("monthly-expenses").textContent = formatMoney(total);
  document.getElementById("monthly-count").textContent = `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"} this month`;
  document.getElementById("monthly-empty").hidden = expenses.length > 0;
  const chart = document.getElementById("category-chart");
  chart.replaceChildren();
  Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([category, amount]) => {
    const percentage = amount / total * 100;
    const item = document.createElement("li");
    const label = document.createElement("div");
    label.className = "chart-label";
    const name = document.createElement("span");
    name.textContent = category;
    const value = document.createElement("span");
    value.textContent = `${formatMoney(amount)} · ${Math.round(percentage)}%`;
    label.append(name, value);
    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("aria-hidden", "true");
    const bar = document.createElement("span");
    bar.className = "bar-fill";
    bar.style.width = `${percentage}%`;
    track.append(bar);
    item.append(label, track);
    chart.append(item);
  });
}

function render() {
  renderSummary();
  renderTransactions();
  renderMonthlySummary();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  statusMessage.textContent = "";
  if (!validateForm()) return;
  const wasEditing = editingId !== null;
  const transaction = {
    id: editingId || (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    type: typeInput.value,
    amount: Math.round(Number(amountInput.value) * 100),
    category: categoryInput.value,
    date: dateInput.value,
    description: descriptionInput.value.trim()
  };
  const updated = wasEditing
    ? transactions.map(item => item.id === editingId ? transaction : item)
    : [...transactions, transaction];
  if (!saveTransactions(updated)) return;
  resetForm();
  // Show the saved transaction even if the previous filters would hide it.
  typeFilter.value = "all";
  categoryFilter.value = "all";
  render();
  statusMessage.textContent = wasEditing ? "Transaction updated." : "Transaction added.";
});

document.getElementById("cancel-edit").addEventListener("click", () => {
  resetForm();
  statusMessage.textContent = "Edit cancelled. No changes were saved.";
});

document.getElementById("cancel-delete").addEventListener("click", () => deleteDialog.close());
deleteDialog.addEventListener("close", () => { deletingId = null; });
document.getElementById("confirm-delete").addEventListener("click", () => {
  if (!deletingId) return;
  const updated = transactions.filter(transaction => transaction.id !== deletingId);
  if (!saveTransactions(updated)) {
    deleteDialog.close();
    return;
  }
  if (editingId === deletingId) resetForm();
  deleteDialog.close();
  render();
  statusMessage.textContent = "Transaction deleted.";
});

typeFilter.addEventListener("change", renderTransactions);
categoryFilter.addEventListener("change", renderTransactions);
monthInput.addEventListener("change", () => {
  if (!monthInput.value || !monthInput.checkValidity()) monthInput.value = today().slice(0, 7);
  renderMonthlySummary();
});

categories.forEach(category => categoryFilter.add(new Option(category, category)));
dateInput.value = today();
monthInput.value = today().slice(0, 7);
loadTransactions();
render();
