// @/components/SubMenu.tsx
"use client"

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Icon as LucideIcon } from 'lucide-react';

interface SubMenuProps {
  item: {
    href: string;
    label: string;
    icon: React.ElementType;
    children?: {
      href: string;
      label: string;
      icon: React.ElementType;
    }[];
  };
}

export const SubMenu: React.FC<SubMenuProps> = ({ item }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(pathname.startsWith(item.href));

  const toggleSubMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button
        onClick={toggleSubMenu}
        className="flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-4 w-4" />
          {item.label}
        </div>
        <ChevronDown className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="ml-4 mt-2 grid gap-1">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                pathname === child.href ? 'bg-muted text-primary' : ''
              }`}
            >
              <child.icon className="h-4 w-4" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
