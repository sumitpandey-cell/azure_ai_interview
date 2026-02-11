import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-data';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://arjuna.ai';

    // These are the public-facing pages that should be indexed by search engines
    const staticRoutes = [
        '',
        '/about',
        '/pricing',
        '/blog',
        '/contact',
        '/faq',
        '/leaderboard',
        '/templates',
        '/terms',
        '/privacy',
        '/badges',
        '/roadmap',
        '/sample-report',
        '/start-interview',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : (route === '/start-interview' ? 0.9 : 0.8),
    }));

    // Dynamic blog posts from blog-data.ts
    const blogRoutes = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date).toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    return [...staticRoutes, ...blogRoutes];
}
