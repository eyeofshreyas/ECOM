import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, Shield, User as UserIcon, Trash2 } from 'lucide-react';
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

interface User {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = users.filter(
                (user) =>
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/users`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            const data = await response.json();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify({ isAdmin: !currentAdminStatus }),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: `User ${!currentAdminStatus ? 'promoted to' : 'removed from'} admin`,
                });
                fetchUsers();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update user',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await fetch(`${API_URL}/users/${userToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'User deleted successfully',
                });
                fetchUsers();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete user',
                variant: 'destructive',
            });
        } finally {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const confirmDelete = (userId: string) => {
        setUserToDelete(userId);
        setDeleteDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading users...</p>
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
                            <h1 className="text-2xl font-bold">Users Management</h1>
                            <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>
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
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Users Table */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <UserIcon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {user.isAdmin ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                        <Shield className="h-3 w-3" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                                                        Customer
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleAdmin(user._id, user.isAdmin)}
                                                    >
                                                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => confirmDelete(user._id)}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
