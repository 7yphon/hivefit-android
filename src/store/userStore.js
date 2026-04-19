import { create } from 'zustand';
import { getActiveUser, getUsers, setActiveUser } from '../database/db';

export const useUserStore = create((set, get) => ({
  activeUser: null,
  users: [],

  loadUsers: async () => {
    const users = await getUsers();
    const active = users.find(u => u.is_active) || users[0] || null;
    set({ users, activeUser: active });
  },

  switchUser: async (id) => {
    await setActiveUser(id);
    const users = await getUsers();
    const active = users.find(u => u.id === id) || null;
    set({ users, activeUser: active });
  },
}));
