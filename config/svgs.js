let svgs = require('@nycopportunity/pttrn/config/svgs');

/**
 * Plugin options for SVGO
 *
 * @source https://github.com/svg/svgo#built-in-plugins
 */
const svgo = svgs[0].svgo;

/**
 * Distribution folder
 *
 * @var {String}
 */
const dist = svgs[0].dist;

/**
 * Config
 *
 * @type {Object}
 */
module.exports = [
  {
    source: svgs[0].source,
    dist: dist,
    prefix: '',
    file: svgs[0].file,
    svgo: svgo
  },
  {
    source: './node_modules/@nycopportunity/pattern-elements/src/svg',
    dist: dist,
    prefix: '',
    file: 'pattern-elements.svg',
    svgo: svgo,
    write: {
      source: false
    }
  },
  {
    source: './node_modules/lucide-static/icons',
    dist: dist,
    prefix: 'lucide-',
    file: 'lucide.svg',
    svgo: svgo,
    write: {
      source: false
    }
  }
  // {
  //   source: './node_modules/feather-icons/dist/icons',
  //   dist: dist,
  //   prefix: 'feather-',
  //   file: 'feather.svg',
  //   svgo: svgo,
  //   write: {
  //     source: false
  //   }
  // }
];
