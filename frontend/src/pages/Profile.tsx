import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Package, Truck, CheckCircle, Clock, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Order {
    _id: string;
    orderItems: Array<{
        name: string;
        qty: number;
        price: number;
        image: string;
    }>;
    totalPrice: number;
    isPaid: boolean;
    isDelivered: boolean;
    createdAt: string;
    paidAt?: string;
    deliveredAt?: string;
}

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
    });
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
    });
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUserInfo = localStorage.getItem('userInfo');
                if (storedUserInfo) {
                    const user = JSON.parse(storedUserInfo);
                    setUserInfo({ name: user.name, email: user.email });
                    setEditForm({ name: user.name, email: user.email, password: '' });
                }

                // Fetch user orders
                const { data } = await api.get('/orders/myorders');
                setOrders(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching profile data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel edit
            setEditForm({ name: userInfo.name, email: userInfo.email, password: '' });
        }
        setIsEditing(!isEditing);
    };

    const handleSaveProfile = async () => {
        try {
            const updateData: any = {
                name: editForm.name,
                email: editForm.email,
            };

            if (editForm.password) {
                updateData.password = editForm.password;
            }

            const { data } = await api.put('/users/profile', updateData);

            // Update localStorage
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUserInfo({ name: data.name, email: data.email });
            setIsEditing(false);

            toast({
                title: 'Profile Updated',
                description: 'Your profile has been successfully updated.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update profile',
                variant: 'destructive',
            });
        }
    };

    const getOrderStatus = (order: Order) => {
        if (order.isDelivered) return { text: 'Delivered', icon: CheckCircle, color: 'bg-green-500' };
        if (order.isPaid) return { text: 'In Transit', icon: Truck, color: 'bg-blue-500' };
        return { text: 'Processing', icon: Clock, color: 'bg-yellow-500' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 bg-secondary/20">
                <div className="container mx-auto py-8 px-4">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-2">My Profile</h1>
                        <p className="text-muted-foreground">Manage your account and view your orders</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* User Info Card */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                                                <User className="h-6 w-6 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <CardTitle>Account Info</CardTitle>
                                                <CardDescription>Your personal details</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!isEditing ? (
                                        <>
                                            <div>
                                                <Label className="text-muted-foreground text-xs">Name</Label>
                                                <p className="font-medium">{userInfo.name}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground text-xs">Email</Label>
                                                <p className="font-medium">{userInfo.email}</p>
                                            </div>
                                            <Button onClick={handleEditToggle} className="w-full">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Profile
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">New Password (optional)</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Leave blank to keep current"
                                                    value={editForm.password}
                                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button onClick={handleSaveProfile} className="flex-1">
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save
                                                </Button>
                                                <Button onClick={handleEditToggle} variant="outline" className="flex-1">
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order History */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order History
                                    </CardTitle>
                                    <CardDescription>
                                        {orders.length === 0 ? 'No orders yet' : `${orders.length} order${orders.length > 1 ? 's' : ''}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {orders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                            <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                                            <Button asChild>
                                                <Link to="/products">Start Shopping</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map((order) => {
                                                const status = getOrderStatus(order);
                                                const StatusIcon = status.icon;

                                                return (
                                                    <div key={order._id} className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-10 w-10 rounded-full ${status.color} flex items-center justify-center`}>
                                                                    <StatusIcon className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">Order #{order._id.slice(-8).toUpperCase()}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric',
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="outline" className="font-normal">
                                                                    {status.text}
                                                                </Badge>
                                                                <p className="font-semibold">₹{order.totalPrice.toLocaleString('en-IN')}</p>
                                                            </div>
                                                        </div>

                                                        <Separator className="my-3" />

                                                        <div className="space-y-3">
                                                            {order.orderItems.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-3">
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="h-12 w-12 rounded-lg object-cover bg-secondary"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium truncate">{item.name}</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="mt-4 pt-4 border-t border-border">
                                                            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                                                                <Link to={`/order/${order._id}`}>View Details</Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
