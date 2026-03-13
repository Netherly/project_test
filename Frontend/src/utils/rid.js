export const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export default rid;
