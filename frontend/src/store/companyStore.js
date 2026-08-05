import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCompanyStore = create(
  persist(
    (set) => ({
      companies: [],
      selectedCompanyId: null,
      setCompanies: (companies) => set({ companies }),
      setSelectedCompany: (id) => set({ selectedCompanyId: id }),
      reset: () => set({ companies: [], selectedCompanyId: null }),
    }),
    { name: 'company-store' }
  )
);