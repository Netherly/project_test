const taskService = require('../services/task.service');

const createTask = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const employeeId = req.employee.employeeId;
        const task = await taskService.createTask(employeeId, title, description);
        res.json(task);
    } catch (err) {
        next(err);
    }
};

module.exports = { createTask };
