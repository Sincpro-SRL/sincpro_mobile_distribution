const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const reactPlugin = require("eslint-plugin-react");

module.exports = defineConfig([
  {
    ignores: ["android/**", "ios/**", ".expo/**", "dist/**", "node_modules/**"],
  },
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      react: reactPlugin,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "react/jsx-sort-props": ["warn", { ignoreCase: true }],
      "react-hooks/exhaustive-deps": "off",
      // Async init effects call setLoading synchronously before the first await — valid pattern.
      "react-hooks/set-state-in-effect": "warn",
      // Manual memoization that the compiler can't preserve is not a bug in existing code.
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);
