import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function Wishlist() {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleMoveToCart = (product: any) => {
        addToCart(product);
        removeFromWishlist(product.id);
        toast({
            title: 'Moved to cart',
            description: `${product.name} has been moved to your cart.`,
        });
    };

    const handleAddAllToCart = () => {
        wishlistItems.forEach((item) => addToCart(item));
        toast({
            title: 'All items added to cart',
            description: `${wishlistItems.length} items have been added to your cart.`,
        });
        navigate('/');
    };

    return (
        <>
            <Header />
            <CartDrawer />

            <main className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    <Heart className="h-8 w-8 fill-destructive text-destructive" />
                                    My Wishlist
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                        </div>

                        {wishlistItems.length > 0 && (
                            <Button onClick={handleAddAllToCart} size="lg">
                                <ShoppingBag className="h-5 w-5 mr-2" />
                                Add All to Cart
                            </Button>
                        )}
                    </div>

                    {/* Content */}
                    {wishlistItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Heart className="h-24 w-24 text-muted-foreground mb-6" />
                            <h2 className="text-2xl font-semibold mb-3">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mb-8 max-w-md">
                                Save items you love for later! Click the heart icon on any product to add it to your wishlist.
                            </p>
                            <Button onClick={() => navigate('/products')} size="lg">
                                Browse Products
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {wishlistItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative bg-card rounded-lg border p-5 hover:shadow-lg transition-all duration-300"
                                >
                                    {/* Product Image */}
                                    <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-secondary">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            onClick={() => navigate(`/product/${item.id}`)}
                                        />

                                        {/* Remove Button */}
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="absolute top-2 right-2 h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-md"
                                            onClick={() => removeFromWishlist(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>

                                    {/* Product Info */}
                                    <div className="space-y-3">
                                        <div>
                                            <h3
                                                className="font-semibold text-base line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => navigate(`/product/${item.id}`)}
                                            >
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {item.category}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-xl">
                                                ₹{item.price.toLocaleString('en-IN')}
                                            </p>
                                            {item.rating && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <span className="text-yellow-500">★</span>
                                                    <span className="font-medium">{item.rating}</span>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            className="w-full"
                                            onClick={() => handleMoveToCart(item)}
                                        >
                                            <ShoppingBag className="h-4 w-4 mr-2" />
                                            Move to Cart
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
