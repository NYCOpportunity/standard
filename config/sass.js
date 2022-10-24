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
    `${process.env.PWD}/dist/`,
    `${process.env.PWD}/node_modules/`,
    `${process.env.PWD}/node_modules/@nycopportunity/pattern-elements/src/`,
    `${process.env.PWD}/node_modules/@nycopportunity/pattern-typography/src/`
  ]
};

let modules = [
  {
    file: `${process.env.PWD}/src/scss/default.scss`,
    outDir: `${process.env.PWD}/dist/css/`,
    outFile: 'default.css',
    sourceMapEmbed: sass.sourceMapEmbed,
    includePaths: sass.includePaths
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
  },
  {
    file: `${process.env.PWD}/src/utilities/tailwindcss/_tailwindcss.scss`,
    outDir: `${process.env.PWD}/src/utilities/tailwindcss/`,
    outFile: '_tailwindsass.scss',
    sourceMapEmbed: sass.sourceMapEmbed,
  }
];

if (process.env.NODE_ENV === 'development') {
  modules.push({
    file: `${process.env.PWD}/src/scss/default.scss`,
    outDir: `${process.env.PWD}/dist/css/`,
    outFile: 'documentation.css',
    sourceMapEmbed: sass.sourceMapEmbed,
    includePaths: sass.includePaths,
    devModule: true
  })
}

/**
 * Sass Export
 *
 * @type {Array}
 */
module.exports = modules;