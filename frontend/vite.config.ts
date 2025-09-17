// filepath: frontend/vite.config.ts
/// <reference types="vitest" />
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  define: {
    __PDF_WORKER__: JSON.stringify("pdfjs-dist/build/pdf.worker.min.js"),
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          tiptap: [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-link",
            "@tiptap/extension-bold",
            "prosemirror-model",
            "prosemirror-state",
            "prosemirror-view",
          ],
          pdf: ["pdfjs-dist"],
          icons: ["lucide-react"],
        },
      },
    },
    // رفع الحد بشكل كافي يمنع التحذير
    chunkSizeWarningLimit: 2000,
  },
});
