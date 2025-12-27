// @/app/(dashboard)/discounts/page.tsx
"use client"

import { PlusCircle } from "lucide-react";
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
import { MoreHorizontal } from "lucide-react"
import { useDiscounts } from "@/hooks/useDiscounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function DiscountsPage() {
    const { discounts, isLoading, error } = useDiscounts();

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Personalized Discount Engine</h1>
            <Button>
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
                {isLoading ? (
                     <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rule Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total Usage</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discounts.map((discount) => (
                                <TableRow key={discount.id}>
                                    <TableCell className="font-medium">{discount.name}</TableCell>
                                    <TableCell>
                                         <Badge variant="outline">{discount.type}</Badge>
                                    </TableCell>
                                    <TableCell>{discount.value}</TableCell>
                                    <TableCell>
                                         <Badge 
                                            variant={
                                                discount.status === "Active" ? "default" :
                                                discount.status === "Expired" ? "secondary" :
                                                "outline"
                                            }
                                        >
                                            {discount.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{discount.usage.toLocaleString()}</TableCell>
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
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
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
    </div>
  );
}