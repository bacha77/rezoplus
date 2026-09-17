"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Truck, ShieldAlert, Zap, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import { SignInButton, useAuth } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)] selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-white/5 glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="RezoPlus Logo" className="h-8 rounded-md shadow-lg shadow-blue-500/20" />
            <span className="text-xl font-bold text-white tracking-tight">RezoPlus</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</Link>
            {!isLoaded ? (
              <div className="w-16 h-8 bg-white/10 animate-pulse rounded-md" />
            ) : isSignedIn ? (
              <Link href="/dashboard" className="text-sm font-medium px-4 py-2 bg-[var(--primary)] hover:bg-indigo-500 text-white rounded-md transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                Dashboard
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-medium px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors cursor-pointer">
                  Login
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary)] opacity-20 blur-[120px] rounded-full pointer-events-none animate-float" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
              </span>
              FMCSA API Integration Live
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
              Eliminate Negligent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                Hiring Liability.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Automated, real-time FMCSA compliance monitoring for freight brokerages. We ping you on Slack the exact second a carrier in your network drops their insurance or authority.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isLoaded ? (
                <div className="w-full sm:w-auto px-8 py-4 bg-white/10 animate-pulse rounded-lg font-medium" />
              ) : isSignedIn ? (
                <Link 
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-[var(--primary)] hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto px-8 py-4 bg-[var(--primary)] hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 cursor-pointer">
                    Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
                  </button>
                </SignInButton>
              )}
              <Link 
                href="#demo"
                className="w-full sm:w-auto px-8 py-4 bg-[var(--card)] hover:bg-white/5 border border-white/10 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                Book Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Top Brokerages Trust Us</h2>
            <p className="text-gray-400">Stop wasting hours manually checking SAFER. Automate your risk management.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants} className="glass-panel p-8 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(79,70,229,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-10 -mt-10 transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6 text-indigo-400 group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Fraud Alerts</h3>
              <p className="text-gray-400 leading-relaxed">
                If a carrier gets their authority revoked, we intercept it instantly and alert your dispatch team via Slack or Email before they assign a load.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel p-8 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(79,70,229,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl -mr-10 -mt-10 transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-400 group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Historical Analytics</h3>
              <p className="text-gray-400 leading-relaxed">
                Track carrier safety scores over time. Spot negative trends and deteriorating safety cultures before the FMCSA officially intervenes.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel p-8 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(79,70,229,0.15)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl -mr-10 -mt-10 transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-blue-400 group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Enterprise B2B API</h3>
              <p className="text-gray-400 leading-relaxed">
                Integrate directly into your TMS (McLeod, MercuryGate, etc.). Instantly block dispatchers from assigning loads to unauthorized carriers.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">Protect your brokerage for a fraction of the cost of a lawsuit.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col">
              <h3 className="text-xl font-semibold text-white mb-2">Basic</h3>
              <p className="text-gray-400 text-sm mb-6">Perfect for small brokerages.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$99</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Monitor up to 500 Carriers
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Daily Status Updates
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Email Alerts
                </li>
              </ul>
              <Link href="/dashboard" className="w-full block text-center px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors">
                Get Started
              </Link>
            </div>

            {/* Pro (Highlighted) */}
            <div className="bg-gradient-to-br from-indigo-600/20 via-[var(--card)] to-purple-600/20 border border-[var(--primary)]/50 rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(79,70,229,0.2)] animate-sweep overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
              <p className="text-gray-300 text-sm mb-6">For rapidly growing 3PLs.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$299</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Monitor up to 2,500 Carriers
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Hourly Status Updates
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Slack & SMS Alerts
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> CSV Bulk Upload
                </li>
              </ul>
              <Link href="/dashboard" className="w-full block text-center px-4 py-3 bg-[var(--primary)] hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:scale-[1.02]">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <p className="text-gray-400 text-sm mb-6">Direct TMS Integrations.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$899+</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Unlimited Carriers
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Minute-by-Minute Updates
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> B2B API Access
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" /> Dedicated Success Manager
                </li>
              </ul>
              <Link href="#contact" className="w-full block text-center px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-400">RezoPlus</span>
          </div>
          <p className="text-sm text-gray-600">© 2026 RezoPlus Monitor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
