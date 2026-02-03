// @/app/(dashboard)/dashboard/page.tsx
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  MoreHorizontal,
} from 'lucide-react'
import StatCard from '@/components/StatCard'

const DashboardPage = () => {
  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4'>
        <StatCard
          title='Total Revenue'
          value='$45,231.89'
          description='+20.1% from last month'
          icon={<DollarSign className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Subscriptions'
          value='+2350'
          description='+180.1% from last month'
          icon={<Users className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Sales'
          value='+12,234'
          description='+19% from last month'
          icon={<CreditCard className='h-4 w-4 text-muted-foreground' />}
        />
        <StatCard
          title='Active Now'
          value='+573'
          description='+201 since last hour'
          icon={<Activity className='h-4 w-4 text-muted-foreground' />}
        />
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-1 lg:col-span-4'>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              You made 265 sales this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className='font-medium'>Liam Johnson</div>
                    <div className='hidden text-sm text-muted-foreground md:inline'>
                      liam@example.com
                    </div>
                  </TableCell>
                  <TableCell>Sale</TableCell>
                  <TableCell>
                    <Badge className='text-xs' variant='outline'>
                      Approved
                    </Badge>
                  </TableCell>
                  <TableCell>2023-06-23</TableCell>
                  <TableCell className='text-right'>$250.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-8'>
              <div className='flex items-center gap-4'>
                <div className='grid gap-1'>
                  <p className='text-sm font-medium leading-none'>
                    google.com
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Direct, organic, paid
                  </p>
                </div>
                <div className='ml-auto font-medium'>+1,921</div>
              </div>
              <div className='flex items-center gap-4'>
                <div className='grid gap-1'>
                  <p className='text-sm font-medium leading-none'>
                    twitter.com
                  </p>
                  <p className='text-sm text-muted-foreground'>Social</p>
                </div>
                <div className='ml-auto font-medium'>+392</div>
              </div>
              <div className='flex items-center gap-4'>
                <div className='grid gap-1'>
                  <p className='text-sm font-medium leading-none'>
                    github.com
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Social
                  </p>
                </div>
                <div className='ml-auto font-medium'>+92</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default DashboardPage