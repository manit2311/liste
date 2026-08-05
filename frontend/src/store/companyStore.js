import { create } from 'zustand';

export const useCompanyStore = create((set) => ({
  companies: [],
  selectedCompanyId: null, // null = all companies (super admin default)
  setCompanies: (companies) => set({ companies }),
  setSelectedCompany: (id) => set({ selectedCompanyId: id }),
  reset: () => set({ companies: [], selectedCompanyId: null }),
}));