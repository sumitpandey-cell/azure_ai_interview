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
      <body className={inter.className}>
        <Providers>
          <GlobalBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}
