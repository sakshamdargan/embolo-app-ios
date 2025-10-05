import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useProductStore } from '@/store/useProductStore';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { Store, Tag } from 'lucide-react';

const Quick = () => {
  const { categories, stores, setCategories, setStores } = useProductStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickData();
  }, []);

  const loadQuickData = async () => {
    try {
      setLoading(true);
      const [categoriesData, storesData] = await Promise.all([
        api.getCategories(),
        api.getStores(),
      ]);
      setCategories(categoriesData);
      setStores(storesData);
    } catch (error) {
      console.error('Error loading quick data:', error);
      toast.error('Failed to load shortcuts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16">
        <header className="gradient-primary p-4">
          <h1 className="text-2xl font-bold text-white">Quick Access</h1>
        </header>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted shimmer rounded-lg mb-3" />
                  <div className="h-4 bg-muted shimmer rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <header className="gradient-primary p-4">
        <h1 className="text-2xl font-bold text-white">Quick Access</h1>
        <p className="text-white/90 text-sm mt-1">Browse by categories and vendors</p>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Categories Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Categories</h2>
          </div>
          
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No categories available</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Card
                  key={category.id}
                  className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      {category.image?.src ? (
                        <img
                          src={category.image.src}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Tag className="w-12 h-12 text-primary" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-center line-clamp-1">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        {category.count} products
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Vendors Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Top Vendors</h2>
          </div>
          
          {stores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No vendors available</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stores.slice(0, 6).map((store) => (
                <Card
                  key={store.id}
                  className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      {store.banner ? (
                        <img
                          src={store.banner}
                          alt={store.store_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-12 h-12 text-primary" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-center line-clamp-1">
                        {store.store_name}
                      </p>
                      <p className="text-xs text-muted-foreground text-center line-clamp-1">
                        {store.vendor_name}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Quick;
