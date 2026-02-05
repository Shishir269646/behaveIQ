'use client'

import {
  Activity,
  ArrowRight,
  BarChart,
  BrainCircuit,
  ShieldCheck,
  Shuffle,
  Users,
} from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: <Activity className='w-12 h-12 text-blue-500' />,
    title: 'Session Replay',
    description: 'Watch how users interact with your site, just like a movie.',
  },
  {
    icon: <BarChart className='w-12 h-12 text-green-500' />,
    title: 'Heatmaps',
    description:
      'Visualize where users click, move, and scroll on your pages.',
  },
  {
    icon: <BrainCircuit className='w-12 h-12 text-purple-500' />,
    title: 'AI-Powered Insights',
    description:
      'Get automated insights and recommendations to improve your UX.',
  },
  {
    icon: <Users className='w-12 h-12 text-red-500' />,
    title: 'Personalization Engine',
    description: 'Deliver personalized experiences to your visitors in real-time.',
  },
  {
    icon: <Shuffle className='w-12 h-12 text-yellow-500' />,
    title: 'A/B Testing',
    description:
      'Run experiments to find out what works best for your audience.',
  },
  {
    icon: <ShieldCheck className='w-12 h-12 text-indigo-500' />,
    title: 'Fraud Detection',
    description: 'Protect your site from fraudulent activity and bots.',
  },
]

const testimonials = [
  {
    name: 'Jane Doe',
    title: 'CEO, Startup Inc.',
    quote:
      "BehaveIQ has transformed the way we understand our customers. The insights are invaluable, and the personalization engine has boosted our conversions by 30%.",
  },
  {
    name: 'John Smith',
    title: 'Marketing Lead, Tech Corp.',
    quote:
      "The session replay and heatmaps are game-changers. We can finally see what's causing drop-offs and fix them instantly. Highly recommended!",
  },
]

export default function HomePage() {
  return (
    <div className='bg-gray-50 text-gray-800'>
      <header className='bg-white shadow-sm'>
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-gray-900'>BehaveIQ</h1>
          <nav className='space-x-4'>
            <Link
              href='/dashboard'
              className='text-gray-600 hover:text-blue-500'
            >
              Login
            </Link>
            <Link
              href='/dashboard'
              className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600'
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className='hero text-center py-20 bg-white'>
          <div className='container mx-auto px-4'>
            <h2 className='text-5xl font-extrabold mb-4'>
              Understand Your Users, Effortlessly
            </h2>
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
              BehaveIQ provides AI-powered tools to analyze user behavior,
              personalize experiences, and boost your conversions.
            </p>
            <Link
              href='/dashboard'
              className='bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition duration-300'
            >
              Go to Dashboard
              <ArrowRight className='inline-block ml-2' />
            </Link>
          </div>
        </section>

        <section id='features' className='py-20'>
          <div className='container mx-auto px-4'>
            <div className='text-center mb-12'>
              <h3 className='text-4xl font-bold'>Powerful Features, All in One Place</h3>
              <p className='text-lg text-gray-600 mt-2'>
                Everything you need to create amazing user experiences.
              </p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {features.map((feature, index) => (
                <div key={index} className='bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300'>
                  <div className='flex items-center justify-center h-16 w-16 mb-6'>
                    {feature.icon}
                  </div>
                  <h4 className='text-2xl font-bold mb-2'>{feature.title}</h4>
                  <p className='text-gray-600'>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id='testimonials' className='py-20 bg-white'>
          <div className='container mx-auto px-4'>
            <div className='text-center mb-12'>
              <h3 className='text-4xl font-bold'>Loved by Teams Worldwide</h3>
              <p className='text-lg text-gray-600 mt-2'>
                Don't just take our word for it. Here's what our customers say.
              </p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {testimonials.map((testimonial, index) => (
                <div key={index} className='bg-gray-50 p-8 rounded-lg border border-gray-200'>
                  <p className='text-lg mb-6 italic'>"{testimonial.quote}"</p>
                  <div className='font-bold text-right'>
                    <p className='text-gray-900'>{testimonial.name}</p>
                    <p className='text-gray-500 text-sm'>{testimonial.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='cta py-20 text-center'>
          <div className='container mx-auto px-4'>
            <h3 className='text-4xl font-bold mb-4'>Ready to Get Started?</h3>
            <p className='text-xl text-gray-600 mb-8'>
              Sign up today and start understanding your users like never before.
            </p>
            <Link
              href='/dashboard'
              className='bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition duration-300'
            >
              Sign Up for Free
            </Link>
          </div>
        </section>
      </main>

      <footer className='bg-white border-t'>
        <div className='container mx-auto px-4 py-6 text-center text-gray-600'>
          &copy; {new Date().getFullYear()} BehaveIQ. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
