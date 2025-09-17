const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (login, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.employee.create({
        data: { login, password: hashedPassword }
    });
    return employee;
};

const login = async (login, password) => {
    const employee = await prisma.employee.findUnique({ where: { login } });
    if (!employee) throw new Error('Employee not found');

    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) throw new Error('Invalid password');

    const token = jwt.sign({ employeeId: employee.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return { token };
};

module.exports = { register, login };
