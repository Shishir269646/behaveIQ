// @/app/(dashboard)/discounts/page.tsx
"use client"

import { PlusCircle, MoreHorizontal, Edit, Trash2, Tag, CalendarDays, Percent, DollarSign, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDiscounts } from "@/hooks/useDiscounts"; // Updated hook import
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Discount } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DiscountFormState {
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    expiresAt: Date;
    status: 'active' | 'used' | 'expired';
    reasons: { factor: string; value: number }[];
    applicableTo: {
        products: string[];
        categories: string[];
        minAmount: number;
    };
}

export default function DiscountsPage() {
    const { discounts, isLoading, error, success, fetchDiscounts, createDiscount, updateDiscount, deleteDiscount, clearSuccess } = useDiscounts();

    const selectedWebsite = useAppStore((state) => state.website);

    const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

    const [formState, setFormState] = useState<DiscountFormState>({
        code: '',
        type: 'percentage',
        value: 0,
        expiresAt: new Date(),
        status: 'active',
        reasons: [],
        applicableTo: { products: [], categories: [], minAmount: 0 },
    });

    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchDiscounts();
        }
    }, [selectedWebsite?._id, fetchDiscounts]);

    useEffect(() => {
        if (success) {
            toast({
                title: "Success",
                description: success,
            });
            clearSuccess();
        }
        if (error) {
            toast({
                title: "Error",
                description: error,
                variant: "destructive",
            });
            clearSuccess();
        }
    }, [success, error, clearSuccess, toast]);

    const handleCreateEditDiscount = async () => {
        if (!selectedWebsite?._id) {
            toast({
                title: "Error",
                description: "Please select a website first.",
                variant: "destructive",
            });
            return;
        }

        const dataToSave = {
            ...formState,
            value: Number(formState.value),
            expiresAt: formState.expiresAt.toISOString(),
            userId: selectedWebsite.userId, // Assuming userId is available in selectedWebsite
            websiteId: selectedWebsite._id,
        };
        
        try {
            if (editingDiscount) {
                await updateDiscount(editingDiscount._id, dataToSave);
            } else {
                await createDiscount(dataToSave as any); // Type assertion needed here
            }
            setIsCreateEditOpen(false);
            setEditingDiscount(null);
            setFormState({
                code: '',
                type: 'percentage',
                value: 0,
                expiresAt: new Date(),
                status: 'active',
                reasons: [],
                applicableTo: { products: [], categories: [], minAmount: 0 },
            });
        } catch (err) {
            // Error handled by hook
        }
    };

    const handleEditClick = (discount: Discount) => {
        setEditingDiscount(discount);
        setFormState({
            code: discount.code,
            type: discount.type,
            value: discount.value,
            expiresAt: new Date(discount.expiresAt),
            status: discount.status,
            reasons: discount.reasons || [],
            applicableTo: {
                products: discount.applicableTo?.products || [],
                categories: discount.applicableTo?.categories || [],
                minAmount: discount.applicableTo?.minAmount || 0,
            },
        });
        setIsCreateEditOpen(true);
    };

    const handleDeleteClick = (discountId: string) => {
        setDiscountToDelete(discountId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (discountToDelete) {
            await deleteDiscount(discountToDelete);
            setIsDeleteDialogOpen(false);
            setDiscountToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Personalized Discount Engine</h1>
                <Button onClick={() => { setEditingDiscount(null); setIsCreateEditOpen(true); }}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Discount Rule
                </Button>
            </div>
            <p className="text-muted-foreground">
                Create and manage ethical, transparent discounts based on user behavior.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Discount Rules</CardTitle>
                    <CardDescription>
                        A list of all active, draft, and expired discount rules.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {discounts.length === 0 ? (
                        <EmptyState
                            icon={Gift}
                            title="No Discount Rules"
                            description="Create your first personalized discount rule to engage your users."
                            actionLabel="Create Discount"
                            onAction={() => { setEditingDiscount(null); setIsCreateEditOpen(true); }}
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Reasons</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discounts.map((discount) => (
                                    <TableRow key={discount._id}>
                                        <TableCell className="font-medium">{discount.code}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{discount.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={
                                                    discount.status === "active" ? "default" :
                                                    discount.status === "expired" ? "secondary" :
                                                    "outline"
                                                }
                                            >
                                                {discount.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(discount.expiresAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {discount.reasons?.map((reason, idx) => (
                                                    <Badge key={idx} variant="secondary">{reason.factor}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditClick(discount)}>
                                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(discount._id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Discount Dialog */}
            <Dialog open={isCreateEditOpen} onOpenChange={setIsCreateEditOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingDiscount ? 'Edit Discount Rule' : 'Create New Discount Rule'}</DialogTitle>
                        <DialogDescription>
                            Define a personalized discount based on various factors.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Discount Code</Label>
                            <Input
                                id="code"
                                value={formState.code}
                                onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                                placeholder="e.g., SAVE10NOW"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Discount Type</Label>
                                <Select
                                    value={formState.type}
                                    onValueChange={(value: 'percentage' | 'fixed_amount') => setFormState({ ...formState, type: value })}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Discount Value</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    value={formState.value}
                                    onChange={(e) => setFormState({ ...formState, value: Number(e.target.value) })}
                                    placeholder={formState.type === 'percentage' ? "e.g., 10 for 10%" : "e.g., 20 for $20"}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">Expires At</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formState.expiresAt && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {formState.expiresAt ? format(formState.expiresAt, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formState.expiresAt}
                                        onSelect={(date) => date && setFormState({ ...formState, expiresAt: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formState.status}
                                onValueChange={(value: 'active' | 'used' | 'expired') => setFormState({ ...formState, status: value })}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="used">Used</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <h3 className="font-semibold mt-4">Discount Reasons</h3>
                        <p className="text-sm text-muted-foreground mb-2">Select factors that apply to this discount. Values are automatically set by backend.</p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { factor: 'loyalty', label: 'Loyalty Bonus' },
                                { factor: 'first_time', label: 'First-time Buyer' },
                                { factor: 'persona', label: 'Persona Specific' },
                                { factor: 'cart_abandonment', label: 'Cart Abandonment Recovery' },
                                { factor: 'seasonal', label: 'Seasonal Offer' },
                            ].map((reasonOption) => (
                                <div key={reasonOption.factor} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`reason-${reasonOption.factor}`}
                                        checked={formState.reasons.some(r => r.factor === reasonOption.factor)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setFormState(prev => ({
                                                    ...prev,
                                                    reasons: [...prev.reasons, { factor: reasonOption.factor, value: 0 }] // Value will be calculated by backend
                                                }));
                                            } else {
                                                setFormState(prev => ({
                                                    ...prev,
                                                    reasons: prev.reasons.filter(r => r.factor !== reasonOption.factor)
                                                }));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`reason-${reasonOption.factor}`}>{reasonOption.label}</Label>
                                </div>
                            ))}
                        </div>
                        {/* Applicable To (simplified for now) */}
                         <div className="space-y-2">
                            <Label htmlFor="minAmount">Minimum Amount (Optional)</Label>
                            <Input
                                id="minAmount"
                                type="number"
                                value={formState.applicableTo.minAmount || ''}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    applicableTo: { ...prev.applicableTo, minAmount: Number(e.target.value) }
                                }))}
                                placeholder="e.g., 50 (minimum order value)"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateEditDiscount} disabled={isLoading}>
                            {editingDiscount ? 'Save Changes' : 'Create Discount'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this discount rule? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}