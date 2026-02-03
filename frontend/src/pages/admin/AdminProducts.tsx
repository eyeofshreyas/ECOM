import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Menu,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Product {
    _id: string;
    name: string;
    price: number;
    brand: string;
    category: string;
    countInStock: number;
    image: string;
    description: string;
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = products.filter(
                (product) =>
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/products`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            const data = await response.json();
            setProducts(data.products || []);
            setFilteredProducts(data.products || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load products',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProduct = async (formData: any) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

            // First create sample product
            const createResponse = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            const createdProduct = await createResponse.json();

            // Then update it with actual data
            const updateResponse = await fetch(`${API_URL}/products/${createdProduct._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify(formData),
            });

            if (updateResponse.ok) {
                toast({
                    title: 'Success',
                    description: 'Product created successfully',
                });
                fetchProducts();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create product',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateProduct = async (formData: any) => {
        if (!selectedProduct) return;

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/products/${selectedProduct._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Product updated successfully',
                });
                fetchProducts();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update product',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/products/${productToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Product deleted successfully',
                });
                fetchProducts();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete product',
                variant: 'destructive',
            });
        } finally {
            setDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    const openEditForm = (product: Product) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const openCreateForm = () => {
        setSelectedProduct(undefined);
        setIsFormOpen(true);
    };

    const confirmDelete = (productId: string) => {
        setProductToDelete(productId);
        setDeleteDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background">
            <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex-1 overflow-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">Products Management</h1>
                                <p className="text-sm text-muted-foreground">{filteredProducts.length} products</p>
                            </div>
                        </div>
                        <Button onClick={openCreateForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Products Table */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Brand</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Stock</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr key={product._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded-lg"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                                                        }}
                                                    />
                                                    <span className="font-medium">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">{product.brand}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
                                            <td className="py-3 px-4 text-right font-medium">₹{product.price.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 ${product.countInStock < 10 ? 'text-orange-500' : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    {product.countInStock < 10 && <AlertCircle className="h-3 w-3" />}
                                                    {product.countInStock}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditForm(product)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => confirmDelete(product._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Form Dialog */}
            <ProductForm
                product={selectedProduct}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={selectedProduct ? handleUpdateProduct : handleCreateProduct}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product from your inventory.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
