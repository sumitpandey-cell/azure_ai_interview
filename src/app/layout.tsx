import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://arjuna.ai"),
  title: {
    default: "Arjuna AI | Ace Any Interview with AI-Powered Practice",
    template: "%s | Arjuna AI"
  },
  description: "Arjuna AI is the world's most advanced AI interview coach. Practice real-time interviews, get instant behavioral scoring, and master your technical skills with personalized feedback built to train you like a real hiring manager.",
  keywords: [
    "AI Interview Coach",
    "Practice Interviews",
    "Job Interview Preparation",
    "AI Scoring",
    "Mock Interview",
    "Behavioral Interview Practice",
    "Technical Interview Prep",
    "Arjuna AI",
    "Career Growth",
    "Hiring Manager Simulation"
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
        url: "/dashboard-preview.png",
        width: 1200,
        height: 630,
        alt: "Arjuna AI Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arjuna AI | Your Personal AI Interview Coach",
    description: "Stop guessing and start improving. Get real-time AI feedback on your interviews today.",
    images: ["/dashboard-preview.png"],
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
};

import { GlobalBackground } from "@/components/GlobalBackground";

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
          {children}
        </Providers>
      </body>
    </html>
  );
}
