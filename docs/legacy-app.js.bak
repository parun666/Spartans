const storeKey = "fintrack.v1";

const categories = {
  income: ["Salary", "Freelance", "Investments", "Refunds"],
  expense: ["Food", "Rent", "Transport", "Utilities", "Health", "Shopping", "Education"]
};

const defaultBudgets = [
  { category: "Food", limit: 10000 },
  { category: "Rent", limit: 22000 },
  { category: "Transport", limit: 5000 },
  { category: "Shopping", limit: 8000 }
];

const state = loadState();
const page = document.body.dataset.page || "overview";

const nodes = {
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  savingsRate: document.querySelector("#savingsRate"),
  form: document.querySelector("#transactionForm"),
  editingId: document.querySelector("#editingId"),
  description: document.querySelector("#descriptionInput"),
  amount: document.querySelector("#amountInput"),
  type: document.querySelector("#typeInput"),
  category: document.querySelector("#categoryInput"),
  date: document.querySelector("#dateInput"),
  saveButton: document.querySelector("#saveTransactionButton"),
  filterType: document.querySelector("#filterType"),
  table: document.querySelector("#transactionTable"),
  chart: document.querySelector("#cashflowChart"),
  budgetList: document.querySelector("#budgetList"),
  goalForm: document.querySelector("#goalForm"),
  goalName: document.querySelector("#goalNameInput"),
  goalTarget: document.querySelector("#goalTargetInput"),
  goalSaved: document.querySelector("#goalSavedInput"),
  goalList: document.querySelector("#goalList"),
  seedButton: document.querySelector("#seedButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  recentList: document.querySelector("#recentList"),
  emptyTemplate: document.querySelector("#emptyTemplate")
};

initSharedActions();
initTransactionsPage();
initGoalsPage();
renderPage();

function initSharedActions() {
  if (nodes.seedButton) {
    nodes.seedButton.addEventListener("click", seedSampleData);
  }

  if (nodes.exportButton) {
    nodes.exportButton.addEventListener("click", exportData);
  }

  if (nodes.importInput) {
    nodes.importInput.addEventListener("change", importData);
  }
}

function initTransactionsPage() {
  if (!nodes.form) {
    return;
  }

  nodes.date.valueAsDate = new Date();
  populateCategories();
  nodes.type.addEventListener("change", populateCategories);
  nodes.filterType.addEventListener("change", renderTransactions);
  nodes.form.addEventListener("submit", saveTransaction);
}

function initGoalsPage() {
  if (nodes.goalForm) {
    nodes.goalForm.addEventListener("submit", saveGoal);
  }
}

function loadState() {
  const fallback = createDefaultState();

  try {
    const raw = localStorage.getItem(storeKey);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : defaultBudgets
    };
  } catch {
    return fallback;
  }
}

function createDefaultState() {
  const today = new Date();
  const iso = (monthOffset, day) => {
    const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, day);
    return date.toISOString().slice(0, 10);
  };

  return {
    budgets: defaultBudgets,
    goals: [{ id: "goal-emergency", name: "Emergency fund", target: 100000, saved: 42000 }],
    transactions: [
      { id: "demo-salary", description: "Monthly salary", amount: 72000, type: "income", category: "Salary", date: iso(0, 1) },
      { id: "demo-transfer", description: "Lucas Bennett", amount: 2500, type: "income", category: "Refunds", date: iso(0, 20) },
      { id: "demo-drive", description: "Google Drive", amount: 500, type: "expense", category: "Utilities", date: iso(0, 20) },
      { id: "demo-store", description: "Nike Store", amount: 5500, type: "expense", category: "Shopping", date: iso(0, 19) },
      { id: "demo-rent", description: "Apartment rent", amount: 18000, type: "expense", category: "Rent", date: iso(0, 3) },
      { id: "demo-groceries", description: "Groceries", amount: 4200, type: "expense", category: "Food", date: iso(0, 8) },
      { id: "demo-metro", description: "Metro card", amount: 1400, type: "expense", category: "Transport", date: iso(0, 10) },
      { id: "demo-freelance", description: "Freelance payout", amount: 15000, type: "income", category: "Freelance", date: iso(-1, 18) },
      { id: "demo-course", description: "Course subscription", amount: 2500, type: "expense", category: "Education", date: iso(-1, 15) }
    ]
  };
}

function persist() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function populateCategories() {
  if (!nodes.type || !nodes.category) {
    return;
  }

  const selected = nodes.type.value;
  nodes.category.replaceChildren();
  categories[selected].forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    nodes.category.append(option);
  });
}

