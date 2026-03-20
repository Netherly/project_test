const { ensureDefaultCompanies } = require('../seeds/companies.seed');
const { ensureDefaultClientGroups } = require('../seeds/client-groups.seed');
const { ensureDefaultCurrencies } = require('../seeds/currencies.seed');
const { ensureRatesExcelImportedOnBoot } = require('../services/rates.excel-import.service');

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

async function runTaskGroup(tasks = []) {
  const enabledTasks = tasks.filter((task) => task.enabled !== false);
  if (!enabledTasks.length) return;

  const results = await Promise.allSettled(
    enabledTasks.map(async (task) => {
      const startedAt = Date.now();
      const result = await task.run();
      return {
        label: task.label,
        result,
        durationMs: Date.now() - startedAt,
      };
    })
  );

  results.forEach((item, index) => {
    const task = enabledTasks[index];

    if (item.status === 'fulfilled') {
      const { result, durationMs } = item.value;
      const suffix = typeof task.describe === 'function' ? task.describe(result) : 'done';
      console.log(`[bootstrap] ${task.label}: ${suffix} (${durationMs}ms)`);
      return;
    }

    console.error(`[bootstrap] ${task.label} failed:`, item.reason?.message || item.reason);
  });
}

async function runStartupBootstrap() {
  const startedAt = Date.now();
  const enableReferenceData = parseBool(process.env.REFERENCE_DATA_BOOTSTRAP_ON_START, true);

  await runTaskGroup([
    {
      label: 'seed currencies',
      enabled: enableReferenceData && parseBool(process.env.SEED_CURRENCIES_ON_START, true),
      run: ensureDefaultCurrencies,
    },
    {
      label: 'seed companies',
      enabled: enableReferenceData && parseBool(process.env.SEED_COMPANIES_ON_START, true),
      run: ensureDefaultCompanies,
    },
    {
      label: 'seed client groups',
      enabled: enableReferenceData && parseBool(process.env.SEED_CLIENT_GROUPS_ON_START, true),
      run: ensureDefaultClientGroups,
    },
  ]);

  const importStartedAt = Date.now();
  try {
    const result = await ensureRatesExcelImportedOnBoot();
    const summary = result?.skipped
      ? `skipped: ${result.reason}`
      : `imported ${result.importedRows} rows (${result.earliestDate} .. ${result.latestDate})`;
    console.log(`[bootstrap] rates import: ${summary} (${Date.now() - importStartedAt}ms)`);
  } catch (error) {
    console.error('[bootstrap] rates import failed:', error?.message || error);
  }

  console.log(`[bootstrap] startup tasks finished in ${Date.now() - startedAt}ms`);
}

module.exports = {
  parseBool,
  runStartupBootstrap,
};
