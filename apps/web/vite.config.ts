import { env } from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites under /<repository>/.
// Keep "/" for local development and use "/new/" in GitHub Actions.
export default defineConfig({
  base: env.GITHUB_ACTIONS === "true" ? "/new/" : "/",
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "zustand"]
  },
  server: {
    host: "0.0.0.0",
    fs: {
      allow: [fileURLToPath(new URL("../../", import.meta.url))]
    }
  }
});
