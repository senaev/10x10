// eslint-disable-next-line no-undef
module.exports = {
    tabWidth: 4,
    singleQuote: true,
    jsxSingleQuote: true,
    singleAttributePerLine: true,
    // Add SVG-specific settings
    printWidth: 100,
    htmlWhitespaceSensitivity: 'css',
    embeddedLanguageFormatting: 'auto',
    plugins: ['@prettier/plugin-xml'],
    overrides: [
        {
            files: '*.svg',
            options: {
                parser: 'xml',
            },
        },
    ],
};
