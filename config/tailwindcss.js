/**
 * Dependencies
 */

const tokens = require('./tokens.js');
const logical = require('tailwindcss-logical');

/**
 * Config
 */

module.exports = {
  /**
   * Scans static HTML files for on-demand utilities
   */
  content: [
    'dist/**/**.html'
  ],

  /**
   * All classes are only generated for non-development
   */
  safelist: (process.env.NODE_ENV === 'development')
    ? [] : [{
      pattern: /./,
      variants: Object.keys(tokens.screen)
    }],

  /**
   * All classes are generated
   */
  // safelist: [{
  //   pattern: /./,
  //   variants: Object.keys(tokens.screen)
  // }],

  important: true,
  theme: {
    colors: tokens.color,
    borderColor: {
      default: '',
      ...tokens.color
    },
    borderWidth: tokens.borderWidth,
    boxShadow: tokens.shadow,
    fill: tokens.color,
    fontFamily: tokens.fontFamily,
    fontSize: tokens.fontSize,
    fontWeight: tokens.fontWeight,
    fontStyle: tokens.fontStyle,
    lineHeight: tokens.leading,
    screens: tokens.screen,
    spacing: {
      ...tokens.spacing,
      ...tokens.dimension
    },
    margin: tokens.margin,
    textColor: tokens.color,
    zIndex: tokens.z
  },
  plugins: [
    logical
  ]
};