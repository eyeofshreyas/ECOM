export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: 'new' | 'sale' | 'bestseller';
  description?: string;
  features?: string[];
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
