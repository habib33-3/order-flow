export default {
    "**/*.{js,cjs,mjs,ts,mts,cts}": [
        "eslint --fix --no-warn-ignored",
        "prettier --write",
    ],

    "**/*.{json,jsonc,yml,yaml,md,css,scss}": ["prettier --write"],
};
