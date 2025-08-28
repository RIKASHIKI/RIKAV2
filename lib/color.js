/**
 * Console color utilities
 */

// Simple color functions without chalk dependency
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    white: (text) => `\x1b[37m${text}\x1b[0m`,
    keyword: (colorName) => (text) => colors[colorName] ? colors[colorName](text) : text,
    bgKeyword: (colorName) => (text) => text // Simple fallback for background colors
};

const color = (text, colorName) => {
    return !colorName ? colors.green(text) : colors.keyword(colorName)(text);
};

const bgcolor = (text, bgcolorName) => {
    return !bgcolorName ? colors.green(text) : colors.bgKeyword(bgcolorName)(text);
};

module.exports = {
    color,
    bgcolor
};
