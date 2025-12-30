const prisma = require('../../prisma/client');


async function resolveDictionaryId(model, name, additionalCreateData = {}) {
  if (!name || typeof name !== 'string') return null;
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  
  let record = await model.findFirst({
    where: { name: { equals: trimmedName, mode: 'insensitive' } }
  });

 
  if (!record) {
    record = await model.create({
      data: { name: trimmedName, ...additionalCreateData }
    });
  }
  return record.id;
}

const ClientsService = {
  async getAllClients() {
    return prisma.client.findMany({
      include: {
        category: true,
        source: true,
        country: true,
        currency: true,
        tags: { include: { tag: true } },
        credentials: true,
        company: true,
        manager: true,
      },
      orderBy: { name: 'asc' }
    });
  },

  async getClientById(id) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        category: true,
        source: true,
        country: true,
        currency: true,
        tags: { include: { tag: true } },
        credentials: true,
        company: true,
        manager: true,
      }
    });
  },

  // --- CREATE ---
  async createClient(payload) {
    const categoryId = await resolveDictionaryId(prisma.clientCategoryDict, payload.category);
    const sourceId = await resolveDictionaryId(prisma.clientSourceDict, payload.source);
    const countryId = await resolveDictionaryId(prisma.country, payload.country);
    
    
    const currencyId = await resolveDictionaryId(
      prisma.currencyDict, 
      payload.currency, 
      { code: payload.currency } 
    );

   
    let managerId = payload.managerId || payload.manager_id;
    let companyId = payload.companyId || payload.company_id;
    let referrerId = payload.referrerId || payload.referrer_id;
    let referrerFirstId = payload.referrerFirstId || payload.referrer_first_id;

    if (managerId) {
       const exists = await prisma.user.findUnique({ where: { id: managerId } }).catch(() => null);
       if (!exists) managerId = null; 
    }
    
    if (companyId) {
       const exists = await prisma.client.findUnique({ where: { id: companyId } }).catch(() => null);
       if (!exists) companyId = null;
    }

    if (referrerId) {
       const exists = await prisma.client.findUnique({ where: { id: referrerId } }).catch(() => null);
       if (!exists) referrerId = null;
    }

    
    const data = {
      name: payload.name,
      share_info: payload.share_info ? "true" : "false", 
      intro_description: payload.intro_description,
      note: payload.note,
      full_name: payload.full_name,
      messenger_name: payload.messenger_name,
      phone: payload.phone,
      email: payload.email,
      city: payload.city,
      payment_details: payload.payment_details,
      
      hourly_rate: payload.hourly_rate ? parseFloat(payload.hourly_rate) : null,
      percent: payload.percent ? parseFloat(payload.percent) : null,
      
      status: payload.status || 'active',
      
      chat_link: payload.chatLink || payload.chat_link,
      photo_link: payload.photoLink || payload.photo_link,
      folder_link: payload.folderLink || payload.folder_link,

      categoryId,
      sourceId,
      countryId,
      currencyId,
      managerId,
      companyId,
      referrer_id: referrerId,
      referrer_first_id: referrerFirstId, 

      credentials: {
        create: (payload.credentials || []).map(cred => ({
          login: cred.login,
          password: cred.password,
          description: cred.name ? `${cred.name}: ${cred.description || ''}` : cred.description
        }))
      }
    };

    
    const client = await prisma.client.create({
      data,
      include: { tags: true }
    });

    
    if (payload.tags && Array.isArray(payload.tags)) {
      await this.updateTags(client.id, payload.tags);
    }

    return this.getClientById(client.id);
  },

  // --- UPDATE ---
  async updateClient(id, payload) {
    const categoryId = payload.category !== undefined 
      ? await resolveDictionaryId(prisma.clientCategoryDict, payload.category) : undefined;
    const sourceId = payload.source !== undefined 
      ? await resolveDictionaryId(prisma.clientSourceDict, payload.source) : undefined;
    const countryId = payload.country !== undefined 
      ? await resolveDictionaryId(prisma.country, payload.country) : undefined;
    const currencyId = payload.currency !== undefined 
      ? await resolveDictionaryId(prisma.currencyDict, payload.currency, { code: payload.currency }) : undefined;

    const data = {
      name: payload.name,
      ...(payload.share_info !== undefined && { share_info: payload.share_info ? "true" : "false" }),
      
      intro_description: payload.intro_description,
      note: payload.note,
      full_name: payload.full_name,
      messenger_name: payload.messenger_name,
      phone: payload.phone,
      email: payload.email,
      city: payload.city,
      payment_details: payload.payment_details,
      hourly_rate: payload.hourly_rate ? parseFloat(payload.hourly_rate) : null,
      percent: payload.percent ? parseFloat(payload.percent) : null,
      status: payload.status,
      chat_link: payload.chatLink || payload.chat_link,
      photo_link: payload.photoLink || payload.photo_link,
      folder_link: payload.folderLink || payload.folder_link,

      ...(categoryId !== undefined && { categoryId }),
      ...(sourceId !== undefined && { sourceId }),
      ...(countryId !== undefined && { countryId }),
      ...(currencyId !== undefined && { currencyId }),
      
      managerId: payload.managerId || null,
      companyId: payload.companyId || null,
      referrer_id: payload.referrerId || payload.referrer_id || null,
      referrer_first_id: payload.referrerFirstId || payload.referrer_first_id || null,
    };

    await prisma.client.update({ where: { id }, data });

    if (payload.tags) {
      await this.updateTags(id, payload.tags);
    }
    if (payload.credentials) {
      await this.updateCredentials(id, payload.credentials);
    }

    return this.getClientById(id);
  },

  async deleteClient(id) {
    await prisma.credential.deleteMany({ where: { clientId: id } });
    await prisma.clientTag.deleteMany({ where: { clientId: id } });
    return prisma.client.delete({ where: { id } });
  },

  // --- HELPERS ---

 
  async updateTags(clientId, tags) {
    await prisma.clientTag.deleteMany({ where: { clientId } });

    let defaultCategory = await prisma.tagCategory.findFirst(); 
    
    
    if (!defaultCategory) {
       try {
         defaultCategory = await prisma.tagCategory.create({ data: { name: 'General', color: '#000' } });
       } catch (e) {
         console.warn('Не удалось создать дефолтную категорию тегов');
       }
    }

    for (const tag of tags) {
      
      let tagRecord = await prisma.tag.findFirst({
        where: { name: tag.name }
      });

     
      if (!tagRecord) {
        if (!defaultCategory) {
            console.error(`Невозможно создать тег "${tag.name}": нет категорий тегов в базе.`);
            continue; 
        }

        tagRecord = await prisma.tag.create({
          data: {
            name: tag.name,
            color: tag.color || '#777',
            categoryId: defaultCategory.id 
          }
        });
      }

     
      await prisma.clientTag.create({
        data: {
          clientId,
          tagId: tagRecord.id
        }
      });
    }
  },

  async updateCredentials(clientId, credentials) {
    await prisma.credential.deleteMany({ where: { clientId } });
    if (credentials.length > 0) {
      const credsData = credentials.map(c => ({
        clientId,
        login: c.login,
        password: c.password,
        description: c.name ? `${c.name}: ${c.description || ''}` : c.description
      }));
      await prisma.credential.createMany({ data: credsData });
    }
  }
};

module.exports = ClientsService;