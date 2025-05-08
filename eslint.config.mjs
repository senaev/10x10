import exlintConfig from 'senaev-utils/eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default exlintConfig.map((config) => {
    return {
        ...config,
        ignores: [
            'dist/**/*',
            'public/libs/**/*',
        ],
    };
});
