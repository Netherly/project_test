const prisma = require('../../prisma/client');


const createClient = (data) => prisma.client.create({ data });

const getAllClients = () => prisma.client.findMany();

const getClientById = (id) => prisma.client.findUnique({ where: { id } });

const updateClient = (id, data) =>
  prisma.client.update({ where: { id }, data });

const deleteClient = (id) => prisma.client.delete({ where: { id } });

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
};
