import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["docs/prisma/**", "src/components/ui/**", "src/routeTree.gen.ts"],
  plugins: ["eslint", "import", "promise", "react", "typescript"],
  rules: {
    "react/exhaustive-deps": "allow",
    "react/immutability": "allow",
    "react/incompatible-library": "allow",
    "react/set-state-in-effect": "allow",
    "sort-keys": "allow",
  },
});
