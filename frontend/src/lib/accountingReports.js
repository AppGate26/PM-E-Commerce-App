import { getAccountingTransactions, getAccounts } from "./accountingApi";

const getAccountTypeMap = (accounts = []) => {
  const map = new Map();
  accounts.forEach((account) => {
    const code = String(account.code || "").trim();
    if (!code) return;
    const type = String(account.type || account.accountType || "").toUpperCase();
    const name = String(account.name || "").toUpperCase();
    const normalizedType =
      type.includes("EQUITY") || name.includes("CAPITAL") || name.includes("RESERVE")
        ? "EQUITY"
        : type;
    map.set(code, normalizedType);
  });
  return map;
};

const getTransactionAccountType = (row = {}, accountTypeMap = new Map()) => {
  const code = String(row.accountId || "").trim();
  return accountTypeMap.get(code) || "";
};

const sumDebit = (rows = []) => rows.reduce((sum, row) => sum + (Number(row.debit) || 0), 0);
const sumCredit = (rows = []) => rows.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);

// Full account code = chart-of-account code + account-details code, concatenated
// (e.g. "10202" + "01" => "1020201"; see docs/trialbalance.jpeg). Falls back to
// whichever code is available.
const formatAccountCode = (account = {}, fallback = "") => {
  const chart = String(account.chartOfAccountCode || account.chartOfAccount || "").trim();
  const detail = String(account.accountDetailsCode || "").trim();
  if (chart && detail) {
    return detail.startsWith(chart) ? detail : `${chart}${detail}`;
  }
  return detail || chart || String(account.code || account.accountId || fallback || "");
};

// Index accounts by every id/code a transaction might reference, so a posting's
// accountId can be resolved to its display code, name, and type.
const buildAccountMetaMap = (accounts = []) => {
  const map = new Map();
  accounts.forEach((account) => {
    const meta = {
      code: formatAccountCode(account),
      name: account.name || account.accountDetailsName || "",
      type: String(account.type || account.accountType || "").toUpperCase(),
      chartName: account.chartOfAccountName || "",
      controlName: account.controlAccountName || "",
    };
    [account.accountId, account.code, account.id].forEach((key) => {
      const value = String(key ?? "").trim();
      if (value) map.set(value, meta);
    });
  });
  return map;
};

export const loadAccountingReportBundle = async (branchId = undefined) => {
  const [transactions, accounts] = await Promise.all([
    getAccountingTransactions(branchId),
    getAccounts({ activeOnly: true }),
  ]);

  return { transactions, accounts };
};

export const buildChartOfAccountRows = (accounts = []) =>
  accounts.map((account, index) => ({
    sn: index + 1,
    code: account.code,
    name: account.name,
    type: account.type || account.accountType || "",
    group: account.code.slice(0, 3),
  }));

export const buildAccountDetailRows = (accounts = []) =>
  accounts.map((account, index) => ({
    sn: index + 1,
    name: account.name || account.description || "",
    type: account.type || account.accountType || "",
    controlAccount: account.controlAccountName || account.controlAccount || "",
    chartOfAccount: account.chartOfAccountName || account.chartOfAccount || "",
  }));

export const buildJournalReportRows = (transactions = []) =>
  transactions
    .filter((row) => row.sourceType === "JOURNAL")
    .map((row) => ({
      date: row.transactionDate || "-",
      reference: row.referenceNo || "-",
      account: row.affectedAccount || "-",
      name: row.customerName || row.accountName || "-",
      description: row.description || "-",
      debit: Number(row.debit || 0),
      credit: Number(row.credit || 0),
      user: row.user || "-",
    }));

export const buildCashFlowRows = (transactions = []) => {
  const cashRows = transactions.filter((row) => {
    const name = `${row.accountName} ${row.customerName}`.toLowerCase();
    return name.includes("cash") || name.includes("bank");
  });

  const grouped = new Map();
  cashRows.forEach((row) => {
    const key = row.affectedAccount || row.accountId || "Cash movement";
    const current = grouped.get(key) || {
      account: key,
      debit: 0,
      credit: 0,
    };
    current.debit += Number(row.debit || 0);
    current.credit += Number(row.credit || 0);
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    net: row.debit - row.credit,
  }));
};

