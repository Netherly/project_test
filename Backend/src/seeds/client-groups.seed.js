const prisma = require('../../prisma/client');

const DEFAULT_CLIENT_GROUPS = [
  { order: 1, name: 'Партнёры' },
  { order: 2, name: 'Наши клиенты' },
  { order: 3, name: 'По ситуации' },
];

async function ensureDefaultClientGroups() {
  let defaultGroupId = null;

  for (const group of DEFAULT_CLIENT_GROUPS) {
    if (!group?.name) continue;

    const existingByOrder = await prisma.clientGroup.findFirst({
      where: { order: group.order },
    });
    if (existingByOrder) {
      if (existingByOrder.name !== group.name) {
        await prisma.clientGroup.update({
          where: { id: existingByOrder.id },
          data: { name: group.name },
        });
      }
      if (group.order === 2) defaultGroupId = existingByOrder.id;
      continue;
    }

    const existingByName = await prisma.clientGroup.findUnique({
      where: { name: group.name },
    });
    if (existingByName) {
      if (existingByName.order !== group.order) {
        await prisma.clientGroup.update({
          where: { id: existingByName.id },
          data: { order: group.order },
        });
      }
      if (group.order === 2) defaultGroupId = existingByName.id;
      continue;
    }

    const created = await prisma.clientGroup.create({
      data: { name: group.name, order: group.order },
    });
    if (group.order === 2) defaultGroupId = created.id;
  }

  if (defaultGroupId) {
    await prisma.client.updateMany({
      where: { groupId: null },
      data: { groupId: defaultGroupId },
    });
  }
}

module.exports = { ensureDefaultClientGroups };
