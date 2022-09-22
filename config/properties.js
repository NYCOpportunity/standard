const resolve = require(`${process.env.PWD}/node_modules/@nycopportunity/pttrn/bin/util/resolve`);
let tokens = resolve('config/tokens', true, false); // The resolve utility prevents the tokens file from being cached

let light = tokens.colorMode.default;
let dark = tokens.colorMode.dark;

delete tokens.version;
delete tokens.output;
delete tokens.prefix;
delete tokens.language;
delete tokens.languageRtl;
delete tokens.scale;
delete tokens.colorMode;
delete tokens.iconSize;

module.exports = [
  {
    'dist': 'dist/css/tokens.css',
    'properties': {
      'nyco': {
        ...tokens
      }
    }
  },
  {
    'dist': 'dist/css/tokens-default.css',
    'ruleset': ':root, .default',
    'properties': {
      'nyco': {
        ...light
      }
    }
  },
  {
    'dist': 'dist/css/tokens-dark.css',
    'ruleset': '.dark',
    'properties': {
      'nyco': {
        ...dark
      }
    }
  }
];