export const buildBalanceSheetRows = (transactions = [], accounts = []) => {
  const accountTypeMap = getAccountTypeMap(accounts);
  const assetRows = transactions.filter(
    (row) => getTransactionAccountType(row, accountTypeMap) === "ASSET"
  );
  const liabilityRows = transactions.filter(
    (row) => getTransactionAccountType(row, accountTypeMap) === "LIABILITY"
  );
  const equityRows = transactions.filter(
    (row) => getTransactionAccountType(row, accountTypeMap) === "EQUITY"
  );

  return [
    {
      section: "Assets",
      debit: sumDebit(assetRows),
      credit: sumCredit(assetRows),
      balance: sumDebit(assetRows) - sumCredit(assetRows),
    },
    {
      section: "Liabilities",
      debit: sumDebit(liabilityRows),
      credit: sumCredit(liabilityRows),
      balance: sumCredit(liabilityRows) - sumDebit(liabilityRows),
    },
    {
      section: "Equity",
      debit: sumDebit(equityRows),
      credit: sumCredit(equityRows),
      balance: sumCredit(equityRows) - sumDebit(equityRows),
    },
  ];
};

// Detailed balance sheet: each section (Assets / Liabilities / Equity) lists the
// chart-of-account codes posted under it with their Dr/Cr/Balance, and the section
// totals are the sums (see docs/balancesheet.jpeg). Net income (income - expense)
// is rolled into Equity as retained earnings so that, when the underlying journal
// is balanced (debits == credits), Assets == Liabilities + Equity.
export const buildBalanceSheetDetail = (transactions = [], accounts = []) => {
  const accountTypeMap = getAccountTypeMap(accounts);
  const accountNameMap = new Map();
  accounts.forEach((account) => {
    const code = String(account.code || "").trim();
    if (code) accountNameMap.set(code, account.name || "");
  });

  // Group postings by chart-of-account code, accumulating debit/credit + type.
  const groups = new Map();
  transactions.forEach((row) => {
    const code = String(row.accountId || "").trim();
    if (!code) return;
    const type = accountTypeMap.get(code) || "";
    const current = groups.get(code) || {
      code,
      name: accountNameMap.get(code) || row.accountName || row.customerName || "",
      type,
      debit: 0,
      credit: 0,
    };
    current.debit += Number(row.debit || 0);
    current.credit += Number(row.credit || 0);
    if (!current.type && type) current.type = type;
    groups.set(code, current);
  });

  const allGroups = Array.from(groups.values());

  // balanceSign "debit" => balance = debit - credit (assets); "credit" => credit - debit.
  const buildSection = (typeKey, label, balanceSign) => {
    const rows = allGroups
      .filter((group) => group.type === typeKey)
      .map((group) => ({
        code: group.code,
        name: group.name,
        debit: group.debit,
        credit: group.credit,
        balance: balanceSign === "debit" ? group.debit - group.credit : group.credit - group.debit,
      }))
      .sort((left, right) => String(left.code).localeCompare(String(right.code)));

    return {
      key: typeKey,
      label,
      rows,
      debit: rows.reduce((sum, row) => sum + row.debit, 0),
      credit: rows.reduce((sum, row) => sum + row.credit, 0),
      balance: rows.reduce((sum, row) => sum + row.balance, 0),
    };
  };

  const assets = buildSection("ASSET", "Assets", "debit");
  const liabilities = buildSection("LIABILITY", "Liabilities", "credit");
  const equity = buildSection("EQUITY", "Equity", "credit");

  // Roll net income (income - expense) into equity as retained earnings.
  const incomeNet = allGroups
    .filter((group) => group.type === "INCOME")
    .reduce((sum, group) => sum + (group.credit - group.debit), 0);
  const expenseNet = allGroups
    .filter((group) => group.type === "EXPENSE")
    .reduce((sum, group) => sum + (group.debit - group.credit), 0);
  const netIncome = incomeNet - expenseNet;

  if (Math.abs(netIncome) >= 0.005) {
    equity.rows.push({
      code: "—",
      name: "Net Income (Retained Earnings)",
      debit: netIncome < 0 ? -netIncome : 0,
      credit: netIncome > 0 ? netIncome : 0,
      balance: netIncome,
      isDerived: true,
    });
    equity.debit += netIncome < 0 ? -netIncome : 0;
    equity.credit += netIncome > 0 ? netIncome : 0;
    equity.balance += netIncome;
  }

  const difference = assets.balance - (liabilities.balance + equity.balance);

  return {
    sections: [assets, liabilities, equity],
    totals: {
      assets: assets.balance,
      liabilities: liabilities.balance,
      equity: equity.balance,
      difference,
    },
    isBalanced: Math.abs(difference) < 0.005,
  };
};

