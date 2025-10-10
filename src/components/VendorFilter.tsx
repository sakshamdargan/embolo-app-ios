import { useState, useEffect, useRef } from 'react';
import { Store, Search, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { Vendor as VendorType } from '@/services/productService';
import { useVendorStore } from '@/store/useVendorStore';
import { toast } from 'sonner';

const VendorFilter = () => {
  const [vendors, setVendors] = useState<VendorType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    selectedVendorIds, 
    allVendorsSelected, 
    isFilterOpen,
    toggleVendor, 
    selectAllVendors,
    closeFilter,
    toggleFilter
  } = useVendorStore();

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeFilter();
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, closeFilter]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await api.getStores();
      setVendors(data);
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleVendor = (vendorId: number) => {
    toggleVendor(vendorId);
  };

  const handleSelectAll = () => {
    selectAllVendors();
  };

  const selectedCount = allVendorsSelected 
    ? vendors.length 
    : selectedVendorIds.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Vendor Filter Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFilter}
        className="relative text-black hover:bg-gray-100 p-2 font-semibold [font-style:normal] [font-weight:600] [font-variant:normal] [text-transform:none] [line-height:1]"
        aria-label="Filter by vendor"
      >
        <Store className="!w-6 !h-6" strokeWidth={2.5} />
        {selectedCount > 0 && selectedCount < vendors.length && !allVendorsSelected && (
          <Badge className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
            {selectedCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel */}
      <div
        className={`fixed left-0 right-0 bottom-0 bg-white shadow-2xl z-50 overflow-hidden transition-all duration-300 ease-in-out border-t rounded-t-2xl ${
          isFilterOpen 
            ? 'max-h-[50vh] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
        style={{
          transform: isFilterOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Filter by Vendor</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeFilter}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors..."
              className="pl-10 h-10 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Vendor List */}
          <div className="overflow-y-auto max-h-[calc(50vh-180px)] space-y-1">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading vendors...
              </div>
            ) : (
              <>
                {/* All Vendors Option */}
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-primary/5 ${
                    allVendorsSelected ? 'bg-primary/10 border-2 border-primary' : 'border-2 border-transparent'
                  }`}
                  onClick={handleSelectAll}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    allVendorsSelected 
                      ? 'bg-primary border-primary' 
                      : 'border-gray-300'
                  }`}>
                    {allVendorsSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">All Vendors</p>
                    <p className="text-xs text-muted-foreground">
                      Show products from all vendors
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {vendors.length} vendors
                  </span>
                </div>

                {/* Individual Vendors */}
                {filteredVendors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No vendors found
                  </div>
                ) : (
                  filteredVendors.map((vendor) => {
                    const isSelected = !allVendorsSelected && selectedVendorIds.includes(vendor.id);
                    
                    return (
                      <div
                        key={vendor.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-primary/5 ${
                          isSelected ? 'bg-primary/10 border-2 border-primary' : 'border-2 border-transparent'
                        }`}
                        onClick={() => handleToggleVendor(vendor.id)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-primary border-primary' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {vendor.store_name || vendor.vendor_name}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Footer with selected count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {allVendorsSelected 
                  ? `All ${vendors.length} vendors selected`
                  : `${selectedVendorIds.length} vendor${selectedVendorIds.length !== 1 ? 's' : ''} selected`
                }
              </span>
              <Button
                size="sm"
                onClick={closeFilter}
                className="h-8"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={closeFilter}
        />
      )}
    </div>
  );
};

export default VendorFilter;
