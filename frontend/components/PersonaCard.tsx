import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Persona } from '@/types';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { Users, TrendingUp } from 'lucide-react';

interface PersonaCardProps {
    persona: Persona;
    onEdit?: () => void;
}

export function PersonaCard({ persona, onEdit }: PersonaCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{persona.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{persona.description}</p>
                    </div>

                    <Badge variant={persona.isActive ? 'default' : 'secondary'}>
                        {persona.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500">Sessions</p>
                            <p className="font-semibold">{formatNumber(persona.stats.sessionCount)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500">Conv. Rate</p>
                            <p className="font-semibold">{formatPercentage(persona.stats.conversionRate)}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Characteristics</p>
                    <div className="flex flex-wrap gap-2">
                        {persona.clusterData.characteristics.slice(0, 3).map((char, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                                {char}
                            </Badge>
                        ))}
                    </div>
                </div>

                {onEdit && (
                    <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
                        Edit Persona
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
