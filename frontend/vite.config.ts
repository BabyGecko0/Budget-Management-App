import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: proxies /api to the Spring Boot backend on :8085.
// Build: outputs straight into the backend's static resources so
// `mvn package` produces a single jar that serves the UI.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8600",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../backend/src/main/resources/static",
    emptyOutDir: true,
  },
});
