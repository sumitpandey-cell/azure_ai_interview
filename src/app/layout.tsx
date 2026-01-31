import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://arjuna.ai"),
  title: {
    default: "Arjuna AI | The World's Best AI Interviewer & Coach",
    template: "%s | Arjuna AI"
  },
  description: "Arjuna AI is your personal AI Interviewer. Practice with realistic AI mock interviews for coding, system design, and behavioral rounds. Get real-time scoring, personalized feedback, and master your technical skills to ace your dream job.",
  keywords: [
    "AI Interviewer",
    "Arjuna AI",
    "AI Mock Interview",
    "AI Interview Coach",
    "Practice Interviews",
    "Job Interview Preparation",
    "Coding Interview Prep",
    "System Design Interview Prep",
    "Behavioral Interview Practice",
    "Mock Interview",
    "Tech Interview Coach",
    "Career Growth",
    "Hiring Manager Simulation",
    "Interview Copilot",
    "Google Interview Prep",
    "Amazon Interview Prep"
  ],
  authors: [{ name: "Arjuna AI Team", url: "https://arjuna.ai" }],
  creator: "Arjuna AI",
  publisher: "Arjuna AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Arjuna AI | Ace Any Interview with AI-Powered Practice",
    description: "Master your next interview with real-time AI feedback and professional scoring. Built by hiring experts.",
    url: "https://arjuna.ai",
    siteName: "Arjuna AI",
    images: [
      {
        url: "/social-share.png",
        width: 1200,
        height: 630,
        alt: "Arjuna AI - Ace Your Interview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arjuna AI | Your Personal AI Interview Coach",
    description: "Stop guessing and start improving. Get real-time AI feedback on your interviews today.",
    images: ["/social-share.png"],
    creator: "@ArjunaAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "google-site-verification-id", // User should replace this
  },
  alternates: {
    canonical: "https://arjuna.ai",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arjuna AI",
  },
  icons: {
    icon: "/arjuna_logo.png",
    apple: "/arjuna_logo.png",
  },
};

export const viewport = {
  themeColor: "#020617",
};

import { GlobalBackground } from "@/components/GlobalBackground";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  const colorTheme = localStorage.getItem('color-theme');
                  const root = document.documentElement;
                  
                  root.classList.add(theme);
                  if (colorTheme && colorTheme !== 'purple') {
                    root.setAttribute('data-color-theme', colorTheme);
                  }

                  // Polyfill Promise.withResolvers for PDF.js compatibility
                  if (typeof Promise.withResolvers === 'undefined') {
                    Promise.withResolvers = function() {
                      let resolve, reject;
                      const promise = new Promise((res, rej) => {
                        resolve = res;
                        reject = rej;
                      });
                      return { promise, resolve, reject };
                    };
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <GlobalBackground />
          <InstallPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}
