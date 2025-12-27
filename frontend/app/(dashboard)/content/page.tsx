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
import { useState } from "react";
import { mlApi } from "@/lib/api"; // Only mlApi is needed
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function ContentPage() {
    const [selectedPersona, setSelectedPersona] = useState("budget-buyer");
    const [selectedContentType, setSelectedContentType] = useState("headline");
    const [generatedContent, setGeneratedContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerateContent = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedContent("");
        try {
            const response = await mlApi.post('/llm/content-generation', {
                persona: selectedPersona,
                content_type: selectedContentType
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
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger id="persona-select">
                  <SelectValue placeholder="Select a persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget-buyer">Budget Buyer</SelectItem>
                  <SelectItem value="feature-explorer">Feature Explorer</SelectItem>
                  <SelectItem value="careful-researcher">Careful Researcher</SelectItem>
                  <SelectItem value="impulse-buyer">Impulse Buyer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-type-select">Content Type</Label>
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger id="content-type-select">
                  <SelectValue placeholder="Select a content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="headline">Headline</SelectItem>
                  <SelectItem value="product_description">Product Description</SelectItem>
                  <SelectItem value="email_subject">Email Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleGenerateContent} disabled={isLoading}>
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