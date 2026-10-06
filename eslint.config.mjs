import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Règles du compilateur React : du code existant les enfreint (état posé dans un
    // effet, Date.now() d'une page serveur dynamique). Warnings tant qu'il n'est pas repris.
    rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/purity": "warn" },
  },
  globalIgnores([".next*/**", "src/generated/**", "node_modules/**", "next-env.d.ts", "graphify-out/**"]),
]);
