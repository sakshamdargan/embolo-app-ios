# Vendor Filter Feature

## Overview
A modern, mobile-responsive vendor filtering system that allows users to filter products by vendor across the entire application.

## Features Implemented

### 1. Vendor Store (`useVendorStore`)
- **Location**: `src/store/useVendorStore.ts`
- Zustand store with persistence (localStorage)
- Manages selected vendor IDs and "All Vendors" state
- Methods:
  - `toggleVendor()` - Toggle individual vendor selection
  - `selectAllVendors()` - Select all vendors
  - `isVendorSelected()` - Check if a vendor is selected

### 2. Vendor Filter Component
- **Location**: `src/components/VendorFilter.tsx`
- **UI Features**:
  - 10px wide button with Store icon in navbar (left of search bar)
  - Animated dropdown that slides from top
  - Full width, 50vh height panel
  - Search bar to filter vendor list
  - "All Vendors" option at top (checked by default)
  - Individual vendor checkboxes
  - Selected count badge on button
  - Modern design with smooth animations
  - Mobile-first responsive design

### 3. Integration Points

#### Header Component
- **File**: `src/components/Header.tsx`
- Vendor filter button positioned left of search bar
- Flexbox layout: VendorFilter (10px) + SearchBar (flex-1)

#### SearchBar Component
- **File**: `src/components/SearchBar.tsx`
- Filters search results by selected vendors
- Uses vendor store to access selected vendor IDs
- Real-time filtering when vendors change

#### Home Page
- **File**: `src/pages/Home.tsx`
- Filters all product sections by selected vendors
- Updates automatically when vendor selection changes
- Affects:
  - Featured Products
  - Top Rated
  - Best Sellers
  - Trending Now
  - Daily Essentials
  - Special Offers
  - Category-based sections
  - New Arrivals
  - All Products

#### API Updates
- **File**: `src/utils/api.ts`
- `searchProducts()` - Added optional `vendorIds` parameter
- `getProducts()` - Added optional `vendorIds` parameter
- Client-side filtering in SearchBar for now

## User Experience

### Default State
- "All Vendors" is selected by default
- Shows products from all vendors
- Badge shows total vendor count

### Selecting Vendors
1. Click vendor filter button (Store icon)
2. Dropdown slides down from header
3. Search for vendors using search bar
4. Click "All Vendors" or individual vendors
5. Click "Apply Filter" or click outside to close
6. Products automatically filter

### Visual Feedback
- Selected vendors highlighted with green border
- Checkmark icon in selected vendors
- Badge on button shows selection count
- Smooth animations throughout

## Mobile Responsive
- Touch-friendly 10px button
- Full-width dropdown
- Optimized for small screens
- Smooth slide-down animation
- Easy vendor selection with large touch targets

## Persistence
- Selected vendors saved to localStorage
- Persists across sessions
- Automatically restored on page load

## Future Enhancements
- Server-side vendor filtering in API
- Vendor logos/avatars in list
- Recent vendor selections
- Vendor product count display
