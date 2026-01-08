// @/components/SessionDetailSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Session } from "@/hooks/useDashboard"
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { CircleUser, MousePointerClick, FileText, ShoppingCart, Clock, Monitor, Smartphone, Tablet, GitMerge } from "lucide-react"
import { useUserDevices } from "@/hooks/useUserDevices" // New import
import { formatDate, formatRelativeTime } from "@/lib/utils" // New import

interface SessionDetailSheetProps {
  session: Session | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const eventIcons: { [key: string]: React.ReactNode } = {
    page_view: <FileText className="h-4 w-4" />,
    click: <MousePointerClick className="h-4 w-4" />,
    session_start: <CircleUser className="h-4 w-4" />,
    add_to_cart: <ShoppingCart className="h-4 w-4" />,
    // Add other event types as needed
}

const deviceIcons: { [key: string]: React.ReactNode } = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
}

export default function SessionDetailSheet({ session, isOpen, onOpenChange }: SessionDetailSheetProps) {
    if (!session) return null;

    const { devices, isLoading: isLoadingDevices, error: devicesError } = useUserDevices(session.user.id);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Session Details</SheetTitle>
          <SheetDescription>
            A detailed look at the user's session timeline and properties.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <ScrollArea className="h-[calc(100vh-100px)] pr-4"> {/* Adjust height for scrollable content */}
            <div className="space-y-4 pb-4"> {/* Add padding-bottom */}
                <div>
                    <h4 className="text-sm font-medium">User</h4>
                    <p className="text-sm text-muted-foreground">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium">Properties</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">Persona: {session.persona}</Badge>
                        <Badge variant="outline">Intent: {session.intentScore}</Badge>
                        <Badge variant={session.status === 'Abandoned' ? 'destructive' : session.status === 'Converted' ? 'secondary' : 'default'}>
                            Status: {session.status}
                        </Badge>
                    </div>
                </div>

                {/* Cross-Device Journey Mapping */}
                <div>
                    <h4 className="text-sm font-medium mb-2">User Devices ({devices.length})</h4>
                    {isLoadingDevices ? (
                        <div>Loading devices...</div>
                    ) : devicesError ? (
                        <Alert variant="destructive">
                            <AlertDescription>{devicesError}</AlertDescription>
                        </Alert>
                    ) : devices.length > 0 ? (
                        <div className="space-y-2">
                            {devices.map((device, index) => (
                                <Card key={index} className="p-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {deviceIcons[device.type] || <Monitor className="h-4 w-4" />}
                                        <span>{device.type.charAt(0).toUpperCase() + device.type.slice(1)}</span>
                                        <Badge variant="outline" className="ml-auto">First Seen: {formatDate(device.firstSeen)}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground break-all mt-1">Fingerprint: {device.fingerprint}</p>
                                    {device.stitchedWith && device.stitchedWith.length > 0 && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <GitMerge className="h-3 w-3" /> Stitched With:
                                            </div>
                                            <ul className="list-disc pl-5">
                                                {device.stitchedWith.map((stitch, sIdx) => (
                                                    <li key={sIdx} className="break-all">
                                                        {stitch.fingerprint.substring(0, 10)}... (Confidence: {stitch.confidence.toFixed(2)})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No other devices found for this user.</p>
                    )}
                </div>

                {/* Event Timeline - Using mock data for now, replace with actual session events */}
                <div>
                    <h4 className="text-sm font-medium">Event Timeline</h4>
                    <ScrollArea className="h-96 w-full rounded-md border mt-2">
                        <div className="p-4">
                            {session.events && session.events.length > 0 ? (
                                session.events.map((event, index) => (
                                    <div key={index} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                                        <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                                        <div className="grid gap-1">
                                            <div className="flex items-center gap-2">
                                                {eventIcons[event.eventType] || <Clock className="h-4 w-4" />}
                                                <p className="text-sm font-medium leading-none capitalize">{event.eventType.replace('_', ' ')}</p>
                                                <p className="text-sm text-muted-foreground ml-auto">{formatRelativeTime(event.timestamp)}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-mono truncate">{JSON.stringify(event.eventData)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No events recorded for this session.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
