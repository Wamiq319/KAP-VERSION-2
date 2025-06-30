// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  server: {
    host: "0.0.0.0", // Exposes dev server to external access (e.g., tunnels)
    port: 5173, // Optional: fixed port
    strictPort: true, // Prevents Vite from switching to another port
    allowedHosts: "all", // ✅ Allow all hosts, including Cloudflare Tunnel domains
  },
});
