import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/products/ProductCard';
import { products } from '@/data/products';

export function FeaturedProducts() {
  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Featured Products</h2>
            <p className="text-muted-foreground">Handpicked favorites from our collection</p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* Mobile View All */}
        <Link
          to="/products"
          className="sm:hidden flex items-center justify-center gap-2 mt-8 text-sm font-medium text-primary"
        >
          View All Products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
