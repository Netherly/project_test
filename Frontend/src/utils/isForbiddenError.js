export function isForbiddenError(err) {
  if (!err) return false;
  if (err.status === 403) return true;
  if (err?.payload?.status === 403) return true;

  const message = String(err?.message || "");
  return message.includes("HTTP 403") || /Access denied/i.test(message);
}

export default isForbiddenError;
