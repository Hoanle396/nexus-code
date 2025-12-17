"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Sparkles, ShieldCheck, GitBranch, Github, GitlabIcon as Gitlab, MessageSquare, Slack, Trello, Boxes } from "lucide-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import Footer from "@/components/layout/footer";
import { SparklesCore } from "@/components/ui/sparkles";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 overflow-hidden">
      {/* HERO */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 text-center">
        <BackgroundBeams />

        {/* Emerald glow effect */}
        {/* <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 blur-[150px]" />
        </div> */}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="
            relative z-10
            text-3xl
            sm:text-4xl
            md:text-5xl
            lg:text-7xl
            font-bold
            bg-gradient-to-b from-emerald-300 via-emerald-50 to-emerald-400
            bg-clip-text text-transparent
          "
        >
          <EncryptedText text="Nexus Code for Modern Development" />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="
            relative z-10
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
          className="relative z-10 mt-10 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link
            href="/register"
            className="group px-8 py-4 rounded-xl bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/60 hover:shadow-2xl hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              Get Started Free
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 rounded-xl border-2 border-emerald-400/40 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 hover:bg-emerald-500/10"
          >
            View Pricing
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-10 mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-zinc-500"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            14-day free trial
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Cancel anytime
          </div>
        </motion.div>
      </section>

      {/* VIDEO INTRO */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 w-[500px] md:w-[700px] h-[500px] md:h-[700px] -translate-x-1/2 -translate-y-1/2 bg-emerald-500/15 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-2xl sm:text-3xl md:text-5xl font-bold text-white relative"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              See AI Code Review in Action
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto"
          >
            Watch how AI automatically reviews your pull requests and suggests
            improvements in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="relative mt-10 md:mt-16 max-w-5xl mx-auto"
          >
            <div className="p-[2px] rounded-2xl bg-gradient-to-r from-emerald-400/60 via-emerald-500/70 to-emerald-400/60 animate-glow">
              <div className="rounded-2xl bg-black overflow-hidden aspect-video shadow-2xl">
                <video
                  src="intro.mp4"
                  autoPlay
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="absolute -inset-4 md:-inset-6 bg-emerald-400/20 blur-2xl md:blur-3xl rounded-3xl -z-10 animate-pulse" />
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">

              What is AI Code Reviewer?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto"
          >
            Our AI-powered reviewer analyzes your code with precision —
            detecting bugs, refactoring opportunities, and security risks.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mt-12 md:mt-16 max-w-6xl mx-auto">
          <AboutCard
            icon={<Sparkles className="h-8 w-8 text-emerald-400" />}
            title="AI-Powered Insights"
            desc="Identify issues in real-time with advanced code understanding."
          />
          <AboutCard
            icon={<ShieldCheck className="h-8 w-8 text-emerald-400" />}
            title="Security First"
            desc="Detect vulnerabilities before merging."
          />
          <AboutCard
            icon={<GitBranch className="h-8 w-8 text-emerald-400" />}
            title="Seamless Git Integration"
            desc="Works with GitHub, GitLab, Bitbucket."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent text-center"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              Core Features
            </span>
          </motion.h2>

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

      {/* WORKFLOW */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-black to-zinc-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-1/4 w-[400px] h-[400px] bg-emerald-400/10 blur-[120px] animate-pulse" />
          <div className="absolute right-1/4 bottom-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent text-center mb-4"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              How It Works
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-center text-zinc-400 max-w-2xl mx-auto mb-16"
          >
            Get started in minutes with our simple three-step process
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <WorkflowStep
              step="01"
              title="Connect Repository"
              desc="Link your GitHub, GitLab, or Bitbucket repository with one click."
              icon="🔗"
              index={0}
            />
            <WorkflowStep
              step="02"
              title="Configure Settings"
              desc="Customize review rules, severity levels, and team preferences."
              icon="⚙️"
              index={1}
            />
            <WorkflowStep
              step="03"
              title="Start Reviewing"
              desc="AI automatically reviews every pull request and provides feedback."
              icon="✨"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatsCard number="1M+" label="Code Reviews" />
            <StatsCard number="50K+" label="Developers" />
            <StatsCard number="10K+" label="Organizations" />
            <StatsCard number="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent mb-4"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              Integrates with Your Stack
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-zinc-400 max-w-2xl mx-auto mb-16"
          >
            Works seamlessly with the tools you already use
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
            <IntegrationLogo name="GitHub" icon={Github} index={0} />
            <IntegrationLogo name="GitLab" icon={Gitlab} index={1} />
            <IntegrationLogo name="Bitbucket" icon={Boxes} index={2} />
            <IntegrationLogo name="Slack" icon={Slack} index={3} />
            <IntegrationLogo name="Discord" icon={MessageSquare} index={4} />
            <IntegrationLogo name="Jira" icon={Trello} index={5} />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent text-center mb-16"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              Loved by Developers
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <TestimonialCard
              quote="This tool saved us hours of manual code review. The AI catches things we often miss!"
              author="Sarah Chen"
              role="Tech Lead @ TechCorp"
              avatar="👩‍💻"
              index={0}
            />
            <TestimonialCard
              quote="Best investment for our development team. Code quality improved significantly."
              author="Mike Johnson"
              role="CTO @ StartupXYZ"
              avatar="👨‍💼"
              index={1}
            />
            <TestimonialCard
              quote="The security vulnerability detection alone is worth it. Highly recommended!"
              author="Alex Kumar"
              role="DevOps Engineer @ CloudSys"
              avatar="👨‍💻"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent text-center mb-16"
          >
            <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </motion.h2>

          <div className="space-y-4">
            <FAQItem
              question="How does AI Code Reviewer work?"
              answer="Our AI analyzes your pull requests using advanced machine learning models trained on millions of code samples. It checks for bugs, security vulnerabilities, performance issues, and best practices."
            />
            <FAQItem
              question="Which programming languages are supported?"
              answer="We support JavaScript, TypeScript, Python, Go, Rust, Java, C++, PHP, Ruby, and more. New languages are added regularly based on user feedback."
            />
            <FAQItem
              question="Is my code secure?"
              answer="Yes! Your code never leaves your infrastructure. We use secure, encrypted connections and comply with SOC 2 and GDPR standards. You maintain full control over your data."
            />
            <FAQItem
              question="Can I customize review rules?"
              answer="Absolutely! You can configure severity levels, enable/disable specific checks, and create custom rules tailored to your team's coding standards."
            />
            <FAQItem
              question="What's included in the free plan?"
              answer="The free plan includes 100 reviews per month, support for public repositories, and basic AI-powered code analysis. Perfect for individual developers and small projects."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-36 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-emerald-400/15 blur-[150px] animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="rounded-3xl p-[2px] bg-gradient-to-r from-emerald-400/70 via-emerald-500/80 to-emerald-400/70 animate-glow">
            <div className="rounded-3xl bg-zinc-950 px-6 sm:px-10 py-12 sm:py-16 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Ship better code.
                <br />
                <span className="bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">
                  Automatically.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
                Let AI review every pull request — before production.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-10 py-4 bg-emerald-400 text-black rounded-xl font-semibold hover:bg-emerald-300 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/60 hover:scale-105"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/pricing"
                  className="px-10 py-4 border-2 border-emerald-400/40 rounded-xl hover:border-emerald-400 hover:text-emerald-300 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 hover:bg-emerald-500/10"
                >
                  View Pricing
                </Link>
              </div>

              <div className="mt-6 flex justify-center items-center gap-2 text-sm text-zinc-500">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                No credit card required
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

/* COMPONENTS */

const AboutCard = ({ icon, title, desc }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="h-full"
  >
    <CometCard className="h-full">
      <div className="p-6 h-full sm:p-8 bg-zinc-900/60 border border-emerald-400/20 rounded-xl text-center hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group hover:-translate-y-1">
        <div className="flex justify-center mb-4 p-3 rounded-full bg-emerald-400/10 w-fit mx-auto group-hover:bg-emerald-400/20 transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-zinc-400 text-sm sm:text-base">{desc}</p>
      </div>
    </CometCard>
  </motion.div>
);

const FeatureItem = ({ title, desc }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="h-full"
  >
    <CometCard className="h-full">
      <div className="p-6 h-full sm:p-8 bg-zinc-900/50 border border-emerald-400/15 rounded-xl hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group hover:-translate-y-1">
        <div className="w-12 h-12 rounded-lg bg-emerald-400/15 flex items-center justify-center mb-4 group-hover:bg-emerald-400/25 transition-all duration-300">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-zinc-400">{desc}</p>
      </div>
    </CometCard>
  </motion.div>
);

const WorkflowStep = ({ step, title, desc, icon, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true }}
    transition={{
      duration: 0.6,
      delay: index * 0.2,
      ease: "easeOut"
    }}
    className="relative"
  >
    <div className="bg-zinc-900/60 border border-emerald-400/20 rounded-xl p-6 sm:p-8 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <div className="text-emerald-400 font-mono text-sm mb-2">STEP {step}</div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-zinc-400">{desc}</p>
    </div>
  </motion.div>
);

const StatsCard = ({ number, label }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.85 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true }}
    transition={{
      duration: 0.6,
      ease: "easeOut"
    }}
    whileHover={{
      scale: 1.05,
      transition: { duration: 0.3 }
    }}
    className="text-center"
  >
    <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent mb-2">
      {number}
    </div>
    <div className="text-zinc-400 text-sm sm:text-base">{label}</div>
  </motion.div>
);

