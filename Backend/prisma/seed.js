// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gsse.work';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  
  const admin = await prisma.employee.upsert({
    where: { login: ADMIN_LOGIN },
    update: {
      password: passwordHash,
      status: 'active',
      full_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
    },
    create: {
      login: ADMIN_LOGIN,
      password: passwordHash,
      status: 'active',
      full_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
    },
  });

  console.log('✔ Admin ensured:', admin.login);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
