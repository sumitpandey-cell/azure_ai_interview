import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCompanyLogo(slug: string, logoUrl: string | null): string {
  const localLogos: Record<string, string> = {
    'google': '/company_logos/google.png',
    'stripe': '/company_logos/stripe.png',
    'netflix': '/company_logos/netflix.png',
    'apple': '/company_logos/apple.jpeg',
    'meta': '/company_logos/meta.png',
    'amazon': '/company_logos/amazon.png',
    'microsoft': '/company_logos/microsoft.png',
    'tesla': '/company_logos/tesla.png',
  };

  return localLogos[slug] || logoUrl || '';
}
