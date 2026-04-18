'use client';

import Link from 'next/link';
import { TopNavBar } from '@/components/TopNavBar';

export default function ContactPage() {
  return (
    <>
      <TopNavBar />
      <div className="min-h-screen bg-black text-white pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <span className="text-sm opacity-60 uppercase">[ CONTACT & SUPPORT ]</span>
          <h1 className="font-headline text-5xl font-bold mt-4 mb-8">Get in Touch</h1>
          <p className="font-body text-lg opacity-80 mb-12">Have questions? We&apos;re here to help.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="border border-white/20 p-8">
              <h2 className="font-bold text-lg mb-4">Email Support</h2>
              <p className="font-body text-sm opacity-70 mb-4">For inquiries and support:</p>
              <a href="mailto:support@trovia.ai" className="text-white hover:opacity-60 transition font-mono">
                support@trovia.ai
              </a>
            </div>

            <div className="border border-white/20 p-8">
              <h2 className="font-bold text-lg mb-4">Business Inquiries</h2>
              <p className="font-body text-sm opacity-70 mb-4">For partnerships and collaborations:</p>
              <a href="mailto:business@trovia.ai" className="text-white hover:opacity-60 transition font-mono">
                business@trovia.ai
              </a>
            </div>

            <div className="border border-white/20 p-8">
              <h2 className="font-bold text-lg mb-4">Discord Community</h2>
              <p className="font-body text-sm opacity-70 mb-4">Join our community for help and updates:</p>
              <a href="https://discord.gg/trovia" target="_blank" rel="noopener noreferrer" className="text-white hover:opacity-60 transition">
                discord.gg/trovia →
              </a>
            </div>

            <div className="border border-white/20 p-8">
              <h2 className="font-bold text-lg mb-4">Security Issues</h2>
              <p className="font-body text-sm opacity-70 mb-4">Report vulnerabilities responsibly:</p>
              <a href="mailto:security@trovia.ai" className="text-white hover:opacity-60 transition font-mono">
                security@trovia.ai
              </a>
            </div>
          </div>

          <div className="border border-white/20 p-8 mb-12">
            <h2 className="font-bold text-lg mb-6">Contact Form</h2>
            <form className="space-y-6">
              <div>
                <label className="block font-body text-sm font-bold mb-2">Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/20 text-white px-4 py-2 focus:border-white transition outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-black border border-white/20 text-white px-4 py-2 focus:border-white transition outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold mb-2">Subject</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/20 text-white px-4 py-2 focus:border-white transition outline-none"
                  placeholder="Message subject"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold mb-2">Message</label>
                <textarea 
                  className="w-full bg-black border border-white/20 text-white px-4 py-2 focus:border-white transition outline-none h-32"
                  placeholder="Your message..."
                />
              </div>
              <button 
                type="submit"
                className="bg-white text-black px-8 py-3 font-bold hover:opacity-80 transition"
              >
                [ SEND MESSAGE ]
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="font-body text-xs opacity-60 mb-2">RESPONSE TIME</p>
              <p className="font-headline text-2xl font-bold">24-48 Hours</p>
            </div>
            <div className="text-center">
              <p className="font-body text-xs opacity-60 mb-2">SUPPORT HOURS</p>
              <p className="font-headline text-2xl font-bold">24/7</p>
            </div>
            <div className="text-center">
              <p className="font-body text-xs opacity-60 mb-2">LANGUAGES</p>
              <p className="font-headline text-2xl font-bold">English</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex flex-wrap gap-4">
              <Link href="/faq" className="text-white hover:opacity-60 transition text-sm">[ FAQ ]</Link>
              <Link href="/privacy" className="text-white hover:opacity-60 transition text-sm">[ PRIVACY ]</Link>
              <Link href="/terms" className="text-white hover:opacity-60 transition text-sm">[ TERMS ]</Link>
              <Link href="/security" className="text-white hover:opacity-60 transition text-sm">[ SECURITY ]</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
