// @/components/Header.tsx
"use client"

import Link from 'next/link';
import {
    CircleUser,
    Menu,
    Search,
    Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import WebsiteSwitcher from './WebsiteSwitcher';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { useState } from 'react';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


const Header = () => {
    const [searchValue, setSearchValue] = useState("");
    const user = useAppStore((state) => state.user);
    const logout = useAppStore((state) => state.logout);
    const { isListening, startListening, isSupported } = useVoiceSearch((transcript) => {
        setSearchValue(transcript);
    });
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = () => {
        logout();
        toast({
            title: "Logged out",
            description: "You have been successfully logged out.",
        });
        router.push("/login");
    };

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            <WebsiteSwitcher />

            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={isListening ? "Listening..." : "Search features..."}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                        />
                        {isSupported && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1 h-8 w-8"
                                onClick={startListening}
                                disabled={isListening}
                                type="button"
                            >
                                <Mic className={`h-4 w-4 ${isListening ? 'text-red-500' : ''}`} />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        {user?.avatar ? (
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar} alt="Avatar" />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ) : (
                            <CircleUser className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.name || "My Account"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};

export default Header;
