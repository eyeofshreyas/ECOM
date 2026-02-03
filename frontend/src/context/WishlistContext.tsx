import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

interface WishlistContextType {
    wishlistItems: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleWishlist: (product: Product) => void;
    isWishlistOpen: boolean;
    setIsWishlistOpen: (isOpen: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const { toast } = useToast();

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            setWishlistItems(JSON.parse(savedWishlist));
        }
    }, []);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToWishlist = (product: Product) => {
        setWishlistItems((prev) => {
            if (prev.some((item) => item.id === product.id)) {
                return prev;
            }
            toast({
                title: 'Added to Wishlist',
                description: `${product.name} has been added to your wishlist.`,
            });
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId: string) => {
        setWishlistItems((prev) => {
            const product = prev.find((item) => item.id === productId);
            toast({
                title: 'Removed from Wishlist',
                description: `${product?.name} has been removed from your wishlist.`,
            });
            return prev.filter((item) => item.id !== productId);
        });
    };

    const isInWishlist = (productId: string) => {
        return wishlistItems.some((item) => item.id === productId);
    };

    const toggleWishlist = (product: Product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                toggleWishlist,
                isWishlistOpen,
                setIsWishlistOpen,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
