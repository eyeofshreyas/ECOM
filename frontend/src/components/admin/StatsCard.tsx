import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
    return (
        <div className={cn('bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold mt-2">{value}</p>
                    {trend && (
                        <p className={cn('text-sm mt-2', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </p>
                    )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            </div>
        </div>
    );
}
