/**
 * Dependencies
 */

const resolve = require(`${process.env.PWD}/node_modules/@nycopportunity/pttrn/bin/util/resolve`);
const global = resolve('config/global');

/**
 * Config
 *
 * @type {Object}
 */
const sass = {
  sourceMapEmbed: true,
  includePaths: [
    `${process.env.PWD}/src/`,
    `${process.env.PWD}/node_modules/`,
    `${process.env.PWD}/node_modules/@nycopportunity/pattern-elements/src/`,
    `${process.env.PWD}/node_modules/@nycopportunity/pattern-typography/src/`
  ]
};

/**
 * Sass Export
 *
 * @type {Array}
 */
module.exports = [
  {
    file: `${process.env.PWD}/src/scss/default.scss`,
    outDir: `${process.env.PWD}/dist/css/`,
    outFile: 'default.css',
    sourceMapEmbed: sass.sourceMapEmbed,
    includePaths: sass.includePaths,
    devModule: true // This needs to be set if we want the module to be compiled during development
  },

  /**
   * Tailwindcss
   *
   * These must match the configuration in config/global.js
   */
  {
    file: `${process.env.PWD}/src/utilities/tailwindcss/_tailwindcss.scss`,
    outDir: `${process.env.PWD}/dist/css/`,
    outFile: 'tailwindcss.css',
    sourceMapEmbed: sass.sourceMapEmbed,
    // devModule: true
  },
  {
    file: `${process.env.PWD}/src/utilities/tailwindcss/_tailwindcss.scss`,
    outDir: `${process.env.PWD}/src/utilities/tailwindcss/`,
    outFile: '_tailwindsass.scss',
    sourceMapEmbed: sass.sourceMapEmbed,
    // devModule: true
  }
];
