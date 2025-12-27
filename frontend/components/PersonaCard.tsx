// @/components/PersonaCard.tsx
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface PersonaCardProps {
    name: string;
    description: string;
    confidence: number;
    userCount: number;
}

export function PersonaCard({ name, description, confidence, userCount }: PersonaCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{name}</CardTitle>
                    <Badge variant={confidence > 90 ? "default" : "secondary"}>
                        {confidence}% confidence
                    </Badge>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{userCount.toLocaleString()} users in this persona</span>
                </div>
            </CardContent>
        </Card>
    )
}