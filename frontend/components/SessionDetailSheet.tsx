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
import { CircleUser, MousePointerClick, Page, ShoppingCart, Clock } from "lucide-react"

interface SessionDetailSheetProps {
  session: Session | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Mock event data for a given session
const sessionEvents = [
    { type: 'page_view', detail: '/products/widget-pro', timestamp: '2:30:15 PM' },
    { type: 'click', detail: 'button#add-to-cart', timestamp: '2:30:45 PM' },
    { type: 'add_to_cart', detail: 'Widget Pro', timestamp: '2:30:46 PM' },
    { type: 'page_view', detail: '/cart', timestamp: '2:31:05 PM' },
    { type: 'page_view', detail: '/checkout', timestamp: '2:32:10 PM' },
    { type: 'click', detail: 'link#back-to-cart', timestamp: '2:33:00 PM' },
    { type: 'session_end', detail: 'User inactive', timestamp: '2:45:00 PM' },
]

const eventIcons: { [key: string]: React.ReactNode } = {
    page_view: <Page className="h-4 w-4" />,
    click: <MousePointerClick className="h-4 w-4" />,
    session_start: <CircleUser className="h-4 w-4" />,
    add_to_cart: <ShoppingCart className="h-4 w-4" />,
}

export default function SessionDetailSheet({ session, isOpen, onOpenChange }: SessionDetailSheetProps) {
    if (!session) return null;

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
        <div className="space-y-4">
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
            <div>
                <h4 className="text-sm font-medium">Event Timeline</h4>
                <ScrollArea className="h-96 w-full rounded-md border mt-2">
                    <div className="p-4">
                        {sessionEvents.map((event, index) => (
                            <div key={index} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                                <div className="grid gap-1">
                                    <div className="flex items-center gap-2">
                                        {eventIcons[event.type] || <Clock className="h-4 w-4" />}
                                        <p className="text-sm font-medium leading-none capitalize">{event.type.replace('_', ' ')}</p>
                                        <p className="text-sm text-muted-foreground ml-auto">{event.timestamp}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-mono">{event.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
