import { env } from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites under /<repository>/.
// Keep "/" for local development and use "/new/" in GitHub Actions.
export default defineConfig({
  base: env.GITHUB_ACTIONS === "true" ? "/new/" : "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0"
  }
});
