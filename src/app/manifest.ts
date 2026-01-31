import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ArjunaAi Interview',
        short_name: 'ArjunaAi',
        description: 'AI-Powered Interview Platform',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        icons: [
            {
                src: '/arjuna_logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/arjuna_logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
