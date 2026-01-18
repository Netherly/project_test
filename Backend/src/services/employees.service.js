const prisma = require('../../prisma/client');

const EmployeesService = {
  async list(params = {}) {
    const { page = 1, limit = 50, search, status, roleId, countryId } = params;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (roleId) where.roleId = roleId;
    if (countryId) where.countryId = countryId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        country: true,
        role: true,
        company: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.employee.count({ where });

    return { employees, total, page, limit };
  },

  async byId(id) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        country: true,
        role: true,
        company: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
        assets: true,
        clients: true,
        tasks: true,
      },
    });
    if (!employee) {
      const e = new Error('Employee not found');
      e.status = 404;
      throw e;
    }
    return employee;
  },

  async create(payload) {
    const data = {
      status: payload.status,
      full_name: payload.full_name,
      phone: payload.phone,
      email: payload.email,
      login: payload.login,
      password: payload.password,
      folder: payload.folder,
      userid: payload.userid,
      companyId: payload.companyId,
      publicId: payload.publicId,
      roleId: payload.roleId,
      countryId: payload.countryId,
      telegramUserId: payload.telegramUserId,
      telegramChatId: payload.telegramChatId,
      telegramUsername: payload.telegramUsername,
      telegramLinkedAt: payload.telegramLinkedAt,
      telegramVerified: payload.telegramVerified,
      balance: payload.balance,
      currencyId: payload.currencyId,
      birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
      passport: payload.passport,
      address: payload.address,
      chatLink: payload.chatLink,
      telegramDateTime: payload.telegram?.dateTime ? new Date(payload.telegram.dateTime) : null,
      telegramId: payload.telegram?.id ? BigInt(payload.telegram.id) : null,
      telegramName: payload.telegram?.name,
      telegramNickname: payload.telegram?.nickname,
      telegramBindingLink: payload.telegram?.bindingLink,
      photoLink: payload.photoLink,
      rates: payload.rates,
      mainCurrency: payload.mainCurrency,
    };

    const employee = await prisma.employee.create({
      data,
      include: {
        country: true,
        role: true,
        company: true,
        currency: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
      },
    });

    // Handle tags if provided
    if (payload.tags && Array.isArray(payload.tags)) {
      await this.updateTags(employee.id, payload.tags);
    }

    // Handle requisites if provided
    if (payload.requisites && Array.isArray(payload.requisites)) {
      await this.updateRequisites(employee.id, payload.requisites);
    }

    return employee;
  },

  async update(id, payload) {
    const data = {};
    if (payload.status !== undefined) data.status = payload.status;
    if (payload.full_name !== undefined) data.full_name = payload.full_name;
    if (payload.phone !== undefined) data.phone = payload.phone;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.login !== undefined) data.login = payload.login;
    if (payload.password !== undefined) data.password = payload.password;
    if (payload.folder !== undefined) data.folder = payload.folder;
    if (payload.userid !== undefined) data.userid = payload.userid;
    if (payload.companyId !== undefined) data.companyId = payload.companyId;
    if (payload.publicId !== undefined) data.publicId = payload.publicId;
    if (payload.roleId !== undefined) data.roleId = payload.roleId;
    if (payload.countryId !== undefined) data.countryId = payload.countryId;
    if (payload.telegramUserId !== undefined) data.telegramUserId = payload.telegramUserId;
    if (payload.telegramChatId !== undefined) data.telegramChatId = payload.telegramChatId;
    if (payload.telegramUsername !== undefined) data.telegramUsername = payload.telegramUsername;
    if (payload.telegramLinkedAt !== undefined) data.telegramLinkedAt = payload.telegramLinkedAt;
    if (payload.telegramVerified !== undefined) data.telegramVerified = payload.telegramVerified;
    if (payload.balance !== undefined) data.balance = payload.balance;
    if (payload.currencyId !== undefined) data.currencyId = payload.currencyId;
    if (payload.birthDate !== undefined) data.birthDate = payload.birthDate ? new Date(payload.birthDate) : null;
    if (payload.passport !== undefined) data.passport = payload.passport;
    if (payload.address !== undefined) data.address = payload.address;
    if (payload.chatLink !== undefined) data.chatLink = payload.chatLink;
    if (payload.telegram?.dateTime !== undefined) data.telegramDateTime = payload.telegram.dateTime ? new Date(payload.telegram.dateTime) : null;
    if (payload.telegram?.id !== undefined) data.telegramId = payload.telegram.id ? BigInt(payload.telegram.id) : null;
    if (payload.telegram?.name !== undefined) data.telegramName = payload.telegram.name;
    if (payload.telegram?.nickname !== undefined) data.telegramNickname = payload.telegram.nickname;
    if (payload.telegram?.bindingLink !== undefined) data.telegramBindingLink = payload.telegram.bindingLink;
    if (payload.photoLink !== undefined) data.photoLink = payload.photoLink;
    if (payload.rates !== undefined) data.rates = payload.rates;
    if (payload.mainCurrency !== undefined) data.mainCurrency = payload.mainCurrency;

    const employee = await prisma.employee.update({
      where: { id },
      data,
      include: {
        country: true,
        role: true,
        company: true,
        currency: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
      },
    });

    // Handle tags if provided
    if (payload.tags !== undefined) {
      await this.updateTags(employee.id, payload.tags);
    }

    // Handle requisites if provided
    if (payload.requisites !== undefined) {
      await this.updateRequisites(employee.id, payload.requisites);
    }

    return employee;
  },

  async delete(id) {
    // Delete related tags and requisites first
    await prisma.employeeTag.deleteMany({ where: { employeeId: id } });
    await prisma.employeeRequisite.deleteMany({ where: { employeeId: id } });

    return prisma.employee.delete({
      where: { id },
    });
  },

  async updateTags(employeeId, tags) {
    const category = await prisma.tagCategory.upsert({
      where: { code: 'employee' },
      update: { name: 'Employee' },
      create: { code: 'employee', name: 'Employee' },
    });

    // Delete existing tags
    await prisma.employeeTag.deleteMany({ where: { employeeId } });

    // Add new tags, upserting Tag by name if no id
    for (const tag of tags) {
      let tagRecord;
      if (tag.id) {
        tagRecord = await prisma.tag.findUnique({ where: { id: tag.id } });
      } else {
        tagRecord = await prisma.tag.upsert({
          where: { name_categoryId: { name: tag.name, categoryId: category.id } },
          update: { color: tag.color || '#777' },
          create: { name: tag.name, color: tag.color || '#777', categoryId: category.id },
        });
      }
      if (tagRecord) {
        await prisma.employeeTag.create({ data: { employeeId, tagId: tagRecord.id } });
      }
    }
  },

  async updateRequisites(employeeId, requisites) {
    // Delete existing requisites
    await prisma.employeeRequisite.deleteMany({ where: { employeeId } });

    // Add new requisites
    if (requisites.length > 0) {
      const reqData = requisites.map(req => ({
        employeeId,
        label: req.label,
        value: req.value,
      }));
      await prisma.employeeRequisite.createMany({ data: reqData });
    }
  },
};

module.exports = EmployeesService;