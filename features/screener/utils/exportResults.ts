import * as XLSX from "xlsx";
import type { ScreenerResult } from "../types";
import { CRITERION_LABELS } from "../constants";

export type ExportFormat = "csv" | "xlsx";

const HEADERS = ["Symbol", "Name", "Sector", "Last Close", "Matches"] as const;

type ExportRow = Record<(typeof HEADERS)[number], string | number>;

function formatMatches(result: ScreenerResult): string {
  return result.matches
    .map(
      (m) => `${CRITERION_LABELS[m.criterion]} (${m.confidence}): ${m.detail}`,
    )
    .join(" | ");
}

function toExportRows(results: ScreenerResult[]): ExportRow[] {
  return results.map((result) => ({
    Symbol: result.symbol,
    Name: result.name,
    Sector: result.sector ?? "",
    "Last Close": result.lastClose,
    Matches: formatMatches(result),
  }));
}

function escapeCsvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: ExportRow[]): string {
  const lines = [
    HEADERS.join(","),
    ...rows.map((row) => HEADERS.map((h) => escapeCsvField(row[h])).join(",")),
  ];
  return lines.join("\r\n");
}

function toXlsxArrayBuffer(rows: ExportRow[]): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Screener Results");
  return XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadResults(
  results: ScreenerResult[],
  format: ExportFormat = "csv",
): void {
  const rows = toExportRows(results);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `idx-screener-results-${stamp}.${format}`;

  if (format === "xlsx") {
    const buffer = toXlsxArrayBuffer(rows);
    triggerDownload(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename,
    );
    return;
  }

  triggerDownload(
    new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }),
    filename,
  );
}
