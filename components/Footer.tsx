'use client'

import Link from 'next/link'
import { useState } from 'react'

const FOOTER_FAQS = [
  { q: 'How do raffles work?', a: 'Buy a spot at a fixed price. When the raffle fills, a provably fair random spin assigns each spot a prize. Every paid spot wins something.' },
  { q: 'How are winners chosen?', a: 'Using a cryptographically seeded random algorithm. The seed is generated at close using participant data — tamper-proof and verifiable.' },
  { q: 'Are sales final?', a: 'Yes. All purchases are final. If there is a fulfillment issue on our end we will make it right — contact support.' },
  { q: 'How is shipping handled?', a: 'Shipping is calculated at cost via USPS ($8–$15 est.). You pay after winning and we generate a label once payment is confirmed.' },
  { q: 'What is the daily free spin?', a: 'Every registered user gets one free spin per day. The 100th spin wins a mystery gift. Resets at midnight UTC.' },
]

export default function Footer() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <footer style={{ background: 'rgba(6,6,13,0.95)', borderTop: '1px solid rgba(30,30,53,0.8)' }} className="relative mt-16 pb-20 md:pb-0">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.07,
        }}
      />
      <div className="glow-line" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* FAQ Section */}
        <div className="mb-12 pb-12" style={{ borderBottom: '1px solid rgba(30,30,53,0.8)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-white text-2xl tracking-widest uppercase">Common Questions</h3>
            <Link href="/support" className="text-gold text-xs font-semibold hover:underline uppercase tracking-wider">Full FAQ →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {FOOTER_FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3 cursor-pointer transition-all select-none"
                style={{
                  background: openFaq === i ? 'rgba(255,215,0,0.04)' : 'rgba(13,13,26,0.6)',
                  border: `1px solid ${openFaq === i ? 'rgba(255,215,0,0.2)' : 'rgba(30,30,53,0.8)'}`,
                }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-gray-300 text-sm font-semibold">{faq.q}</p>
                  <span className="text-gray-500 text-sm flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && (
                  <p className="text-gray-500 text-xs leading-relaxed mt-2 pt-2" style={{ borderTop: '1px solid rgba(30,30,53,0.8)' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #06B6D4 100%)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21L12 17.77L18.18 21L17 14.14L22 9.27L14.91 8.26L12 2Z" />
                </svg>
              </div>
              <span className="text-xl font-heading tracking-wider">
                <span className="cosmic-title-shimmer">COSMIC</span>
                <span className="text-white"> GRAILS</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The most trusted space-themed trading card raffle platform. Every spin is 100% randomized
              using cryptographic seeds — provably fair, never manipulated.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading text-white text-base tracking-widest mb-4 uppercase">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Home' },
                { href: '/auctions', label: 'Raffles' },
                { href: '/daily-spin', label: 'Free Daily Spin' },
                { href: '/inventory', label: 'Inventory' },
                { href: '/results', label: 'Results' },
                { href: '/support', label: 'FAQ & Support' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-gold transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-heading text-white text-base tracking-widest mb-4 uppercase">Policies</h4>
            <div className="space-y-3">
              <div className="no-refund-banner text-xs">No Refunds — All Sales Final</div>
              <p className="text-gray-600 text-xs leading-relaxed">
                All auctions are 100% randomized. Buyers are responsible for shipping costs. No sales tax collected.
              </p>
              <p className="text-gray-600 text-xs">
                Operated by a single seller. Not affiliated with The Pokemon Company.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 justify-center mb-10 pt-8" style={{ borderTop: '1px solid rgba(30,30,53,0.8)' }}>
          {[
            { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, label: 'Secure Checkout' },
            { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>, label: '100% Randomized' },
            { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, label: 'Verified Seller' },
            { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, label: 'Provably Fair' },
          ].map((badge) => (
            <div key={badge.label} className="trust-badge text-gold text-xs">{badge.icon}{badge.label}</div>
          ))}
        </div>

        <div className="text-center text-gray-700 text-xs space-y-1">
          <p>&copy; {new Date().getFullYear()} Cosmic Grails. All rights reserved.</p>
          <p>Trading cards and related names are trademarks of their respective publishers.</p>
        </div>
      </div>
    </footer>
  )
}
