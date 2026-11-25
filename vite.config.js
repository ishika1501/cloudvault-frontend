
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {

      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/users": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/oauth2": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/login": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/folders": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/recent": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});
