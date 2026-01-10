// @/app/(dashboard)/content/page.tsx
"use client"

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react"; // Added useEffect
import { api } from "@/lib/api"; // Changed from mlApi to api since content/options is a backend route
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppStore } from "@/store"; // New import


interface PersonaOption {
    id: string;
    name: string;
    // Add other relevant fields if needed, e.g., behaviorPattern
}

interface ContentTypeOption {
    key: string;
    name: string;
}

export default function ContentPage() {
    const selectedWebsite = useAppStore((state) => state.website); // Get selected website
    const [selectedPersona, setSelectedPersona] = useState<string>(""); // Initialize with empty string
    const [selectedContentType, setSelectedContentType] = useState<string>(""); // Initialize with empty string
    const [generatedContent, setGeneratedContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // State for dynamic options
    const [availablePersonas, setAvailablePersonas] = useState<PersonaOption[]>([]);
    const [availableContentTypes, setAvailableContentTypes] = useState<ContentTypeOption[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
    const [optionsError, setOptionsError] = useState<string | null>(null);

    // Fetch dynamic options
    useEffect(() => {
        const fetchOptions = async () => {
            if (!selectedWebsite?._id) {
                setIsLoadingOptions(false);
                return;
            }

            setIsLoadingOptions(true);
            setOptionsError(null);
            try {
                const response = await api.get(`/content/options?websiteId=${selectedWebsite._id}`);
                setAvailablePersonas(response.data.data.personas);
                setAvailableContentTypes(response.data.data.contentTypes);
                // Set default selected values if options are available
                if (response.data.data.personas.length > 0) {
                    setSelectedPersona(response.data.data.personas[0].id); // Use ID for value
                }
                if (response.data.data.contentTypes.length > 0) {
                    setSelectedContentType(response.data.data.contentTypes[0].key);
                }
            } catch (err: any) {
                setOptionsError(err.response?.data?.message || err.message || "Failed to fetch content options.");
                toast({
                    title: "Error",
                    description: err.response?.data?.message || err.message || "Failed to fetch content options.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingOptions(false);
            }
        };

        fetchOptions();
    }, [selectedWebsite?._id, toast]);

    const handleGenerateContent = async () => {
        if (!selectedWebsite?._id) {
            toast({
                title: "Error",
                description: "Please select a website first.",
                variant: "destructive",
            });
            return;
        }
        if (!selectedPersona || !selectedContentType) {
            toast({
                title: "Error",
                description: "Please select both a persona and content type.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedContent("");
        try {
            // Use api for the /content/generate route
            const response = await api.post('/content/generate', {
                websiteId: selectedWebsite._id, // Pass websiteId if needed by ML service
                persona: selectedPersona, // Pass persona ID
                contentType: selectedContentType
            });
            // Expected response structure: { generated_content: string }
            setGeneratedContent(response.data.generated_content);

            toast({
                title: "Content Generated",
                description: "AI successfully generated content.",
            });
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to generate content.");
            toast({
                title: "Generation Failed",
                description: err.response?.data?.message || err.message || "Could not generate content.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedWebsite) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>No website selected. Please select a website to generate content.</AlertDescription>
            </Alert>
        );
    }

    if (optionsError) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{optionsError}</AlertDescription>
            </Alert>
        );
    }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">LLM Content Generation</h1>
      </div>
      <p className="text-muted-foreground">
        Use OpenAI GPT-4 to generate persona-specific headlines and copy.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Content Generator</CardTitle>
            <CardDescription>
              Select a persona and content type to generate copy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="persona-select">Target Persona</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona} disabled={isLoadingOptions || !availablePersonas.length}>
                <SelectTrigger id="persona-select">
                  <SelectValue placeholder="Select a persona" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingOptions ? (
                    <SelectItem value="loading" disabled>Loading personas...</SelectItem>
                  ) : (
                    availablePersonas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>{persona.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-type-select">Content Type</Label>
              <Select value={selectedContentType} onValueChange={setSelectedContentType} disabled={isLoadingOptions || !availableContentTypes.length}>
                <SelectTrigger id="content-type-select">
                  <SelectValue placeholder="Select a content type" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingOptions ? (
                    <SelectItem value="loading" disabled>Loading content types...</SelectItem>
                  ) : (
                    availableContentTypes.map((type) => (
                      <SelectItem key={type.key} value={type.key}>{type.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleGenerateContent} disabled={isLoading || isLoadingOptions || !selectedPersona || !selectedContentType}>
                {isLoading ? "Generating..." : "Generate Content"}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Generated Output</CardTitle>
                <CardDescription>
                    The AI-generated content will appear here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <Textarea 
                        readOnly 
                        className="h-48 resize-none" 
                        placeholder="Generated content..."
                        value={generatedContent}
                    />
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}