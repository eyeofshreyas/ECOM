import { Heart, Star, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isLiked = isInWishlist(product.id);

  const badgeStyles = {
    new: 'bg-primary text-primary-foreground',
    sale: 'bg-destructive text-destructive-foreground',
    bestseller: 'bg-accent text-accent-foreground',
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      className="group card-product animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badge */}
        {product.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide",
              badgeStyles[product.badge]
            )}
          >
            {product.badge}
          </span>
        )}

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-soft hover:bg-card",
              isLiked && "text-destructive"
            )}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product);
            }}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
        </div>

        {/* Add to Cart - Mobile friendly */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <Button
            className="w-full"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link to={`/product/${product.id}`} className="block">
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews.toLocaleString()})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold">₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-medium text-destructive">-{discount}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
