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
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useAuth } from '@/hooks/useAuth'; // Correctly placed import


const Header = () => {
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const { user, logout } = useAuth(); // Correctly placed hook call
    const { isListening, startListening, isSupported } = useVoiceSearch((results) => {
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
        if (results.length > 0) {
            setSearchValue(results[0].name || results[0].query || ""); // Set search value to the first result or query
        }
    });
    const router = useRouter();
    const { toast } = useToast();

    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleLogout = () => {
        logout();
        toast({
            title: "Logged out",
            description: "You have been successfully logged out.",
        });
        router.push("/login");
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically perform a text-based search
        console.log("Performing text search for:", searchValue);
        // For now, let's clear results after a hypothetical search
        setSearchResults([]);
        setShowSearchResults(false);
    };

    const handleSearchResultClick = (result: any) => {
        // Handle clicking a search result, e.g., navigate to a product page
        console.log("Clicked search result:", result);
        // router.push(`/products/${result.id}`); // Example navigation
        setSearchValue(result.name || result.query || ""); // Update input with selected result
        setShowSearchResults(false);
    };

    useEffect(() => {
        // Close search results when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


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
                <form onSubmit={handleSearchSubmit}>
                    <div className="relative" ref={searchInputRef}>
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={isListening ? "Listening..." : "Search features or products..."}
                            value={searchValue}
                            onChange={(e) => {
                                setSearchValue(e.target.value);
                                // Potentially trigger text search as user types
                            }}
                            onFocus={() => setShowSearchResults(searchResults.length > 0)}
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
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full md:w-2/3 lg:w-1/3 bg-popover border rounded-md shadow-lg mt-1">
                                <Command>
                                    <CommandList>
                                        <CommandEmpty>No results found.</CommandEmpty>
                                        <CommandGroup heading="Search Results">
                                            {searchResults.map((result, index) => (
                                                <CommandItem
                                                    key={index}
                                                    onSelect={() => handleSearchResultClick(result)}
                                                    className="cursor-pointer"
                                                >
                                                    {result.name || result.query || JSON.stringify(result)}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </div>
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
                                <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ) : (
                            <CircleUser className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.fullName || "My Account"}</DropdownMenuLabel>
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
