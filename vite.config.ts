/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Basispfad für GitHub Pages (goerks.github.io/zahlenotter); lokal mit BASE=/ überschreibbar.
export default defineConfig({
  base: process.env.BASE ?? "/zahlenotter/",
  test: { include: ["tests/**/*.test.ts"] },
});
