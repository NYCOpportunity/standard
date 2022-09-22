/**
 * Plugin options for SVGO
 *
 * @source https://github.com/svg/svgo#built-in-plugins
 */
const svgo = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          convertPathData: false,
          inlineStyles: false,
          cleanupIDs: false
        }
      }
    }
  ]
};

/**
 * Config
 *
 * @type {Object}
 */
module.exports = [
  {
    source: './src/svg',
    dist: './dist/svg',
    prefix: '',
    file: 'svgs.svg',
    svgo: svgo
  },
  {
    source: './node_modules/@nycopportunity/pattern-elements/src/svg',
    dist: './dist/svg',
    prefix: '',
    file: 'pattern-elements.svg',
    svgo: svgo,
    write: {
      source: false
    }
  },
  {
    source: './node_modules/feather-icons/dist/icons',
    dist: './dist/svg',
    prefix: 'feather-',
    file: 'feather.svg',
    svgo: svgo,
    write: {
      source: false
    }
  }
];
