import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/products/ProductCard';
import { products } from '@/data/products';

export function TrendingProducts() {
  const trendingProducts = products.slice(4, 8);

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-1">Trending Now</h2>
              <p className="text-muted-foreground">What everyone's loving this week</p>
            </div>
          </div>
          <Link
            to="/category/trending"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            See More
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {trendingProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
