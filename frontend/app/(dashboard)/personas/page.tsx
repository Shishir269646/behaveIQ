"use client"

import { PersonaCard } from "@/components/PersonaCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { Persona } from "@/types";
import { useAppStore } from "@/store";

const PersonaGridSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
    </div>
);

export default function PersonasPage() {
    const {
        personas: rawPersonas,
        loading: isLoading,
        error,
        fetchPersonas,
        website: selectedWebsite
    } = useAppStore();


    const [groupedPersonas, setGroupedPersonas] = useState<{
        budget: Persona[];
        feature: Persona[];
        researcher: Persona[];
        impulse: Persona[];
        other: Persona[];
    }>({
        budget: [],
        feature: [],
        researcher: [],
        impulse: [],
        other: [],
    });

    useEffect(() => {
        if (selectedWebsite?._id) {
            fetchPersonas(selectedWebsite._id);
        }
    }, [selectedWebsite?._id, fetchPersonas]);

    useEffect(() => {
        if (rawPersonas && rawPersonas.length > 0) {
            const newGroupedPersonas: {
                budget: Persona[];
                feature: Persona[];
                researcher: Persona[];
                impulse: Persona[];
                other: Persona[];
            } = {
                budget: [],
                feature: [],
                researcher: [],
                impulse: [],
                other: [],
            };

            rawPersonas.forEach(persona => {
                if (persona.clusterData.behaviorPattern.priceConscious) {
                    newGroupedPersonas.budget.push(persona);
                } else if (persona.clusterData.behaviorPattern.featureFocused) {
                    newGroupedPersonas.feature.push(persona);
                } else if (persona.clusterData.behaviorPattern.exploreMore) {
                    newGroupedPersonas.researcher.push(persona);
                } else if (persona.clusterData.behaviorPattern.quickDecision) {
                    newGroupedPersonas.impulse.push(persona);
                } else {
                    newGroupedPersonas.other.push(persona);
                }
            });
            setGroupedPersonas(newGroupedPersonas);
        }
    }, [rawPersonas]);

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
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="budget">Budget Buyers</TabsTrigger>
                    <TabsTrigger value="feature">Feature Explorers</TabsTrigger>
                    <TabsTrigger value="researcher">Careful Researchers</TabsTrigger>
                    <TabsTrigger value="impulse">Impulse Buyers</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>

                {isLoading ? (
                    <div className="mt-4">
                        <PersonaGridSkeleton />
                    </div>
                ) : (
                    <>
                        <TabsContent value="budget">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupedPersonas.budget.map(p => <PersonaCard key={p.name} persona={p} />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="feature">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupedPersonas.feature.map(p => <PersonaCard key={p.name} persona={p} />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="researcher">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupedPersonas.researcher.map(p => <PersonaCard key={p.name} persona={p} />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="impulse">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupedPersonas.impulse.map(p => <PersonaCard key={p.name} persona={p} />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="other">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupedPersonas.other.map(p => <PersonaCard key={p.name} persona={p} />)}
                            </div>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}