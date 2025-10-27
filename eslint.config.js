const js = require("@eslint/js");
const tslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  ...(tslint.configs?.recommendedTypeChecked || []),
  {
    files: ["**.*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "tsconfig.eslint.json",
        sourceType: "module",
        tsconfigRootDir: __dirname,
      },
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {},
  },
  {
    files: ["eslint.config.js", "jest.config.js", "simulate.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {},
  },
  {
    ignores: ["node_modules/**", "dist/**"],
  },
];
