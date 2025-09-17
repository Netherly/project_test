<<<<<<< HEAD
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
=======
// CommonJS prisma client
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

>>>>>>> update_last_changes
module.exports = prisma;
