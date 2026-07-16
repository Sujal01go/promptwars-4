export default [
  {
    ignores: ["dist/**", "node_modules/**", "run-tests.js"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        alert: "readonly",
        confirm: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        TextDecoder: "readonly",
        SpeechSynthesisUtterance: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      "no-console": "off",
      "eqeqeq": "error",
      "no-undef": "error"
    }
  }
];
