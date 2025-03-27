import createConfig from "@dipcord/eslint-config/create-config";
import reactQuery from "@tanstack/eslint-plugin-query";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default createConfig({
    react: true,
}, {
    ignores: ["dist"],
    languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
    },
    plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
        "tanstack/react-query": reactQuery,
    },
    rules: {
        "antfu/top-level-function": "off",
        "unicorn/filename-case": ["error", {
            case: "kebabCase",
            ignore: ["README.md", "~__root.tsx"],
        }],
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
        ],
    },
});
