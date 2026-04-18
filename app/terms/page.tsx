'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function TermsPage() {
  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ TERMS OF SERVICE ]</span>
          <h1 className="font-headline text-5xl font-bold mt-4 mb-8">Terms of Service</h1>
          <p className="font-body text-xs opacity-60 mb-12">Last Updated: April 2026</p>

          <div className="space-y-8 font-body text-sm opacity-80 leading-relaxed">
            <section>
              <h2 className="font-bold text-lg text-white mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing and using Trovia, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">2. Use License</h2>
              <p className="mb-3">Permission is granted to temporarily download one copy of the materials (information or software) on Trovia for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on Trovia</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">3. Disclaimer</h2>
              <p>
                The materials on Trovia are provided on an &apos;as is&apos; basis. Trovia makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">4. Limitations</h2>
              <p>
                In no event shall Trovia or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Trovia.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on Trovia could include technical, typographical, or photographic errors. Trovia does not warrant that any of the materials on its website are accurate, complete, or current. Trovia may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">6. Financial Disclaimer</h2>
              <p>
                Trading and using AI agents involves substantial risk of loss. Past performance is not indicative of future results. You are solely responsible for your investment decisions. Trovia is not a financial advisor.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">7. Smart Contract Risks</h2>
              <p>
                Users acknowledge and accept the risks associated with blockchain technology and smart contracts, including but not limited to smart contract vulnerabilities, network failures, and market volatility.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">8. User Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are responsible for maintaining your wallet security</li>
                <li>You must not use Trovia for illegal activities</li>
                <li>You agree not to interfere with platform operations</li>
                <li>You accept liability for all actions taken through your wallet</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">9. Termination</h2>
              <p>
                Trovia may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">10. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of your jurisdiction, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">11. Contact Information</h2>
              <p>
                For inquiries about these Terms, please contact: <span className="text-white">legal@trovia.ai</span>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <Link href="/contact" className="text-white hover:opacity-60 transition">
              ← Back to Contact
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
