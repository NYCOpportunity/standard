/**
 * Dependencies
 */

let global = require('@nycopportunity/pttrn/config/global');

/**
 * Tailwindcss
 *
 * These must match the configuration in config/sass.js
 */
global.entry.tailwindcss = '/css/tailwindcss.css';
global.entry.tailwindsass = '/utilities/tailwindcss/_tailwindsass.scss';

module.exports = global;
