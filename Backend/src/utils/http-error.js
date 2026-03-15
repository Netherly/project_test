const TECHNICAL_ERROR_RE =
  /prisma|connectorerror|postgres|sqlstate|invalid `prisma|query execution|provided value for the column|knownrequesterror|stack trace|<!doctype|<html|[\r\n]+\s+at\s+/i;

function httpErr(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function defaultStatusMessage(status) {
  if (status === 400) return 'Некорректные данные запроса';
  if (status === 401) return 'Требуется авторизация';
  if (status === 403) return 'Недостаточно прав';
  if (status === 404) return 'Запись не найдена';
  if (status === 409) return 'Конфликт данных';
  if (status === 422) return 'Не удалось обработать данные';
  return 'Внутренняя ошибка сервера';
}

function isTechnicalMessage(message) {
  const text = String(message || '').trim();
  if (!text) return false;
  if (TECHNICAL_ERROR_RE.test(text)) return true;
  return text.length > 400;
}

function mapPrismaError(err) {
  switch (err?.code) {
    case 'P2000':
      return { status: 400, message: 'Значение слишком длинное' };
    case 'P2002':
      return { status: 409, message: 'Такая запись уже существует' };
    case 'P2003':
      return { status: 409, message: 'Запись связана с другими данными' };
    case 'P2025':
      return { status: 404, message: 'Запись не найдена' };
    default:
      return null;
  }
}

function toPublicError(err) {
  const status = Number(err?.status || err?.statusCode) || 500;
  const mappedPrisma = mapPrismaError(err);
  if (mappedPrisma) return mappedPrisma;

  const rawMessage = String(err?.message || '').trim();
  if (!rawMessage || isTechnicalMessage(rawMessage)) {
    return { status, message: defaultStatusMessage(status) };
  }

  return { status, message: rawMessage };
}

module.exports = {
  httpErr,
  toPublicError,
  isTechnicalMessage,
  defaultStatusMessage,
};
