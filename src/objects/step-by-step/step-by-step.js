/* eslint-env browser */
'use strict';

import Toggle from '@nycopportunity/pttrn-scripts/src/toggle/toggle';

/**
 * Paginate through a series of steps using click events and the popstate event.
 * Preserves the use of a Query Parameter 'step' onload but migrates to using
 * hashes for step anchors.
 */
class StepByStep {
  /**
   * @constructor
   *
   * @param   {Object}  element  Target of the StepByStep
   *
   * @return  {Object}           Instance of StepByStep
   */
  constructor(element) {
    this.element = element;

    if (!this.element) return;

    this.steps = this.element.querySelectorAll(StepByStep.selectors.STEP);

    this.STEP_TOGGLING = `STEP_TOGGLING_${Math.random().toString().replace('0.', '')}`;

    this.toggle = new Toggle({
      selector: StepByStep.selectors.GOTO,
      // TODO
      // Enable/disable the toggle method's focusable children toggling feature.
      // There are components within the steps that also use the Toggle utility
      // and this will conflict with those components focusable children.
      focusable: StepByStep.focusableChildren
    });

    this.toggle.jumpTo = this.jumpTo; // override the toggle instance's jump method

    this.anchor = document.createElement('a'); // symbolic element for toggle method

    this.preventDefault = () => {};

    /**
     * Init
     */

    (async () => {
      /**
       * Show the first or queried step
       */

      let step = this.getQueriedStep();

      let query = this.steps[step].dataset.step;

      // Replace step query param with step hash
      if (window.location.search) {
        history.pushState('', '', window.location.pathname + '#' + query);
      }

      this.toggle.target = this.steps[step];
      this.toggle.focusable = [];

      // Hide inactive steps using the before toggle callback
      await this.before(this.toggle);

      /**
       * Set event listeners and callbacks
       */

      /** @var {function} valid  Validity method for the toggle */
      this.toggle.settings.valid = toggle => {
        return !toggle.element.classList.contains(toggle.settings.activeClass);
      };

      window.addEventListener('popstate', () => {
        this.popstate();
      });

      this.toggle.settings.before = toggle => {
        this.before(toggle);
      };

      /** @var {function} after  After callback for the toggling instance */
      this.toggle.settings.after = () => {
        window[this.STEP_TOGGLING] = false;
      };
    })();

    return this;
  }

  /**
   * Find queried step index. This is backwards compatible with the previous
   * functionality that used a step query param to track steps and history
   *
   * @return  {Integer}  The index of the queried step
   */
  getQueriedStep() {
    let step = 0;

    const hash = window.location.hash;

    const search = window.location.search;

    if (hash || search) {
      const params = new URLSearchParams(search);

      const query = (search)
        ? params.get(StepByStep.param) : hash.replace('#', '');

      for (let index = 0; index < this.steps.length; index++) {
        if (this.steps[index].dataset.step === query) {
          step = index;

          break;
        }
      }
    }

    return step;
  }

  /**
   * The primary handler for back/forward navigation using the browser
   *
   * @param   {String}  popstate  Window history event to listen to
   */
  popstate() {
    if (window[this.STEP_TOGGLING])
      return;

    const hash = window.location.hash.replace('#', '');

    const step = Array.from(this.steps)
      .findIndex(s => s.dataset.step === hash);

    // Return if hash is not found in steps
    if (step === -1) return;

    // Prep symbolic anchor
    this.anchor.classList.remove(this.toggle.settings.activeClass);
    this.anchor.setAttribute('href', `#${this.steps[step].dataset.step}`);
    this.anchor.setAttribute(StepByStep.attrs.GOTO,
      `${this.steps[step].dataset.step}`);

    // Show the step
    this.toggle.elementToggle(this.anchor, this.steps[step], []);

    setTimeout(() => {
      /**
       * Show potentially focusable children
       */

      if (StepByStep.focusableChildren) {
        let elements = this.steps[step].querySelectorAll(Toggle.elFocusable.join(', '));

        elements.forEach(element => {
          element.removeAttribute('tabindex', '-1');
        });
      }

      /**
       * The item to focus on when the step is shown
       */

      let focusItem = this.steps[step].querySelector(StepByStep.selectors.FOCUS);

      if (focusItem) {
        focusItem.setAttribute('tabindex', '-1');
        focusItem.focus();
      }

      window.scroll({top: this.steps[step].offsetTop});
    }, 10);
  }

  /**
   * Toggle Utility before callback
   *
   * @param   {Object}  toggle  Instance of the Toggle Utility
   *
   * @return  {Object}          Instance of StepByStep
   */
  before(toggle) {
    window[this.STEP_TOGGLING] = true;

    // Remove the active class of all toggle elements
    let others = document.querySelectorAll(toggle.settings.selector);

    for (let y = 0; y < others.length; y++) {
      if (others[y].dataset.stepGoTo === toggle.target.dataset.step)
        continue;

      others[y].classList.remove(toggle.settings.activeClass);
    }

    // Hide all sections unless it is the target section
    for (let index = 0; index < this.steps.length; index++) {
      let s = this.steps[index];

      if (toggle.target === s) continue;

      s.classList.remove(toggle.settings.activeClass);
      s.classList.add(toggle.settings.inactiveClass);
      s.setAttribute('aria-hidden', true);

      /**
       * The item to focus on when the step is shown
       */

      let focusItems = s.querySelectorAll(StepByStep.selectors.FOCUS);

      for (let i = 0; i < focusItems.length; i++) {
        focusItems[i].removeAttribute('tabindex');
      }

      /**
       * Hide the focusable children of the step
       */

      if (StepByStep.focusableChildren) {
        let elements = s.querySelectorAll(Toggle.elFocusable.join(', '));

        elements.forEach(element => {
          element.setAttribute('tabindex', '-1');
        });
      }
    }

    return this;
  }

  /**
   * This replaces the jump method in the toggle. This is necessary to override
   * the history state clearing. The toggle utility assumes that it is going to
   * be used for one-off toggles. Not step by step pagination with history.
   *
   * @param   {Object}  element  Toggle element
   * @param   {Object}  target   Target of the toggle
   *
   * @return  {Object}           Toggle instance
   */
  jumpTo(element, target) {
    if (target.classList.contains(this.settings.activeClass)) {
      window.location.hash = element.getAttribute('href');

      let focusItem = target.querySelector(StepByStep.selectors.FOCUS);

      if (focusItem) {
        focusItem.setAttribute('tabindex', '-1');
        focusItem.focus();
      }
    }
  }
}

/** @var {String} selector  Main element selector */
StepByStep.selector = '[data-js="step-by-step"]';

/** @var {Object} attrs  Selector attribute names */
StepByStep.attrs = {
  STEP: 'data-step',
  GOTO: 'data-step-go-to'
};

/** @var {Object} selectors  Element selectors */
StepByStep.selectors = {
  STEP: `[${StepByStep.attrs.STEP}]`,
  GOTO: `[${StepByStep.attrs.GOTO}]`,
  FOCUS: '[data-step-by-step="focus"]'
};

/** @var {String} param  The query parameter to support step goto onload */
StepByStep.param = 'step';

/** @var {Boolean} focusableChildren  Wether the toggle the focusable children's tabindex when showing/hiding */
StepByStep.focusableChildren = true;

export default StepByStep;
