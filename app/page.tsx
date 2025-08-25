import Link from 'next/link';
import UserSelector from './(components)/UserSelector';

"use client";
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Getting Started Guide */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🚀 Getting Started Guide</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-semibold mt-1">1</span>
              <div>
                <h3 className="font-medium text-blue-900">Select a Demo User Below</h3>
                <p className="text-sm text-gray-600">Choose any user to start experiencing notifications</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-600 font-semibold mt-1">2</span>
              <div>
                <h3 className="font-medium text-green-900">Try Demo Actions</h3>
                <p className="text-sm text-gray-600">Create posts, follow users, or give likes to see notifications in action</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center text-purple-600 font-semibold mt-1">3</span>
              <div>
                <h3 className="font-medium text-purple-900">Check Your Activity</h3>
                <p className="text-sm text-gray-600">Visit notifications or generate a digest to see your interactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Insyd Notifications Demo
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Experience real-time notifications with AI-powered ranking
          </p>
        </div>

        {/* User Selection */}
        <UserSelector />

        {/* Navigation */}
        <div className="mt-8">
          <p className="text-center text-sm text-gray-600 mb-4">Quick Navigation:</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/notifications"
              className="w-full sm:w-auto px-6 py-3 text-center bg-blue-600 text-white font-medium rounded-lg 
                shadow-sm hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 
                focus:ring-blue-500 focus:ring-offset-2 group"
            >
              <span className="inline-flex items-center">
                <span className="mr-2">📬</span>
                View Notifications
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded hidden group-hover:inline">
                  Real-time feed
                </span>
              </span>
            </Link>
            <Link
              href="/digest"
              className="w-full sm:w-auto px-6 py-3 text-center bg-white text-blue-600 font-medium rounded-lg 
                shadow-sm border border-blue-600 hover:bg-blue-50 transition-colors duration-200 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
            >
              <span className="inline-flex items-center">
                <span className="mr-2">📊</span>
                View Digest
                <span className="ml-2 text-xs bg-blue-50 px-2 py-1 rounded hidden group-hover:inline">
                  Activity summary
                </span>
              </span>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">What You Can Do Here</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">🚀</span>
                <div className="text-xl font-semibold">Instant Updates</div>
              </div>
              <p className="text-gray-600 ml-13">
                See notifications appear right after actions with smooth transitions
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">🤖</span>
                <div className="text-xl font-semibold">Smart Sorting</div>
              </div>
              <p className="text-gray-600 ml-13">
                Toggle between chronological and AI-ranked notifications
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">🎯</span>
                <div className="text-xl font-semibold">Quick Actions</div>
              </div>
              <p className="text-gray-600 ml-13">
                Create posts, follow users, and like content with one click
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl">📊</span>
                <div className="text-xl font-semibold">Activity Digest</div>
              </div>
              <p className="text-gray-600 ml-13">
                Get a complete summary of all your interactions and notifications
              </p>
            </div>
          </div>
        </div>

        {/* Tips & Help */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-4">💡 Quick Tips:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">✓</span>
              Select different users to see how notifications change
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">✓</span>
              Use "Reseed Data" anytime to start fresh
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">✓</span>
              Try both chronological and AI-ranked sorting
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
          <p>Experience the notification system with any demo user - no login required!</p>
          <p className="mt-2">
            Built with Next.js and modern web technologies
          </p>
        </div>
      </div>
    </main>
  );
}
