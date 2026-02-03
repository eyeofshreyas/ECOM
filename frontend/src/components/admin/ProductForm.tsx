import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ProductFormData {
    name: string;
    price: number;
    description: string;
    image: string;
    brand: string;
    category: string;
    countInStock: number;
}

interface ProductFormProps {
    product?: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ProductFormData) => Promise<void>;
}

export function ProductForm({ product, isOpen, onClose, onSave }: ProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProductFormData>({
        defaultValues: product || {
            name: '',
            price: 0,
            description: '',
            image: '',
            brand: '',
            category: '',
            countInStock: 0,
        },
    });

    useEffect(() => {
        if (product) {
            reset({
                ...product,
                price: Number(product.price),
                countInStock: Number(product.countInStock),
            });
        } else {
            reset({
                name: '',
                price: 0,
                description: '',
                image: '',
                brand: '',
                category: '',
                countInStock: 0,
            });
        }
    }, [product, reset, isOpen]);

    const onSubmit = async (data: ProductFormData) => {
        setIsLoading(true);
        try {
            // Ensure price and stock are numbers
            const formData = {
                ...data,
                price: Number(data.price),
                countInStock: Number(data.countInStock),
            };
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                        {product ? 'Update product information' : 'Create a new product in your inventory'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input
                                id="name"
                                {...register('name', { required: 'Name is required' })}
                                placeholder="Enter product name"
                            />
                            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="price">Price (₹) *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                {...register('price', {
                                    required: 'Price is required',
                                    min: 0,
                                    valueAsNumber: true
                                })}
                                placeholder="0.00"
                            />
                            {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="countInStock">Stock Quantity *</Label>
                            <Input
                                id="countInStock"
                                type="number"
                                {...register('countInStock', {
                                    required: 'Stock is required',
                                    min: 0,
                                    valueAsNumber: true
                                })}
                                placeholder="0"
                            />
                            {errors.countInStock && (
                                <p className="text-sm text-destructive mt-1">{errors.countInStock.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="brand">Brand *</Label>
                            <Input
                                id="brand"
                                {...register('brand', { required: 'Brand is required' })}
                                placeholder="Enter brand name"
                            />
                            {errors.brand && <p className="text-sm text-destructive mt-1">{errors.brand.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <Input
                                id="category"
                                {...register('category', { required: 'Category is required' })}
                                placeholder="e.g., Electronics, Fashion"
                            />
                            {errors.category && (
                                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                            )}
                        </div>

                        <div className="col-span-2">
                            <Label htmlFor="image">Image URL *</Label>
                            <Input
                                id="image"
                                {...register('image', { required: 'Image URL is required' })}
                                placeholder="https://example.com/image.jpg"
                            />
                            {errors.image && <p className="text-sm text-destructive mt-1">{errors.image.message}</p>}
                        </div>

                        <div className="col-span-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                {...register('description', { required: 'Description is required' })}
                                placeholder="Enter product description"
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
