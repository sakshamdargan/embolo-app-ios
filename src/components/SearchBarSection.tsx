import { useState } from 'react';
import SearchBar from '@/components/SearchBar';

const SearchBarSection = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="sticky top-16 z-30 bg-white">
      <div className="container mx-auto px-4 py-0">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search products..."
        />
      </div>
    </div>
  );
};

export default SearchBarSection;





