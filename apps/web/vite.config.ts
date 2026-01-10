import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false, // Allow using next available port if 5173 is busy
    host: true, // Listen on all addresses (0.0.0.0)
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
    warmup: {
      clientFiles: [
        "./src/routes/index.tsx",
        "./src/routes/anime/top.tsx",
        "./src/routes/anime/catalog.tsx",
        "./src/components/app-sidebar.tsx",
      ],
    },
    watch: {
      usePolling: false,
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "lucide-react",
    ],
  },
})
