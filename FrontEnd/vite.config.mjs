import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import ViteEnvCompatible from 'vite-plugin-env-compatible';

const sass = await import('sass'); // ✅ Use dynamic import in ESM

export default defineConfig({
    plugins: [
        react(),
        ViteEnvCompatible(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'PIXR',
                short_name: 'PIXR',
                start_url: '/',
                display: 'standalone',
                background_color: 'var(--background-primary)',
                theme_color: 'var(--background-primary)',
                icons: [
                    {
                        src: '/icon_400.png',
                        sizes: '400x400',
                        type: 'image/png'
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
