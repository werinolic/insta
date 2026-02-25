const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .cjs files are resolved
config.resolver.sourceExts.push('cjs');

module.exports = config;
