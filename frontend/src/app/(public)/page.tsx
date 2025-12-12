// Modern Dark Landing Page for AI Code Reviewer
// Sections: Hero, About, Features, Workflow, Pricing CTA, Testimonials, Footer
// Styling: Tailwind, dark theme, smooth animations

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle,
  Sparkles,
  Zap,
  Code2,
  ShieldCheck,
  GitBranch,
} from "lucide-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import { GlareCard } from "@/components/ui/glare-card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative py-32 px-6 text-center">
        <BackgroundBeams />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent"
        >
          <EncryptedText text="AI Code Reviewer for Modern Development" />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto"
        >
          Automatically review your pull requests, detect issues, enforce best
          practices, and improve code quality — powered by next-generation AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-10 flex justify-center gap-4"
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

      {/* ABOUT SECTION */}
      <section className="py-28 px-6 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white">
            What is AI Code Reviewer?
          </h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Our AI-powered reviewer analyzes your code with precision —
            detecting bugs, refactoring opportunities, security risks, and
            architectural inconsistencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16 max-w-6xl mx-auto">
          <AboutCard
            icon={<Sparkles className="h-8 w-8 text-indigo-400" />}
            title="AI-Powered Insights"
            desc="Identify issues in real-time with advanced code understanding."
          />
          <AboutCard
            icon={<ShieldCheck className="h-8 w-8 text-green-400" />}
            title="Security First"
            desc="Detect vulnerabilities and unsafe patterns before merging."
          />
          <AboutCard
            icon={<GitBranch className="h-8 w-8 text-blue-400" />}
            title="Seamless Git Integration"
            desc="Works with GitHub, GitLab, Bitbucket, and more."
          />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center">
            Core Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-16">
            <FeatureItem
              title="Deep Code Understanding"
              desc="Understands logic, context, and architecture — just like a senior engineer."
            />
            <FeatureItem
              title="Automated PR Reviews"
              desc="AI leaves comments directly inside your pull requests."
            />
            <FeatureItem
              title="Performance & Security Checks"
              desc="Optimize performance and avoid security vulnerabilities."
            />
            <FeatureItem
              title="Multi-Language Support"
              desc="Supports JavaScript, TypeScript, Python, Go, Rust, Java, and more."
            />
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section className="py-28 px-6 bg-zinc-900/40 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 max-w-6xl mx-auto">
          <WorkflowStep
            number={1}
            title="Connect Your Repo"
            desc="Integrate GitHub, GitLab, or Bitbucket."
          />
          <WorkflowStep
            number={2}
            title="AI Analyzes Code"
            desc="Every commit is scanned for issues and improvements."
          />
          <WorkflowStep
            number={3}
            title="Instant Review Feedback"
            desc="AI suggests fixes and improvements directly in your PR."
          />
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-28 text-center px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-16 shadow-xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to level up your code quality?
          </h2>
          <p className="text-lg text-zinc-300 mb-8">
            Start using AI Code Reviewer today — no credit card required.
          </p>
          <Link
            href="/register"
            className="px-10 py-4 bg-white text-black font-semibold rounded-md hover:bg-zinc-200 transition"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-zinc-800 text-center text-zinc-500">
        <p>
          © {new Date().getFullYear()} AI Code Reviewer. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

/* COMPONENTS */
interface AboutCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}
const AboutCard = ({ icon, title, desc }: AboutCardProps) => (
  <CometCard>
    <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center  transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-zinc-400">{desc}</p>
    </div>
  </CometCard>
);

interface FeatureItemProps {
  title: string;
  desc: string;
}
const FeatureItem = ({ title, desc }: FeatureItemProps) => (
  <GlareCard className="p-8 w-full bg-zinc-900/40 border border-zinc-800 rounded-xl hover:bg-zinc-900/60 hover:border-zinc-600 transition">
    <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-zinc-400">{desc}</p>
    <div className="mt-4 flex items-center gap-2">
      <CheckCircle className="h-5 w-5 text-green-400" />
      <span className="text-zinc-300">Included</span>
    </div>
  </GlareCard>
);

interface WorkflowStepProps {
  number: number;
  title: string;
  desc: string;
}

const WorkflowStep = ({ number, title, desc }: WorkflowStepProps) => (
  <div className="text-center">
    <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-white">
      {number}
    </div>
    <h3 className="text-xl font-semibold text-white mt-4">{title}</h3>
    <p className="text-zinc-400 mt-2 max-w-sm mx-auto">{desc}</p>
  </div>
);
