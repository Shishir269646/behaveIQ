"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, XCircle } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateWebsiteModal } from "./CreateWebsiteModal"; // Import the CreateWebsiteModal

const variationSchema = z.object({
  name: z.string().min(1, "Variation name is required"),
  trafficPercentage: z.coerce.number().min(0).max(100, "Traffic percentage cannot exceed 100%"), // Min 0 here, total sum validated later
  isControl: z.boolean().default(false),
});

const formSchema = z.object({
  name: z.string().min(1, "Experiment name is required"),
  description: z.string().optional(),
  variations: z.array(variationSchema).min(2, "At least two variations are required"),
  minSampleSize: z.coerce.number().min(1, "Minimum sample size is required").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateExperimentModal({ isOpen, onClose }: CreateExperimentModalProps) {
  const { createExperiment, selectedWebsite, loading, error, success, clearSuccess, websites, fetchWebsites } = useAppStore();
  const [totalTraffic, setTotalTraffic] = useState(0);
  const [selectedExperimentWebsiteId, setSelectedExperimentWebsiteId] = useState<string | undefined>(selectedWebsite?._id);
  const [isCreateWebsiteModalOpen, setIsCreateWebsiteModalOpen] = useState(false);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      variations: [
        { name: "Control", trafficPercentage: 50, isControl: true },
        { name: "Variation A", trafficPercentage: 50, isControl: false },
      ],
      minSampleSize: 1000,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variations",
  });

  React.useEffect(() => {
    if (isOpen) { // Fetch websites only when modal is open
        fetchWebsites();
    }
  }, [isOpen, fetchWebsites]);

  // Set initial selected website in the dropdown if global selectedWebsite changes
  React.useEffect(() => {
    if (selectedWebsite?._id && websites.some(w => w._id === selectedWebsite._id)) {
        setSelectedExperimentWebsiteId(selectedWebsite._id);
    } else if (websites.length > 0 && !selectedExperimentWebsiteId) {
        setSelectedExperimentWebsiteId(websites[0]._id); // Auto-select first if none globally selected
    } else if (websites.length === 0) {
        setSelectedExperimentWebsiteId(undefined); // Clear selection if no websites
    }
  }, [selectedWebsite, websites, selectedExperimentWebsiteId]);


  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith("variations")) {
        const total = value.variations?.reduce((sum, v) => sum + (v.trafficPercentage || 0), 0) || 0;
        setTotalTraffic(total);
      }
      if (name === "variations") {
        const controlCount = value.variations?.filter(v => v.isControl).length;
        if (controlCount === 0 && value.variations && value.variations.length > 0) {
            form.setValue(`variations.${0}.isControl`, true);
        } else if (controlCount > 1) {
            const firstControlIndex = value.variations?.findIndex(v => v.isControl);
            value.variations?.forEach((v, index) => {
                if (index !== firstControlIndex) {
                    form.setValue(`variations.${index}.isControl`, false);
                }
            });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, form.watch]);

  React.useEffect(() => {
    if (success === 'Experiment created successfully!') {
      form.reset();
      clearSuccess();
      onClose();
    }
    if (error) {
        console.error("Error creating experiment:", error);
    }
  }, [success, error, onClose, form, clearSuccess]);

  const handleWebsiteCreated = (newWebsiteId: string) => {
    setIsCreateWebsiteModalOpen(false);
    setSelectedExperimentWebsiteId(newWebsiteId); // Select the newly created website
    fetchWebsites(); // Re-fetch to update the list
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedExperimentWebsiteId) {
      form.setError("name", { message: "Please select a website or create a new one." });
      return;
    }

    if (totalTraffic !== 100) {
        form.setError("variations", { message: "Total traffic percentage must be 100%" });
        return;
    }

    try {
      await createExperiment({
        name: values.name,
        description: values.description,
        websiteId: selectedExperimentWebsiteId, // Use the selected ID
        variations: values.variations.map(v => ({
            name: v.name,
            trafficPercentage: v.trafficPercentage,
            isControl: v.isControl,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
        })),
        settings: {
            minSampleSize: values.minSampleSize || 0,
        },
      });
    } catch (e) {
      // Error handling is managed by zustand store
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create New Experiment</DialogTitle>
          <DialogDescription>
            Configure the details for your new A/B test.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="website" className="text-right">
                    Website
                </Label>
                <div className="col-span-3">
                    {websites.length > 0 ? (
                        <Select 
                            onValueChange={setSelectedExperimentWebsiteId} 
                            value={selectedExperimentWebsiteId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a website" />
                            </SelectTrigger>
                            <SelectContent>
                                {websites.map((website) => (
                                    <SelectItem key={website._id} value={website._id}>
                                        {website.name} ({website.domain})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Alert>
                            <AlertTitle>No Websites Found</AlertTitle>
                            <AlertDescription>
                                You need to create a website first.
                                <Button size="sm" onClick={() => setIsCreateWebsiteModalOpen(true)} className="ml-2">
                                    Create Website
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>

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
                <Label htmlFor="description" className="text-right">
                Description
                </Label>
                <Textarea id="description" {...form.register("description")} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minSampleSize" className="text-right">
                Min. Sample Size
                </Label>
                <Input id="minSampleSize" type="number" {...form.register("minSampleSize")} className="col-span-3" />
                {form.formState.errors.minSampleSize && (
                <p className="col-span-4 col-start-2 text-sm text-red-500">{form.formState.errors.minSampleSize.message}</p>
                )}
            </div>

            <div className="col-span-4">
                <h3 className="text-lg font-semibold mb-2">Variations ({totalTraffic}%)</h3>
                {form.formState.errors.variations && (
                    <p className="text-sm text-red-500 mb-2">{form.formState.errors.variations.message}</p>
                )}
                <div className="grid gap-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-10 items-center gap-2">
                    <Label htmlFor={`variation-name-${index}`} className="col-span-2">
                        Variation {index + 1}
                    </Label>
                    <Input
                        id={`variation-name-${index}`}
                        {...form.register(`variations.${index}.name`)}
                        className="col-span-3"
                    />
                    <Input
                        type="number"
                        {...form.register(`variations.${index}.trafficPercentage`)}
                        className="col-span-2"
                    />
                    <Label htmlFor={`is-control-${index}`} className="col-span-2 text-right">
                        Control
                    </Label>
                    <Switch
                        id={`is-control-${index}`}
                        checked={form.watch(`variations.${index}.isControl`)}
                        onCheckedChange={(checked) => form.setValue(`variations.${index}.isControl`, checked)}
                        className="col-span-1"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 2}
                        className="col-span-1"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                    {form.formState.errors.variations?.[index]?.name && (
                        <p className="col-span-10 col-start-3 text-sm text-red-500">
                        {form.formState.errors.variations[index]?.name?.message}
                        </p>
                    )}
                    {form.formState.errors.variations?.[index]?.trafficPercentage && (
                        <p className="col-span-10 col-start-3 text-sm text-red-500">
                        {form.formState.errors.variations[index]?.trafficPercentage?.message}
                        </p>
                    )}
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ name: `Variation ${fields.length}`, trafficPercentage: 0, isControl: false })}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Variation
                </Button>
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={loading || websites.length === 0}>
                {loading ? "Creating..." : "Create Experiment"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
      <CreateWebsiteModal 
        isOpen={isCreateWebsiteModalOpen} 
        onClose={() => setIsCreateWebsiteModalOpen(false)} 
        onWebsiteCreated={handleWebsiteCreated}
      />
    </Dialog>
  );
}
