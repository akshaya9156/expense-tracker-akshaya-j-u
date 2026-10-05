# Expense Tracker

A simple, responsive application to track income and expenses in Indian rupees (INR). Built with vanilla HTML, CSS, and JavaScript, with no dependencies, backend, or database.

[Live application](https://akshaya9156.github.io/expense-tracker-akshaya-j-u/) · [GitHub repository](https://github.com/akshaya9156/expense-tracker-akshaya-j-u)

## Features

- Add income and expenses with an amount, category, date, and description.
- Edit transactions and confirm before deleting them.
- See total income, total expenses, and the current balance.
- Filter by transaction type and category together.
- View a monthly expense total and category breakdown chart.
- Get helpful messages for missing or invalid fields.
- Use the application on desktop, tablet, and mobile.

## Technologies and files

```text
expense-tracker/
├── index.html   — page structure and form
├── style.css    — styling and responsive layouts
├── script.js    — transactions, validation, totals, and storage
└── README.md    — project instructions
```

## How to run

Download and extract the project, then open `index.html` in a modern browser. Keep all four files in the same folder. No installation, terminal commands, or build step is needed.

## Basic usage

1. Select Income or Expense and complete the transaction form.
2. Click **Add transaction**. Transactions appear with the newest date first.
3. Use **Edit** to change a transaction, then **Save changes**, or **Cancel edit** to discard your edits.
4. Use **Delete** and confirm to remove a transaction.
5. Choose a type and/or category to filter the list. Overview totals always include all transactions.
6. Choose a month under **Monthly spending** to see that month's expenses by category. This summary is independent of the list filters.

## Local Storage

Transactions are saved as a JSON array in browser `localStorage` under `expense-tracker-akshaya-ju-v1`. Each object contains a unique ID, type, amount, category, date, and description. Amounts are stored as integer paise for accurate calculations.

Data remains after refresh or reopening in the same browser and location. It is not sent to a server or shared between devices. Clearing browser data removes saved transactions; private browsing may remove them when the session ends. Storage for directly opened files can vary between browsers. Use the same file location or the hosted application for consistent access.

If storage is blocked or a change cannot be saved, the application displays an error instead of claiming it was saved.
