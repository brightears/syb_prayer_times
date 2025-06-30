import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          SYB Prayer Times
        </h1>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Automatically pause music during prayer times in your Soundtrack Your Brand zones.
          Perfect for businesses observing prayer times during Ramadan and throughout the year.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-8 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-gray-300 px-8 py-3 hover:bg-gray-50 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    </main>
  )
}