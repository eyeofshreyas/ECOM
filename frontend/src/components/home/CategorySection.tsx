import { Link } from 'react-router-dom';
import { categories } from '@/data/products';
import { ArrowRight } from 'lucide-react';

export function CategorySection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Shop by Category</h2>
            <p className="text-muted-foreground">Find exactly what you're looking for</p>
          </div>
          <Link
            to="/categories"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => {
            // Convert category name to URL-safe slug
            const categorySlug = category.name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
            return (
              <Link
                key={category.id}
                to={`/category/${categorySlug}`}
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="card-product p-4 text-center hover:scale-[1.02] transition-transform duration-300">
                  {/* Category Image */}
                  <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-secondary">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Category Info */}
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-xl">{category.icon}</span>
                    <h3 className="font-medium text-sm">{category.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{category.count} Products</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile View All */}
        <Link
          to="/categories"
          className="sm:hidden flex items-center justify-center gap-2 mt-6 text-sm font-medium text-primary"
        >
          View All Categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
