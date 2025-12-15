// Modern Dark Landing Page for AI Code Reviewer
// Sections: Hero, About, Features, Workflow, Pricing CTA, Testimonials, Footer
// Styling: Tailwind, dark theme, smooth animations

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
      {/* WORKFLOW SECTION */}
      <section className="relative py-32 px-6 bg-zinc-900/40 border-t border-zinc-800 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center">
            How It Works
          </h2>

          <div className="relative mt-24 grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Animated connector line */}
            <WorkflowLine />

            <WorkflowStep
              number={1}
              title="Connect Your Repo"
              desc="Integrate GitHub, GitLab, or Bitbucket in minutes."
              delay={0}
            />
            <WorkflowStep
              number={2}
              title="AI Analyzes Code"
              desc="Every commit is scanned using advanced AI models."
              delay={0.2}
            />
            <WorkflowStep
              number={3}
              title="Instant PR Feedback"
              desc="Get inline suggestions, fixes, and best practices."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative py-36 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute left-1/2 top-1/2 w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/20 blur-[140px]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Gradient border wrapper */}
          <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60">
            <div className="rounded-3xl bg-zinc-950 px-10 py-16 text-center shadow-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Ship better code.
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Automatically.
                </span>
              </h2>

              <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
                Let AI review every pull request, catch issues early, and
                enforce best practices — before your code hits production.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  href="/register"
                  className="px-10 py-4 rounded-lg bg-white text-black font-semibold shadow-lg hover:bg-zinc-200 transition"
                >
                  Get Started Free
                </motion.a>

                <Link
                  href="/pricing"
                  className="px-10 py-4 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition"
                >
                  View Pricing
                </Link>
              </div>

              {/* Trust hint */}
              <div className="mt-8 flex items-center justify-center gap-3 text-sm text-zinc-500">
                <CheckCircle className="h-4 w-4 text-green-400" />
                No credit card required · Free plan available
              </div>
            </div>
          </div>
        </motion.div>
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
  <CometCard className="">
    <div className="p-8 w-full bg-zinc-900 border border-zinc-800 rounded-xl text-center  transition">
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
  <CometCard>
    <div className="p-8 w-full bg-zinc-900/40 border border-zinc-800 rounded-xl hover:bg-zinc-900/60 hover:border-zinc-600 transition">
      <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400">{desc}</p>
      <div className="mt-4 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <span className="text-zinc-300">Included</span>
      </div>
    </div>
  </CometCard>
);

const WorkflowLine = () => (
  <div className="hidden md:block absolute top-[22%] left-[10%] right-[10%] h-px">
    {/* Static gradient line */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

    {/* Moving signal */}
    <motion.div
      initial={{ x: "50%" }}
      animate={{ x: "3500%" }}
      transition={{
        duration: 5,
        ease: "linear",
        repeat: Infinity,
      }}
      className="absolute top-1/2 -translate-y-1/2"
    >
      {/* Glow wrapper */}
      <div className="relative flex w-6 h-6 -translate-y-1/2 items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 w-6 h-6 bg-white/40 blur-md rounded-full" />
        {/* Core dot */}
        <div className="w-2.5 h-2.5 bg-white rounded-full" />
      </div>
    </motion.div>
  </div>
);

interface WorkflowStepProps {
  number: number;
  title: string;
  desc: string;
  delay?: number;
}

const WorkflowStep = ({
  number,
  title,
  desc,
  delay = 0,
}: WorkflowStepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="relative text-center"
  >
    {/* Glow */}
    <div className="absolute inset-0 -z-10">
      <div className="mx-auto w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />
    </div>

    {/* Step number */}
    <motion.div
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg"
    >
      {number}
    </motion.div>

    <h3 className="text-xl font-semibold text-white mt-6">{title}</h3>
    <p className="text-zinc-400 mt-3 max-w-sm mx-auto">{desc}</p>
  </motion.div>
);
