'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store';
import { EmptyState } from '@/components/EmptyState';
import { Users as UsersIcon, Plus, Settings, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { User } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function UsersPage() {
    const { users, loading, fetchUsers, updateUser, deleteUser, success, error, clearSuccess } = useAppStore();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({
        email: '',
        fullName: '',
        companyName: '',
        plan: '',
        role: '',
    });

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (success) {
            toast.success(success);
            clearSuccess();
        }
        if (error) {
            toast.error(error);
            clearSuccess();
        }
    }, [success, error, clearSuccess]);

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditFormData({
            email: user.email,
            fullName: user.fullName,
            companyName: user.companyName || '',
            plan: user.plan,
            role: user.role,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateUser = async () => {
        if (selectedUser) {
            await updateUser(selectedUser._id, editFormData as Partial<User>);
            setIsEditDialogOpen(false);
            setSelectedUser(null);
        }
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedUser) {
            await deleteUser(selectedUser._id);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
        }
    };

    if (loading && users.length === 0) {
        return <div className="text-center py-10">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-gray-500">Manage user accounts</p>
                </div>
            </div>

            {users.length === 0 ? (
                <EmptyState
                    icon={UsersIcon}
                    title="No users found"
                    description="There are no user accounts to display."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <Card key={user._id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{user.fullName}</CardTitle>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500">Company</p>
                                    <p className="font-medium">{user.companyName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Plan</p>
                                    <p className="font-medium capitalize">{user.plan}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Role</p>
                                    <p className="font-medium capitalize">{user.role}</p>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditClick(user)}>
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(user)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Make changes to the user's profile here.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                disabled
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-fullName">Full Name</Label>
                            <Input
                                id="edit-fullName"
                                value={editFormData.fullName}
                                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-companyName">Company Name</Label>
                            <Input
                                id="edit-companyName"
                                value={editFormData.companyName}
                                onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-plan">Plan</Label>
                            <Select value={editFormData.plan} onValueChange={(value) => setEditFormData({ ...editFormData, plan: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateUser} disabled={loading}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedUser?.fullName}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={loading}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
