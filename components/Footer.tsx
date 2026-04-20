import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: 'rgba(6,6,13,0.95)', borderTop: '1px solid rgba(30,30,53,0.8)' }} className="mt-16">
      {/* Gold glow line at top */}
      <div className="glow-line" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FFE44D 0%, #FFD700 50%, #B8860B 100%)',
                  boxShadow: '0 0 16px rgba(255,215,0,0.25)',
                }}
              >
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <span className="text-xl font-heading tracking-wider">
                <span className="shimmer-gold">POKE</span>
                <span className="text-white">AUCTION</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The most trusted Pokemon surprise wheel auction site. Every spin is 100% randomized
              using cryptographic seeds — never manipulated.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading text-white text-base tracking-widest mb-4 uppercase">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Home' },
                { href: '/inventory', label: 'Inventory' },
                { href: '/auth/login', label: 'Sign In' },
                { href: '/auth/register', label: 'Register' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-gold transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span
                      className="w-1 h-1 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity"
                    />
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
              <div className="no-refund-banner text-xs">
                No Refunds — All Sales Final
              </div>
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
        <div
          className="flex flex-wrap gap-3 justify-center mb-10 pt-8"
          style={{ borderTop: '1px solid rgba(30,30,53,0.8)' }}
        >
          {[
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              label: 'Secure Checkout',
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
              label: '100% Randomized',
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
              label: 'Verified Seller',
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              label: 'Provably Fair',
            },
          ].map((badge) => (
            <div
              key={badge.label}
              className="trust-badge text-gold text-xs"
            >
              {badge.icon}
              {badge.label}
            </div>
          ))}
        </div>

        <div className="text-center text-gray-700 text-xs space-y-1">
          <p>&copy; {new Date().getFullYear()} PokeAuction. All rights reserved.</p>
          <p>Pokemon and all related names are trademarks of Nintendo / Game Freak / The Pokemon Company.</p>
        </div>
      </div>
    </footer>
  )
}
