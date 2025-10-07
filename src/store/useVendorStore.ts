import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VendorStore {
  selectedVendorIds: number[];
  allVendorsSelected: boolean;
  isFilterOpen: boolean;
  setSelectedVendorIds: (ids: number[]) => void;
  toggleVendor: (id: number) => void;
  selectAllVendors: () => void;
  clearVendors: () => void;
  isVendorSelected: (id: number) => boolean;
  openFilter: () => void;
  closeFilter: () => void;
  toggleFilter: () => void;
}

export const useVendorStore = create<VendorStore>()(
  persist(
    (set, get) => ({
      selectedVendorIds: [],
      allVendorsSelected: true,
      isFilterOpen: false,
      
      setSelectedVendorIds: (ids) => 
        set({ 
          selectedVendorIds: ids,
          allVendorsSelected: ids.length === 0
        }),
      
      toggleVendor: (id) => 
        set((state) => {
          const isCurrentlySelected = state.selectedVendorIds.includes(id);
          const newSelectedIds = isCurrentlySelected
            ? state.selectedVendorIds.filter((vendorId) => vendorId !== id)
            : [...state.selectedVendorIds, id];
          
          return {
            selectedVendorIds: newSelectedIds,
            allVendorsSelected: newSelectedIds.length === 0,
          };
        }),
      
      selectAllVendors: () => 
        set({ selectedVendorIds: [], allVendorsSelected: true }),
      
      clearVendors: () => 
        set({ selectedVendorIds: [], allVendorsSelected: false }),
      
      isVendorSelected: (id) => {
        const state = get();
        return state.allVendorsSelected || state.selectedVendorIds.includes(id);
      },

      openFilter: () => set({ isFilterOpen: true }),
      closeFilter: () => set({ isFilterOpen: false }),
      toggleFilter: () => set((state) => ({ isFilterOpen: !state.isFilterOpen })),
    }),
    {
      name: 'vendor-filter-storage',
    }
  )
);
