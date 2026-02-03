import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
    isMobileMenuOpen?: boolean;
    setIsMobileMenuOpen?: (open: boolean) => void;
}

export function AdminSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: AdminSidebarProps) {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Users', href: '/admin/users', icon: Users },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen?.(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 lg:static',
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Mobile Close Button */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold">Admin Panel</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen?.(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    <div className="hidden lg:block mb-6">
                        <h2 className="text-lg font-bold px-3">Admin Panel</h2>
                    </div>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsMobileMenuOpen?.(false)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to Store Link */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to Store
                    </Link>
                </div>
            </aside>
        </>
    );
}
