import { defineConfig } from 'vite'; // Import defineConfig
import react from '@vitejs/plugin-react'; // If using React plugin

export default defineConfig({
    plugins: [react()],
    base: '/',
    build: {
        outDir: 'dist', // Ensure the output directory is correct
        assetsDir: 'assets',
        emptyOutDir: true,
    },
});
