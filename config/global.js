/**
 * Dependencies
 */

let global = require('@nycopportunity/pttrn/config/global');

/**
 * Distributed Stylesheet Path
 */
global.entry.stylesDist = global.entry.styles.replace(/scss/g, 'css');

/**
 * Tailwindcss
 *
 * These must match the configuration in config/sass.js
 */
global.entry.tailwindcss = '/css/tailwindcss.css';
global.entry.tailwindsass = '/utilities/tailwindcss/_tailwindsass.scss';

/**
 * Path to main SVG sprite
 *
 * @var {String}
 */
global.entry.svgs = '/svg/svgs.svg';

module.exports = global;
