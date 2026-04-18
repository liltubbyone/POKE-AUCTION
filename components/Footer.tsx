import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-heading gold-gradient-text mb-3">POKEAUCTION</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              The most trusted Pokemon surprise wheel auction site. Every spin is 100% randomized using cryptographic seeds — never manipulated.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading text-white text-xl mb-3">QUICK LINKS</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-gold transition-colors">Home</Link></li>
              <li><Link href="/inventory" className="text-gray-400 hover:text-gold transition-colors">Inventory</Link></li>
              <li><Link href="/auth/login" className="text-gray-400 hover:text-gold transition-colors">Sign In</Link></li>
              <li><Link href="/auth/register" className="text-gray-400 hover:text-gold transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-heading text-white text-xl mb-3">POLICIES</h4>
            <div className="space-y-3">
              <div className="no-refund-banner">
                NO REFUNDS — ALL SALES FINAL
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                All auctions are 100% randomized. Buyers are responsible for shipping costs. No sales tax collected.
              </p>
              <p className="text-gray-400 text-xs">
                This site is operated by a single seller. Not affiliated with The Pokemon Company.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="border-t border-border pt-6 flex flex-wrap gap-4 justify-center mb-6">
          <div className="trust-badge text-gold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Secure Checkout
          </div>
          <div className="trust-badge text-gold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z" />
              <path d="M10 6a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 11V7a1 1 0 011-1z" />
            </svg>
            100% Randomized
          </div>
          <div className="trust-badge text-gold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Verified Seller
          </div>
          <div className="trust-badge text-gold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Provably Fair
          </div>
        </div>

        <div className="text-center text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} PokeAuction. All rights reserved.</p>
          <p className="mt-1">Pokemon and all related names are trademarks of Nintendo/Game Freak/The Pokemon Company.</p>
        </div>
      </div>
    </footer>
  )
}
