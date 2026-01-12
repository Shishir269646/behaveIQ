// @/components/WebsiteSwitcher.tsx
"use client"

import * as React from "react"
import { ChevronsUpDown, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAppStore } from "@/store"
import { useEffect } from "react"
import { Website } from "@/types";


type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface WebsiteSwitcherProps extends PopoverTriggerProps {}

export default function WebsiteSwitcher({ className }: WebsiteSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const { websites, website: selectedWebsite, selectWebsite, fetchWebsites } = useAppStore();

  useEffect(() => {
    if (websites.length === 0) {
        fetchWebsites();
    }
  }, [websites.length, fetchWebsites]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a website"
          className={cn("w-[220px] justify-between", className)}
        >
          {selectedWebsite ? selectedWebsite.name : "Select a website"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search website..." />
            <CommandEmpty>No website found.</CommandEmpty>
            <CommandGroup heading="Websites">
              {websites.map((website: Website) => (
                <CommandItem
                  key={website._id}
                  onSelect={() => {
                    selectWebsite(website._id);
                    setOpen(false)
                  }}
                  className="text-sm"
                >
                  {website.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedWebsite?._id === website._id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