const IntegrationLogo = ({ name, icon: Icon, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.8 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true }}
    transition={{
      duration: 0.6,
      delay: index * 0.12,
      ease: "easeOut"
    }}
    whileHover={{
      y: -12,
      scale: 1.08,
      transition: { duration: 0.3, ease: "easeOut" }
    }}
    className="group"
  >
    <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-500/5 via-zinc-900/70 to-zinc-900/90 border-2 border-emerald-400/25 rounded-2xl hover:border-emerald-400/70 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/30">
      {/* Animated gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-emerald-500/0 group-hover:from-emerald-400/15 group-hover:to-emerald-500/10 transition-all duration-500" />

      {/* Decorative corner glow */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Radial glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-400/0 via-emerald-400/0 to-transparent group-hover:from-emerald-400/10 group-hover:via-emerald-400/5 transition-all duration-500" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          <Icon className="w-10 h-10 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" strokeWidth={1.5} />
        </div>
        <div className="text-white font-bold text-sm tracking-wide group-hover:text-emerald-50 transition-colors duration-300">{name}</div>
      </div>

      {/* Bottom accent line with animation */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  </motion.div>
);

const TestimonialCard = ({ quote, author, role, avatar, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true }}
    transition={{
      duration: 0.6,
      delay: index * 0.2,
      ease: "easeOut"
    }}
    whileHover={{
      scale: 1.03,
      y: -5,
      transition: { duration: 0.3 }
    }}
    className="h-full"
  >
    <div className="h-full p-8 bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 border-2 border-emerald-400/30 rounded-2xl hover:border-emerald-400/60 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 relative overflow-hidden">
      {/* Decorative corner gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-full" />

      <div className="relative">
        <div className="text-emerald-400 text-5xl mb-4 leading-none">"</div>
        <p className="text-zinc-200 text-base leading-relaxed mb-8">{quote}</p>

        <div className="flex items-center gap-4 pt-4 border-t border-emerald-400/20">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 flex items-center justify-center text-2xl ring-2 ring-emerald-400/30">
            {avatar}
          </div>
          <div>
            <div className="text-white font-bold text-base">{author}</div>
            <div className="text-emerald-400/80 text-sm font-medium">{role}</div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const FAQItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border border-emerald-400/20 rounded-xl overflow-hidden hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex justify-between items-center bg-zinc-900/50 hover:bg-zinc-900/70 transition-all duration-300 text-left group"
      >
        <span className="text-white font-semibold pr-4 group-hover:text-emerald-100 transition-colors">{question}</span>
        <svg
          className={`w-5 h-5 text-emerald-400 flex-shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.4, ease: "easeInOut" },
                opacity: { duration: 0.3, delay: 0.1 }
              }
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }
            }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 bg-zinc-900/30">
              <p className="text-zinc-300 leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
