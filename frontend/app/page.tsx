'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Brain, Target } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Don't Just Track Visitors,
            <span className="text-blue-600"> Understand Their Intent</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            BEHAVEIQ uses AI to automatically discover visitor personas, predict purchase intent,
            and personalize content in real-time—without any manual setup.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/register" legacyBehavior>
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/login" legacyBehavior>
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Brain className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">AI Persona Discovery</h3>
            <p className="text-gray-600">
              Automatically identifies visitor types without manual configuration.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Target className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Intent Prediction</h3>
            <p className="text-gray-600">
              Real-time scoring to identify high-intent visitors.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Zap className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Zero-Flicker Personalization</h3>
            <p className="text-gray-600">
              Content changes before visitors see it—instant and seamless.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}