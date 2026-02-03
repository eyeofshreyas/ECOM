import { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid3X3, LayoutList, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProductCard } from '@/components/products/ProductCard';
import { categories } from '@/data/products';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Product } from '@/types/product';

export default function Products() {
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New States for filters
  const [priceRange, setPriceRange] = useState([0, 80000]);
  const [minRating, setMinRating] = useState<number | null>(null);

  const { id } = useParams();

  useEffect(() => {
    if (id) {
      // Convert URL-safe slug back to category name
      let categoryName = '';

      switch (id.toLowerCase()) {
        case 'electronics':
          categoryName = 'Electronics';
          break;
        case 'fashion':
          categoryName = 'Fashion';
          break;
        case 'home-living':
          categoryName = 'Home & Living';
          break;
        case 'beauty':
          categoryName = 'Beauty';
          break;
        case 'sports':
          categoryName = 'Sports';
          break;
        case 'books':
          categoryName = 'Books';
          break;
        default:
          // Handle other cases by capitalizing first letter
          categoryName = id.charAt(0).toUpperCase() + id.slice(1);
      }

      setSelectedCategory(categoryName);
    } else {
      setSelectedCategory(null);
    }
  }, [id]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // If there's a search keyword, pass it to the API
        const params = new URLSearchParams();
        if (searchKeyword) params.append('keyword', searchKeyword);

        const { data } = await api.get(`/products?${params.toString()}`);
        // Map backend data to match frontend Product interface
        const mappedProducts = data.products.map((p: any) => ({
          ...p,
          id: p._id,
          reviews: p.numReviews || 0,
        }));
        setProducts(mappedProducts);
        setError(null);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchKeyword]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesRating = minRating ? p.rating >= minRating : true;
    return matchesCategory && matchesPrice && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground">All Products</span>
            {searchKeyword && (
              <>
                <span>/</span>
                <span className="text-foreground">Search: "{searchKeyword}"</span>
              </>
            )}
          </nav>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold mb-1">
                {searchKeyword ? `Search Results for "${searchKeyword}"` : 'All Products'}
              </h1>
              <p className="text-muted-foreground">{sortedProducts.length} products</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('rounded-r-none', viewMode === 'grid' && 'bg-secondary')}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('rounded-l-none', viewMode === 'list' && 'bg-secondary')}
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </h3>

                  {/* Categories */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Categories</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                          'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          !selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                        )}
                      >
                        All Products
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.name)}
                          className={cn(
                            'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                            selectedCategory === category.name
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary'
                          )}
                        >
                          {category.icon} {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium">Price Range</h4>
                    <div className="px-2">
                      <Slider
                        defaultValue={[0, 80000]}
                        max={165000}
                        step={1000}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="my-4"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
                        <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium">Rating</h4>
                    <div className="space-y-2">
                      {[4, 3, 2].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={minRating === rating}
                            onCheckedChange={(checked) => setMinRating(checked ? rating : null)}
                          />
                          <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer">
                            {rating} Stars & Up
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Filters */}
            {isFilterOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-background shadow-large p-6 animate-slide-in-right">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold">Filters</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Categories</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setIsFilterOpen(false);
                        }}
                        className={cn(
                          'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          !selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                        )}
                      >
                        All Products
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                            selectedCategory === category.name
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary'
                          )}
                        >
                          {category.icon} {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {/* Active Filters */}
              {selectedCategory && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    {selectedCategory}
                    <X className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-16">
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center py-16">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      'grid gap-4 lg:gap-6',
                      viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                    )}
                  >
                    {sortedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>

                  {sortedProducts.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground">No products found</p>
                      <Button variant="outline" className="mt-4" onClick={() => {
                        window.location.href = '/products';
                      }}>
                        Clear Search & Filters
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
