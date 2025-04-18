import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const sass = await import('sass'); // ✅ Use dynamic import in ESM

export default defineConfig({
    plugins: [react()],
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
