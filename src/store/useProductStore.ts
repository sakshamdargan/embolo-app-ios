import { create } from 'zustand';
import { Product, Category, Store } from '@/utils/api';

interface ProductStore {
  products: Product[];
  categories: Category[];
  stores: Store[];
  loading: boolean;
  error: string | null;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setStores: (stores: Store[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  categories: [],
  stores: [],
  loading: false,
  error: null,
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setStores: (stores) => set({ stores }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
