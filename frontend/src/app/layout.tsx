import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/header";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus Code - Intelligent Code Review Platform",
  description: "Nexus Code: AI-powered code review platform with team collaboration, business context awareness, and Web3 payment. Supports GitHub, GitLab, and Discord integration.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#18181b',
                color: '#fff',
                border: '1px solid #34d399',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 40px rgba(52, 211, 153, 0.2)',
              },
              success: {
                iconTheme: {
                  primary: '#34d399',
                  secondary: '#18181b',
                },
                style: {
                  background: '#18181b',
                  border: '1px solid #34d399',
                  boxShadow: '0 10px 40px rgba(52, 211, 153, 0.3)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#18181b',
                },
                style: {
                  background: '#18181b',
                  border: '1px solid #ef4444',
                  boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#34d399',
                  secondary: '#18181b',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
