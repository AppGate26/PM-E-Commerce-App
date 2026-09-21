import * as XLSX from "xlsx";

export const exportChartRowsToExcel = (
  rows = [],
  filePrefix = "chart-of-account",
  reportTitle = "Chart Of Account"
) => {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const headers = ["S/N", "Control ID", "Chart Of Account", "Account Name"];
  const dataRows = rows.map((row, index) => [
    row.sn ?? index + 1,
    row.controlId ?? "",
    row.chartOfAccount ?? "",
    row.accountName ?? "",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([
    [reportTitle],
    ["Generated At", new Date().toLocaleString()],
    [],
    headers,
    ...dataRows,
  ]);

  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  worksheet["!cols"] = [{ wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 44 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Chart Of Account");
  XLSX.writeFile(
    workbook,
    `${filePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};
