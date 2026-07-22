import eslintPluginNestTyped from "@darraghor/eslint-plugin-nestjs-typed";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import eslintPluginEslintComments from "eslint-plugin-eslint-comments";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginN from "eslint-plugin-n";
import eslintPluginPerfectionist from "eslint-plugin-perfectionist";
import eslintPluginSecurity from "eslint-plugin-security";
import eslintPluginSonarjs from "eslint-plugin-sonarjs";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/* ======================================================
 * Ignore patterns
 * ====================================================== */
const ignores = {
    ignores: [
        "**/dist/**",
        "**/node_modules/**",
        "**/coverage/**",
        "**/public/**",
        "**/scripts/**",
        "**/src/generated/**",
        "eslint.config.mjs",
    ],
};

/* ======================================================
 * Base JS + TS
 * ====================================================== */
const base = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
];

/* ======================================================
 * TypeScript (type-aware)
 * ====================================================== */
const typescript = {
    files: ["src/**/*.ts"],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            ecmaVersion: "latest",
            project: ["./tsconfig.json"],
            sourceType: "module",
        },
        globals: {
            ...globals.node,
            ...globals.es2021,
        },
    },
    plugins: {
        "@typescript-eslint": tseslint.plugin,
    },
    rules: {
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
        "@typescript-eslint/explicit-module-boundary-types": "off",

        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": [
            "error",
            { checksVoidReturn: false },
        ],

        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                argsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                ignoreRestSiblings: true,
            },
        ],

        "@typescript-eslint/return-await": ["error", "in-try-catch"],
        "@typescript-eslint/switch-exhaustiveness-check": "error",

        // Runtime safety
        "@typescript-eslint/only-throw-error": "error",
        "no-throw-literal": "error",
        "@typescript-eslint/promise-function-async": "error",
    },
};

/* ======================================================
 * Node.js correctness (NestJS-safe)
 * ====================================================== */
const node = {
    plugins: { n: eslintPluginN },
    rules: {
        "n/no-missing-require": "error",
        "n/no-unpublished-import": "warn",
        "n/no-unpublished-require": "warn",
        "n/prefer-global/process": ["error", "never"],

        "n/prefer-global/buffer": ["error", "always"],
        "n/prefer-global/text-decoder": ["error", "always"],
        "n/prefer-global/text-encoder": ["error", "always"],
        "n/prefer-global/url": ["error", "always"],
        "n/prefer-global/url-search-params": ["error", "always"],

        "n/prefer-node-protocol": "error",

        "n/no-path-concat": "error",
        "n/no-deprecated-api": "warn",

        // NestJS-friendly
        "n/no-missing-import": "off",
        "n/no-unsupported-features/es-syntax": "off",

        // Runtime safety
        "no-process-exit": "error",
    },
};

/* ======================================================
 * Imports & architecture
 * ====================================================== */
const imports = {
    plugins: { import: eslintPluginImport },
    rules: {
        "import/no-unresolved": "off",
        "import/no-cycle": ["error", { maxDepth: 1 }],
        "import/order": "off",

        "no-restricted-imports": [
            "error",
            {
                name: "../../",
                message: "Use public module exports only.",
            },
            {
                name: "../../../",
                message: "Use public module exports only.",
            },
            {
                name: "../../../../",
                message: "Use public module exports only.",
            },
        ],
    },
};

/* ======================================================
 * Quality, security & DX
 * ====================================================== */
const quality = {
    plugins: {
        "eslint-comments": eslintPluginEslintComments,
        "perfectionist": eslintPluginPerfectionist,
        "security": eslintPluginSecurity,
        "sonarjs": eslintPluginSonarjs,
        "unicorn": eslintPluginUnicorn,
    },
    rules: {
        "eqeqeq": ["error", "always"],
        "no-var": "error",
        "prefer-const": "error",
        "object-shorthand": ["error", "always"],
        "no-console": ["error"],
        "no-debugger": "error",
        "no-eval": "error",
        "no-new-func": "error",

        "eslint-comments/no-unlimited-disable": "error",
        "eslint-comments/no-unused-disable": "error",

        // Security (high signal)
        "security/detect-eval-with-expression": "error",
        "security/detect-new-buffer": "error",
        "security/detect-object-injection": "warn",
        "security/detect-possible-timing-attacks": "warn",
        "security/detect-non-literal-regexp": "warn",

        // Code quality
        "sonarjs/no-identical-conditions": "error",

        "sonarjs/cognitive-complexity": ["warn", 20],

        // Unicorn (DX-safe)
        "unicorn/filename-case": [
            "warn",
            {
                cases: { kebabCase: true, pascalCase: true },
                ignore: ["^[A-Za-z0-9]+\\.[A-Za-z0-9]+$"],
            },
        ],
        "unicorn/error-message": "error",
        "unicorn/throw-new-error": "error",
        "unicorn/no-abusive-eslint-disable": "error",
        "unicorn/prefer-module": "off",
        "unicorn/prefer-top-level-await": "off",
    },
};

/* ======================================================
 * NestJS Typed rules
 * ====================================================== */
const nest = {
    ...eslintPluginNestTyped.configs.recommended,
    plugins: {
        "@darraghor/nestjs-typed": eslintPluginNestTyped,
    },
};

const toolingOverrides = {
    files: ["scripts/**/*.ts", "**/*.config.ts"],
    rules: {
        "no-console": "off",
    },
};

/* ======================================================
 * Global settings (fix import alias resolution)
 * ====================================================== */
const globalSettings = {
    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },
        "import/resolver": {
            node: {
                extensions: [".ts", ".js", ".mjs", ".cjs"],
            },
        },
    },
};

/* ======================================================
 * Export
 * ====================================================== */
export default defineConfig([
    globalSettings,
    ignores,
    ...base,
    node,
    imports,
    quality,
    nest,
    typescript,
    toolingOverrides,
    prettier, // MUST be last
]);
