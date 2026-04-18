import type { Metadata } from 'next'
import { Bebas_Neue, Rajdhani } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SessionProvider from '@/components/SessionProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PokeAuction - Surprise Wheel Auctions',
  description:
    'The most trusted Pokemon surprise wheel auction site. 100% randomized, provably fair. Buy a spot, spin the wheel, win rare Pokemon cards and products.',
  keywords: 'pokemon, auction, surprise wheel, booster box, ETB, pokemon cards',
  openGraph: {
    title: 'PokeAuction - Surprise Wheel Auctions',
    description: '100% randomized Pokemon surprise wheel auctions',
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
    <html lang="en" className={`${bebasNeue.variable} ${rajdhani.variable}`}>
      <body className="bg-background text-white font-body antialiased min-h-screen flex flex-col">
        <SessionProvider session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
