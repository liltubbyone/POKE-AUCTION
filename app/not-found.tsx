import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-heading gold-gradient-text mb-4">404</h1>
        <h2 className="text-3xl font-heading text-white mb-4">PAGE NOT FOUND</h2>
        <p className="text-gray-400 mb-8">That page doesn&apos;t exist, trainer!</p>
        <Link href="/" className="btn-gold">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
