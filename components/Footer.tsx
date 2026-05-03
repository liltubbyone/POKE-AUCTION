'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const FOOTER_FAQS = [
  { q: 'How do raffles work?', a: 'Buy a spot at a fixed price. When the raffle fills, a provably fair random spin assigns each spot a prize. Every paid spot wins something.' },
  { q: 'How are winners chosen?', a: 'Using a cryptographically seeded random algorithm. The seed is generated at close using participant data — tamper-proof and verifiable.' },
  { q: 'Are sales final?', a: 'Yes. All purchases are final. If there is a fulfillment issue on our end we will make it right — contact support.' },
  { q: 'How is shipping handled?', a: 'Shipping is calculated at cost via USPS ($4–$8 est.). You pay after winning and we generate a label once payment is confirmed.' },
  { q: 'What is the daily free spin?', a: 'Every registered user gets one free spin per day. One lucky spin wins a mystery gift. Resets at midnight Central.' },
]

const badges = [
  {
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    label: 'Secure Checkout',
    color: '#4ade80',
  },
  {
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    label: '100% Randomized',
    color: '#a78bfa',
  },
  {
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    label: 'Verified Seller',
    color: '#38bdf8',
  },
  {
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    label: 'Provably Fair',
    color: '#FFD700',
  },
]

export default function Footer() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <footer
      className="relative mt-16 pb-20 md:pb-0"
      style={{
        background: 'rgba(2,6,23,0.98)',
        borderTop: '1px solid rgba(30,41,59,0.7)',
      }}
    >
      {/* Top neon separator */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.35) 25%, rgba(56,189,248,0.25) 50%, rgba(124,58,237,0.35) 75%, transparent 100%)',
      }} />

      {/* Subtle nebula bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 40% at 50% 100%, rgba(124,58,237,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">

        {/* FAQ */}
        <div className="mb-12 pb-12" style={{ borderBottom: '1px solid rgba(30,41,59,0.7)' }}>
          <div className="flex items-center justify-between mb-7">
            <h3 className="font-heading text-white text-xl tracking-widest uppercase">Common Questions</h3>
            <Link href="/support" className="text-[11px] font-bold uppercase tracking-widest hover:text-white transition-colors" style={{ color: '#FFD700' }}>
              Full FAQ →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {FOOTER_FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3 cursor-pointer transition-all select-none"
                style={{
                  background: openFaq === i ? 'rgba(124,58,237,0.05)' : 'rgba(13,18,36,0.7)',
                  border: `1px solid ${openFaq === i ? 'rgba(124,58,237,0.25)' : 'rgba(30,41,59,0.8)'}`,
                }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-300 text-sm font-semibold">{faq.q}</p>
                  <span
                    className="text-sm flex-shrink-0 font-bold transition-colors"
                    style={{ color: openFaq === i ? '#a78bfa' : '#475569' }}
                  >
                    {openFaq === i ? '−' : '+'}
                  </span>
                </div>
                {openFaq === i && (
                  <p className="text-slate-500 text-xs leading-relaxed mt-2 pt-2" style={{ borderTop: '1px solid rgba(30,41,59,0.7)' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main footer columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image src="/logo.png" alt="Cosmic Grails" width={120} height={120} style={{ objectFit: 'contain' }} />
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              The most trusted space-themed trading card raffle platform. Every spin is 100% randomized
              using cryptographic seeds — provably fair, never manipulated.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-white text-sm tracking-widest mb-5 uppercase">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/',           label: 'Home'           },
                { href: '/auctions',   label: 'Raffles'        },
                { href: '/daily-spin', label: 'Free Daily Spin'},
                { href: '/inventory',  label: 'Inventory'      },
                { href: '/results',    label: 'Results'        },
                { href: '/support',    label: 'FAQ & Support'  },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-gold transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-heading text-white text-sm tracking-widest mb-5 uppercase">Policies</h4>
            <div className="space-y-3">
              <div className="no-refund-banner text-xs">No Refunds — All Sales Final</div>
              <p className="text-slate-600 text-xs leading-relaxed">
                All auctions are 100% randomized. Buyers are responsible for shipping costs. No sales tax collected.
              </p>
              <p className="text-slate-600 text-xs">
                Operated by a single seller. Not affiliated with The Pokémon Company.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div
          className="flex flex-wrap gap-3 justify-center mb-10 pt-8"
          style={{ borderTop: '1px solid rgba(30,41,59,0.7)' }}
        >
          {badges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200"
              style={{
                color: b.color,
                background: `${b.color}0a`,
                border: `1px solid ${b.color}22`,
              }}
            >
              {b.icon}
              {b.label}
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center space-y-1">
          <p className="text-slate-700 text-xs">&copy; {new Date().getFullYear()} Cosmic Grails. All rights reserved.</p>
          <p className="text-slate-700 text-xs">Trading cards and related names are trademarks of their respective publishers.</p>
        </div>
      </div>
    </footer>
  )
}
