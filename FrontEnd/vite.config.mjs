import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const sass = await import('sass'); // ✅ Use dynamic import in ESM

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            manifest: {
                name: 'PIXR',
                short_name: 'PIXR',
                description: 'PIXR Web Application',
                start_url: '/',
                display: 'standalone',
                background_color: '#121622',
                theme_color: '#0094f6',
                icons: [
                    {
                        src: '/icon_400.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icon_400.png',
                        sizes: '400x400',
                        type: 'image/png'
                    },
                    {
                        src: '/icon_1600.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icon_1600.png',
                        sizes: '1600x1600',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    css: {
        preprocessorOptions: {
            scss: {
                implementation: sass.default, // ✅ Use `.default`
            },
        },
    },
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    },
    server: {
        proxy: {
            '/api': 'http://localhost:5000',
        },
    }
});
