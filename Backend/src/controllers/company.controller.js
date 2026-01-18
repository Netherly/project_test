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

module.exports = {
  listCompanies,
  createCompany,
};
