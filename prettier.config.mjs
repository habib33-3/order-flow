/** @type {import('prettier').Config} */
export default {
    arrowParens: "always",
    bracketSameLine: false,
    bracketSpacing: true,
    endOfLine: "lf",
    /* =============================
     * Import sorting (Prettier-only)
     * ============================= */
    importOrder: [
        // Node.js built-ins
        "^node:(.*)$",
        "^(fs|path|os|http|https|crypto|util|stream)(/.*)?$",

        // Framework & core libs
        "^@nestjs/(.*)$",
        "^express$",
        "^express-(.*)$",

        // Third-party packages
        "<THIRD_PARTY_MODULES>",

        // App-level config and shared utilities
        "^@/config/(.*)$",
        "^@/libs/(.*)$",
        "^@/utils/(.*)$",
        "^@/types/(.*)$",
        "^@/shared/(.*)$",
        "^@/errors/(.*)$",

        // NestJS-specific structure
        "^@/common/(.*)$",
        "^@/middlewares/(.*)$",

        // Modules
        "^@/modules/(.*)$",

        // Infra / other src-level aliases
        "^@/infra/(.*)$",
        "^@/(.*)$",

        // Relative imports
        "^[./]",
    ],

    importOrderCaseInsensitive: true,
    importOrderParserPlugins: ["typescript", "decorators-legacy"],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    /* =============================
     * File-specific overrides
     * ============================= */
    overrides: [
        {
            files: "*.prisma",
            options: {
                parser: "prisma",
                printWidth: 120,
                tabWidth: 4,
            },
        },
        {
            files: "*.sql",
            options: {
                identifierCase: "lower",
                keywordCase: "upper",
                parser: "sql",
                printWidth: 120,
            },
        },
        {
            files: ["*.json", "*.jsonc"],
            options: {
                parser: "json",
                tabWidth: 2,
            },
        },
        {
            files: ["*.yml", "*.yaml"],
            options: {
                parser: "yaml",
                tabWidth: 2,
            },
        },
        {
            files: ["*.sh"],
            options: {
                parser: "sh",
                printWidth: 80,
                tabWidth: 2,
            },
        },
    ],

    /* =============================
     * Plugins
     * ============================= */
    plugins: [
        "@trivago/prettier-plugin-sort-imports",
        "prettier-plugin-packagejson",
        "prettier-plugin-sh",
    ],
    /* =============================
     * Core formatting
     * ============================= */
    printWidth: 80,
    quoteProps: "consistent",
    semi: true,
    singleQuote: false,
    tabWidth: 4,
    trailingComma: "es5",
};
