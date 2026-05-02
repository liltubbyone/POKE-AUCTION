import type { Metadata } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileBottomBar from '@/components/MobileBottomBar'
import StarField from '@/components/StarField'
import SessionProvider from '@/components/SessionProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const orbitron = Orbitron({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cosmic Grails — Space-Themed Trading Card Raffles',
  description:
    'Discover rare trading card grails through provably fair cosmic raffles. Buy a spot, spin the wheel, win rare cards and collectibles. 100% randomized, fully transparent.',
  keywords: 'trading cards, raffle, cosmic grails, rare cards, collectibles, booster box, pokemon',
  openGraph: {
    title: 'Cosmic Grails — Space-Themed Trading Card Raffles',
    description: '100% randomized trading card raffles. Discover your next grail.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="bg-background text-white font-body antialiased min-h-screen flex flex-col">
        <SessionProvider session={session}>
          <StarField />
          <Navbar />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
          <MobileBottomBar />
        </SessionProvider>
      </body>
    </html>
  )
}
