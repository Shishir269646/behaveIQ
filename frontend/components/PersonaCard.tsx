// @/components/PersonaCard.tsx
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart2, TrendingUp, ScrollText, MousePointerClick } from 'lucide-react';
import { Persona } from '@/types'; // Import the full Persona interface
import { formatPercentage, formatNumber } from '@/lib/utils';
import { Separator } from './ui/separator';

interface PersonaCardProps {
    persona: Persona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
    const { name, description, clusterData, stats } = persona;
    const confidence = clusterData?.confidence || 0;
    const userCount = stats?.sessionCount || 0;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{name}</CardTitle>
                    {confidence > 0 && (
                        <Badge variant={confidence > 70 ? "default" : "secondary"}>
                            {formatPercentage(confidence)} Confidence
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-sm">{description || "No description provided."}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{formatNumber(userCount)} sessions attributed</span>
                </div>
                {stats && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center text-muted-foreground">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            <span>CR: {formatPercentage(stats.conversionRate)}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                            <BarChart2 className="h-4 w-4 mr-2" />
                            <span>Avg Intent: {stats.avgIntentScore?.toFixed(2)}</span>
                        </div>
                    </div>
                )}
                {clusterData && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <h5 className="font-medium text-muted-foreground">Behavioral Insights:</h5>
                            <ul className="text-xs space-y-1">
                                <li className="flex items-center">
                                    <ScrollText className="h-3 w-3 mr-1" /> Avg Scroll Depth: {(clusterData.avgScrollDepth * 100).toFixed(0)}%
                                </li>
                                <li className="flex items-center">
                                    <MousePointerClick className="h-3 w-3 mr-1" /> Avg Click Rate: {clusterData.avgClickRate?.toFixed(2)}
                                </li>
                                {clusterData.behaviorPattern.priceConscious && <li>- Price Conscious</li>}
                                {clusterData.behaviorPattern.featureFocused && <li>- Feature Focused</li>}
                                {clusterData.behaviorPattern.exploreMore && <li>- Explores More</li>}
                                {clusterData.behaviorPattern.quickDecision && <li>- Quick Decision Maker</li>}
                            </ul>
                            {clusterData.commonPages && clusterData.commonPages.length > 0 && (
                                <div className="mt-2">
                                    <h5 className="font-medium text-muted-foreground">Common Pages:</h5>
                                    <p className="text-xs text-muted-foreground">{clusterData.commonPages.map(p => p.split('/').pop()).join(', ')}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}