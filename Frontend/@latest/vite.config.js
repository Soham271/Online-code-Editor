import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "core-js-pure/stable/object/define-properties.js",
      "@babel/runtime/helpers/classCallCheck",
    ],
  },
});
