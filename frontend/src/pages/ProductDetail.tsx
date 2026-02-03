import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star, Truck, Shield, RotateCcw, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProductCard } from '@/components/products/ProductCard';
import api from '@/lib/api';
import { Product } from '@/types/product';
import { cn } from '@/lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        // Map backend data to match frontend Product interface
        setProduct({
          ...data,
          id: data._id,
          reviews: data.numReviews || 0,
        });
        setLoading(false);
      } catch (err) {
        setError('Product not found');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>; // You might want a better loader

  // Related products logic (simplified for now, or fetch from backend if available)
  const relatedProducts: Product[] = []; // You can implement a fetch for related products later

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold mb-4">Product Not Found</h1>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          {/* Back Button - Mobile */}
          <Button variant="ghost" className="mb-4 lg:hidden" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>

          {/* Product Section */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-secondary">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Thumbnail placeholder for future image gallery */}
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden bg-secondary border-2 transition-colors ${selectedImage === i ? 'border-primary' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={product.image}
                      alt={`${product.name} view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6 animate-fade-in">
              {/* Category & Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{product.category}</span>
                {product.badge && (
                  <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium uppercase">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl lg:text-4xl font-semibold">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating)
                        ? 'fill-primary text-primary'
                        : 'fill-muted text-muted'
                        }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews.toLocaleString()} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold">₹{product.price.toLocaleString('en-IN')}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground">{product.description}</p>

              {/* Features */}
              {product.features && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Highlights</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center border border-border rounded-lg w-fit">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleAddToCart}
                    variant="outline"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>

                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => navigate('/checkout', { state: { product, quantity } })}
                  >
                    Buy Now
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toggleWishlist(product)}
                    className={cn(
                      isInWishlist(product.id) && "text-destructive"
                    )}
                  >
                    <Heart className={cn(
                      "h-5 w-5",
                      isInWishlist(product.id) && "fill-current"
                    )} />
                  </Button>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-medium">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">Orders over ₹2,500</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-medium">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">100% Protected</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-medium">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day policy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="font-display text-2xl font-semibold mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