// Detailed trial balance (see docs/trialbalance.jpeg). For each account:
//   Opening balance = net (debit - credit) of postings BEFORE dateFrom,
//   Debit / Credit   = movement WITHIN [dateFrom, dateTo],
//   Closing balance  = opening + debit - credit.
// Pass the FULL transaction set (not pre-filtered) so opening can be computed.
export const buildTrialBalanceDetail = (
  transactions = [],
  accounts = [],
  { dateFrom = "", dateTo = "" } = {}
) => {
  const metaMap = buildAccountMetaMap(accounts);
  const fromTime = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : null;
  const toTime = dateTo ? Date.parse(`${dateTo}T23:59:59`) : null;

  const groups = new Map();
  transactions.forEach((row) => {
    const key = String(row.accountId || "").trim();
    if (!key) return;
    const meta = metaMap.get(key);
    const time = Date.parse(row.transactionDate || "");
    const debit = Number(row.debit || 0);
    const credit = Number(row.credit || 0);

    const current = groups.get(key) || {
      key,
      code: meta?.code || key,
      name: meta?.name || row.accountName || row.customerName || "",
      opening: 0,
      debit: 0,
      credit: 0,
    };

    const isBefore = fromTime != null && !Number.isNaN(time) && time < fromTime;
    const isWithin =
      (fromTime == null || (!Number.isNaN(time) && time >= fromTime)) &&
      (toTime == null || (!Number.isNaN(time) && time <= toTime));

    if (isBefore) {
      current.opening += debit - credit;
    } else if (isWithin) {
      current.debit += debit;
      current.credit += credit;
    }
    groups.set(key, current);
  });

  const rows = Array.from(groups.values())
    .map((group) => ({ ...group, closing: group.opening + group.debit - group.credit }))
    .filter((group) => group.opening !== 0 || group.debit !== 0 || group.credit !== 0)
    .sort((left, right) => String(left.code).localeCompare(String(right.code)));

  return {
    rows,
    totals: {
      opening: rows.reduce((sum, row) => sum + row.opening, 0),
      debit: rows.reduce((sum, row) => sum + row.debit, 0),
      credit: rows.reduce((sum, row) => sum + row.credit, 0),
      closing: rows.reduce((sum, row) => sum + row.closing, 0),
    },
  };
};

