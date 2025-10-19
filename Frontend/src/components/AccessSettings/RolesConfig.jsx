export const modules = [
    { key: 'employees', name: 'Сотрудники' },
    { key: 'clients', name: 'Клиенты' },
    { key: 'orders', name: 'Заказы' },
    { key: 'performers', name: 'Исполнители' },
    { key: 'magazine', name: 'Журнал' },
    { key: 'objectives', name: 'Задачи' },
    { key: 'reports', name: 'Отчеты'},
    { key: 'archive', name: 'Архив' },
    { key: 'settings', name: 'Настройки' },
    { key: 'assets', name: 'Активы' },
    { key: 'finance', name: 'Транзакции' },
    { key: 'analytics', name: 'Аналитика' },
];

export const actions = [
    { key: 'create', name: 'Создание' },
    { key: 'view', name: 'Просмотр' },
    { key: 'edit', name: 'Изменения' },
    { key: 'delete', name: 'Удаление' }
];

// (все запрещено)
const createBasePermissions = () => {
    const permissions = {};
    modules.forEach(module => {
        permissions[module.key] = {};
        actions.forEach(action => {
            permissions[module.key][action.key] = 'forbidden';
        });
    });
    return permissions;
};

// (все разрешено)
const createFullPermissions = () => {
    const permissions = {};
    modules.forEach(module => {
        permissions[module.key] = {};
        actions.forEach(action => {
            permissions[module.key][action.key] = 'allowed';
        });
    });
    return permissions;
};

// Предустановленная роли 
export const defaultRoles = [
    {
        id: 'owner',
        name: 'Владелец',
        isBase: true,
        isProtected: true, // Роль нельзя удалить и изменить
        permissions: createFullPermissions()
    },
    {
        id: 'admin',
        name: 'Админ',
        isBase: true,
        isProtected: true, 
        permissions: {
            employees: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            clients: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            orders: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            performers: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            objectives: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            magazine: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            reports : { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            archive: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            settings: { create: 'allowed', view: 'allowed', edit: 'allowed', delete: 'allowed' },
            finance: { create: 'allowed', view: 'responsible', edit: 'responsible', delete: 'responsible' },
            assets: { create: 'forbidden', view: 'responsible', edit: 'forbidden', delete: 'forbidden' },
            analytics: { create: 'forbidden', view: 'allowed', edit: 'forbidden', delete: 'forbidden' }
        }
    },
    {
        id: 'manager',
        name: 'Менеджер',
        isBase: true,
        isProtected: true,
        permissions: {
            employees: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            clients: { create: 'allowed', view: 'responsible', edit: 'responsible', delete: 'forbidden' },
            orders: { create: 'allowed', view: 'responsible', edit: 'responsible', delete: 'forbidden' },
            performers: { create: 'allowed', view: 'responsible', edit: 'responsible', delete: 'responsible' },
            objectives: { create: 'allowed', view: 'allowed', edit: 'responsible', delete: 'responsible' },
            magazine: { create: 'allowed', view: 'responsible', edit: 'responsible', delete: 'responsible' },
            reports: { create: 'allowed', view: 'responsible', edit: 'responsible', delete: 'forbidden' },
            archive: { create: 'forbidden', view: 'responsible', edit: 'forbidden', delete: 'forbidden' },
            settings: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            finance: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            assets: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            analytics: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' }
        }
    },
    {
        id: 'employee',
        name: 'Сотрудник',
        isBase: true,
        isProtected: true,
        permissions: {
            employees: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            clients: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            orders: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            performers: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            objectives: { create: 'allowed', view: 'responsible', edit: 'responsible', delete: 'responsible' },
            magazine: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            reports: { create: 'forbidden', view: 'responsible', edit: 'forbidden', delete: 'forbidden' },
            archive: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            settings: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            finance: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            assets: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' },
            analytics: { create: 'forbidden', view: 'forbidden', edit: 'forbidden', delete: 'forbidden' }
        }
    }
];

// Функция для создания новой  роли
export const createNewRole = (name) => ({
    id: `role-${Date.now()}`,
    name: name.trim(),
    isBase: false,
    isProtected: false,
    permissions: createBasePermissions()
});

export const isRoleProtected = (role) => role?.isProtected === true;

export const canDeleteRole = (role) => !role?.isBase;