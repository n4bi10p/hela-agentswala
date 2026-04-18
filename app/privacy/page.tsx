'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function PrivacyPage() {
  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ PRIVACY POLICY ]</span>
          <h1 className="font-headline text-5xl font-bold mt-4 mb-8">Privacy Policy</h1>
          <p className="font-body text-xs opacity-60 mb-12">Last Updated: April 2026</p>

          <div className="space-y-8 font-body text-sm opacity-80 leading-relaxed">
            <section>
              <h2 className="font-bold text-lg text-white mb-3">1. Introduction</h2>
              <p>
                Trovia ("we," "our," "us," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise handle your information when you visit our website and use our decentralized agent marketplace.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">2. Information We Collect</h2>
              <p className="mb-3">We collect information in the following ways:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Wallet address and transaction history (via MetaMask connection)</li>
                <li>Agent configuration preferences and selections</li>
                <li>Execution logs and interaction data</li>
                <li>Email address (if voluntarily provided for support)</li>
                <li>Browser and device information (automatically collected)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and improve our marketplace services</li>
                <li>To process agent activations and executions</li>
                <li>To send transactional notifications</li>
                <li>To comply with legal obligations</li>
                <li>To prevent fraud and maintain security</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">4. Data Retention</h2>
              <p>
                We retain your information for as long as necessary to provide our services. Execution logs are stored on-chain indefinitely. Account data may be deleted upon request, subject to legal requirements.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">5. Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your wallet private keys.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">6. Third-Party Services</h2>
              <p>
                We use third-party services including Google Gemini API for agent intelligence and blockchain networks for transaction processing. These services have their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-white mb-3">7. Contact Us</h2>
              <p>
                For privacy inquiries, please contact us at: <span className="text-white">privacy@trovia.ai</span>
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