// Detailed profit & loss (see docs/pl.jpeg): income and expense account details
// with credit, debit, and a calculated balance (income = credit - debit,
// expense = debit - credit). Transactions should already be date-filtered.
export const buildProfitAndLossDetail = (transactions = [], accounts = []) => {
  const metaMap = buildAccountMetaMap(accounts);
  const accountTypeMap = getAccountTypeMap(accounts);

  const groups = new Map();
  transactions.forEach((row) => {
    const key = String(row.accountId || "").trim();
    if (!key) return;
    const meta = metaMap.get(key);
    const type = meta?.type || accountTypeMap.get(key) || "";
    if (type !== "INCOME" && type !== "EXPENSE") return;

    const current = groups.get(key) || {
      key,
      code: meta?.code || key,
      name: meta?.name || row.accountName || row.customerName || "",
      type,
      debit: 0,
      credit: 0,
    };
    current.debit += Number(row.debit || 0);
    current.credit += Number(row.credit || 0);
    groups.set(key, current);
  });

  const allGroups = Array.from(groups.values());

  const buildSection = (typeKey, label, sign) => {
    const rows = allGroups
      .filter((group) => group.type === typeKey)
      .map((group) => ({
        code: group.code,
        name: group.name,
        debit: group.debit,
        credit: group.credit,
        balance: sign === "credit" ? group.credit - group.debit : group.debit - group.credit,
      }))
      .sort((left, right) => String(left.code).localeCompare(String(right.code)));

    return {
      key: typeKey,
      label,
      rows,
      debit: rows.reduce((sum, row) => sum + row.debit, 0),
      credit: rows.reduce((sum, row) => sum + row.credit, 0),
      balance: rows.reduce((sum, row) => sum + row.balance, 0),
    };
  };

  const income = buildSection("INCOME", "Income", "credit");
  const expense = buildSection("EXPENSE", "Expense", "debit");

  return {
    sections: [income, expense],
    totals: {
      income: income.balance,
      expense: expense.balance,
      netProfit: income.balance - expense.balance,
    },
  };
};

export const buildTrialBalanceRows = (transactions = []) => {
  const grouped = new Map();
  transactions.forEach((row) => {
    const key = row.accountId || row.accountName || row.customerName || row.referenceNo || row.id;
    const current = grouped.get(key) || {
      accountId: row.accountId || "-",
      accountName: row.accountName || row.customerName || "-",
      debit: 0,
      credit: 0,
    };
    current.debit += Number(row.debit || 0);
    current.credit += Number(row.credit || 0);
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    balance: row.debit - row.credit,
  }));
};

export const buildCamelRows = (transactions = [], accounts = []) => {
  const accountTypeMap = getAccountTypeMap(accounts);
  const totalDebit = sumDebit(transactions);
  const totalCredit = sumCredit(transactions);
  const volume = transactions.length || 1;
  const cashMovement = buildCashFlowRows(transactions).reduce((sum, row) => sum + row.net, 0);
  const assetRows = transactions.filter(
    (row) => getTransactionAccountType(row, accountTypeMap) === "ASSET"
  );
  const incomeRows = transactions.filter(
    (row) => getTransactionAccountType(row, accountTypeMap) === "INCOME"
  );

  return [
    { metric: "Capital Adequacy", value: (totalCredit / (totalDebit || 1)) * 100, note: "Credit-to-debit capital proxy" },
    { metric: "Asset Quality", value: (sumDebit(assetRows) / (totalDebit || 1)) * 100, note: "Asset-weighted posting proxy" },
    { metric: "Management Efficiency", value: volume, note: "Posting volume tracked" },
    { metric: "Earnings", value: sumCredit(incomeRows), note: "Income postings tracked" },
    { metric: "Liquidity", value: cashMovement, note: "Cash and bank movement" },
  ].map((row) => ({
    ...row,
    value: Number(row.value || 0),
  }));
};

export const buildProfitAndLossRows = (transactions = [], accounts = []) => {
  const accountTypeMap = getAccountTypeMap(accounts);
  const incomeRows = transactions.filter(
    (row) => getTransactionAccountType(row, accountTypeMap) === "INCOME"
  );
  const expenseRows = transactions.filter(
    (row) => getTransactionAccountType(row, accountTypeMap) === "EXPENSE"
  );
  const income = sumCredit(incomeRows) - sumDebit(incomeRows);
  const expense = sumDebit(expenseRows) - sumCredit(expenseRows);

  return [
    { section: "Income", amount: income },
    { section: "Expense", amount: expense },
    { section: "Net Profit / Loss", amount: income - expense },
  ];
};
