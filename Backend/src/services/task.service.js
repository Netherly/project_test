const prisma = require('../../prisma/client');

const createTask = async (employeeId, title, description) => {
    return await prisma.task.create({
        data: {
            title,
            description,
            employeeId
        }
    });
};

module.exports = { createTask };
