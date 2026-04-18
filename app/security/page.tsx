'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function SecurityPage() {
  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ SECURITY ]</span>
          <h1 className="font-headline text-5xl font-bold mt-4 mb-8">Security & Privacy</h1>
          <p className="font-body text-lg opacity-80 mb-12">How we protect your funds and data on Trovia.</p>

          <div className="space-y-8 font-body text-sm opacity-80 leading-relaxed">
            <section>
              <h2 className="font-bold text-lg text-white mb-3">1. Smart Contract Security</h2>
              <div className="space-y-3 ml-4">
                <p>• All smart contracts undergo professional security audits before deployment</p>
                <p>• Contracts are immutable once deployed, preventing unauthorized modifications</p>
                <p>• Escrow mechanisms ensure user funds are always protected in smart contracts</p>
                <p>• Multi-signature wallets guard contract owner functions</p>
                <p>• Regular vulnerability assessments and bug bounties active</p>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">2. Wallet Security</h2>
              <div className="space-y-3 ml-4">
                <p>• We use MetaMask for industry-standard wallet integration</p>
                <p>• Private keys never leave your device—always stored locally in MetaMask</p>
                <p>• We never request or store your private keys or seed phrases</p>
                <p>• Transaction signing happens locally on your device</p>
                <p>• Always verify contract addresses before approving transactions</p>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">3. Frontend Security</h2>
              <div className="space-y-3 ml-4">
                <p>• HTTPS encryption for all data in transit</p>
                <p>• Content Security Policy (CSP) prevents XSS attacks</p>
                <p>• Regular dependency updates and security patches</p>
                <p>• No sensitive data stored in browser local storage</p>
                <p>• DDoS protection and rate limiting on API routes</p>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">4. Data Protection</h2>
              <div className="space-y-3 ml-4">
                <p>• Minimal data collection—only necessary for functionality</p>
                <p>• Blockchain transactions are public and immutable by design</p>
                <p>• Personal information (email) is encrypted and never shared</p>
                <p>• GDPR compliant data handling and deletion policies</p>
                <p>• Regular data backups with secure storage</p>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">5. Best Security Practices</h2>
              <div className="space-y-3 ml-4">
                <p>✓ Use a hardware wallet (Ledger, Trezor) for large amounts</p>
                <p>✓ Enable 2FA on all accounts associated with crypto</p>
                <p>✓ Never click suspicious links or install unknown extensions</p>
                <p>✓ Verify URLs before entering credentials (phishing prevention)</p>
                <p>✓ Keep your browser and operating system updated</p>
                <p>✓ Use a dedicated browser or sandbox for crypto activities</p>
                <p>✓ Test agents with small amounts first on testnet</p>
                <p>✓ Monitor your wallet regularly for suspicious activity</p>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">6. Bug Bounty Program</h2>
              <p>
                We offer bounties for responsible vulnerability disclosures. If you discover a security issue, please report it to <span className="text-white">security@trovia.ai</span> rather than publicly disclosing it.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">7. Incident Response</h2>
              <p>
                In the unlikely event of a security incident, we will:
              </p>
              <div className="space-y-2 ml-4 mt-3">
                <p>• Immediately stop affected operations</p>
                <p>• Notify all affected users within 24 hours</p>
                <p>• Conduct a thorough investigation and post-mortem</p>
                <p>• Implement fixes and security improvements</p>
                <p>• Provide compensation where appropriate</p>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">8. Security Audit History</h2>
              <div className="border border-white/20 p-4 space-y-3">
                <div className="flex justify-between pb-2 border-b border-white/10">
                  <span className="font-bold">Audit Date</span>
                  <span className="font-bold">Auditor</span>
                  <span className="font-bold">Status</span>
                </div>
                <div className="flex justify-between">
                  <span>April 2026</span>
                  <span>Trail of Bits</span>
                  <span className="text-green-500">Passed ✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Q3 2026 (Planned)</span>
                  <span>Certora</span>
                  <span className="text-white/60">Scheduled</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">9. Compliance</h2>
              <p>
                Trovia complies with GDPR, CCPA, and other privacy regulations where applicable. We maintain security certifications and follow industry best practices.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">10. Questions?</h2>
              <p>
                For security concerns or questions, contact: <span className="text-white">security@trovia.ai</span>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex flex-wrap gap-4">
              <Link href="/disclaimer" className="text-white hover:opacity-60 transition text-sm">[ DISCLAIMER ]</Link>
              <Link href="/privacy" className="text-white hover:opacity-60 transition text-sm">[ PRIVACY ]</Link>
              <Link href="/terms" className="text-white hover:opacity-60 transition text-sm">[ TERMS ]</Link>
              <Link href="/contact" className="text-white hover:opacity-60 transition text-sm">[ CONTACT ]</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
