const tokens = require('@nycopportunity/pattern-elements/config/tokens');

const light = {
  /**
   * Component Tokens
   */

  'card': {
    'header': 'var(--nyco-scale-2)',
    'body': 'var(--nyco-scale-0)'
  },

  'material': {
    // 'shadow-up': '0 3px 12px 2px rgba(21, 60, 96, 0.13)',
    'shadow-up': 'none',
    'border': '4px solid var(--nyco-scale-2)',
    'border-radius': '0px'
  }

  /**
   * Object Tokens
   */

  // 'modal': {
  //   'background': 'var(--nyco-color-blue-l-3)',
  // },

  // 'newsletter' {
  //   'heading': 'var(--nyco-text-alt)',
  //   'text': 'inherit',
  //   'background': 'var(--nyco-scale-2)',

  //   // Smoothing
  //   // 'webkit-font-smoothing': 'auto',  // browser default
  //   // 'moz-osx-font-smoothing': 'auto', // browser default
  // }
};

const dark = {
  /**
   * Component Tokens
   */

  'card': {
    'header': 'var(--nyco-scale-3)',
    'body': 'var(--nyco-scale-4)'
  },

  'material': {
    // 'shadow-up': '0 3px 12px 2px rgba(0, 0, 0, 0.15)',
    'shadow-up': 'none',
    'border': '4px solid var(--nyco-scale-3)',
    'border-radius': '0px'
  }

  /**
   * Object Tokens
   */

  // 'modal': {
  //   'background': 'var(--nyco-color-blue-l-3)',
  // },

  // 'newsletter': {
  //   'heading': 'var(--nyco-color-white)',
  //   'text': 'var(--nyco-color-white)',
  //   'background': 'var(--nyco-color-default-3)',

  //   // Smoothing
  //   'webkit-font-smoothing': 'antialiased', // always
  //   'moz-osx-font-smoothing': 'grayscale',  // always
  // }
};

/**
 * Set tokens for the library's themes
 */

tokens.colorMode.dark = {
  ...tokens.colorMode.dark,
  ...dark
};

tokens.colorMode.default = {
  ...tokens.colorMode.default,
  ...light
};

/**
 * Dimensions
 */

const dimension = {
  // 'mobile-menu-width': '80vw',
  'navigation-logo': 'calc(var(--nyco-grid) * 16)',   // '128px',
  'feedback-height': 'calc(var(--nyco-grid) * 12.5)', // '100px', // Static reference. Overridden via JavaScript
  'navigation-height': 'calc(var(--nyco-grid) * 10)', // '80px', // Static reference. Overridden via JavaScript
  'webshare-fallback': 'calc(var(--nyco-grid) * 54)'  // '432px'
};

tokens.dimension = {
  ...tokens.dimension,
  ...dimension
};

/**
 * Export Modules
 */

module.exports = {
  ...tokens
};
