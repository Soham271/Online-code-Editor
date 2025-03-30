import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ["file", "system"], // Mark these as external
    },
  },
  optimizeDeps: {
    include: [
      "core-js-pure/stable/object/define-properties.js",
      "@babel/runtime/helpers/classCallCheck",
    ],
    exclude: ["jshints"],
  },
  resolve: {
    alias: {
      events: "events",
    },
  },
  server: {
    hmr: {
      overlay: false, 
    },
  },
});
