"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Website name is required"),
  domain: z.string().url("Must be a valid URL (e.g., https://example.com)"),
  industry: z.string().min(1, "Industry is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWebsiteCreated?: (websiteId: string) => void; // Optional callback
}

export function CreateWebsiteModal({ isOpen, onClose, onWebsiteCreated }: CreateWebsiteModalProps) {
  const { createWebsite, loading, success, clearSuccess, error, websites } = useAppStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      domain: "",
      industry: "",
    },
  });

  React.useEffect(() => {
    if (success === 'Website created successfully!' && websites.length > 0) {
      form.reset();
      clearSuccess();
      onClose();
      // Call callback with the ID of the newly created website
      if (onWebsiteCreated) {
        onWebsiteCreated(websites[websites.length - 1]._id);
      }
    }
    if (error) {
        // Handle error display if needed
        console.error("Error creating website:", error);
    }
  }, [success, error, onClose, form, clearSuccess, websites, onWebsiteCreated]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createWebsite({
        name: values.name,
        domain: values.domain,
        industry: values.industry,
      });
    } catch (e) {
      // Error handling is managed by zustand store
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Website</DialogTitle>
          <DialogDescription>
            Add a new website to your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" {...form.register("name")} className="col-span-3" />
            {form.formState.errors.name && (
              <p className="col-span-4 col-start-2 text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="domain" className="text-right">
              Domain
            </Label>
            <Input id="domain" {...form.register("domain")} className="col-span-3" placeholder="https://example.com" />
            {form.formState.errors.domain && (
              <p className="col-span-4 col-start-2 text-sm text-red-500">{form.formState.errors.domain.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="industry" className="text-right">
              Industry
            </Label>
            <Input id="industry" {...form.register("industry")} className="col-span-3" />
            {form.formState.errors.industry && (
              <p className="col-span-4 col-start-2 text-sm text-red-500">{form.formState.errors.industry.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
