const prisma = require('../../prisma/client');
const { randomUUID } = require('crypto');
const { findByEntityRef, resolveEntityId } = require('../utils/entity-ref');
const { companyPhotoUrlToAbsPath, isCompanyPhotoLink, safeUnlink } = require('../utils/company-photo');

const pickStr = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') return String(value.name ?? value.value ?? value.code ?? '').trim();
  return String(value).trim();
};

const COMPANY_SELECT = {
  id: true,
  urlId: true,
  name: true,
  photo_link: true,
};

const CompanyService = {
  async list() {
    return prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: COMPANY_SELECT,
    });
  },

  async getById(id) {
    return findByEntityRef(prisma.company, id, { select: COMPANY_SELECT });
  },

  async create(payload = {}) {
    const name = pickStr(payload.name);
    if (!name) {
      const err = new Error('Company name is required');
      err.status = 400;
      throw err;
    }

    const existing = await prisma.company.findFirst({
      where: { name },
      select: COMPANY_SELECT,
    });
    if (existing) return existing;

    try {
      return await prisma.company.create({
        data: { name },
        select: COMPANY_SELECT,
      });
    } catch (err) {
      const message = String(err?.message || '');
      const legacyIdBindingIssue =
        message.includes('22P03') ||
        message.includes('incorrect binary data format in bind parameter 1');

      if (!legacyIdBindingIssue) throw err;

      const rows = await prisma.$queryRaw`
        INSERT INTO "Company" ("id", "name")
        VALUES (${randomUUID()}, ${name})
        RETURNING "id", "urlId", "name", "photo_link"
      `;
      return rows[0] || null;
    }
  },

  async update(id, payload = {}) {
    const actualId = await resolveEntityId(prisma.company, id, {
      notFoundMessage: 'Company not found',
    });
    const data = {};

    if (payload.name !== undefined) {
      const name = pickStr(payload.name);
      if (!name) {
        const err = new Error('Company name is required');
        err.status = 400;
        throw err;
      }
      data.name = name;
    }

    if (payload.photo_link !== undefined || payload.photoLink !== undefined) {
      data.photo_link = pickStr(payload.photo_link ?? payload.photoLink) || null;
    }

    if (!Object.keys(data).length) {
      return prisma.company.findUnique({
        where: { id: actualId },
        select: COMPANY_SELECT,
      });
    }

    return prisma.company.update({
      where: { id: actualId },
      data,
      select: COMPANY_SELECT,
    });
  },

  async remove(id) {
    const actualId = await resolveEntityId(prisma.company, id, {
      notFoundMessage: 'Company not found',
    });
    const company = await prisma.company.findUnique({
      where: { id: actualId },
      select: COMPANY_SELECT,
    });

    const removed = await prisma.company.delete({
      where: { id: actualId },
      select: COMPANY_SELECT,
    });

    if (isCompanyPhotoLink(company?.photo_link)) {
      await safeUnlink(companyPhotoUrlToAbsPath(company.photo_link));
    }

    return removed;
  },
};

module.exports = CompanyService;
