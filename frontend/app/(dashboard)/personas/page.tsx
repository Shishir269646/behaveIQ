// @/app/(dashboard)/personas/page.tsx
"use client"

import { PersonaCard } from "@/components/PersonaCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersonas } from "@/hooks/usePersonas";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PersonaGridSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
    </div>
);

export default function PersonasPage() {
    const { data: personas, isLoading, error } = usePersonas();

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
        <h1 className="text-2xl font-bold">Shadow Persona Discovery</h1>
      </div>
      <p className="text-muted-foreground">
        Automatically identified visitor types based on behavior. No manual setup required.
      </p>
      
      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="budget">Budget Buyers</TabsTrigger>
          <TabsTrigger value="feature">Feature Explorers</TabsTrigger>
          <TabsTrigger value="researcher">Careful Researchers</TabsTrigger>
          <TabsTrigger value="impulse">Impulse Buyers</TabsTrigger>
        </TabsList>

        {isLoading ? (
            <div className="mt-4">
                <PersonaGridSkeleton />
            </div>
        ) : personas && (
            <>
                <TabsContent value="budget">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {personas.budget.map(p => <PersonaCard key={p.name} {...p} />)}
                  </div>
                </TabsContent>
                <TabsContent value="feature">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {personas.feature.map(p => <PersonaCard key={p.name} {...p} />)}
                  </div>
                </TabsContent>
                 <TabsContent value="researcher">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {personas.researcher.map(p => <PersonaCard key={p.name} {...p} />)}
                  </div>
                </TabsContent>
                 <TabsContent value="impulse">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {personas.impulse.map(p => <PersonaCard key={p.name} {...p} />)}
                  </div>
                </TabsContent>
            </>
        )}
      </Tabs>
    </div>
  );
}