'use strict';

import Toggle from '@nycopportunity/pttrn-scripts/src/toggle/toggle';

/**
 * The Search module
 *
 * @class
 */
class Search {
  /**
   * @constructor
   *
   * @return {object} The class
   */
  constructor() {
    this._toggle = new Toggle({
      selector: Search.selector,
      after: (toggle) => {
        let el = document.querySelector(Search.selector);
        let input = document.querySelector(Search.selectors.input);

        if (el.className.includes('active') && input) {
          input.focus();
        }
      }
    });

    return this;
  }
}

/**
 * The dom selector for the module
 * @type {String}
 */
Search.selector = '[data-js*="search"]';

Search.selectors = {
  input: '[data-js*="search__input"]'
};

export default Search;
