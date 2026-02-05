'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Home,
  Users,
  LineChart,
  Beaker,
  Palette,
  Settings,
  MessageSquareQuote,
  TicketPercent,
  ShieldAlert,
  Waves,
  ShoppingCart,
  LayoutDashboard,
  Globe,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { SubMenu } from './SubMenu'

const Sidebar = () => {
  const pathname = usePathname()
  const {
    experiments,
    loading: isLoadingExperiments,
    fetchExperiments,
    website: selectedWebsite,
  } = useAppStore()
  const [activeExperimentCount, setActiveExperimentCount] = useState(0)

  useEffect(() => {
    if (selectedWebsite?._id) {
      fetchExperiments(selectedWebsite._id)
    }
  }, [selectedWebsite?._id, fetchExperiments])

  useEffect(() => {
    if (experiments) {
      const activeCount = experiments.filter(
        (exp) => exp.status === 'active'
      ).length
      setActiveExperimentCount(activeCount)
    }
  }, [experiments])

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      children: [
        { href: '/dashboard', label: 'Overview', icon: Home },
        { href: '/dashboard/users', label: 'Users', icon: Users },
        { href: '/dashboard/websites', label: 'Websites', icon: Globe },
      ],
    },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/events', label: 'Live Events', icon: Waves },
    { href: '/personas', label: 'Personas', icon: Users },
    {
      href: '/experiments',
      label: 'Experiments',
      icon: Beaker,
      badge: activeExperimentCount,
    },
    { href: '/heatmaps', label: 'Heatmaps', icon: Palette },
    { href: '/content', label: 'Content Generation', icon: MessageSquareQuote },
    { href: '/discounts', label: 'Discounts', icon: TicketPercent },
    { href: '/abandonment', label: 'Cart Abandonment', icon: ShoppingCart },
    { href: '/fraud', label: 'Fraud Detection', icon: ShieldAlert },
  ]

  return (
    <div className='border-r bg-muted/40'>
      <div className='flex h-full max-h-screen flex-col gap-2'>
        <div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
          <Link href='/' className='flex items-center gap-2 font-semibold'>
            <LineChart className='h-6 w-6 text-primary' />
            <span className=''>BehaveIQ</span>
          </Link>
          <Button variant='outline' size='icon' className='ml-auto h-8 w-8'>
            <Bell className='h-4 w-4' />
            <span className='sr-only'>Toggle notifications</span>
          </Button>
        </div>
        <div className='flex-1'>
          <nav className='grid items-start px-2 text-sm font-medium lg:px-4'>
            {navItems.map((item) =>
              item.children ? (
                <SubMenu key={item.href} item={item} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                    pathname === item.href ? 'bg-muted text-primary' : ''
                  }`}
                >
                  <item.icon className='h-4 w-4' />
                  {item.label}
                  {item.badge && (
                    <Badge className='ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Sidebar