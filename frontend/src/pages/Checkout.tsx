import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShoppingBag, Truck, CreditCard, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import api from '@/lib/api';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');

    // Get product and quantity from location state
    const product = location.state?.product as Product | undefined;
    const quantity = location.state?.quantity || 1;

    const [shippingInfo, setShippingInfo] = useState({
        address: '',
        city: '',
        postalCode: '',
        country: 'India',
    });

    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

    useEffect(() => {
        if (!product) {
            navigate('/products');
        }
    }, [product, navigate]);

    if (!product) {
        return null;
    }

    const itemsPrice = product.price * quantity;
    const shippingPrice = itemsPrice > 2500 ? 0 : 50;
    const taxPrice = Math.round(itemsPrice * 0.18); // 18% GST
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all shipping details',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                orderItems: [{
                    name: product.name,
                    qty: quantity,
                    image: product.image,
                    price: product.price,
                    product: product.id,
                }],
                shippingAddress: shippingInfo,
                paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
            };

            const { data } = await api.post('/orders', orderData);
            setOrderId(data._id);
            setOrderPlaced(true);

            toast({
                title: 'Order Placed Successfully!',
                description: `Your order #${data._id.slice(-8).toUpperCase()} has been placed.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to place order',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center bg-secondary/20">
                    <Card className="max-w-md mx-4">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
                            <CardDescription>Your order has been confirmed</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-secondary rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                                <p className="font-mono font-semibold text-lg">#{orderId.slice(-8).toUpperCase()}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p className="text-muted-foreground">
                                    Thank you for your order! We'll send you a confirmation email shortly.
                                </p>
                                <p className="text-muted-foreground">
                                    You can track your order status from your profile page.
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Button asChild className="w-full">
                                    <Link to="/profile">View Order in Profile</Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/products">Continue Shopping</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 bg-secondary/20">
                <div className="container mx-auto py-8 px-4">
                    {/* Back Button */}
                    <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Product
                    </Button>

                    <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-8">Checkout</h1>

                    <form onSubmit={handlePlaceOrder}>
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Checkout Form */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Shipping Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Truck className="h-5 w-5" />
                                            Shipping Information
                                        </CardTitle>
                                        <CardDescription>Enter your delivery address</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Street Address *</Label>
                                            <Input
                                                id="address"
                                                placeholder="123 Main Street, Apartment 4B"
                                                value={shippingInfo.address}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City *</Label>
                                                <Input
                                                    id="city"
                                                    placeholder="Mumbai"
                                                    value={shippingInfo.city}
                                                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="postalCode">Postal Code *</Label>
                                                <Input
                                                    id="postalCode"
                                                    placeholder="400001"
                                                    value={shippingInfo.postalCode}
                                                    onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                value={shippingInfo.country}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                                                disabled
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payment Method */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Payment Method
                                        </CardTitle>
                                        <CardDescription>Select your payment option</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <div className="flex items-center space-x-3 border border-border rounded-lg p-4">
                                                <RadioGroupItem value="Cash on Delivery" id="cod" />
                                                <Label htmlFor="cod" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">Cash on Delivery</p>
                                                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <Card className="sticky top-24">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingBag className="h-5 w-5" />
                                            Order Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Product Item */}
                                        <div className="flex gap-4">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="h-20 w-20 rounded-lg object-cover bg-secondary"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                                                <p className="font-semibold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Price Breakdown */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span className={shippingPrice === 0 ? 'text-green-600' : ''}>
                                                    {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tax (GST 18%)</span>
                                                <span>₹{taxPrice.toLocaleString('en-IN')}</span>
                                            </div>

                                            {shippingPrice > 0 && (
                                                <p className="text-xs text-muted-foreground pt-2">
                                                    Add ₹{(2500 - itemsPrice).toLocaleString('en-IN')} more for FREE shipping
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Total */}
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Total</span>
                                            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                        </div>

                                        {/* Place Order Button */}
                                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                            {loading ? 'Placing Order...' : 'Place Order'}
                                        </Button>

                                        <p className="text-xs text-center text-muted-foreground">
                                            By placing this order, you agree to our terms and conditions
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
