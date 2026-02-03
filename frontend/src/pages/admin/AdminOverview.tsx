import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
    lowStockCount: number;
    pendingOrdersCount: number;
}

interface LowStockProduct {
    _id: string;
    name: string;
    brand: string;
    category: string;
    countInStock: number;
    price: number;
}

interface RecentOrder {
    _id: string;
    user: { name: string; email: string };
    totalPrice: number;
    isPaid: boolean;
    isDelivered: boolean;
    createdAt: string;
}

export default function AdminOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { toast } = useToast();

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`,
            };

            const [statsRes, lowStockRes, ordersRes] = await Promise.all([
                fetch(`${API_URL}/stats/dashboard`, { headers }),
                fetch(`${API_URL}/stats/low-stock`, { headers }),
                fetch(`${API_URL}/stats/recent-orders?limit=5`, { headers }),
            ]);

            const statsData = await statsRes.json();
            const lowStockData = await lowStockRes.json();
            const ordersData = await ordersRes.json();

            setStats(statsData);
            setLowStockProducts(lowStockData);
            setRecentOrders(ordersData);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load dashboard data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading dashboard...</p>
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
                            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                            <p className="text-sm text-muted-foreground">Welcome to your admin dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatsCard
                            title="Total Products"
                            value={stats?.totalProducts || 0}
                            icon={Package}
                        />
                        <StatsCard
                            title="Total Orders"
                            value={stats?.totalOrders || 0}
                            icon={ShoppingCart}
                        />
                        <StatsCard
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            icon={Users}
                        />
                        <StatsCard
                            title="Total Revenue"
                            value={`₹${(stats?.totalRevenue || 0).toFixed(2)}`}
                            icon={DollarSign}
                        />
                        <StatsCard
                            title="Low Stock Items"
                            value={stats?.lowStockCount || 0}
                            icon={AlertTriangle}
                            className="border-orange-500/50"
                        />
                        <StatsCard
                            title="Pending Orders"
                            value={stats?.pendingOrdersCount || 0}
                            icon={ShoppingCart}
                        />
                    </div>

                    {/* Low Stock Products */}
                    {lowStockProducts.length > 0 && (
                        <div className="bg-card rounded-xl border border-border p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Low Stock Alert
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Product</th>
                                            <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Brand</th>
                                            <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Category</th>
                                            <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Stock</th>
                                            <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockProducts.map((product) => (
                                            <tr key={product._id} className="border-b border-border/50 last:border-0">
                                                <td className="py-3 px-2 text-sm">{product.name}</td>
                                                <td className="py-3 px-2 text-sm text-muted-foreground">{product.brand}</td>
                                                <td className="py-3 px-2 text-sm text-muted-foreground">{product.category}</td>
                                                <td className="py-3 px-2 text-sm text-right">
                                                    <span className="text-orange-500 font-medium">{product.countInStock}</span>
                                                </td>
                                                <td className="py-3 px-2 text-sm text-right">₹{product.price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Recent Orders */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Order ID</th>
                                        <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Customer</th>
                                        <th className="text-right py-2 px-2 text-sm font-medium text-muted-foreground">Total</th>
                                        <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground">Paid</th>
                                        <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground">Delivered</th>
                                        <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order._id} className="border-b border-border/50 last:border-0">
                                            <td className="py-3 px-2 text-sm font-mono">{order._id.slice(-8)}</td>
                                            <td className="py-3 px-2 text-sm">{order.user.name}</td>
                                            <td className="py-3 px-2 text-sm text-right font-medium">
                                                ₹{order.totalPrice.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full ${order.isPaid ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full ${order.isDelivered ? 'bg-green-500' : 'bg-yellow-500'
                                                        }`}
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-sm text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString()}
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
