export const formatUrlId = (value, size = 8) => {
  const num = Number(value);
  if (!Number.isSafeInteger(num) || num <= 0) return "";
  return String(num).padStart(size, "0");
};

export const getEntityRouteId = (entity, fallbackToId = true) => {
  const formatted = formatUrlId(entity?.urlId);
  if (formatted) return formatted;
  return fallbackToId ? String(entity?.id ?? "").trim() : "";
};

export const matchesEntityRouteParam = (entity, routeParam) => {
  const param = String(routeParam ?? "").trim();
  if (!param || !entity) return false;
  if (String(entity.id ?? "") === param) return true;

  const formatted = formatUrlId(entity.urlId);
  if (formatted && formatted === param) return true;

  const numericParam = /^\d+$/.test(param) ? Number(param) : null;
  if (numericParam && Number(entity.urlId) === numericParam) return true;

  return false;
};

export const buildEntityPath = (basePath, entity) => {
  const routeId = getEntityRouteId(entity);
  return routeId ? `${basePath}/${routeId}` : basePath;
};
