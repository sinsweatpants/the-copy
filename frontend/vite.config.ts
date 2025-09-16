// filepath: frontend/vite.config.ts
/// <reference types="vitest" />
import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);

const tiptapDeps = [
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-link",
  "@tiptap/extension-bold",
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-view",
].filter((dep) => {
  try {
    require.resolve(dep);
    return true;
  } catch {
    return false;
  }
});

const manualChunks: Record<string, string[]> = {
  react: ["react", "react-dom"],
  pdf: ["pdfjs-dist"],
  icons: ["lucide-react"],
};

if (tiptapDeps.length > 0) {
  manualChunks.tiptap = tiptapDeps;
}

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
        manualChunks,
      },
    },
    // رفع الحد بشكل كافي يمنع التحذير
    chunkSizeWarningLimit: 2000,
  },
});