function saveTransaction(event) {
  event.preventDefault();

  const transaction = {
    id: nodes.editingId.value || makeId(),
    description: nodes.description.value.trim(),
    amount: Number(nodes.amount.value),
    type: nodes.type.value,
    category: nodes.category.value,
    date: nodes.date.value
  };

  if (!transaction.description || transaction.amount <= 0 || !transaction.date) {
    return;
  }

  const existingIndex = state.transactions.findIndex((item) => item.id === transaction.id);
  if (existingIndex >= 0) {
    state.transactions[existingIndex] = transaction;
  } else {
    state.transactions.unshift(transaction);
  }

  nodes.form.reset();
  nodes.date.valueAsDate = new Date();
  nodes.editingId.value = "";
  nodes.saveButton.textContent = "Add";
  populateCategories();
  persist();
  renderPage();
}

function saveGoal(event) {
  event.preventDefault();
  const target = Number(nodes.goalTarget.value);
  const saved = Number(nodes.goalSaved.value);

  if (!nodes.goalName.value.trim() || target <= 0 || saved < 0) {
    return;
  }

  state.goals.push({
    id: makeId(),
    name: nodes.goalName.value.trim(),
    target,
    saved: Math.min(saved, target)
  });

  nodes.goalForm.reset();
  persist();
  renderGoals();
}

function renderPage() {
  if (page === "overview") {
    renderMetrics();
    renderChart();
    renderRecentTransactions();
  }

  if (page === "transactions") {
    renderTransactions();
  }

  if (page === "budgets") {
    renderBudgets();
  }

  if (page === "goals") {
    renderGoals();
  }
}

function renderMetrics() {
  if (!nodes.incomeTotal && !nodes.expenseTotal && !nodes.balanceTotal && !nodes.savingsRate) {
    return;
  }

  const monthTransactions = getCurrentMonthTransactions();
  const income = sumByType(monthTransactions, "income");
  const expense = sumByType(monthTransactions, "expense");
  const balance = income - expense;
  const rate = income > 0 ? Math.round((balance / income) * 100) : 0;

  if (nodes.incomeTotal) {
    nodes.incomeTotal.textContent = formatCurrency(income);
  }

  if (nodes.expenseTotal) {
    nodes.expenseTotal.textContent = formatCurrency(expense);
  }

  if (nodes.balanceTotal) {
    nodes.balanceTotal.textContent = formatCurrency(balance);
  }

  if (nodes.savingsRate) {
    nodes.savingsRate.textContent = `+ ${Math.max(rate, 0)}%`;
  }
}

function renderTransactions() {
  if (!nodes.table || !nodes.filterType) {
    return;
  }

  const filter = nodes.filterType.value;
  const rows = state.transactions
    .filter((item) => filter === "all" || item.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  nodes.table.replaceChildren();
  if (!rows.length) {
    nodes.table.append(nodes.emptyTemplate.content.cloneNode(true));
    return;
  }

  rows.forEach((transaction) => {
    const row = document.createElement("tr");
    row.append(
      cell(formatDate(transaction.date)),
      cell(transaction.description),
      cell(transaction.category),
      amountCell(transaction),
      actionCell(transaction)
    );
    nodes.table.append(row);
  });
}

function renderChart() {
  if (!nodes.chart) {
    return;
  }

  const months = getRecentMonths(6);
  const totals = months.map((month) => {
    const monthRows = state.transactions.filter((item) => item.date.startsWith(month.key));
    return {
      label: month.label,
      income: sumByType(monthRows, "income"),
      expense: sumByType(monthRows, "expense")
    };
  });
  const max = Math.max(1, ...totals.flatMap((item) => [item.income, item.expense]));

  nodes.chart.replaceChildren();
  totals.forEach((item) => {
    const group = document.createElement("div");
    group.className = "bar-pair";
    group.title = `${item.label}: in ${formatCurrency(item.income)}, out ${formatCurrency(item.expense)}`;

    const incomeBar = document.createElement("div");
    incomeBar.className = "bar in";
    incomeBar.style.height = `${Math.max(5, (item.income / max) * 100)}%`;

    const expenseBar = document.createElement("div");
    expenseBar.className = "bar out";
    expenseBar.style.height = `${Math.max(5, (item.expense / max) * 100)}%`;

    group.append(incomeBar, expenseBar);
    nodes.chart.append(group);
  });
}

function renderBudgets() {
  if (!nodes.budgetList) {
    return;
  }

  nodes.budgetList.replaceChildren();
  const monthTransactions = getCurrentMonthTransactions().filter((item) => item.type === "expense");

  state.budgets.forEach((budget) => {
    const spent = monthTransactions
      .filter((item) => item.category === budget.category)
      .reduce((total, item) => total + item.amount, 0);
    nodes.budgetList.append(progressItem(budget.category, spent, budget.limit));
  });
}

function renderGoals() {
  if (!nodes.goalList) {
    return;
  }

  nodes.goalList.replaceChildren();
  if (!state.goals.length) {
    const empty = document.createElement("p");
    empty.className = "quiet";
    empty.textContent = "No savings goals yet.";
    nodes.goalList.append(empty);
    return;
  }

  state.goals.forEach((goal) => {
    nodes.goalList.append(progressItem(goal.name, goal.saved, goal.target));
  });
}

function renderRecentTransactions() {
  if (!nodes.recentList) {
    return;
  }

  const rows = state.transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  nodes.recentList.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "quiet";
    empty.textContent = "Load sample data or add transactions to see recent activity.";
    nodes.recentList.append(empty);
    return;
  }

  rows.forEach((transaction) => {
    const item = document.createElement("article");
    item.className = "recent-item";

    const icon = document.createElement("span");
    icon.className = "recent-icon";
    icon.textContent = transaction.category.slice(0, 1).toUpperCase();

    const meta = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = transaction.description;
    const date = document.createElement("small");
    date.textContent = formatDate(transaction.date);
    meta.append(title, date);

    const amount = document.createElement("b");
    amount.className = transaction.type === "income" ? "amount-income" : "amount-expense";
    amount.textContent = `${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}`;

    item.append(icon, meta, amount);
    nodes.recentList.append(item);
  });
}

