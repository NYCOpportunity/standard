'use strict';

import Observe from '@nycopportunity/pttrn-scripts/src/observe/observe';

class ActiveNavigation {
  /**
   * @constructor
   *
   * @return {Object}  The instantiated pattern
   */
  constructor(s = {}) {
    this.selector = (s.selector) ? s.selector : ActiveNavigation.selector;

    this.selectors = (s.selectors) ?
      Object.assign(ActiveNavigation.selectors, s.selectors) : ActiveNavigation.selectors;

    this.observeOptions = (s.observeOptions) ?
      Object.assign(ActiveNavigation.observeOptions, s.observeOptions) : ActiveNavigation.observeOptions;

    /**
     * Method for toggling the jump navigation item, used by the click event
     * handler and the intersection observer event handler.
     *
     * @var NodeElement
     */
     const jumpClassToggle = item => {
      for (let i = 0; i < item.parentNode.children.length; i++) {
        const sibling = item.parentNode.children[i];

        if (this.selectors.FOCUS_ATTR in sibling.dataset) {
          let classActive = sibling.dataset.activeNavigationItem.split(' ');
          let classInactive = sibling.dataset.inactiveNavigationItem.split(' ');

          if (sibling.classList.contains(...classActive)) {
            sibling.classList.remove(...classActive);
            sibling.classList.add(...classInactive);
          }
        }
      }

      item.classList.remove(...item.dataset.inactiveNavigationItem.split(' '));
      item.classList.add(...item.dataset.activeNavigationItem.split(' '));
    };

    /**
     * Click event handler for jump navigation items
     *
     * @var NodeElement
     */
    (element => {
      if (element) {
        let activeNavigation = element.querySelectorAll('a[data-active-navigation-item]');

        for (let i = 0; i < activeNavigation.length; i++) {
          const a = activeNavigation[i];

          a.addEventListener('click', event => {
            setTimeout(() => {
              jumpClassToggle(event.target);

              let item = document.querySelector(event.target.getAttribute('href'));
              let focusItem = item.querySelector(this.selectors.FOCUS);

              if (focusItem) {
                focusItem.setAttribute('tabindex', '-1');
                focusItem.focus();
              }
            }, 200);
          });
        }
      }
    })(document.querySelector(this.selector));

    /**
     * Intersection Observer event handler for jump navigation items
     *
     * @var NodeElementList
     */
    (elements => {
      elements.forEach(element => {
        new Observe({
          element: element,
          options: this.observeOptions,
          selectors: {
            ITEM: this.selectors.OBSERVE_ITEM,
            ITEMS_ATTR: this.selectors.OBSERVE_ITEMS_ATTR
          },
          trigger: (entry) => {
            if (!entry.isIntersecting) return;

            let jumpItem = document.querySelector(`a[href="#${entry.target.id}"]`);

            if (!jumpItem) return;

            jumpItem.closest(this.selectors.SCROLL).scrollTo({
              left: jumpItem.offsetLeft,
              top: 0,
              behavior: 'smooth'
            });

            let focusItems = document.querySelectorAll(this.selectors.FOCUS);

            for (let i = 0; i < focusItems.length; i++) {
              focusItems[i].removeAttribute('tabindex');
            }

            jumpClassToggle(jumpItem);
          }
        });
      });
    })(document.querySelectorAll(this.selectors.OBSERVE));
  }
}

/** @type {String}  Main DOM selector */
ActiveNavigation.selector = '[data-js*=\"active-navigation\"]';

/** @type {Object}  Selectors for the element */
ActiveNavigation.selectors = {
  OBSERVE: '[data-active-navigation="observe"]',
  OBSERVE_ITEM: '[data-active-navigation-observe-item="{{ item }}"]',
  OBSERVE_ITEMS_ATTR: 'activeNavigationObserveItems',
  SCROLL: '[data-active-navigation="scroll"]',
  FOCUS: '[data-active-navigation-item="focus"]',
  FOCUS_ATTR: 'activeNavigationItem'
};

/** @type {Object}  Observation utility options */
ActiveNavigation.observeOptions = {
  root: null,
  rootMargin: '0px',
  threshold: [0.15]
};

export default ActiveNavigation;
