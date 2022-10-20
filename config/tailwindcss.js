/**
 * Dependencies
 */

const tokens = require('./tokens.js');
const logical = require('tailwindcss-logical');

/**
 * Config
 */

module.exports = {
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

  // /**
  //  * All classes are generated
  //  */
  // safelist: [{
  //   pattern: /./,
  //   variants: Object.keys(tokens.screen)
  // }],

  important: true,
  theme: {
    colors: tokens.color,
    borderColor: global.Object.assign({default: ''}, tokens.color),
    borderWidth: tokens.borderWidth,
    // inset: {
    //   '0': 0,
    //   'auto': 'auto',
    //   '100': '100%'
    // },
    boxShadow: tokens.shadow,
    fill: tokens.color,
    fontFamily: tokens.fontFamily,
    fontSize: tokens.fontSize,
    fontWeight: tokens.fontWeight,
    fontStyle: tokens.fontStyle,
    // height: {
    //   'auto': 'auto',
    //   'full': '100%',
    //   '90vh': '90vh',
    //   '100vh': '100vh'
    // },
    lineHeight: tokens.leading,
    // maxWidth: {
    //   '1/2': '50%',
    //   'full': '100%'
    // },
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