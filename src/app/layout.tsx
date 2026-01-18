import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arjuna AI - Ace Any Interview with AI",
  description: "Practice real interviews with AI scoring and feedback — built to train you like a real hiring manager.",
  keywords: ["interview", "AI", "practice", "job", "career", "preparation"],
  authors: [{ name: "Arjuna AI" }],
  openGraph: {
    title: "Arjuna AI - Ace Any Interview with AI",
    description: "Practice real interviews with AI scoring and feedback",
    type: "website",
    siteName: "Arjuna AI",
    url: "https://arjuna.ai",
    images: ['/arjuna-logo.png'],
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
