import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: ["docs/prisma/**", "migrations/**", "src/components/ui/**", "src/routeTree.gen.ts"],
  printWidth: 120,
  sortImports: true,
  sortTailwindcss: true,
});
