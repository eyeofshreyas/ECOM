import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { toast } = useToast();

    const handleAddToCart = (product: any) => {
        addToCart(product);
        toast({
            title: 'Added to cart',
            description: `${product.name} has been added to your cart.`,
        });
    };

    const handleMoveToCart = (product: any) => {
        addToCart(product);
        removeFromWishlist(product.id);
        toast({
            title: 'Moved to cart',
            description: `${product.name} has been moved to your cart.`,
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    'fixed right-0 top-0 h-full w-full sm:w-[450px] bg-background border-l shadow-lg z-[60] transition-transform duration-300 ease-in-out flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 fill-destructive text-destructive" />
                        <h2 className="font-semibold text-lg">My Wishlist</h2>
                        <span className="text-sm text-muted-foreground">
                            ({wishlistItems.length})
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>


                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {wishlistItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Your wishlist is empty</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Save items you love for later!
                            </p>
                            <Button onClick={onClose} asChild>
                                <Link to="/products">Browse Products</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-muted-foreground mb-2">Showing {wishlistItems.length} item(s)</p>
                            <div className="space-y-4">
                                {wishlistItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 p-5 rounded-lg border bg-white dark:bg-slate-900 hover:shadow-md transition-shadow min-h-[200px]"
                                    >
                                        {/* Product Image */}
                                        <Link
                                            to={`/product/${item.id}`}
                                            onClick={onClose}
                                            className="flex-shrink-0"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-36 h-36 object-cover rounded-lg"
                                            />
                                        </Link>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <Link
                                                    to={`/product/${item.id}`}
                                                    onClick={onClose}
                                                    className="block mb-3"
                                                >
                                                    <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors leading-tight">
                                                        {item.name}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {item.category}
                                                </p>
                                                <p className="font-bold text-xl">
                                                    ₹{item.price.toLocaleString('en-IN')}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    size="default"
                                                    className="flex-1"
                                                    onClick={() => handleMoveToCart(item)}
                                                >
                                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                                    Move to Cart
                                                </Button>
                                                <Button
                                                    size="default"
                                                    variant="outline"
                                                    className="px-4"
                                                    onClick={() => removeFromWishlist(item.id)}
                                                >
                                                    <Trash2 className="h-5 w-5 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {wishlistItems.length > 0 && (
                    <div className="border-t p-4 space-y-3">
                        <Button
                            className="w-full"
                            onClick={() => {
                                wishlistItems.forEach((item) => addToCart(item));
                                toast({
                                    title: 'All items added to cart',
                                    description: `${wishlistItems.length} items have been added to your cart.`,
                                });
                            }}
                        >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Add All to Cart
                        </Button>
                        <Button variant="outline" className="w-full" onClick={onClose} asChild>
                            <Link to="/products">Continue Shopping</Link>
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
