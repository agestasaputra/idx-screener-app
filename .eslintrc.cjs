// Append a name here whenever a new top-level folder is added under features/.
const FEATURE_NAMES = ["screener"];

const featureBoundaryOverrides = FEATURE_NAMES.map((feature) => ({
  files: [`features/${feature}/**/*.ts`, `features/${feature}/**/*.vue`],
  rules: {
    "no-restricted-imports": [
      "warn",
      {
        patterns: FEATURE_NAMES.filter((f) => f !== feature).map((other) => ({
          group: [`~/features/${other}`, `~/features/${other}/**`],
          message: `Cross-feature import: '${feature}' must not import from 'features/${other}'. Use common/ instead.`,
        })),
      },
    ],
  },
}));

module.exports = {
  root: true,
  ignorePatterns: [],
  env: {
    browser: true,
    node: true,
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
  },
  extends: ["@nuxtjs/eslint-config-typescript", "plugin:prettier/recommended"],
  plugins: ["vitest"],
  rules: {
    complexity: ["error", 10],
    "max-depth": ["error", 3],
    "max-lines-per-function": ["error", { max: 50 }],
    "max-params": ["error", 3],
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "max-classes-per-file": ["error", 1], // Single Responsibility Principle
    "no-param-reassign": "error", // Immutability
    "max-lines": [
      "error",
      {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
    "vue/attribute-hyphenation": "off",
  },
  overrides: featureBoundaryOverrides,
};
