import { Card, CardContent } from '@/components/ui/card';

const ProductSkeleton = () => {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="p-0">
        <div className="aspect-square bg-muted shimmer" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-muted shimmer rounded w-3/4" />
          <div className="h-3 bg-muted shimmer rounded w-1/2" />
          <div className="h-5 bg-muted shimmer rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-8 bg-muted shimmer rounded flex-1" />
            <div className="h-8 bg-muted shimmer rounded flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSkeleton;
