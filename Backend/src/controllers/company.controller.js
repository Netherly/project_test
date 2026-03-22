const companyService = require('../services/company.service');

const listCompanies = async (_req, res, next) => {
  try {
    const companies = await companyService.list();
    res.json(companies);
  } catch (err) {
    next(err);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.create(req.body);
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await companyService.getById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    next(err);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await companyService.update(req.params.id, req.body);
    res.json(company);
  } catch (err) {
    next(err);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    await companyService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
