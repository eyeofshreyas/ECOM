import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
    _id: string;
    user: { _id: string; name: string; email: string };
    orderItems: Array<{ name: string; qty: number; price: number }>;
    shippingAddress: {
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    paymentMethod: string;
    totalPrice: number;
    isPaid: boolean;
    paidAt?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    createdAt: string;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { toast } = useToast();

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = orders.filter(
                (order) =>
                    order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    order.user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredOrders(filtered);
        } else {
            setFilteredOrders(orders);
        }
    }, [searchQuery, orders]);

    const fetchOrders = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/orders`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            const data = await response.json();
            setOrders(data);
            setFilteredOrders(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load orders',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkDelivered = async (orderId: string) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/orders/${orderId}/deliver`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Order marked as delivered',
                });
                fetchOrders();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update order',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading orders...</p>
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
                            <h1 className="text-2xl font-bold">Orders Management</h1>
                            <p className="text-sm text-muted-foreground">{filteredOrders.length} orders</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search orders by ID or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Orders Table */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order ID</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Paid</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Delivered</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => (
                                        <tr key={order._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-sm">{order._id.slice(-8)}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{order.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{order.user.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium">
                                                ₹{order.totalPrice.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {order.isPaid ? (
                                                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-sm text-red-600">
                                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                                        Unpaid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {order.isDelivered ? (
                                                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                        Delivered
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-sm text-yellow-600">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!order.isDelivered && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleMarkDelivered(order._id)}
                                                        >
                                                            <Package className="h-3 w-3 mr-1" />
                                                            Mark Delivered
                                                        </Button>
                                                    )}
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
        </div>
    );
}
