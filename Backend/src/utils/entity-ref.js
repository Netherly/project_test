const normalizeEntityRef = (value) => String(value ?? '').trim();

const parseUrlId = (value) => {
  const text = normalizeEntityRef(value);
  if (!/^\d+$/.test(text)) return null;
  const num = Number(text);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
};

const buildEntityRefWhere = (value, urlField = 'urlId') => {
  const ref = normalizeEntityRef(value);
  const urlId = parseUrlId(ref);
  if (urlId !== null) {
    return {
      OR: [
        { id: ref },
        { [urlField]: urlId },
      ],
    };
  }
  return { id: ref };
};

const mergeWhere = (left, right) => {
  if (!left) return right;
  if (!right) return left;
  return { AND: [left, right] };
};

async function findByEntityRef(model, value, args = {}, options = {}) {
  const { urlField = 'urlId' } = options;
  const refWhere = buildEntityRefWhere(value, urlField);
  return model.findFirst({
    ...args,
    where: mergeWhere(args.where, refWhere),
  });
}

async function resolveEntityId(model, value, options = {}) {
  const row = await findByEntityRef(
    model,
    value,
    { select: { id: true } },
    options
  );

  if (!row?.id) {
    const err = new Error(options.notFoundMessage || 'Entity not found');
    err.status = options.status || 404;
    throw err;
  }

  return row.id;
}

module.exports = {
  normalizeEntityRef,
  parseUrlId,
  buildEntityRefWhere,
  findByEntityRef,
  resolveEntityId,
};
