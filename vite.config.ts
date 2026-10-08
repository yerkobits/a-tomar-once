import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    // Ignorar archivos de compilación de Rust y dependencias para evitar recargas fantasma
    watch: {
      ignored: [
        "**/contracts/**",
        "**/target/**",
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**"
      ],
    },
    // Estabilizar el WebSocket de HMR para conexiones remotas por IP
    hmr: {
      clientPort: 3000,
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
});
