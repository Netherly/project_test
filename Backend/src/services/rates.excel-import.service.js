const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const prisma = require('../../prisma/client');
const { hasTable } = require('../utils/db-schema');
const { httpErr } = require('../utils/http-error');
const { assembleAllFields, toUTCDate } = require('./rates.service');

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_FILE_NAME = 'Курсы валют за года.xlsx';
const DEFAULT_CHUNK_SIZE = 250;
const IMPORT_CONFIG_KEY = 'rates_excel_import';

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatLocalDateToYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_:/\\-]+/g, '');
}

function mapHeaderKey(value) {
  const header = normalizeHeader(value);
  if (['дата', 'date', 'day'].includes(header)) return 'date';
  if (['usd', 'доллар', 'долар'].includes(header)) return 'usd';
  if (['rub', 'руб', 'рубль', 'рубл'].includes(header)) return 'rub';
  return null;
}

function isCellEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

function isRowEmpty(row = []) {
  return row.every((cell) => isCellEmpty(cell));
}

function parseRateNumber(value) {
  if (isCellEmpty(value)) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseExcelDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateToYmd(value);
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
  }

  const text = String(value || '').trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const normalized = text.replace(/[./]/g, '-');
  if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
    const [day, month, year] = normalized.split('-');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatLocalDateToYmd(parsed);
}

function resolveRatesExcelFilePath(inputPath = process.env.RATES_EXCEL_IMPORT_FILE || DEFAULT_FILE_NAME) {
  if (!inputPath) return path.join(BACKEND_ROOT, DEFAULT_FILE_NAME);
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(BACKEND_ROOT, inputPath);
}

function getSourceSignature(filePath) {
  const stat = fs.statSync(filePath);
  return {
    filePath,
    size: stat.size,
    mtimeMs: Math.trunc(stat.mtimeMs),
  };
}

function findHeaderRow(rows = []) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = Array.isArray(rows[rowIndex]) ? rows[rowIndex] : [];
    if (isRowEmpty(row)) continue;

    const columns = {};
    row.forEach((cell, cellIndex) => {
      const headerKey = mapHeaderKey(cell);
      if (headerKey && columns[headerKey] === undefined) {
        columns[headerKey] = cellIndex;
      }
    });

    if (
      Number.isInteger(columns.date) &&
      Number.isInteger(columns.usd) &&
      Number.isInteger(columns.rub)
    ) {
      return { headerRowIndex: rowIndex, columns };
    }
  }

  throw httpErr('В Excel не найдены колонки date/USD/RUB', 422);
}

function parseRatesExcelFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw httpErr(`Файл курсов не найден: ${filePath}`, 404);
  }

  const workbook = XLSX.readFile(filePath, {
    cellDates: true,
    dense: true,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw httpErr('Excel-файл не содержит листов', 422);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  const { headerRowIndex, columns } = findHeaderRow(rows);
  const uniqueByDate = new Map();
  const errors = [];
  let duplicateDates = 0;
  let skippedEmptyRows = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = Array.isArray(rows[rowIndex]) ? rows[rowIndex] : [];
    const sourceRowNumber = rowIndex + 1;

    const dateCell = row[columns.date];
    const usdCell = row[columns.usd];
    const rubCell = row[columns.rub];

    if ([dateCell, usdCell, rubCell].every((cell) => isCellEmpty(cell))) {
      skippedEmptyRows += 1;
      continue;
    }

    const date = parseExcelDate(dateCell);
    const usd = parseRateNumber(usdCell);
    const rub = parseRateNumber(rubCell);

    if (!date || usd === null || rub === null) {
      errors.push(
        `строка ${sourceRowNumber}: ожидаются значения date/USD/RUB, получено ${JSON.stringify({
          date: dateCell,
          usd: usdCell,
          rub: rubCell,
        })}`
      );
      if (errors.length >= 20) break;
      continue;
    }

    if (uniqueByDate.has(date)) duplicateDates += 1;

    uniqueByDate.set(date, {
      date,
      uah: 1,
      usd,
      rub,
      usdt: usd,
    });
  }

  if (errors.length > 0) {
    throw httpErr(`Не удалось разобрать Excel-файл: ${errors.join('; ')}`, 422);
  }

  const items = Array.from(uniqueByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  if (!items.length) {
    throw httpErr('В Excel-файле нет строк для импорта', 422);
  }

  return {
    filePath,
    sheetName,
    headerRowNumber: headerRowIndex + 1,
    rowsRead: Math.max(0, rows.length - headerRowIndex - 1),
    skippedEmptyRows,
    duplicateDates,
    items,
  };
}

async function loadImportState() {
  if (!(await hasTable('AppConfig'))) return null;
  const row = await prisma.appConfig.findUnique({ where: { key: IMPORT_CONFIG_KEY } });
  return row?.value && typeof row.value === 'object' ? row.value : null;
}

async function saveImportState(payload) {
  if (!(await hasTable('AppConfig'))) return;

  await prisma.appConfig.upsert({
    where: { key: IMPORT_CONFIG_KEY },
    update: { value: payload },
    create: {
      key: IMPORT_CONFIG_KEY,
      value: payload,
    },
  });
}

function isSameSourceSignature(left, right) {
  return (
    left &&
    right &&
    left.filePath === right.filePath &&
    Number(left.size) === Number(right.size) &&
    Number(left.mtimeMs) === Number(right.mtimeMs)
  );
}

function toUtcDateStart(ymd) {
  return new Date(`${String(ymd).slice(0, 10)}T00:00:00.000Z`);
}

async function hasImportedRange(result) {
  const expectedRows = Number(result?.importedRows || 0);
  const earliestDate = result?.earliestDate;
  const latestDate = result?.latestDate;

  if (!expectedRows || !earliestDate || !latestDate) return false;

  const total = await prisma.exchangeRates.count({
    where: {
      date: {
        gte: toUtcDateStart(earliestDate),
        lte: toUtcDateStart(latestDate),
      },
    },
  });

  return total >= expectedRows;
}

async function importRatesFromExcel({
  filePath,
  force = false,
  chunkSize = DEFAULT_CHUNK_SIZE,
} = {}) {
  const resolvedFilePath = resolveRatesExcelFilePath(filePath);
  const source = getSourceSignature(resolvedFilePath);
  const savedState = await loadImportState();

  if (
    !force &&
    isSameSourceSignature(savedState?.source, source) &&
    (await hasImportedRange(savedState?.result))
  ) {
    return {
      skipped: true,
      reason: 'unchanged',
      filePath: resolvedFilePath,
      ...(savedState?.result || {}),
    };
  }

  const parsed = parseRatesExcelFile(resolvedFilePath);
  const take = Math.max(1, Number(chunkSize) || DEFAULT_CHUNK_SIZE);
  const preparedItems = parsed.items.map((item) => ({
    date: toUTCDate(item.date),
    ...assembleAllFields(item),
  }));

  let importedRows = preparedItems.length;
  let chunkCount = 0;

  await prisma.$transaction(
    async (tx) => {
      await tx.exchangeRates.deleteMany({
        where: {
          date: {
            gte: preparedItems[0].date,
            lte: preparedItems[preparedItems.length - 1].date,
          },
        },
      });

      for (let index = 0; index < preparedItems.length; index += take) {
        const chunk = preparedItems.slice(index, index + take);
        if (!chunk.length) continue;
        await tx.exchangeRates.createMany({ data: chunk });
        chunkCount += 1;
      }
    },
    {
      timeout: 120000,
    }
  );

  const result = {
    skipped: false,
    reason: null,
    filePath: resolvedFilePath,
    sheetName: parsed.sheetName,
    headerRowNumber: parsed.headerRowNumber,
    rowsRead: parsed.rowsRead,
    skippedEmptyRows: parsed.skippedEmptyRows,
    duplicateDates: parsed.duplicateDates,
    importedRows,
    chunkCount,
    earliestDate: parsed.items[0]?.date || null,
    latestDate: parsed.items[parsed.items.length - 1]?.date || null,
    importedAt: new Date().toISOString(),
  };

  await saveImportState({
    source,
    result,
  });

  return result;
}

async function ensureRatesExcelImportedOnBoot() {
  const enabled = parseBool(process.env.RATES_EXCEL_IMPORT_ON_BOOT, true);
  if (!enabled) {
    return {
      skipped: true,
      reason: 'disabled',
      filePath: resolveRatesExcelFilePath(),
    };
  }

  const force = parseBool(process.env.RATES_EXCEL_IMPORT_FORCE, false);
  return importRatesFromExcel({ force });
}

module.exports = {
  parseBool,
  resolveRatesExcelFilePath,
  parseRatesExcelFile,
  importRatesFromExcel,
  ensureRatesExcelImportedOnBoot,
};
