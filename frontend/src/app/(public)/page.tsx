"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Sparkles, ShieldCheck, GitBranch } from "lucide-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 overflow-hidden">
      {/* HERO */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 text-center">
        <BackgroundBeams />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="
            text-3xl
            sm:text-4xl
            md:text-5xl
            lg:text-6xl
            font-bold
            bg-gradient-to-b from-white to-zinc-400
            bg-clip-text text-transparent
          "
        >
          <EncryptedText text="AI Code Reviewer for Modern Development" />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="
            mt-6
            text-base
            sm:text-lg
            md:text-xl
            text-zinc-400
            max-w-2xl
            mx-auto
          "
        >
          Automatically review your pull requests, detect issues, enforce best
          practices, and improve code quality — powered by next-generation AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link
            href="/register"
            className="px-8 py-3 rounded-md bg-white text-black font-semibold hover:bg-zinc-200 transition shadow-lg"
          >
            Get Started Free
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3 rounded-md border border-zinc-700 hover:border-zinc-500 hover:text-white transition"
          >
            View Pricing
          </Link>
        </motion.div>
      </section>

      {/* VIDEO INTRO */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 w-[500px] md:w-[700px] h-[500px] md:h-[700px] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/15 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-2xl sm:text-3xl md:text-5xl font-bold text-white"
          >
            See AI Code Review <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              in Action
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto"
          >
            Watch how AI automatically reviews your pull requests and suggests
            improvements in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-10 md:mt-16 max-w-5xl mx-auto"
          >
            <div className="p-[1.5px] rounded-2xl bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60">
              <div className="rounded-2xl bg-black overflow-hidden aspect-video shadow-2xl">
                <video
                  src="intro.mp4"
                  autoPlay
                  loop
                  muted
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="absolute -inset-4 md:-inset-6 bg-indigo-500/20 blur-2xl md:blur-3xl rounded-3xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            What is AI Code Reviewer?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
            Our AI-powered reviewer analyzes your code with precision —
            detecting bugs, refactoring opportunities, and security risks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mt-12 md:mt-16 max-w-6xl mx-auto">
          <AboutCard
            icon={<Sparkles className="h-8 w-8 text-indigo-400" />}
            title="AI-Powered Insights"
            desc="Identify issues in real-time with advanced code understanding."
          />
          <AboutCard
            icon={<ShieldCheck className="h-8 w-8 text-green-400" />}
            title="Security First"
            desc="Detect vulnerabilities before merging."
          />
          <AboutCard
            icon={<GitBranch className="h-8 w-8 text-blue-400" />}
            title="Seamless Git Integration"
            desc="Works with GitHub, GitLab, Bitbucket."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center">
            Core Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-12 md:mt-16">
            <FeatureItem
              title="Deep Code Understanding"
              desc="Understands logic and architecture."
            />
            <FeatureItem
              title="Automated PR Reviews"
              desc="AI comments directly in pull requests."
            />
            <FeatureItem
              title="Performance & Security"
              desc="Avoid bottlenecks and vulnerabilities."
            />
            <FeatureItem
              title="Multi-Language Support"
              desc="JS, TS, Python, Go, Rust, Java."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-36 px-4 sm:px-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-3xl p-[1.5px] bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60">
            <div className="rounded-3xl bg-zinc-950 px-6 sm:px-10 py-12 sm:py-16 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Ship better code.
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Automatically.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
                Let AI review every pull request — before production.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-10 py-4 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/pricing"
                  className="px-10 py-4 border border-zinc-700 rounded-lg hover:border-zinc-500 transition"
                >
                  View Pricing
                </Link>
              </div>

              <div className="mt-6 flex justify-center items-center gap-2 text-sm text-zinc-500">
                <CheckCircle className="h-4 w-4 text-green-400" />
                No credit card required
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="py-10 border-t border-zinc-800 text-center text-zinc-500">
        © {new Date().getFullYear()} AI Code Reviewer
      </footer>
    </div>
  );
}

/* COMPONENTS */

const AboutCard = ({ icon, title, desc }: any) => (
  <CometCard>
    <div className="p-6 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-zinc-400 text-sm sm:text-base">{desc}</p>
    </div>
  </CometCard>
);

const FeatureItem = ({ title, desc }: any) => (
  <CometCard>
    <div className="p-6 sm:p-8 bg-zinc-900/40 border border-zinc-800 rounded-xl">
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400">{desc}</p>
    </div>
  </CometCard>
);
