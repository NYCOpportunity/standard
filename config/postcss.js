/**
 * Dependencies
 */

const tailwindcss = require('tailwindcss');       // Utility framework/management
const autoprefixer = require('autoprefixer');     // Adds vendor spec prefixes
const mqpacker = require('@hail2u/css-mqpacker'); // Packs media queries together
const cssnano = require('cssnano');               // CSS optimization

/**
 * PostCSS Configuration
 *
 * @type {Object}
 */
module.exports = {
  parser: 'postcss-scss',

  /**
   * PostCSS plugins. This is where most of the configuration for PostCSS is
   * handled. Refer to the PostCSS docs for details and available plugins.
   *
   * @source https://github.com/postcss/postcss#plugins
   *
   * @type {Array}
   */
  plugins: [
    tailwindcss(require('./tailwindcss.js')),
    autoprefixer('last 4 version'),
    mqpacker({sort: true}),
    cssnano({
      preset: [
        'default', {
          calc: false // The current calc preset is not up-to-date with postcss-calc so this needs to be disabled for now https://github.com/postcss/postcss-simple-vars/issues/94
        }
      ]
    })
  ]
};
