module.exports = {
  // // parser: "@typescript-eslint/parser",
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    soureType: "module"
  },
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    // "eslint:recommended",
    "@vue/typescript/recommended",
  ],
  plugins: [
    "vue",
    "@typescript-eslint",
  ],
  rules: {
  },
  globals: {
  },
  settings: {
  }
};
  