function progressItem(label, current, target) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const item = document.createElement("div");
  item.className = "progress-item";

  const meta = document.createElement("div");
  meta.className = "progress-meta";

  const name = document.createElement("strong");
  name.textContent = label;

  const value = document.createElement("span");
  value.textContent = `${formatCurrency(current)} / ${formatCurrency(target)}`;

  const track = document.createElement("div");
  track.className = "track";

  const fill = document.createElement("div");
  fill.className = "fill";
  fill.style.width = `${percent}%`;

  meta.append(name, value);
  track.append(fill);
  item.append(meta, track);
  return item;
}

function actionCell(transaction) {
  const td = document.createElement("td");
  const wrap = document.createElement("div");
  wrap.className = "action-row";

  const edit = document.createElement("button");
  edit.className = "table-action";
  edit.type = "button";
  edit.title = "Edit";
  edit.textContent = "E";
  edit.addEventListener("click", () => editTransaction(transaction.id));

  const remove = document.createElement("button");
  remove.className = "table-action";
  remove.type = "button";
  remove.title = "Delete";
  remove.textContent = "X";
  remove.addEventListener("click", () => deleteTransaction(transaction.id));

  wrap.append(edit, remove);
  td.append(wrap);
  return td;
}

function editTransaction(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) {
    return;
  }

  nodes.editingId.value = transaction.id;
  nodes.description.value = transaction.description;
  nodes.amount.value = transaction.amount;
  nodes.type.value = transaction.type;
  populateCategories();
  nodes.category.value = transaction.category;
  nodes.date.value = transaction.date;
  nodes.saveButton.textContent = "Update";
}

function deleteTransaction(id) {
  const index = state.transactions.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.transactions.splice(index, 1);
    persist();
    renderTransactions();
  }
}

function seedSampleData() {
  if (state.transactions.length > 0) {
    return;
  }

  const today = new Date();
  const iso = (monthOffset, day) => {
    const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, day);
    return date.toISOString().slice(0, 10);
  };

  state.transactions.push(
    { id: makeId(), description: "Monthly salary", amount: 72000, type: "income", category: "Salary", date: iso(0, 1) },
    { id: makeId(), description: "Apartment rent", amount: 18000, type: "expense", category: "Rent", date: iso(0, 3) },
    { id: makeId(), description: "Groceries", amount: 4200, type: "expense", category: "Food", date: iso(0, 8) },
    { id: makeId(), description: "Metro card", amount: 1400, type: "expense", category: "Transport", date: iso(0, 10) },
    { id: makeId(), description: "Freelance payout", amount: 15000, type: "income", category: "Freelance", date: iso(-1, 18) },
    { id: makeId(), description: "Course subscription", amount: 2500, type: "expense", category: "Education", date: iso(-1, 15) }
  );
  state.goals.push({ id: makeId(), name: "Emergency fund", target: 100000, saved: 42000 });
  persist();
  renderPage();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "fintrack-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function importData(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.goals)) {
        return;
      }

      state.transactions = parsed.transactions;
      state.goals = parsed.goals;
      state.budgets = Array.isArray(parsed.budgets) ? parsed.budgets : defaultBudgets;
      persist();
      renderPage();
    } catch {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function cell(value) {
  const td = document.createElement("td");
  td.textContent = value;
  return td;
}

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function amountCell(transaction) {
  const td = cell(formatCurrency(transaction.amount));
  td.className = transaction.type === "income" ? "amount-income" : "amount-expense";
  return td;
}

function sumByType(rows, type) {
  return rows.filter((item) => item.type === type).reduce((total, item) => total + Number(item.amount || 0), 0);
}

function getCurrentMonthTransactions() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return state.transactions.filter((item) => item.date.startsWith(monthKey));
}

function getRecentMonths(count) {
  const date = new Date();
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(date.getFullYear(), date.getMonth() - (count - index - 1), 1);
    return {
      key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
      label: month.toLocaleDateString("en-IN", { month: "short" })
    };
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}
