
import Link from 'next/link'
import { ArrowRight, Zap, Target, TrendingUp } from 'lucide-react'


export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary-600">PersonaFlow</h1>
                    <div className="space-x-4">
                        <Link
                            href="/login"
                            className="text-gray-700 hover:text-primary-600 transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        AI-Powered Website{' '}
                        <span className="text-primary-600">Personalization</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        দর্শকদের জন্য সঠিক content দেখান। Conversion বাড়ান।
                        এক লাইনের SDK দিয়ে শুরু করুন।
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link
                            href="#features"
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-primary-600 hover:text-primary-600 transition-colors"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div id="features" className="grid md:grid-cols-3 gap-8 mt-24">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                        <p className="text-gray-600">
                            Real-time personalization with &lt;100ms latency
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Target className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Smart Targeting</h3>
                        <p className="text-gray-600">
                            AI-powered intent scoring and segmentation
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Higher Conversions</h3>
                        <p className="text-gray-600">
                            30-50% average conversion uplift
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
