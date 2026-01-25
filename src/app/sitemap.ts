import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://arjuna.ai';

    // These are the public-facing pages that should be indexed by search engines
    const routes = [
        '',
        '/about',
        '/pricing',
        '/blog',
        '/contact',
        '/faq',
        '/terms',
        '/privacy',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    return routes;
}
