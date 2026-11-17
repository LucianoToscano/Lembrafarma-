import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const staticDirectories = [
  "assets",
  "css",
];

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, ""),
      },
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    {
      name: "copy-static-assets",
      apply: "build",
      closeBundle() {
        const outputDirectory = resolve(process.cwd(), "dist");
        for (const directory of staticDirectories) {
          cpSync(
            resolve(process.cwd(), directory),
            resolve(outputDirectory, directory),
            { recursive: true },
          );
        }
      },
    },
  ],
});
