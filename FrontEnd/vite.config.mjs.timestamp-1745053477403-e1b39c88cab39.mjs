// vite.config.mjs
import { defineConfig } from "file:///D:/WorkShop/2.%20WebDev/3.%20Project/PIXR/FrontEnd/node_modules/vite/dist/node/index.js";
import react from "file:///D:/WorkShop/2.%20WebDev/3.%20Project/PIXR/FrontEnd/node_modules/@vitejs/plugin-react/dist/index.mjs";
var sass = await import("file:///D:/WorkShop/2.%20WebDev/3.%20Project/PIXR/FrontEnd/node_modules/sass/sass.node.mjs");
var vite_config_default = defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        implementation: sass.default
        // ✅ Use `.default`
      }
    }
  },
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcV29ya1Nob3BcXFxcMi4gV2ViRGV2XFxcXDMuIFByb2plY3RcXFxcUElYUlxcXFxGcm9udEVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcV29ya1Nob3BcXFxcMi4gV2ViRGV2XFxcXDMuIFByb2plY3RcXFxcUElYUlxcXFxGcm9udEVuZFxcXFx2aXRlLmNvbmZpZy5tanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1dvcmtTaG9wLzIuJTIwV2ViRGV2LzMuJTIwUHJvamVjdC9QSVhSL0Zyb250RW5kL3ZpdGUuY29uZmlnLm1qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5cclxuY29uc3Qgc2FzcyA9IGF3YWl0IGltcG9ydCgnc2FzcycpOyAvLyBcdTI3MDUgVXNlIGR5bmFtaWMgaW1wb3J0IGluIEVTTVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcclxuICAgIGNzczoge1xyXG4gICAgICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgICAgICAgc2Nzczoge1xyXG4gICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb246IHNhc3MuZGVmYXVsdCwgLy8gXHUyNzA1IFVzZSBgLmRlZmF1bHRgXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBiYXNlOiAnLycsXHJcbiAgICBidWlsZDoge1xyXG4gICAgICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXHJcbiAgICAgICAgZW1wdHlPdXREaXI6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgICAgcHJveHk6IHtcclxuICAgICAgICAgICAgJy9hcGknOiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VSxTQUFTLG9CQUFvQjtBQUMzVyxPQUFPLFdBQVc7QUFFbEIsSUFBTSxPQUFPLE1BQU0sT0FBTyw0RkFBTTtBQUVoQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsS0FBSztBQUFBLElBQ0QscUJBQXFCO0FBQUEsTUFDakIsTUFBTTtBQUFBLFFBQ0YsZ0JBQWdCLEtBQUs7QUFBQTtBQUFBLE1BQ3pCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLGFBQWE7QUFBQSxFQUNqQjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0osT0FBTztBQUFBLE1BQ0gsUUFBUTtBQUFBLElBQ1o7QUFBQSxFQUNKO0FBRUosQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
