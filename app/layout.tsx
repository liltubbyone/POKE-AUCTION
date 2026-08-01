import type { Metadata } from 'next'
import { Orbitron, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileBottomBar from '@/components/MobileBottomBar'
import StarField from '@/components/StarField'
import SessionProvider from '@/components/SessionProvider'
import PageViewTracker from '@/components/PageViewTracker'
import PresenceTracker from '@/components/PresenceTracker'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const orbitron = Orbitron({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://poke-auction-wheat.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cosmic Grails — Pokémon Card Raffles & Auctions',
    template: '%s — Cosmic Grails',
  },
  description:
    'Win rare Pokémon cards, booster boxes, and grails through provably fair raffles. Buy a spot, spin the wheel, and discover your next grail. 100% randomized and transparent.',
  keywords: [
    'pokemon card raffle', 'pokemon booster box raffle', 'trading card raffle', 'pokemon auction',
    'rare pokemon cards', 'pokemon grail', 'booster box auction', 'cosmic grails',
    'pokemon card giveaway', 'pokemon collectibles',
  ],
  openGraph: {
    title: 'Cosmic Grails — Pokémon Card Raffles & Auctions',
    description: 'Win rare Pokémon cards and booster boxes through provably fair raffles. Spin the wheel, claim your grail.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Cosmic Grails',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Cosmic Grails' }],
  },
  twitter: {
    card: 'summary',
    title: 'Cosmic Grails — Pokémon Card Raffles',
    description: 'Win rare Pokémon cards through provably fair raffles.',
    images: ['/logo.png'],
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Cosmic Grails',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: 'Provably fair Pokémon card raffles and auctions. Win rare cards, booster boxes, and grails.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Cosmic Grails',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/browse`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]

  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable}`}>
      <body className="bg-background text-white font-body antialiased min-h-screen flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SessionProvider session={session}>
          <StarField />
          <Navbar />
          <PageViewTracker />
          <PresenceTracker />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
          <MobileBottomBar />
        </SessionProvider>
      </body>
    </html>
  )
}
