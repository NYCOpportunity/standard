var Default = (function () {
  'use strict';

  /**
   * The Simple Toggle class. This will toggle the class 'active' and 'hidden'
   * on target elements, determined by a click event on a selected link or
   * element. This will also toggle the aria-hidden attribute for targeted
   * elements to support screen readers. Target settings and other functionality
   * can be controlled through data attributes.
   *
   * This uses the .matches() method which will require a polyfill for IE
   * https://polyfill.io/v2/docs/features/#Element_prototype_matches
   *
   * @class
   */
  class Toggle {
    /**
     * @constructor
     *
     * @param  {Object}  s  Settings for this Toggle instance
     *
     * @return {Object}     The class
     */
    constructor(s) {
      // Create an object to store existing toggle listeners (if it doesn't exist)
      if (!window.hasOwnProperty(Toggle.callback))
        window[Toggle.callback] = [];

      s = (!s) ? {} : s;

      this.settings = {
        selector: (s.selector) ? s.selector : Toggle.selector,
        namespace: (s.namespace) ? s.namespace : Toggle.namespace,
        inactiveClass: (s.inactiveClass) ? s.inactiveClass : Toggle.inactiveClass,
        activeClass: (s.activeClass) ? s.activeClass : Toggle.activeClass,
        before: (s.before) ? s.before : false,
        after: (s.after) ? s.after : false,
        valid: (s.valid) ? s.valid : false,
        focusable: (s.hasOwnProperty('focusable')) ? s.focusable : true,
        jump: (s.hasOwnProperty('jump')) ? s.jump : true
      };

      // Store the element for potential use in callbacks
      this.element = (s.element) ? s.element : false;

      if (this.element) {
        this.element.addEventListener('click', (event) => {
          this.toggle(event);
        });
      } else {
        // If there isn't an existing instantiated toggle, add the event listener.
        if (!window[Toggle.callback].hasOwnProperty(this.settings.selector)) {
          let body = document.querySelector('body');

          for (let i = 0; i < Toggle.events.length; i++) {
            let tggleEvent = Toggle.events[i];

            body.addEventListener(tggleEvent, event => {
              if (!event.target.matches(this.settings.selector))
                return;

              this.event = event;

              let type = event.type.toUpperCase();

              if (
                this[event.type] &&
                Toggle.elements[type] &&
                Toggle.elements[type].includes(event.target.tagName)
              ) this[event.type](event);
            });
          }
        }
      }

      // Record that a toggle using this selector has been instantiated.
      // This prevents double toggling.
      window[Toggle.callback][this.settings.selector] = true;

      return this;
    }

    /**
     * Click event handler
     *
     * @param  {Event}  event  The original click event
     */
    click(event) {
      this.toggle(event);
    }

    /**
     * Input/select/textarea change event handler. Checks to see if the
     * event.target is valid then toggles accordingly.
     *
     * @param  {Event}  event  The original input change event
     */
    change(event) {
      let valid = event.target.checkValidity();

      if (valid && !this.isActive(event.target)) {
        this.toggle(event); // show
      } else if (!valid && this.isActive(event.target)) {
        this.toggle(event); // hide
      }
    }

    /**
     * Check to see if the toggle is active
     *
     * @param  {Object}  element  The toggle element (trigger)
     */
    isActive(element) {
      let active = false;

      if (this.settings.activeClass) {
        active = element.classList.contains(this.settings.activeClass);
      }

      // if () {
        // Toggle.elementAriaRoles
        // TODO: Add catch to see if element aria roles are toggled
      // }

      // if () {
        // Toggle.targetAriaRoles
        // TODO: Add catch to see if target aria roles are toggled
      // }

      return active;
    }

    /**
     * Get the target of the toggle element (trigger)
     *
     * @param  {Object}  el  The toggle element (trigger)
     */
    getTarget(element) {
      let target = false;

      /** Anchor Links */
      target = (element.hasAttribute('href')) ?
        document.querySelector(element.getAttribute('href')) : target;

      /** Toggle Controls */
      target = (element.hasAttribute('aria-controls')) ?
        document.querySelector(`#${element.getAttribute('aria-controls')}`) : target;

      return target;
    }

    /**
     * The toggle event proxy for getting and setting the element/s and target
     *
     * @param  {Object}  event  The main click event
     *
     * @return {Object}         The Toggle instance
     */
    toggle(event) {
      let element = event.target;
      let target = false;
      let focusable = [];

      event.preventDefault();

      target = this.getTarget(element);

      /** Focusable Children */
      focusable = (target) ?
        target.querySelectorAll(Toggle.elFocusable.join(', ')) : focusable;

      /** Main Functionality */
      if (!target) return this;
      this.elementToggle(element, target, focusable);

      /** Undo */
      if (element.dataset[`${this.settings.namespace}Undo`]) {
        const undo = document.querySelector(
          element.dataset[`${this.settings.namespace}Undo`]
        );

        undo.addEventListener('click', (event) => {
          event.preventDefault();
          this.elementToggle(element, target);
          undo.removeEventListener('click');
        });
      }

      return this;
    }

    /**
     * Get other toggles that might control the same element
     *
     * @param   {Object}    element  The toggling element
     *
     * @return  {NodeList}           List of other toggling elements
     *                               that control the target
     */
    getOthers(element) {
      let selector = false;

      if (element.hasAttribute('href')) {
        selector = `[href="${element.getAttribute('href')}"]`;
      } else if (element.hasAttribute('aria-controls')) {
        selector = `[aria-controls="${element.getAttribute('aria-controls')}"]`;
      }

      return (selector) ? document.querySelectorAll(selector) : [];
    }

    /**
     * Hide the Toggle Target's focusable children from focus.
     * If an element has the data-attribute `data-toggle-tabindex`
     * it will use that as the default tab index of the element.
     *
     * @param   {NodeList}  elements  List of focusable elements
     *
     * @return  {Object}              The Toggle Instance
     */
    toggleFocusable(elements) {
      elements.forEach(element => {
        let tabindex = element.getAttribute('tabindex');

        if (tabindex === '-1') {
          let dataDefault = element
            .getAttribute(`data-${Toggle.namespace}-tabindex`);

          if (dataDefault) {
            element.setAttribute('tabindex', dataDefault);
          } else {
            element.removeAttribute('tabindex');
          }
        } else {
          element.setAttribute('tabindex', '-1');
        }
      });

      return this;
    }

    /**
     * Jumps to Element visibly and shifts focus
     * to the element by setting the tabindex
     *
     * @param   {Object}  element  The Toggling Element
     * @param   {Object}  target   The Target Element
     *
     * @return  {Object}           The Toggle instance
     */
    jumpTo(element, target) {
      // Reset the history state. This will clear out
      // the hash when the target is toggled closed
      history.pushState('', '',
        window.location.pathname + window.location.search);

      // Focus if active
      if (target.classList.contains(this.settings.activeClass)) {
        window.location.hash = element.getAttribute('href');

        target.setAttribute('tabindex', '0');
        target.focus({preventScroll: true});
      } else {
        target.removeAttribute('tabindex');
      }

      return this;
    }

    /**
     * The main toggling method for attributes
     *
     * @param  {Object}    element    The Toggle element
     * @param  {Object}    target     The Target element to toggle active/hidden
     * @param  {NodeList}  focusable  Any focusable children in the target
     *
     * @return {Object}               The Toggle instance
     */
    elementToggle(element, target, focusable = []) {
      let i = 0;
      let attr = '';
      let value = '';

      /**
       * Store elements for potential use in callbacks
       */

      this.element = element;
      this.target = target;
      this.others = this.getOthers(element);
      this.focusable = focusable;

      /**
       * Validity method property that will cancel the toggle if it returns false
       */

      if (this.settings.valid && !this.settings.valid(this))
        return this;

      /**
       * Toggling before hook
       */

      if (this.settings.before)
        this.settings.before(this);

      /**
       * Toggle Element and Target classes
       */

      if (this.settings.activeClass) {
        this.element.classList.toggle(this.settings.activeClass);
        this.target.classList.toggle(this.settings.activeClass);

        // If there are other toggles that control the same element
        this.others.forEach(other => {
          if (other !== this.element)
            other.classList.toggle(this.settings.activeClass);
        });
      }

      if (this.settings.inactiveClass)
        target.classList.toggle(this.settings.inactiveClass);

      /**
       * Target Element Aria Attributes
       */

      for (i = 0; i < Toggle.targetAriaRoles.length; i++) {
        attr = Toggle.targetAriaRoles[i];
        value = this.target.getAttribute(attr);

        if (value != '' && value)
          this.target.setAttribute(attr, (value === 'true') ? 'false' : 'true');
      }

      /**
       * Toggle the target's focusable children tabindex
       */

      if (this.settings.focusable)
        this.toggleFocusable(this.focusable);

      /**
       * Jump to Target Element if Toggle Element is an anchor link
       */

      if (this.settings.jump && this.element.hasAttribute('href'))
        this.jumpTo(this.element, this.target);

      /**
       * Toggle Element (including multi toggles) Aria Attributes
       */

      for (i = 0; i < Toggle.elAriaRoles.length; i++) {
        attr = Toggle.elAriaRoles[i];
        value = this.element.getAttribute(attr);

        if (value != '' && value)
          this.element.setAttribute(attr, (value === 'true') ? 'false' : 'true');

        // If there are other toggles that control the same element
        this.others.forEach((other) => {
          if (other !== this.element && other.getAttribute(attr))
            other.setAttribute(attr, (value === 'true') ? 'false' : 'true');
        });
      }

      /**
       * Toggling complete hook
       */

      if (this.settings.after)
        this.settings.after(this);

      return this;
    }
  }

  /** @type  {String}  The main selector to add the toggling function to */
  Toggle.selector = '[data-js*="toggle"]';

  /** @type  {String}  The namespace for our data attribute settings */
  Toggle.namespace = 'toggle';

  /** @type  {String}  The hide class */
  Toggle.inactiveClass = 'hidden';

  /** @type  {String}  The active class */
  Toggle.activeClass = 'active';

  /** @type  {Array}  Aria roles to toggle true/false on the toggling element */
  Toggle.elAriaRoles = ['aria-pressed', 'aria-expanded'];

  /** @type  {Array}  Aria roles to toggle true/false on the target element */
  Toggle.targetAriaRoles = ['aria-hidden'];

  /** @type  {Array}  Focusable elements to hide within the hidden target element */
  Toggle.elFocusable = [
    'a', 'button', 'input', 'select', 'textarea', 'object', 'embed', 'form',
    'fieldset', 'legend', 'label', 'area', 'audio', 'video', 'iframe', 'svg',
    'details', 'table', '[tabindex]', '[contenteditable]', '[usemap]'
  ];

  /** @type  {Array}  Key attribute for storing toggles in the window */
  Toggle.callback = ['TogglesCallback'];

  /** @type  {Array}  Default events to to watch for toggling. Each must have a handler in the class and elements to look for in Toggle.elements */
  Toggle.events = ['click', 'change'];

  /** @type  {Array}  Elements to delegate to each event handler */
  Toggle.elements = {
    CLICK: ['A', 'BUTTON'],
    CHANGE: ['SELECT', 'INPUT', 'TEXTAREA']
  };

  /**
   * @class  Dialog
   *
   * Usage
   *
   * Element Attributes. Either <a> or <button>
   *
   * @attr  data-js="dialog"               Instantiates the toggling method
   * @attr  aria-controls=""               Targets the id of the dialog
   * @attr  aria-expanded="false"          Declares target closed/open when toggled
   * @attr  data-dialog="open"             Designates the primary opening element of the dialog
   * @attr  data-dialog="close"            Designates the primary closing element of the dialog
   * @attr  data-dialog-focus-on-close=""  Designates an alternate element to focus on when the dialog closes. Value of the attribute is the id of the dialog.
   * @attr  data-dialog-lock="true"        Wether to lock screen scrolling when dialog is open
   *
   * Target Attributes. Any <element>
   *
   * @attr  id=""               Matches aria-controls attr of Element
   * @attr  class="hidden"      Hidden class
   * @attr  aria-hidden="true"  Declares target open/closed when toggled
   */
  class Dialog {
    /**
     * @constructor  Instantiates dialog and toggle method
     *
     * @return  {Object}  The instantiated dialog with properties
     */
    constructor() {
      this.selector = Dialog.selector;

      this.selectors = Dialog.selectors;

      this.classes = Dialog.classes;

      this.dataAttrs = Dialog.dataAttrs;

      this.toggle = new Toggle({
        selector: this.selector,
        after: (toggle) => {
          let active = toggle.target.classList.contains(Toggle.activeClass);

          // Lock the body from scrolling if lock attribute is present
          if (active && toggle.element.dataset[this.dataAttrs.LOCK] === 'true') {
            // Scroll to the top of the page
            window.scroll(0, 0);

            // Prevent scrolling on the body
            document.querySelector('body').style.overflow = 'hidden';

            // When the last focusable item in the list looses focus loop to the first
            toggle.focusable.item(toggle.focusable.length - 1)
              .addEventListener('blur', () => {
                toggle.focusable.item(0).focus();
              });
          } else {
            // Remove if all other dialog body locks are inactive
            let locks = document.querySelectorAll([
                this.selector,
                this.selectors.locks,
                `.${Toggle.activeClass}`
              ].join(''));

            if (locks.length === 0) {
              document.querySelector('body').style.overflow = '';
            }
          }

          // Focus on the close, open, or other focus element if present
          let id = toggle.target.getAttribute('id');
          let control = `[aria-controls="${id}"]`;
          let close = document.querySelector(this.selectors.CLOSE + control);
          let open = document.querySelector(this.selectors.OPEN + control);

          let focusOnClose = document.querySelector(this.selectors.FOCUS_ON_CLOSE.replace('{{ ID }}', id));

          if (active && close) {
            close.focus();
          } else if (open) {
            // Alternatively focus on this element if it is present
            if (focusOnClose) {
              focusOnClose.setAttribute('tabindex', '-1');
              focusOnClose.focus();
            } else {
              open.focus();
            }
          }
        }
      });

      return this;
    }
  }

  /** @type  {String}  Main DOM selector */
  Dialog.selector = '[data-js*=\"dialog\"]';

  /** @type  {Object}  Additional selectors used by the script */
  Dialog.selectors = {
    CLOSE: '[data-dialog*="close"]',
    OPEN: '[data-dialog*="open"]',
    LOCKS: '[data-dialog-lock="true"]',
    FOCUS_ON_CLOSE: '[data-dialog-focus-on-close="{{ ID }}"]'
  };

  /** @type  {Object}  Data attribute namespaces */
  Dialog.dataAttrs = {
    LOCK: 'dialogLock'
  };

  /**
   * Sets the reading direction of the document based on URL Query Parameter
   * or toggle click. Stores the user's preference in local storage.
   */
  class Direction {
    /**
     * @constructor
     *
     * @return  {Class}  Instance of Direction
     */
    constructor() {
      /**
       * Settings
       */

      this.storage = Direction.storage;

      this.selectors = Direction.selectors;

      /**
       * Set the initial desired direction
       */

      let params = new URLSearchParams(window.location.search);

      let dir = (params.get('dir')) ?
        params.get('dir') : localStorage.getItem(this.storage.DIR);

      if (dir) this.set(dir);

      /**
       * Add event listeners for toggling
       */

      document.querySelector('body').addEventListener('click', event => {
        if (!event.target.matches(this.selectors.TOGGLE))
          return;

        this.click();
      });

      return this;
    }

    /**
     * The click event handler for the toggle
     *
     * @return  {Class}  Instance of Direction
     */
    click() {
      let current = document.documentElement.getAttribute('dir');

      let direction = (current === 'rtl') ? 'ltr' : 'rtl';

      this.set(direction);

      return this;
    }

    /**
     * Sets the attribute on the root element and in local storage.
     *
     * @param   {String}  direction  The desired direction; 'ltr' or 'rtl'
     *
     * @return  {Class}              Instance of Direction
     */
    set(direction) {
      document.documentElement.setAttribute('dir', direction);

      localStorage.setItem(this.storage.DIR, direction);

      return this;
    }
  }

  /**
   * Local storage keys
   *
   * @var {Object}
   */
  Direction.storage = {
    DIR: '--nyco-direction'
  };

  /**
   * Selector strings for the class
   *
   * @var {Object}
   */
  Direction.selectors = {
    TOGGLE: '[data-js="direction"]'
  };

  /**
   * Copy to Clipboard Helper
   */
  class Copy {
    /**
     * @constructor
     *
     * @param   {Object}  s  The settings object, may include 'selector',
     *                       'aria', 'notifyTimeout', 'before', 'copied',
     *                       or 'after' attributes.
     *
     * @return  {Class}      The constructed instance of Copy.
     */
    constructor(s) {
      // Set attributes
      this.selector = (s.hasOwnProperty('selector')) ? s.selector : Copy.selector;

      this.selectors = (s.hasOwnProperty('selectors')) ? s.selectors : Copy.selectors;

      this.aria = (s.hasOwnProperty('aria')) ? s.aria : Copy.aria;

      this.notifyTimeout = (s.hasOwnProperty('notifyTimeout')) ? s.notifyTimeout : Copy.notifyTimeout;

      this.before = (s.hasOwnProperty('before')) ? s.before : Copy.before;

      this.copied = (s.hasOwnProperty('copied')) ? s.copied : Copy.copied;

      this.after = (s.hasOwnProperty('after')) ? s.after : Copy.after;

      // Select the entire text when it's focused on
      document.querySelectorAll(this.selectors.TARGETS).forEach(item => {
        item.addEventListener('focus', () => this.select(item));
        item.addEventListener('click', () => this.select(item));
      });

      // The main click event for the class
      document.querySelector('body').addEventListener('click', event => {
        if (!event.target.matches(this.selector))
          return;

        this.element = event.target;

        this.element.setAttribute(this.aria, false);

        this.target = this.element.dataset.copy;

        this.before(this);

        if (this.copy(this.target)) {
          this.copied(this);

          this.element.setAttribute(this.aria, true);

          clearTimeout(this.element['timeout']);

          this.element['timeout'] = setTimeout(() => {
            this.element.setAttribute(this.aria, false);

            this.after(this);
          }, this.notifyTimeout);
        }
      });

      return this;
    }

    /**
     * The click event handler
     *
     * @param   {String}  target  Content of target data attribute
     *
     * @return  {Boolean}         Wether copy was successful or not
     */
    copy(target) {
      let selector = this.selectors.TARGETS.replace(']', `="${target}"]`);

      let input = document.querySelector(selector);

      this.select(input);

      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(input.value);
      else if (document.execCommand)
        document.execCommand('copy');
      else
        return false;

      return true;
    }

    /**
     * Handler for the text selection method
     *
     * @param   {Object}  input  The input with content to select
     */
    select(input) {
      input.select();

      input.setSelectionRange(0, 99999);
    }
  }

  /**
   * The main element selector.
   *
   * @var {String}
   */
  Copy.selector = '[data-js*="copy"]';

  /**
   * The selectors for various elements queried by the utility. Refer to the
   * source for defaults.
   *
   * @var {[type]}
   */
  Copy.selectors = {
    TARGETS: '[data-copy-target]'
  };

  /**
   * Button aria role to toggle
   *
   * @var {String}
   */
  Copy.aria = 'aria-pressed';

  /**
   * Timeout for the "Copied!" notification
   *
   * @var {Number}
   */
  Copy.notifyTimeout = 1500;

  /**
   * Before hook. Triggers before the click event.
   *
   * @var {Function}
   */
  Copy.before = () => {};

  /**
   * Copied hook. Triggers after a successful the copy event.
   *
   * @var {Function}
   */
  Copy.copied = () => {};

  /**
   * After hook. Triggers after the click event.
   *
   * @var {Function}
   */
  Copy.after = () => {};

  /**
   * Utilities for Form components
   * @class
   */
  class Forms {
    /**
     * The Form constructor
     * @param  {Object} form The form DOM element
     */
    constructor(form = false) {
      this.FORM = form;

      this.strings = Forms.strings;

      this.submit = Forms.submit;

      this.classes = Forms.classes;

      this.markup = Forms.markup;

      this.selectors = Forms.selectors;

      this.attrs = Forms.attrs;

      this.FORM.setAttribute('novalidate', true);

      return this;
    }

    /**
     * Map toggled checkbox values to an input.
     * @param  {Object} event The parent click event.
     * @return {Element}      The target element.
     */
    joinValues(event) {
      if (!event.target.matches('input[type="checkbox"]'))
        return;

      if (!event.target.closest('[data-js-join-values]'))
        return;

      let el = event.target.closest('[data-js-join-values]');
      let target = document.querySelector(el.dataset.jsJoinValues);

      target.value = Array.from(
          el.querySelectorAll('input[type="checkbox"]')
        )
        .filter((e) => (e.value && e.checked))
        .map((e) => e.value)
        .join(', ');

      return target;
    }

    /**
     * A simple form validation class that uses native form validation. It will
     * add appropriate form feedback for each input that is invalid and native
     * localized browser messaging.
     *
     * See https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Form_validation
     * See https://caniuse.com/#feat=form-validation for support
     *
     * @param  {Event}         event The form submission event
     * @return {Class/Boolean}       The form class or false if invalid
     */
    valid(event) {
      let validity = event.target.checkValidity();
      let elements = event.target.querySelectorAll(this.selectors.REQUIRED);

      for (let i = 0; i < elements.length; i++) {
        // Remove old messaging if it exists
        let el = elements[i];

        this.reset(el);

        // If this input valid, skip messaging
        if (el.validity.valid) continue;

        this.highlight(el);
      }

      return (validity) ? this : validity;
    }

    /**
     * Adds focus and blur events to inputs with required attributes
     * @param   {object}  form  Passing a form is possible, otherwise it will use
     *                          the form passed to the constructor.
     * @return  {class}         The form class
     */
    watch(form = false) {
      this.FORM = (form) ? form : this.FORM;

      let elements = this.FORM.querySelectorAll(this.selectors.REQUIRED);

      /** Watch Individual Inputs */
      for (let i = 0; i < elements.length; i++) {
        // Remove old messaging if it exists
        let el = elements[i];

        el.addEventListener('focus', () => {
          this.reset(el);
        });

        el.addEventListener('blur', () => {
          if (!el.validity.valid)
            this.highlight(el);
        });
      }

      /** Submit Event */
      this.FORM.addEventListener('submit', (event) => {
        event.preventDefault();

        if (this.valid(event) === false)
          return false;

        this.submit(event);
      });

      return this;
    }

    /**
     * Removes the validity message and classes from the message.
     * @param   {object}  el  The input element
     * @return  {class}       The form class
     */
    reset(el) {
      let container = (this.selectors.ERROR_MESSAGE_PARENT)
        ? el.closest(this.selectors.ERROR_MESSAGE_PARENT) : el.parentNode;

      let message = container.querySelector('.' + this.classes.ERROR_MESSAGE);

      // Remove old messaging if it exists
      container.classList.remove(this.classes.ERROR_CONTAINER);
      if (message) message.remove();

      // Remove error class from the form
      container.closest('form').classList.remove(this.classes.ERROR_CONTAINER);

      // Remove dynamic attributes from the input
      el.removeAttribute(this.attrs.ERROR_INPUT[0]);
      el.removeAttribute(this.attrs.ERROR_LABEL);

      return this;
    }

    /**
     * Displays a validity message to the user. It will first use any localized
     * string passed to the class for required fields missing input. If the
     * input is filled in but doesn't match the required pattern, it will use
     * a localized string set for the specific input type. If one isn't provided
     * it will use the default browser provided message.
     * @param   {object}  el  The invalid input element
     * @return  {class}       The form class
     */
    highlight(el) {
      let container = (this.selectors.ERROR_MESSAGE_PARENT)
        ? el.closest(this.selectors.ERROR_MESSAGE_PARENT) : el.parentNode;

      // Create the new error message.
      let message = document.createElement(this.markup.ERROR_MESSAGE);
      let id = `${el.getAttribute('id')}-${this.classes.ERROR_MESSAGE}`;

      // Get the error message from localized strings (if set).
      if (el.validity.valueMissing && this.strings.VALID_REQUIRED)
        message.innerHTML = this.strings.VALID_REQUIRED;
      else if (!el.validity.valid &&
        this.strings[`VALID_${el.type.toUpperCase()}_INVALID`]) {
        let stringKey = `VALID_${el.type.toUpperCase()}_INVALID`;
        message.innerHTML = this.strings[stringKey];
      } else
        message.innerHTML = el.validationMessage;

      // Set aria attributes and css classes to the message
      message.setAttribute('id', id);
      message.setAttribute(this.attrs.ERROR_MESSAGE[0],
        this.attrs.ERROR_MESSAGE[1]);
      message.classList.add(this.classes.ERROR_MESSAGE);

      // Add the error class and error message to the dom.
      container.classList.add(this.classes.ERROR_CONTAINER);
      container.insertBefore(message, container.childNodes[0]);

      // Add the error class to the form
      container.closest('form').classList.add(this.classes.ERROR_CONTAINER);

      // Add dynamic attributes to the input
      el.setAttribute(this.attrs.ERROR_INPUT[0], this.attrs.ERROR_INPUT[1]);
      el.setAttribute(this.attrs.ERROR_LABEL, id);

      return this;
    }
  }

  /**
   * A dictionairy of strings in the format.
   * {
   *   'VALID_REQUIRED': 'This is required',
   *   'VALID_{{ TYPE }}_INVALID': 'Invalid'
   * }
   */
  Forms.strings = {};

  /** Placeholder for the submit function */
  Forms.submit = function() {};

  /** Classes for various containers */
  Forms.classes = {
    'ERROR_MESSAGE': 'error-message', // error class for the validity message
    'ERROR_CONTAINER': 'error', // class for the validity message parent
    'ERROR_FORM': 'error'
  };

  /** HTML tags and markup for various elements */
  Forms.markup = {
    'ERROR_MESSAGE': 'div',
  };

  /** DOM Selectors for various elements */
  Forms.selectors = {
    'REQUIRED': '[required="true"]', // Selector for required input elements
    'ERROR_MESSAGE_PARENT': false
  };

  /** Attributes for various elements */
  Forms.attrs = {
    'ERROR_MESSAGE': ['aria-live', 'polite'], // Attribute for valid error message
    'ERROR_INPUT': ['aria-invalid', 'true'],
    'ERROR_LABEL': 'aria-describedby'
  };

  /**
   * The Icon module
   * @class
   */
  class Icons {
    /**
     * @constructor
     * @param  {String} path The path of the icon file
     * @return {object} The class
     */
    constructor(path) {
      path = (path) ? path : Icons.path;

      fetch(path)
        .then((response) => {
          if (response.ok)
            return response.text();
          else
            // eslint-disable-next-line no-console
            console.dir(response);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.dir(error);
        })
        .then((data) => {
          const sprite = document.createElement('div');
          sprite.innerHTML = data;
          sprite.setAttribute('aria-hidden', true);
          sprite.setAttribute('style', 'display: none;');
          document.body.appendChild(sprite);
        });

      return this;
    }
  }

  /** @type {String} The path of the icon file */
  Icons.path = 'svg/icons.svg';

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var NumeralFormatter = function (numeralDecimalMark,
                                   numeralIntegerScale,
                                   numeralDecimalScale,
                                   numeralThousandsGroupStyle,
                                   numeralPositiveOnly,
                                   stripLeadingZeroes,
                                   prefix,
                                   signBeforePrefix,
                                   tailPrefix,
                                   delimiter) {
      var owner = this;

      owner.numeralDecimalMark = numeralDecimalMark || '.';
      owner.numeralIntegerScale = numeralIntegerScale > 0 ? numeralIntegerScale : 0;
      owner.numeralDecimalScale = numeralDecimalScale >= 0 ? numeralDecimalScale : 2;
      owner.numeralThousandsGroupStyle = numeralThousandsGroupStyle || NumeralFormatter.groupStyle.thousand;
      owner.numeralPositiveOnly = !!numeralPositiveOnly;
      owner.stripLeadingZeroes = stripLeadingZeroes !== false;
      owner.prefix = (prefix || prefix === '') ? prefix : '';
      owner.signBeforePrefix = !!signBeforePrefix;
      owner.tailPrefix = !!tailPrefix;
      owner.delimiter = (delimiter || delimiter === '') ? delimiter : ',';
      owner.delimiterRE = delimiter ? new RegExp('\\' + delimiter, 'g') : '';
  };

  NumeralFormatter.groupStyle = {
      thousand: 'thousand',
      lakh:     'lakh',
      wan:      'wan',
      none:     'none'    
  };

  NumeralFormatter.prototype = {
      getRawValue: function (value) {
          return value.replace(this.delimiterRE, '').replace(this.numeralDecimalMark, '.');
      },

      format: function (value) {
          var owner = this, parts, partSign, partSignAndPrefix, partInteger, partDecimal = '';

          // strip alphabet letters
          value = value.replace(/[A-Za-z]/g, '')
              // replace the first decimal mark with reserved placeholder
              .replace(owner.numeralDecimalMark, 'M')

              // strip non numeric letters except minus and "M"
              // this is to ensure prefix has been stripped
              .replace(/[^\dM-]/g, '')

              // replace the leading minus with reserved placeholder
              .replace(/^\-/, 'N')

              // strip the other minus sign (if present)
              .replace(/\-/g, '')

              // replace the minus sign (if present)
              .replace('N', owner.numeralPositiveOnly ? '' : '-')

              // replace decimal mark
              .replace('M', owner.numeralDecimalMark);

          // strip any leading zeros
          if (owner.stripLeadingZeroes) {
              value = value.replace(/^(-)?0+(?=\d)/, '$1');
          }

          partSign = value.slice(0, 1) === '-' ? '-' : '';
          if (typeof owner.prefix != 'undefined') {
              if (owner.signBeforePrefix) {
                  partSignAndPrefix = partSign + owner.prefix;
              } else {
                  partSignAndPrefix = owner.prefix + partSign;
              }
          } else {
              partSignAndPrefix = partSign;
          }
          
          partInteger = value;

          if (value.indexOf(owner.numeralDecimalMark) >= 0) {
              parts = value.split(owner.numeralDecimalMark);
              partInteger = parts[0];
              partDecimal = owner.numeralDecimalMark + parts[1].slice(0, owner.numeralDecimalScale);
          }

          if(partSign === '-') {
              partInteger = partInteger.slice(1);
          }

          if (owner.numeralIntegerScale > 0) {
            partInteger = partInteger.slice(0, owner.numeralIntegerScale);
          }

          switch (owner.numeralThousandsGroupStyle) {
          case NumeralFormatter.groupStyle.lakh:
              partInteger = partInteger.replace(/(\d)(?=(\d\d)+\d$)/g, '$1' + owner.delimiter);

              break;

          case NumeralFormatter.groupStyle.wan:
              partInteger = partInteger.replace(/(\d)(?=(\d{4})+$)/g, '$1' + owner.delimiter);

              break;

          case NumeralFormatter.groupStyle.thousand:
              partInteger = partInteger.replace(/(\d)(?=(\d{3})+$)/g, '$1' + owner.delimiter);

              break;
          }

          if (owner.tailPrefix) {
              return partSign + partInteger.toString() + (owner.numeralDecimalScale > 0 ? partDecimal.toString() : '') + owner.prefix;
          }

          return partSignAndPrefix + partInteger.toString() + (owner.numeralDecimalScale > 0 ? partDecimal.toString() : '');
      }
  };

  var NumeralFormatter_1 = NumeralFormatter;

  var DateFormatter = function (datePattern, dateMin, dateMax) {
      var owner = this;

      owner.date = [];
      owner.blocks = [];
      owner.datePattern = datePattern;
      owner.dateMin = dateMin
        .split('-')
        .reverse()
        .map(function(x) {
          return parseInt(x, 10);
        });
      if (owner.dateMin.length === 2) owner.dateMin.unshift(0);

      owner.dateMax = dateMax
        .split('-')
        .reverse()
        .map(function(x) {
          return parseInt(x, 10);
        });
      if (owner.dateMax.length === 2) owner.dateMax.unshift(0);
      
      owner.initBlocks();
  };

  DateFormatter.prototype = {
      initBlocks: function () {
          var owner = this;
          owner.datePattern.forEach(function (value) {
              if (value === 'Y') {
                  owner.blocks.push(4);
              } else {
                  owner.blocks.push(2);
              }
          });
      },

      getISOFormatDate: function () {
          var owner = this,
              date = owner.date;

          return date[2] ? (
              date[2] + '-' + owner.addLeadingZero(date[1]) + '-' + owner.addLeadingZero(date[0])
          ) : '';
      },

      getBlocks: function () {
          return this.blocks;
      },

      getValidatedDate: function (value) {
          var owner = this, result = '';

          value = value.replace(/[^\d]/g, '');

          owner.blocks.forEach(function (length, index) {
              if (value.length > 0) {
                  var sub = value.slice(0, length),
                      sub0 = sub.slice(0, 1),
                      rest = value.slice(length);

                  switch (owner.datePattern[index]) {
                  case 'd':
                      if (sub === '00') {
                          sub = '01';
                      } else if (parseInt(sub0, 10) > 3) {
                          sub = '0' + sub0;
                      } else if (parseInt(sub, 10) > 31) {
                          sub = '31';
                      }

                      break;

                  case 'm':
                      if (sub === '00') {
                          sub = '01';
                      } else if (parseInt(sub0, 10) > 1) {
                          sub = '0' + sub0;
                      } else if (parseInt(sub, 10) > 12) {
                          sub = '12';
                      }

                      break;
                  }

                  result += sub;

                  // update remaining string
                  value = rest;
              }
          });

          return this.getFixedDateString(result);
      },

      getFixedDateString: function (value) {
          var owner = this, datePattern = owner.datePattern, date = [],
              dayIndex = 0, monthIndex = 0, yearIndex = 0,
              dayStartIndex = 0, monthStartIndex = 0, yearStartIndex = 0,
              day, month, year, fullYearDone = false;

          // mm-dd || dd-mm
          if (value.length === 4 && datePattern[0].toLowerCase() !== 'y' && datePattern[1].toLowerCase() !== 'y') {
              dayStartIndex = datePattern[0] === 'd' ? 0 : 2;
              monthStartIndex = 2 - dayStartIndex;
              day = parseInt(value.slice(dayStartIndex, dayStartIndex + 2), 10);
              month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);

              date = this.getFixedDate(day, month, 0);
          }

          // yyyy-mm-dd || yyyy-dd-mm || mm-dd-yyyy || dd-mm-yyyy || dd-yyyy-mm || mm-yyyy-dd
          if (value.length === 8) {
              datePattern.forEach(function (type, index) {
                  switch (type) {
                  case 'd':
                      dayIndex = index;
                      break;
                  case 'm':
                      monthIndex = index;
                      break;
                  default:
                      yearIndex = index;
                      break;
                  }
              });

              yearStartIndex = yearIndex * 2;
              dayStartIndex = (dayIndex <= yearIndex) ? dayIndex * 2 : (dayIndex * 2 + 2);
              monthStartIndex = (monthIndex <= yearIndex) ? monthIndex * 2 : (monthIndex * 2 + 2);

              day = parseInt(value.slice(dayStartIndex, dayStartIndex + 2), 10);
              month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
              year = parseInt(value.slice(yearStartIndex, yearStartIndex + 4), 10);

              fullYearDone = value.slice(yearStartIndex, yearStartIndex + 4).length === 4;

              date = this.getFixedDate(day, month, year);
          }

          // mm-yy || yy-mm
          if (value.length === 4 && (datePattern[0] === 'y' || datePattern[1] === 'y')) {
              monthStartIndex = datePattern[0] === 'm' ? 0 : 2;
              yearStartIndex = 2 - monthStartIndex;
              month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
              year = parseInt(value.slice(yearStartIndex, yearStartIndex + 2), 10);

              fullYearDone = value.slice(yearStartIndex, yearStartIndex + 2).length === 2;

              date = [0, month, year];
          }

          // mm-yyyy || yyyy-mm
          if (value.length === 6 && (datePattern[0] === 'Y' || datePattern[1] === 'Y')) {
              monthStartIndex = datePattern[0] === 'm' ? 0 : 4;
              yearStartIndex = 2 - 0.5 * monthStartIndex;
              month = parseInt(value.slice(monthStartIndex, monthStartIndex + 2), 10);
              year = parseInt(value.slice(yearStartIndex, yearStartIndex + 4), 10);

              fullYearDone = value.slice(yearStartIndex, yearStartIndex + 4).length === 4;

              date = [0, month, year];
          }

          date = owner.getRangeFixedDate(date);
          owner.date = date;

          var result = date.length === 0 ? value : datePattern.reduce(function (previous, current) {
              switch (current) {
              case 'd':
                  return previous + (date[0] === 0 ? '' : owner.addLeadingZero(date[0]));
              case 'm':
                  return previous + (date[1] === 0 ? '' : owner.addLeadingZero(date[1]));
              case 'y':
                  return previous + (fullYearDone ? owner.addLeadingZeroForYear(date[2], false) : '');
              case 'Y':
                  return previous + (fullYearDone ? owner.addLeadingZeroForYear(date[2], true) : '');
              }
          }, '');

          return result;
      },

      getRangeFixedDate: function (date) {
          var owner = this,
              datePattern = owner.datePattern,
              dateMin = owner.dateMin || [],
              dateMax = owner.dateMax || [];

          if (!date.length || (dateMin.length < 3 && dateMax.length < 3)) return date;

          if (
            datePattern.find(function(x) {
              return x.toLowerCase() === 'y';
            }) &&
            date[2] === 0
          ) return date;

          if (dateMax.length && (dateMax[2] < date[2] || (
            dateMax[2] === date[2] && (dateMax[1] < date[1] || (
              dateMax[1] === date[1] && dateMax[0] < date[0]
            ))
          ))) return dateMax;

          if (dateMin.length && (dateMin[2] > date[2] || (
            dateMin[2] === date[2] && (dateMin[1] > date[1] || (
              dateMin[1] === date[1] && dateMin[0] > date[0]
            ))
          ))) return dateMin;

          return date;
      },

      getFixedDate: function (day, month, year) {
          day = Math.min(day, 31);
          month = Math.min(month, 12);
          year = parseInt((year || 0), 10);

          if ((month < 7 && month % 2 === 0) || (month > 8 && month % 2 === 1)) {
              day = Math.min(day, month === 2 ? (this.isLeapYear(year) ? 29 : 28) : 30);
          }

          return [day, month, year];
      },

      isLeapYear: function (year) {
          return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
      },

      addLeadingZero: function (number) {
          return (number < 10 ? '0' : '') + number;
      },

      addLeadingZeroForYear: function (number, fullYearMode) {
          if (fullYearMode) {
              return (number < 10 ? '000' : (number < 100 ? '00' : (number < 1000 ? '0' : ''))) + number;
          }

          return (number < 10 ? '0' : '') + number;
      }
  };

  var DateFormatter_1 = DateFormatter;

  var TimeFormatter = function (timePattern, timeFormat) {
      var owner = this;

      owner.time = [];
      owner.blocks = [];
      owner.timePattern = timePattern;
      owner.timeFormat = timeFormat;
      owner.initBlocks();
  };

  TimeFormatter.prototype = {
      initBlocks: function () {
          var owner = this;
          owner.timePattern.forEach(function () {
              owner.blocks.push(2);
          });
      },

      getISOFormatTime: function () {
          var owner = this,
              time = owner.time;

          return time[2] ? (
              owner.addLeadingZero(time[0]) + ':' + owner.addLeadingZero(time[1]) + ':' + owner.addLeadingZero(time[2])
          ) : '';
      },

      getBlocks: function () {
          return this.blocks;
      },

      getTimeFormatOptions: function () {
          var owner = this;
          if (String(owner.timeFormat) === '12') {
              return {
                  maxHourFirstDigit: 1,
                  maxHours: 12,
                  maxMinutesFirstDigit: 5,
                  maxMinutes: 60
              };
          }

          return {
              maxHourFirstDigit: 2,
              maxHours: 23,
              maxMinutesFirstDigit: 5,
              maxMinutes: 60
          };
      },

      getValidatedTime: function (value) {
          var owner = this, result = '';

          value = value.replace(/[^\d]/g, '');

          var timeFormatOptions = owner.getTimeFormatOptions();

          owner.blocks.forEach(function (length, index) {
              if (value.length > 0) {
                  var sub = value.slice(0, length),
                      sub0 = sub.slice(0, 1),
                      rest = value.slice(length);

                  switch (owner.timePattern[index]) {

                  case 'h':
                      if (parseInt(sub0, 10) > timeFormatOptions.maxHourFirstDigit) {
                          sub = '0' + sub0;
                      } else if (parseInt(sub, 10) > timeFormatOptions.maxHours) {
                          sub = timeFormatOptions.maxHours + '';
                      }

                      break;

                  case 'm':
                  case 's':
                      if (parseInt(sub0, 10) > timeFormatOptions.maxMinutesFirstDigit) {
                          sub = '0' + sub0;
                      } else if (parseInt(sub, 10) > timeFormatOptions.maxMinutes) {
                          sub = timeFormatOptions.maxMinutes + '';
                      }
                      break;
                  }

                  result += sub;

                  // update remaining string
                  value = rest;
              }
          });

          return this.getFixedTimeString(result);
      },

      getFixedTimeString: function (value) {
          var owner = this, timePattern = owner.timePattern, time = [],
              secondIndex = 0, minuteIndex = 0, hourIndex = 0,
              secondStartIndex = 0, minuteStartIndex = 0, hourStartIndex = 0,
              second, minute, hour;

          if (value.length === 6) {
              timePattern.forEach(function (type, index) {
                  switch (type) {
                  case 's':
                      secondIndex = index * 2;
                      break;
                  case 'm':
                      minuteIndex = index * 2;
                      break;
                  case 'h':
                      hourIndex = index * 2;
                      break;
                  }
              });

              hourStartIndex = hourIndex;
              minuteStartIndex = minuteIndex;
              secondStartIndex = secondIndex;

              second = parseInt(value.slice(secondStartIndex, secondStartIndex + 2), 10);
              minute = parseInt(value.slice(minuteStartIndex, minuteStartIndex + 2), 10);
              hour = parseInt(value.slice(hourStartIndex, hourStartIndex + 2), 10);

              time = this.getFixedTime(hour, minute, second);
          }

          if (value.length === 4 && owner.timePattern.indexOf('s') < 0) {
              timePattern.forEach(function (type, index) {
                  switch (type) {
                  case 'm':
                      minuteIndex = index * 2;
                      break;
                  case 'h':
                      hourIndex = index * 2;
                      break;
                  }
              });

              hourStartIndex = hourIndex;
              minuteStartIndex = minuteIndex;

              second = 0;
              minute = parseInt(value.slice(minuteStartIndex, minuteStartIndex + 2), 10);
              hour = parseInt(value.slice(hourStartIndex, hourStartIndex + 2), 10);

              time = this.getFixedTime(hour, minute, second);
          }

          owner.time = time;

          return time.length === 0 ? value : timePattern.reduce(function (previous, current) {
              switch (current) {
              case 's':
                  return previous + owner.addLeadingZero(time[2]);
              case 'm':
                  return previous + owner.addLeadingZero(time[1]);
              case 'h':
                  return previous + owner.addLeadingZero(time[0]);
              }
          }, '');
      },

      getFixedTime: function (hour, minute, second) {
          second = Math.min(parseInt(second || 0, 10), 60);
          minute = Math.min(minute, 60);
          hour = Math.min(hour, 60);

          return [hour, minute, second];
      },

      addLeadingZero: function (number) {
          return (number < 10 ? '0' : '') + number;
      }
  };

  var TimeFormatter_1 = TimeFormatter;

  var PhoneFormatter = function (formatter, delimiter) {
      var owner = this;

      owner.delimiter = (delimiter || delimiter === '') ? delimiter : ' ';
      owner.delimiterRE = delimiter ? new RegExp('\\' + delimiter, 'g') : '';

      owner.formatter = formatter;
  };

  PhoneFormatter.prototype = {
      setFormatter: function (formatter) {
          this.formatter = formatter;
      },

      format: function (phoneNumber) {
          var owner = this;

          owner.formatter.clear();

          // only keep number and +
          phoneNumber = phoneNumber.replace(/[^\d+]/g, '');

          // strip non-leading +
          phoneNumber = phoneNumber.replace(/^\+/, 'B').replace(/\+/g, '').replace('B', '+');

          // strip delimiter
          phoneNumber = phoneNumber.replace(owner.delimiterRE, '');

          var result = '', current, validated = false;

          for (var i = 0, iMax = phoneNumber.length; i < iMax; i++) {
              current = owner.formatter.inputDigit(phoneNumber.charAt(i));

              // has ()- or space inside
              if (/[\s()-]/g.test(current)) {
                  result = current;

                  validated = true;
              } else {
                  if (!validated) {
                      result = current;
                  }
                  // else: over length input
                  // it turns to invalid number again
              }
          }

          // strip ()
          // e.g. US: 7161234567 returns (716) 123-4567
          result = result.replace(/[()]/g, '');
          // replace library delimiter with user customized delimiter
          result = result.replace(/[\s-]/g, owner.delimiter);

          return result;
      }
  };

  var PhoneFormatter_1 = PhoneFormatter;

  var CreditCardDetector = {
      blocks: {
          uatp:          [4, 5, 6],
          amex:          [4, 6, 5],
          diners:        [4, 6, 4],
          discover:      [4, 4, 4, 4],
          mastercard:    [4, 4, 4, 4],
          dankort:       [4, 4, 4, 4],
          instapayment:  [4, 4, 4, 4],
          jcb15:         [4, 6, 5],
          jcb:           [4, 4, 4, 4],
          maestro:       [4, 4, 4, 4],
          visa:          [4, 4, 4, 4],
          mir:           [4, 4, 4, 4],
          unionPay:      [4, 4, 4, 4],
          general:       [4, 4, 4, 4]
      },

      re: {
          // starts with 1; 15 digits, not starts with 1800 (jcb card)
          uatp: /^(?!1800)1\d{0,14}/,

          // starts with 34/37; 15 digits
          amex: /^3[47]\d{0,13}/,

          // starts with 6011/65/644-649; 16 digits
          discover: /^(?:6011|65\d{0,2}|64[4-9]\d?)\d{0,12}/,

          // starts with 300-305/309 or 36/38/39; 14 digits
          diners: /^3(?:0([0-5]|9)|[689]\d?)\d{0,11}/,

          // starts with 51-55/2221–2720; 16 digits
          mastercard: /^(5[1-5]\d{0,2}|22[2-9]\d{0,1}|2[3-7]\d{0,2})\d{0,12}/,

          // starts with 5019/4175/4571; 16 digits
          dankort: /^(5019|4175|4571)\d{0,12}/,

          // starts with 637-639; 16 digits
          instapayment: /^63[7-9]\d{0,13}/,

          // starts with 2131/1800; 15 digits
          jcb15: /^(?:2131|1800)\d{0,11}/,

          // starts with 2131/1800/35; 16 digits
          jcb: /^(?:35\d{0,2})\d{0,12}/,

          // starts with 50/56-58/6304/67; 16 digits
          maestro: /^(?:5[0678]\d{0,2}|6304|67\d{0,2})\d{0,12}/,

          // starts with 22; 16 digits
          mir: /^220[0-4]\d{0,12}/,

          // starts with 4; 16 digits
          visa: /^4\d{0,15}/,

          // starts with 62/81; 16 digits
          unionPay: /^(62|81)\d{0,14}/
      },

      getStrictBlocks: function (block) {
        var total = block.reduce(function (prev, current) {
          return prev + current;
        }, 0);

        return block.concat(19 - total);
      },

      getInfo: function (value, strictMode) {
          var blocks = CreditCardDetector.blocks,
              re = CreditCardDetector.re;

          // Some credit card can have up to 19 digits number.
          // Set strictMode to true will remove the 16 max-length restrain,
          // however, I never found any website validate card number like
          // this, hence probably you don't want to enable this option.
          strictMode = !!strictMode;

          for (var key in re) {
              if (re[key].test(value)) {
                  var matchedBlocks = blocks[key];
                  return {
                      type: key,
                      blocks: strictMode ? this.getStrictBlocks(matchedBlocks) : matchedBlocks
                  };
              }
          }

          return {
              type: 'unknown',
              blocks: strictMode ? this.getStrictBlocks(blocks.general) : blocks.general
          };
      }
  };

  var CreditCardDetector_1 = CreditCardDetector;

  var Util = {
      noop: function () {
      },

      strip: function (value, re) {
          return value.replace(re, '');
      },

      getPostDelimiter: function (value, delimiter, delimiters) {
          // single delimiter
          if (delimiters.length === 0) {
              return value.slice(-delimiter.length) === delimiter ? delimiter : '';
          }

          // multiple delimiters
          var matchedDelimiter = '';
          delimiters.forEach(function (current) {
              if (value.slice(-current.length) === current) {
                  matchedDelimiter = current;
              }
          });

          return matchedDelimiter;
      },

      getDelimiterREByDelimiter: function (delimiter) {
          return new RegExp(delimiter.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'g');
      },

      getNextCursorPosition: function (prevPos, oldValue, newValue, delimiter, delimiters) {
        // If cursor was at the end of value, just place it back.
        // Because new value could contain additional chars.
        if (oldValue.length === prevPos) {
            return newValue.length;
        }

        return prevPos + this.getPositionOffset(prevPos, oldValue, newValue, delimiter ,delimiters);
      },

      getPositionOffset: function (prevPos, oldValue, newValue, delimiter, delimiters) {
          var oldRawValue, newRawValue, lengthOffset;

          oldRawValue = this.stripDelimiters(oldValue.slice(0, prevPos), delimiter, delimiters);
          newRawValue = this.stripDelimiters(newValue.slice(0, prevPos), delimiter, delimiters);
          lengthOffset = oldRawValue.length - newRawValue.length;

          return (lengthOffset !== 0) ? (lengthOffset / Math.abs(lengthOffset)) : 0;
      },

      stripDelimiters: function (value, delimiter, delimiters) {
          var owner = this;

          // single delimiter
          if (delimiters.length === 0) {
              var delimiterRE = delimiter ? owner.getDelimiterREByDelimiter(delimiter) : '';

              return value.replace(delimiterRE, '');
          }

          // multiple delimiters
          delimiters.forEach(function (current) {
              current.split('').forEach(function (letter) {
                  value = value.replace(owner.getDelimiterREByDelimiter(letter), '');
              });
          });

          return value;
      },

      headStr: function (str, length) {
          return str.slice(0, length);
      },

      getMaxLength: function (blocks) {
          return blocks.reduce(function (previous, current) {
              return previous + current;
          }, 0);
      },

      // strip prefix
      // Before type  |   After type    |     Return value
      // PEFIX-...    |   PEFIX-...     |     ''
      // PREFIX-123   |   PEFIX-123     |     123
      // PREFIX-123   |   PREFIX-23     |     23
      // PREFIX-123   |   PREFIX-1234   |     1234
      getPrefixStrippedValue: function (value, prefix, prefixLength, prevResult, delimiter, delimiters, noImmediatePrefix, tailPrefix, signBeforePrefix) {
          // No prefix
          if (prefixLength === 0) {
            return value;
          }

          // Value is prefix
          if (value === prefix && value !== '') {
            return '';
          }

          if (signBeforePrefix && (value.slice(0, 1) == '-')) {
              var prev = (prevResult.slice(0, 1) == '-') ? prevResult.slice(1) : prevResult;
              return '-' + this.getPrefixStrippedValue(value.slice(1), prefix, prefixLength, prev, delimiter, delimiters, noImmediatePrefix, tailPrefix, signBeforePrefix);
          }

          // Pre result prefix string does not match pre-defined prefix
          if (prevResult.slice(0, prefixLength) !== prefix && !tailPrefix) {
              // Check if the first time user entered something
              if (noImmediatePrefix && !prevResult && value) return value;
              return '';
          } else if (prevResult.slice(-prefixLength) !== prefix && tailPrefix) {
              // Check if the first time user entered something
              if (noImmediatePrefix && !prevResult && value) return value;
              return '';
          }

          var prevValue = this.stripDelimiters(prevResult, delimiter, delimiters);

          // New value has issue, someone typed in between prefix letters
          // Revert to pre value
          if (value.slice(0, prefixLength) !== prefix && !tailPrefix) {
              return prevValue.slice(prefixLength);
          } else if (value.slice(-prefixLength) !== prefix && tailPrefix) {
              return prevValue.slice(0, -prefixLength - 1);
          }

          // No issue, strip prefix for new value
          return tailPrefix ? value.slice(0, -prefixLength) : value.slice(prefixLength);
      },

      getFirstDiffIndex: function (prev, current) {
          var index = 0;

          while (prev.charAt(index) === current.charAt(index)) {
              if (prev.charAt(index++) === '') {
                  return -1;
              }
          }

          return index;
      },

      getFormattedValue: function (value, blocks, blocksLength, delimiter, delimiters, delimiterLazyShow) {
          var result = '',
              multipleDelimiters = delimiters.length > 0,
              currentDelimiter = '';

          // no options, normal input
          if (blocksLength === 0) {
              return value;
          }

          blocks.forEach(function (length, index) {
              if (value.length > 0) {
                  var sub = value.slice(0, length),
                      rest = value.slice(length);

                  if (multipleDelimiters) {
                      currentDelimiter = delimiters[delimiterLazyShow ? (index - 1) : index] || currentDelimiter;
                  } else {
                      currentDelimiter = delimiter;
                  }

                  if (delimiterLazyShow) {
                      if (index > 0) {
                          result += currentDelimiter;
                      }

                      result += sub;
                  } else {
                      result += sub;

                      if (sub.length === length && index < blocksLength - 1) {
                          result += currentDelimiter;
                      }
                  }

                  // update remaining string
                  value = rest;
              }
          });

          return result;
      },

      // move cursor to the end
      // the first time user focuses on an input with prefix
      fixPrefixCursor: function (el, prefix, delimiter, delimiters) {
          if (!el) {
              return;
          }

          var val = el.value,
              appendix = delimiter || (delimiters[0] || ' ');

          if (!el.setSelectionRange || !prefix || (prefix.length + appendix.length) <= val.length) {
              return;
          }

          var len = val.length * 2;

          // set timeout to avoid blink
          setTimeout(function () {
              el.setSelectionRange(len, len);
          }, 1);
      },

      // Check if input field is fully selected
      checkFullSelection: function(value) {
        try {
          var selection = window.getSelection() || document.getSelection() || {};
          return selection.toString().length === value.length;
        } catch (ex) {
          // Ignore
        }

        return false;
      },

      setSelection: function (element, position, doc) {
          if (element !== this.getActiveElement(doc)) {
              return;
          }

          // cursor is already in the end
          if (element && element.value.length <= position) {
            return;
          }

          if (element.createTextRange) {
              var range = element.createTextRange();

              range.move('character', position);
              range.select();
          } else {
              try {
                  element.setSelectionRange(position, position);
              } catch (e) {
                  // eslint-disable-next-line
                  console.warn('The input element type does not support selection');
              }
          }
      },

      getActiveElement: function(parent) {
          var activeElement = parent.activeElement;
          if (activeElement && activeElement.shadowRoot) {
              return this.getActiveElement(activeElement.shadowRoot);
          }
          return activeElement;
      },

      isAndroid: function () {
          return navigator && /android/i.test(navigator.userAgent);
      },

      // On Android chrome, the keyup and keydown events
      // always return key code 229 as a composition that
      // buffers the user’s keystrokes
      // see https://github.com/nosir/cleave.js/issues/147
      isAndroidBackspaceKeydown: function (lastInputValue, currentInputValue) {
          if (!this.isAndroid() || !lastInputValue || !currentInputValue) {
              return false;
          }

          return currentInputValue === lastInputValue.slice(0, -1);
      }
  };

  var Util_1 = Util;

  /**
   * Props Assignment
   *
   * Separate this, so react module can share the usage
   */
  var DefaultProperties = {
      // Maybe change to object-assign
      // for now just keep it as simple
      assign: function (target, opts) {
          target = target || {};
          opts = opts || {};

          // credit card
          target.creditCard = !!opts.creditCard;
          target.creditCardStrictMode = !!opts.creditCardStrictMode;
          target.creditCardType = '';
          target.onCreditCardTypeChanged = opts.onCreditCardTypeChanged || (function () {});

          // phone
          target.phone = !!opts.phone;
          target.phoneRegionCode = opts.phoneRegionCode || 'AU';
          target.phoneFormatter = {};

          // time
          target.time = !!opts.time;
          target.timePattern = opts.timePattern || ['h', 'm', 's'];
          target.timeFormat = opts.timeFormat || '24';
          target.timeFormatter = {};

          // date
          target.date = !!opts.date;
          target.datePattern = opts.datePattern || ['d', 'm', 'Y'];
          target.dateMin = opts.dateMin || '';
          target.dateMax = opts.dateMax || '';
          target.dateFormatter = {};

          // numeral
          target.numeral = !!opts.numeral;
          target.numeralIntegerScale = opts.numeralIntegerScale > 0 ? opts.numeralIntegerScale : 0;
          target.numeralDecimalScale = opts.numeralDecimalScale >= 0 ? opts.numeralDecimalScale : 2;
          target.numeralDecimalMark = opts.numeralDecimalMark || '.';
          target.numeralThousandsGroupStyle = opts.numeralThousandsGroupStyle || 'thousand';
          target.numeralPositiveOnly = !!opts.numeralPositiveOnly;
          target.stripLeadingZeroes = opts.stripLeadingZeroes !== false;
          target.signBeforePrefix = !!opts.signBeforePrefix;
          target.tailPrefix = !!opts.tailPrefix;

          // others
          target.swapHiddenInput = !!opts.swapHiddenInput;
          
          target.numericOnly = target.creditCard || target.date || !!opts.numericOnly;

          target.uppercase = !!opts.uppercase;
          target.lowercase = !!opts.lowercase;

          target.prefix = (target.creditCard || target.date) ? '' : (opts.prefix || '');
          target.noImmediatePrefix = !!opts.noImmediatePrefix;
          target.prefixLength = target.prefix.length;
          target.rawValueTrimPrefix = !!opts.rawValueTrimPrefix;
          target.copyDelimiter = !!opts.copyDelimiter;

          target.initValue = (opts.initValue !== undefined && opts.initValue !== null) ? opts.initValue.toString() : '';

          target.delimiter =
              (opts.delimiter || opts.delimiter === '') ? opts.delimiter :
                  (opts.date ? '/' :
                      (opts.time ? ':' :
                          (opts.numeral ? ',' :
                              (opts.phone ? ' ' :
                                  ' '))));
          target.delimiterLength = target.delimiter.length;
          target.delimiterLazyShow = !!opts.delimiterLazyShow;
          target.delimiters = opts.delimiters || [];

          target.blocks = opts.blocks || [];
          target.blocksLength = target.blocks.length;

          target.root = (typeof commonjsGlobal === 'object' && commonjsGlobal) ? commonjsGlobal : window;
          target.document = opts.document || target.root.document;

          target.maxLength = 0;

          target.backspace = false;
          target.result = '';

          target.onValueChanged = opts.onValueChanged || (function () {});

          return target;
      }
  };

  var DefaultProperties_1 = DefaultProperties;

  /**
   * Construct a new Cleave instance by passing the configuration object
   *
   * @param {String | HTMLElement} element
   * @param {Object} opts
   */
  var Cleave = function (element, opts) {
      var owner = this;
      var hasMultipleElements = false;

      if (typeof element === 'string') {
          owner.element = document.querySelector(element);
          hasMultipleElements = document.querySelectorAll(element).length > 1;
      } else {
        if (typeof element.length !== 'undefined' && element.length > 0) {
          owner.element = element[0];
          hasMultipleElements = element.length > 1;
        } else {
          owner.element = element;
        }
      }

      if (!owner.element) {
          throw new Error('[cleave.js] Please check the element');
      }

      if (hasMultipleElements) {
        try {
          // eslint-disable-next-line
          console.warn('[cleave.js] Multiple input fields matched, cleave.js will only take the first one.');
        } catch (e) {
          // Old IE
        }
      }

      opts.initValue = owner.element.value;

      owner.properties = Cleave.DefaultProperties.assign({}, opts);

      owner.init();
  };

  Cleave.prototype = {
      init: function () {
          var owner = this, pps = owner.properties;

          // no need to use this lib
          if (!pps.numeral && !pps.phone && !pps.creditCard && !pps.time && !pps.date && (pps.blocksLength === 0 && !pps.prefix)) {
              owner.onInput(pps.initValue);

              return;
          }

          pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);

          owner.isAndroid = Cleave.Util.isAndroid();
          owner.lastInputValue = '';
          owner.isBackward = '';

          owner.onChangeListener = owner.onChange.bind(owner);
          owner.onKeyDownListener = owner.onKeyDown.bind(owner);
          owner.onFocusListener = owner.onFocus.bind(owner);
          owner.onCutListener = owner.onCut.bind(owner);
          owner.onCopyListener = owner.onCopy.bind(owner);

          owner.initSwapHiddenInput();

          owner.element.addEventListener('input', owner.onChangeListener);
          owner.element.addEventListener('keydown', owner.onKeyDownListener);
          owner.element.addEventListener('focus', owner.onFocusListener);
          owner.element.addEventListener('cut', owner.onCutListener);
          owner.element.addEventListener('copy', owner.onCopyListener);


          owner.initPhoneFormatter();
          owner.initDateFormatter();
          owner.initTimeFormatter();
          owner.initNumeralFormatter();

          // avoid touch input field if value is null
          // otherwise Firefox will add red box-shadow for <input required />
          if (pps.initValue || (pps.prefix && !pps.noImmediatePrefix)) {
              owner.onInput(pps.initValue);
          }
      },

      initSwapHiddenInput: function () {
          var owner = this, pps = owner.properties;
          if (!pps.swapHiddenInput) return;

          var inputFormatter = owner.element.cloneNode(true);
          owner.element.parentNode.insertBefore(inputFormatter, owner.element);

          owner.elementSwapHidden = owner.element;
          owner.elementSwapHidden.type = 'hidden';

          owner.element = inputFormatter;
          owner.element.id = '';
      },

      initNumeralFormatter: function () {
          var owner = this, pps = owner.properties;

          if (!pps.numeral) {
              return;
          }

          pps.numeralFormatter = new Cleave.NumeralFormatter(
              pps.numeralDecimalMark,
              pps.numeralIntegerScale,
              pps.numeralDecimalScale,
              pps.numeralThousandsGroupStyle,
              pps.numeralPositiveOnly,
              pps.stripLeadingZeroes,
              pps.prefix,
              pps.signBeforePrefix,
              pps.tailPrefix,
              pps.delimiter
          );
      },

      initTimeFormatter: function() {
          var owner = this, pps = owner.properties;

          if (!pps.time) {
              return;
          }

          pps.timeFormatter = new Cleave.TimeFormatter(pps.timePattern, pps.timeFormat);
          pps.blocks = pps.timeFormatter.getBlocks();
          pps.blocksLength = pps.blocks.length;
          pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);
      },

      initDateFormatter: function () {
          var owner = this, pps = owner.properties;

          if (!pps.date) {
              return;
          }

          pps.dateFormatter = new Cleave.DateFormatter(pps.datePattern, pps.dateMin, pps.dateMax);
          pps.blocks = pps.dateFormatter.getBlocks();
          pps.blocksLength = pps.blocks.length;
          pps.maxLength = Cleave.Util.getMaxLength(pps.blocks);
      },

      initPhoneFormatter: function () {
          var owner = this, pps = owner.properties;

          if (!pps.phone) {
              return;
          }

          // Cleave.AsYouTypeFormatter should be provided by
          // external google closure lib
          try {
              pps.phoneFormatter = new Cleave.PhoneFormatter(
                  new pps.root.Cleave.AsYouTypeFormatter(pps.phoneRegionCode),
                  pps.delimiter
              );
          } catch (ex) {
              throw new Error('[cleave.js] Please include phone-type-formatter.{country}.js lib');
          }
      },

      onKeyDown: function (event) {
          var owner = this,
              charCode = event.which || event.keyCode;

          owner.lastInputValue = owner.element.value;
          owner.isBackward = charCode === 8;
      },

      onChange: function (event) {
          var owner = this, pps = owner.properties,
              Util = Cleave.Util;

          owner.isBackward = owner.isBackward || event.inputType === 'deleteContentBackward';

          var postDelimiter = Util.getPostDelimiter(owner.lastInputValue, pps.delimiter, pps.delimiters);

          if (owner.isBackward && postDelimiter) {
              pps.postDelimiterBackspace = postDelimiter;
          } else {
              pps.postDelimiterBackspace = false;
          }

          this.onInput(this.element.value);
      },

      onFocus: function () {
          var owner = this,
              pps = owner.properties;
          owner.lastInputValue = owner.element.value;

          if (pps.prefix && pps.noImmediatePrefix && !owner.element.value) {
              this.onInput(pps.prefix);
          }

          Cleave.Util.fixPrefixCursor(owner.element, pps.prefix, pps.delimiter, pps.delimiters);
      },

      onCut: function (e) {
          if (!Cleave.Util.checkFullSelection(this.element.value)) return;
          this.copyClipboardData(e);
          this.onInput('');
      },

      onCopy: function (e) {
          if (!Cleave.Util.checkFullSelection(this.element.value)) return;
          this.copyClipboardData(e);
      },

      copyClipboardData: function (e) {
          var owner = this,
              pps = owner.properties,
              Util = Cleave.Util,
              inputValue = owner.element.value,
              textToCopy = '';

          if (!pps.copyDelimiter) {
              textToCopy = Util.stripDelimiters(inputValue, pps.delimiter, pps.delimiters);
          } else {
              textToCopy = inputValue;
          }

          try {
              if (e.clipboardData) {
                  e.clipboardData.setData('Text', textToCopy);
              } else {
                  window.clipboardData.setData('Text', textToCopy);
              }

              e.preventDefault();
          } catch (ex) {
              //  empty
          }
      },

      onInput: function (value) {
          var owner = this, pps = owner.properties,
              Util = Cleave.Util;

          // case 1: delete one more character "4"
          // 1234*| -> hit backspace -> 123|
          // case 2: last character is not delimiter which is:
          // 12|34* -> hit backspace -> 1|34*
          // note: no need to apply this for numeral mode
          var postDelimiterAfter = Util.getPostDelimiter(value, pps.delimiter, pps.delimiters);
          if (!pps.numeral && pps.postDelimiterBackspace && !postDelimiterAfter) {
              value = Util.headStr(value, value.length - pps.postDelimiterBackspace.length);
          }

          // phone formatter
          if (pps.phone) {
              if (pps.prefix && (!pps.noImmediatePrefix || value.length)) {
                  pps.result = pps.prefix + pps.phoneFormatter.format(value).slice(pps.prefix.length);
              } else {
                  pps.result = pps.phoneFormatter.format(value);
              }
              owner.updateValueState();

              return;
          }

          // numeral formatter
          if (pps.numeral) {
              // Do not show prefix when noImmediatePrefix is specified
              // This mostly because we need to show user the native input placeholder
              if (pps.prefix && pps.noImmediatePrefix && value.length === 0) {
                  pps.result = '';
              } else {
                  pps.result = pps.numeralFormatter.format(value);
              }
              owner.updateValueState();

              return;
          }

          // date
          if (pps.date) {
              value = pps.dateFormatter.getValidatedDate(value);
          }

          // time
          if (pps.time) {
              value = pps.timeFormatter.getValidatedTime(value);
          }

          // strip delimiters
          value = Util.stripDelimiters(value, pps.delimiter, pps.delimiters);

          // strip prefix
          value = Util.getPrefixStrippedValue(value, pps.prefix, pps.prefixLength, pps.result, pps.delimiter, pps.delimiters, pps.noImmediatePrefix, pps.tailPrefix, pps.signBeforePrefix);

          // strip non-numeric characters
          value = pps.numericOnly ? Util.strip(value, /[^\d]/g) : value;

          // convert case
          value = pps.uppercase ? value.toUpperCase() : value;
          value = pps.lowercase ? value.toLowerCase() : value;

          // prevent from showing prefix when no immediate option enabled with empty input value
          if (pps.prefix) {
              if (pps.tailPrefix) {
                  value = value + pps.prefix;
              } else {
                  value = pps.prefix + value;
              }


              // no blocks specified, no need to do formatting
              if (pps.blocksLength === 0) {
                  pps.result = value;
                  owner.updateValueState();

                  return;
              }
          }

          // update credit card props
          if (pps.creditCard) {
              owner.updateCreditCardPropsByValue(value);
          }

          // strip over length characters
          value = Util.headStr(value, pps.maxLength);

          // apply blocks
          pps.result = Util.getFormattedValue(
              value,
              pps.blocks, pps.blocksLength,
              pps.delimiter, pps.delimiters, pps.delimiterLazyShow
          );

          owner.updateValueState();
      },

      updateCreditCardPropsByValue: function (value) {
          var owner = this, pps = owner.properties,
              Util = Cleave.Util,
              creditCardInfo;

          // At least one of the first 4 characters has changed
          if (Util.headStr(pps.result, 4) === Util.headStr(value, 4)) {
              return;
          }

          creditCardInfo = Cleave.CreditCardDetector.getInfo(value, pps.creditCardStrictMode);

          pps.blocks = creditCardInfo.blocks;
          pps.blocksLength = pps.blocks.length;
          pps.maxLength = Util.getMaxLength(pps.blocks);

          // credit card type changed
          if (pps.creditCardType !== creditCardInfo.type) {
              pps.creditCardType = creditCardInfo.type;

              pps.onCreditCardTypeChanged.call(owner, pps.creditCardType);
          }
      },

      updateValueState: function () {
          var owner = this,
              Util = Cleave.Util,
              pps = owner.properties;

          if (!owner.element) {
              return;
          }

          var endPos = owner.element.selectionEnd;
          var oldValue = owner.element.value;
          var newValue = pps.result;

          endPos = Util.getNextCursorPosition(endPos, oldValue, newValue, pps.delimiter, pps.delimiters);

          // fix Android browser type="text" input field
          // cursor not jumping issue
          if (owner.isAndroid) {
              window.setTimeout(function () {
                  owner.element.value = newValue;
                  Util.setSelection(owner.element, endPos, pps.document, false);
                  owner.callOnValueChanged();
              }, 1);

              return;
          }

          owner.element.value = newValue;
          if (pps.swapHiddenInput) owner.elementSwapHidden.value = owner.getRawValue();

          Util.setSelection(owner.element, endPos, pps.document, false);
          owner.callOnValueChanged();
      },

      callOnValueChanged: function () {
          var owner = this,
              pps = owner.properties;

          pps.onValueChanged.call(owner, {
              target: {
                  name: owner.element.name,
                  value: pps.result,
                  rawValue: owner.getRawValue()
              }
          });
      },

      setPhoneRegionCode: function (phoneRegionCode) {
          var owner = this, pps = owner.properties;

          pps.phoneRegionCode = phoneRegionCode;
          owner.initPhoneFormatter();
          owner.onChange();
      },

      setRawValue: function (value) {
          var owner = this, pps = owner.properties;

          value = value !== undefined && value !== null ? value.toString() : '';

          if (pps.numeral) {
              value = value.replace('.', pps.numeralDecimalMark);
          }

          pps.postDelimiterBackspace = false;

          owner.element.value = value;
          owner.onInput(value);
      },

      getRawValue: function () {
          var owner = this,
              pps = owner.properties,
              Util = Cleave.Util,
              rawValue = owner.element.value;

          if (pps.rawValueTrimPrefix) {
              rawValue = Util.getPrefixStrippedValue(rawValue, pps.prefix, pps.prefixLength, pps.result, pps.delimiter, pps.delimiters, pps.noImmediatePrefix, pps.tailPrefix, pps.signBeforePrefix);
          }

          if (pps.numeral) {
              rawValue = pps.numeralFormatter.getRawValue(rawValue);
          } else {
              rawValue = Util.stripDelimiters(rawValue, pps.delimiter, pps.delimiters);
          }

          return rawValue;
      },

      getISOFormatDate: function () {
          var owner = this,
              pps = owner.properties;

          return pps.date ? pps.dateFormatter.getISOFormatDate() : '';
      },

      getISOFormatTime: function () {
          var owner = this,
              pps = owner.properties;

          return pps.time ? pps.timeFormatter.getISOFormatTime() : '';
      },

      getFormattedValue: function () {
          return this.element.value;
      },

      destroy: function () {
          var owner = this;

          owner.element.removeEventListener('input', owner.onChangeListener);
          owner.element.removeEventListener('keydown', owner.onKeyDownListener);
          owner.element.removeEventListener('focus', owner.onFocusListener);
          owner.element.removeEventListener('cut', owner.onCutListener);
          owner.element.removeEventListener('copy', owner.onCopyListener);
      },

      toString: function () {
          return '[Cleave Object]';
      }
  };

  Cleave.NumeralFormatter = NumeralFormatter_1;
  Cleave.DateFormatter = DateFormatter_1;
  Cleave.TimeFormatter = TimeFormatter_1;
  Cleave.PhoneFormatter = PhoneFormatter_1;
  Cleave.CreditCardDetector = CreditCardDetector_1;
  Cleave.Util = Util_1;
  Cleave.DefaultProperties = DefaultProperties_1;

  // for angular directive
  ((typeof commonjsGlobal === 'object' && commonjsGlobal) ? commonjsGlobal : window)['Cleave'] = Cleave;

  // CommonJS
  var Cleave_1 = Cleave;

  class MaskDollars {
    constructor() {
      let dollars = document.querySelectorAll('[data-js="dollars"]');

      for (let i = 0; i < dollars.length; i++) {
        new Cleave_1(dollars[i], {
          numeral: true,
          numeralThousandsGroupStyle: 'thousand'
        });

        dollars[i].addEventListener('blur', event => {
          let value = event.target.value;
          let postfix = '';

          if (`${value}`.indexOf('.') > -1) {
            let split = `${value}`.split('.');

            postfix = (split[1].length == 1) ? '0' : postfix;
            postfix = (split[1].length == 0) ? '00' : postfix;
            value += postfix;
          } else if (value != '') {
            value += '.00';
          }

          event.target.value = value;
        });
      }
    }
  }

  class MaskPhone {
    constructor() {
      let phones = document.querySelectorAll('[data-js="tel"]');

      for (let i = 0; i < phones.length; i++) {
        new Cleave_1(phones[i], {
          numericOnly: true,
          blocks: [0, 3, 0, 3, 4],
          delimiters: ['(', ')', ' ', '-']
        });
      }
    }
  }

  var e=/^(?:submit|button|image|reset|file)$/i,t=/^(?:input|select|textarea|keygen)/i,n=/(\[[^\[\]]*\])/g;function a(e,t,a){if(t.match(n))!function e(t,n,a){if(0===n.length)return a;var r=n.shift(),l=r.match(/^\[(.+?)\]$/);if("[]"===r)return t=t||[],Array.isArray(t)?t.push(e(null,n,a)):(t._values=t._values||[],t._values.push(e(null,n,a))),t;if(l){var i=l[1],u=+i;isNaN(u)?(t=t||{})[i]=e(t[i],n,a):(t=t||[])[u]=e(t[u],n,a);}else t[r]=e(t[r],n,a);return t}(e,function(e){var t=[],a=new RegExp(n),r=/^([^\[\]]*)/.exec(e);for(r[1]&&t.push(r[1]);null!==(r=a.exec(e));)t.push(r[1]);return t}(t),a);else {var r=e[t];r?(Array.isArray(r)||(e[t]=[r]),e[t].push(a)):e[t]=a;}return e}function r(e,t,n){return n=(n=String(n)).replace(/(\r)?\n/g,"\r\n"),n=(n=encodeURIComponent(n)).replace(/%20/g,"+"),e+(e?"&":"")+encodeURIComponent(t)+"="+n}function serialize$1(n,l){"object"!=typeof l?l={hash:!!l}:void 0===l.hash&&(l.hash=!0);for(var i=l.hash?{}:"",u=l.serializer||(l.hash?a:r),s=n&&n.elements?n.elements:[],c=Object.create(null),o=0;o<s.length;++o){var h=s[o];if((l.disabled||!h.disabled)&&h.name&&t.test(h.nodeName)&&!e.test(h.type)){var p=h.name,f=h.value;if("checkbox"!==h.type&&"radio"!==h.type||(h.checked?"on"===h.value?f=!0:"off"===h.value&&(f=!1):f=void 0),l.empty){if("checkbox"!==h.type||h.checked||(f=!1),"radio"===h.type&&(c[h.name]||h.checked?h.checked&&(c[h.name]=!0):c[h.name]=!1),null==f&&"radio"==h.type)continue}else if(!f)continue;if("select-multiple"!==h.type)i=u(i,p,f);else {f=[];for(var v=h.options,m=!1,d=0;d<v.length;++d){var y=v[d];y.selected&&(y.value||l.empty&&!y.value)&&(m=!0,i=l.hash&&"[]"!==p.slice(p.length-2)?u(i,p+"[]",y.value):u(i,p,y.value));}!m&&l.empty&&(i=u(i,p,""));}}}if(l.empty)for(var p in c)c[p]||(i=u(i,p,""));return i}

  /**
   * @class  The Newsletter module
   */
  class Newsletter {
    /**
     * @constructor
     *
     * @param   {Object}  element  The Newsletter DOM Object
     *
     * @return  {Class}            The instantiated Newsletter object
     */
    constructor(element) {
      this._el = element;

      this.keys = Newsletter.keys;

      this.endpoints = Newsletter.endpoints;

      this.selectors = Newsletter.selectors;

      this.selector = Newsletter.selector;

      this.stringKeys = Newsletter.stringKeys;

      this.strings = Newsletter.strings;

      this.templates = Newsletter.templates;

      this.classes = Newsletter.classes;

      this.callback = [
        Newsletter.callback,
        Math.random().toString().replace('0.', '')
      ].join('');

      // This sets the script callback function to a global function that
      // can be accessed by the the requested script.
      window[this.callback] = (data) => {
        this._callback(data);
      };

      this.form = new Forms(this._el.querySelector('form'));

      this.form.strings = this.strings;

      this.form.submit = (event) => {
        event.preventDefault();

        this._submit(event)
          .then(this._onload)
          .catch(this._onerror);
      };

      this.form.watch();

      return this;
    }

    /**
     * The form submission method. Requests a script with a callback function
     * to be executed on our page. The callback function will be passed the
     * response as a JSON object (function parameter).
     *
     * @param   {Event}    event  The form submission event
     *
     * @return  {Promise}         A promise containing the new script call
     */
    _submit(event) {
      event.preventDefault();

      // Serialize the data
      this._data = serialize$1(event.target, {hash: true});

      // Switch the action to post-json. This creates an endpoint for mailchimp
      // that acts as a script that can be loaded onto our page.
      let action = event.target.action.replace(
        `${this.endpoints.MAIN}?`, `${this.endpoints.MAIN_JSON}?`
      );

      // Add our params to the action
      action = action + serialize$1(event.target, {serializer: (...params) => {
        let prev = (typeof params[0] === 'string') ? params[0] : '';

        return `${prev}&${params[1]}=${params[2]}`;
      }});

      // Append the callback reference. Mailchimp will wrap the JSON response in
      // our callback method. Once we load the script the callback will execute.
      action = `${action}&c=window.${this.callback}`;

      // Create a promise that appends the script response of the post-json method
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');

        document.body.appendChild(script);
        script.onload = resolve;
        script.onerror = reject;
        script.async = true;
        script.src = encodeURI(action);
      });
    }

    /**
     * The script onload resolution
     *
     * @param   {Event}  event  The script on load event
     *
     * @return  {Class}         The Newsletter class
     */
    _onload(event) {
      event.path[0].remove();

      return this;
    }

    /**
     * The script on error resolution
     *
     * @param   {Object}  error  The script on error load event
     *
     * @return  {Class}          The Newsletter class
     */
    _onerror(error) {
      // eslint-disable-next-line no-console
      console.dir(error);

      return this;
    }

    /**
     * The callback function for the MailChimp Script call
     *
     * @param   {Object}  data  The success/error message from MailChimp
     *
     * @return  {Class}        The Newsletter class
     */
    _callback(data) {
      if (this[`_${data[this._key('MC_RESULT')]}`]) {
        this[`_${data[this._key('MC_RESULT')]}`](data.msg);
      } else {
        // eslint-disable-next-line no-console
        console.dir(data);
      }

      return this;
    }

    /**
     * Submission error handler
     *
     * @param   {string}  msg  The error message
     *
     * @return  {Class}        The Newsletter class
     */
    _error(msg) {
      this._elementsReset();
      this._messaging('WARNING', msg);

      return this;
    }

    /**
     * Submission success handler
     *
     * @param   {string}  msg  The success message
     *
     * @return  {Class}        The Newsletter class
     */
    _success(msg) {
      this._elementsReset();
      this._messaging('SUCCESS', msg);

      return this;
    }

    /**
     * Present the response message to the user
     *
     * @param   {String}  type  The message type
     * @param   {String}  msg   The message
     *
     * @return  {Class}         Newsletter
     */
    _messaging(type, msg = 'no message') {
      let strings = Object.keys(this.stringKeys);
      let handled = false;

      let alertBox = this._el.querySelector(this.selectors[type]);

      let alertBoxMsg = alertBox.querySelector(
        this.selectors.ALERT_TEXT
      );

      // Get the localized string, these should be written to the DOM already.
      // The utility contains a global method for retrieving them.
      let stringKeys = strings.filter(s => msg.includes(this.stringKeys[s]));
      msg = (stringKeys.length) ? this.strings[stringKeys[0]] : msg;
      handled = (stringKeys.length) ? true : false;

      // Replace string templates with values from either our form data or
      // the Newsletter strings object.
      for (let x = 0; x < this.templates.length; x++) {
        let template = this.templates[x];
        let key = template.replace('{{ ', '').replace(' }}', '');
        let value = this._data[key] || this.strings[key];
        let reg = new RegExp(template, 'gi');

        msg = msg.replace(reg, (value) ? value : '');
      }

      if (handled) {
        alertBoxMsg.innerHTML = msg;
      } else if (type === 'ERROR') {
        alertBoxMsg.innerHTML = this.strings.ERR_PLEASE_TRY_LATER;
      }

      if (alertBox) this._elementShow(alertBox, alertBoxMsg);

      return this;
    }

    /**
     * The main toggling method
     *
     * @return  {Class}  Newsletter
     */
    _elementsReset() {
      let targets = this._el.querySelectorAll(this.selectors.ALERTS);

      for (let i = 0; i < targets.length; i++)
        if (!targets[i].classList.contains(this.classes.HIDDEN)) {
          targets[i].classList.add(this.classes.HIDDEN);

          this.classes.ANIMATE.split(' ').forEach((item) =>
            targets[i].classList.remove(item)
          );

          // Screen Readers
          targets[i].setAttribute('aria-hidden', 'true');
          targets[i].querySelector(this.selectors.ALERT_TEXT)
            .setAttribute('aria-live', 'off');
        }

      return this;
    }

    /**
     * The main toggling method
     *
     * @param   {object}  target   Message container
     * @param   {object}  content  Content that changes dynamically that should
     *                             be announced to screen readers.
     *
     * @return  {Class}            Newsletter
     */
    _elementShow(target, content) {
      target.classList.toggle(this.classes.HIDDEN);

      this.classes.ANIMATE.split(' ').forEach((item) =>
        target.classList.toggle(item)
      );

      // Screen Readers
      target.setAttribute('aria-hidden', 'false');

      if (content) {
        content.setAttribute('aria-live', 'polite');
      }

      return this;
    }

    /**
     * A proxy function for retrieving the proper key
     *
     * @param   {string}  key  The reference for the stored keys.
     *
     * @return  {string}       The desired key.
     */
    _key(key) {
      return this.keys[key];
    }
  }

  /** @type  {Object}  API data keys */
  Newsletter.keys = {
    MC_RESULT: 'result',
    MC_MSG: 'msg'
  };

  /** @type  {Object}  API endpoints */
  Newsletter.endpoints = {
    MAIN: '/post',
    MAIN_JSON: '/post-json'
  };

  /** @type  {String}  The Mailchimp callback reference. */
  Newsletter.callback = 'NewsletterCallback';

  /** @type  {Object}  DOM selectors for the instance's concerns */
  Newsletter.selectors = {
    ELEMENT: '[data-js="newsletter"]',
    ALERTS: '[data-js*="alert"]',
    WARNING: '[data-js="alert-warning"]',
    SUCCESS: '[data-js="alert-success"]',
    ALERT_TEXT: '[data-js-alert="text"]'
  };

  /** @type  {String}  The main DOM selector for the instance */
  Newsletter.selector = Newsletter.selectors.ELEMENT;

  /** @type  {Object}  String references for the instance */
  Newsletter.stringKeys = {
    SUCCESS_CONFIRM_EMAIL: 'Almost finished...',
    ERR_PLEASE_ENTER_VALUE: 'Please enter a value',
    ERR_TOO_MANY_RECENT: 'too many',
    ERR_ALREADY_SUBSCRIBED: 'is already subscribed',
    ERR_INVALID_EMAIL: 'looks fake or invalid'
  };

  /** @type  {Object}  Available strings */
  Newsletter.strings = {
    VALID_REQUIRED: 'This field is required.',
    VALID_EMAIL_REQUIRED: 'Email is required.',
    VALID_EMAIL_INVALID: 'Please enter a valid email.',
    VALID_CHECKBOX_BOROUGH: 'Please select a borough.',
    ERR_PLEASE_TRY_LATER: 'There was an error with your submission. ' +
                          'Please try again later.',
    SUCCESS_CONFIRM_EMAIL: 'Almost finished... We need to confirm your email ' +
                           'address. To complete the subscription process, ' +
                           'please click the link in the email we just sent you.',
    ERR_PLEASE_ENTER_VALUE: 'Please enter a value',
    ERR_TOO_MANY_RECENT: 'Recipient "{{ EMAIL }}" has too ' +
                         'many recent signup requests',
    ERR_ALREADY_SUBSCRIBED: '{{ EMAIL }} is already subscribed ' +
                            'to list {{ LIST_NAME }}.',
    ERR_INVALID_EMAIL: 'This email address looks fake or invalid. ' +
                       'Please enter a real email address.',
    LIST_NAME: 'Newsletter'
  };

  /** @type  {Array}  Placeholders that will be replaced in message strings */
  Newsletter.templates = [
    '{{ EMAIL }}',
    '{{ LIST_NAME }}'
  ];

  Newsletter.classes = {
    ANIMATE: 'animated fadeInUp',
    HIDDEN: 'hidden'
  };

  class SetHeightProperties {
    constructor (s) {
      this.elements = (s.elements) ? s.elements : SetHeightProperties.elements;

      for (let i = 0; i < this.elements.length; i++) {
        if (document.querySelector(this.elements[i]['selector'])) {
          window.addEventListener('load', () => this.setProperty(this.elements[i]));
          window.addEventListener('resize', () => this.setProperty(this.elements[i]));
        } else {
          document.documentElement.style.setProperty(this.elements[i]['property'], '0px');
        }
      }
    }

    setProperty(e) {
      let element = document.querySelector(e['selector']);

      document.documentElement.style.setProperty(e['property'], `${element.clientHeight}px`);
    }
  }

  SetHeightProperties.elements = [];

  /**
   * Cycles through a predefined object of theme classnames and toggles them on
   * the document element based on a click event. Uses local storage to save and
   * refer to a user's preference based on the last theme selected.
   */
  class Themes {
    /**
     * @constructor
     *
     * @param   {Object}  s  The settings object, may include 'storage',
     *                       'selectors', or 'theme' attributes
     *
     * @return  {Class}      The constructed instance of Themes.
     */
    constructor(s = {}) {
      /**
       * Settings
       */

      this.storage = (s.hasOwnProperty('storage')) ?
        Object.assign(Themes.storage, s.storage) : Themes.storage;

      this.selectors = (s.hasOwnProperty('selectors')) ?
        Object.assign(Themes.selectors, s.selectors) : Themes.selectors;

      this.themes = (s.hasOwnProperty('themes')) ? s.themes : Themes.themes;

      this.after = (s.hasOwnProperty('after')) ? s.after : Themes.after;

      this.before = (s.hasOwnProperty('before')) ? s.before : Themes.before;

      /**
       * Get initial user preference
       */

      this.preference = localStorage.getItem(this.storage.THEME);

      if (this.preference)
        this.set(JSON.parse(this.preference));

      /**
       * Add event listeners
       */

      document.querySelector('body').addEventListener('click', event => {
        if (!event.target.matches(this.selectors.TOGGLE))
          return;

        this.target = event.target;

        this.before(this);

        this.click(event);
      });

      return this;
    }

    /**
     * The click handler for theme cycling.
     *
     * @param   {Object}  event  The original click event that invoked the method
     *
     * @return  {Class}          The Themes instance
     */
    click(event) {
      // Get available theme classnames
      let cycle = this.themes.map(t => t.classname);

      // Check to see if the document has any of the theme class settings already
      let intersection = cycle.filter(item => {
        return [...document.documentElement.classList].includes(item)
      });

      // Find the starting index
      let start = (intersection.length === 0) ? 0 : cycle.indexOf(intersection[0]);
      let theme = (typeof cycle[start + 1] === 'undefined') ? cycle[0] : cycle[start + 1];

      // Toggle elements
      this.remove(this.themes.find(t => t.classname === cycle[start]))
        .set(this.themes.find(t => t.classname === theme));

      return this;
    }

    /**
     * The remove method for the theme. Resets all element classes and local storage.
     *
     * @param   {Object}  theme  The theme to remove
     *
     * @return  {Class}          The Themes instance
     */
    remove(theme) {
      document.documentElement.classList.remove(theme.classname);

      document.querySelectorAll(this.selectors.TOGGLE)
        .forEach(element => {
          element.classList.remove(`${theme.classname}${this.selectors.ACTIVE}`);
        });

      localStorage.removeItem(this.storage.THEME);

      return this;
    }

    /**
     * The setter method for theme. Adds element classes and sets local storage.
     *
     * @param   {Object}  theme  The theme object including classname and label
     *
     * @return  {Class}          The Themes instance
     */
    set(theme) {
      this.theme = theme;

      document.documentElement.classList.add(this.theme.classname);

      document.querySelectorAll(this.selectors.TOGGLE)
        .forEach(element => {
          element.classList.add(`${this.theme.classname}${this.selectors.ACTIVE}`);
        });

      document.querySelectorAll(this.selectors.LABEL)
        .forEach(element => {
          element.textContent = this.theme.label;
        });

      localStorage.setItem(this.storage.THEME, JSON.stringify(theme));

      this.after(this);

      return this;
    }
  }
  /**
   * The storage keys used by the script for local storage. The default is
   * `--nyco-theme` for the theme preference.
   *
   * @var {Object}
   */
  Themes.storage = {
    THEME: '--nyco-theme'
  };

  /**
   * The selectors for various elements queried by the utility. Refer to the
   * source for defaults.
   *
   * @var {Object}
   */
  Themes.selectors = {
    TOGGLE: '[data-js="themes"]',
    LABEL: '[data-js-themes="label"]',
    ACTIVE: ':active'
  };

  /**
   * The predefined theme Objects to cycle through, each with a corresponding
   * human-readable text label and classname. The default includes two themes;
   * `default` labelled "Light" theme and `dark` labelled "Dark".
   *
   * @var {Array}
   */
  Themes.themes = [
    {
      label: 'Light',
      classname: 'default'
    },
    {
      label: 'Dark',
      classname: 'dark'
    }
  ];

  /**
   * Before hook
   *
   * @return  {Function}  Triggers before the click event.
   */
  Themes.before = () => {};

  /**
   * After hook
   *
   * @return  {Function}  Triggers after the click event.
   */
  Themes.after = () => {};

  /**
   * Tracking bus for Google analytics and Webtrends.
   */
  class Track {
    constructor(s) {
      const body = document.querySelector('body');

      s = (!s) ? {} : s;

      this._settings = {
        selector: (s.selector) ? s.selector : Track.selector,
      };

      this.desinations = Track.destinations;

      body.addEventListener('click', (event) => {
        if (!event.target.matches(this._settings.selector))
          return;

        let key = event.target.dataset.trackKey;
        let data = JSON.parse(event.target.dataset.trackData);

        this.track(key, data);
      });

      return this;
    }

    /**
     * Tracking function wrapper
     *
     * @param  {String}      key   The key or event of the data
     * @param  {Collection}  data  The data to track
     *
     * @return {Object}            The final data object
     */
    track(key, data) {
      // Set the path name based on the location
      const d = data.map(el => {
          if (el.hasOwnProperty(Track.key))
            el[Track.key] = `${window.location.pathname}/${el[Track.key]}`;
          return el;
        });

      let wt = this.webtrends(key, d);
      let ga = this.gtag(key, d);

      /* eslint-disable no-console */
      console.dir({'Track': [wt, ga]});
      /* eslint-enable no-console */

      return d;
    };

    /**
     * Data bus for tracking views in Webtrends and Google Analytics
     *
     * @param  {String}      app   The name of the Single Page Application to track
     * @param  {String}      key   The key or event of the data
     * @param  {Collection}  data  The data to track
     */
    view(app, key, data) {
      let wt = this.webtrends(key, data);
      let ga = this.gtagView(app, key);

      /* eslint-disable no-console */
      console.dir({'Track': [wt, ga]});
      /* eslint-enable no-console */
    };

    /**
     * Push Events to Webtrends
     *
     * @param  {String}      key   The key or event of the data
     * @param  {Collection}  data  The data to track
     */
    webtrends(key, data) {
      if (
        typeof Webtrends === 'undefined' ||
        typeof data === 'undefined' ||
        !this.desinations.includes('webtrends')
      )
        return false;

      let event = [{
        'WT.ti': key
      }];

      if (data[0] && data[0].hasOwnProperty(Track.key))
        event.push({
          'DCS.dcsuri': data[0][Track.key]
        });
      else
        Object.assign(event, data);

      // Format data for Webtrends
      let wtd = {argsa: event.flatMap(e => {
        return Object.keys(e).flatMap(k => [k, e[k]]);
      })};

      // If 'action' is used as the key (for gtag.js), switch it to Webtrends
      let action = data.argsa.indexOf('action');

      if (action) data.argsa[action] = 'DCS.dcsuri';

      // Webtrends doesn't send the page view for MultiTrack, add path to url
      let dcsuri = data.argsa.indexOf('DCS.dcsuri');

      if (dcsuri)
        data.argsa[dcsuri + 1] = window.location.pathname + data.argsa[dcsuri + 1];

      /* eslint-disable no-undef */
      if (typeof Webtrends !== 'undefined')
        Webtrends.multiTrack(wtd);
      /* eslint-disable no-undef */

      return ['Webtrends', wtd];
    };

    /**
     * Push Click Events to Google Analytics
     *
     * @param  {String}      key   The key or event of the data
     * @param  {Collection}  data  The data to track
     */
    gtag(key, data) {
      if (
        typeof gtag === 'undefined' ||
        typeof data === 'undefined' ||
        !this.desinations.includes('gtag')
      )
        return false;

      let uri = data.find((element) => element.hasOwnProperty(Track.key));

      let event = {
        'event_category': key
      };

      /* eslint-disable no-undef */
      gtag(Track.key, uri[Track.key], event);
      /* eslint-enable no-undef */

      return ['gtag', Track.key, uri[Track.key], event];
    };

    /**
     * Push Screen View Events to Google Analytics
     *
     * @param  {String}  app  The name of the application
     * @param  {String}  key  The key or event of the data
     */
    gtagView(app, key) {
      if (
        typeof gtag === 'undefined' ||
        typeof data === 'undefined' ||
        !this.desinations.includes('gtag')
      )
        return false;

      let view = {
        app_name: app,
        screen_name: key
      };

      /* eslint-disable no-undef */
      gtag('event', 'screen_view', view);
      /* eslint-enable no-undef */

      return ['gtag', Track.key, 'screen_view', view];
    };
  }

  /** @type {String} The main selector to add the tracking function to */
  Track.selector = '[data-js*="track"]';

  /** @type {String} The main event tracking key to map to Webtrends DCS.uri */
  Track.key = 'event';

  /** @type {Array} What destinations to push data to */
  Track.destinations = [
    'webtrends',
    'gtag'
  ];

  /**
   * A wrapper around the navigator.share() API
   */
  class WebShare {
    /**
     * @constructor
     */
    constructor(s = {}) {
      this.selector = (s.selector) ? s.selector : WebShare.selector;

      this.callback = (s.callback) ? s.callback : WebShare.callback;

      this.fallback = (s.fallback) ? s.fallback : WebShare.fallback;

      this.fallbackCondition = (s.fallbackCondition) ? s.fallbackCondition : WebShare.fallbackCondition;

      if (this.fallbackCondition()) {
        // Remove fallback aria toggling attributes
        document.querySelectorAll(this.selector).forEach(item => {
          item.removeAttribute('aria-controls');
          item.removeAttribute('aria-expanded');
        });

        // Add event listener for the share click
        document.querySelector('body').addEventListener('click', event => {
          if (!event.target.matches(this.selector))
            return;

          this.element = event.target;

          this.data = JSON.parse(this.element.dataset.webShare);

          this.share(this.data);
        });
      } else
        this.fallback(); // Execute the fallback

      return this;
    }

    /**
     * Web Share API handler
     *
     * @param   {Object}  data  An object containing title, url, and text.
     *
     * @return  {Promise}       The response of the .share() method.
     */
    share(data = {}) {
      return navigator.share(data)
        .then(res => {
          this.callback(data);
        }).catch(err => {
          console.dir(err);
        });
    }
  }

  /** The html selector for the component */
  WebShare.selector = '[data-js*="web-share"]';

  /** Placeholder callback for a successful send */
  WebShare.callback = () => {
    console.dir('Success!');
  };

  /** Placeholder for the WebShare fallback */
  WebShare.fallback = () => {
    console.dir('Fallback!');
  };

  /** Conditional function for the Web Share fallback */
  WebShare.fallbackCondition = () => {
    return navigator.share;
  };

  /**
   * @class  Set the the css variable '--100vh' to the size of the Window's inner height.
   */
  class WindowVh {
    /**
     * @constructor  Set event listeners
     */
    constructor(s = {}) {
      this.property = (s.property) ? s.property : WindowVh.property;

      window.addEventListener('load', () => {this.set();});

      window.addEventListener('resize', () => {this.set();});

      return this;
    }

    /**
     * Sets the css variable property
     */
    set() {
      document.documentElement.style
        .setProperty(this.property, `${window.innerHeight}px`);
    }
  }

  /** @param  {String}  property  The css variable string to set */
  WindowVh.property = '--100vh';

  class CodeHighlight {
    /**
     * Initializes Highlight.js
     *
     * @return  {Object}  Instance of Code
     */
    constructor(s = {}) {
      this.link = (s.hasOwnProperty('link')) ? s.link : CodeHighlight.link;

      this.script = (s.hasOwnProperty('script')) ? s.script : CodeHighlight.script;

      this.syntax = (s.hasOwnProperty('syntax')) ? s.syntax : CodeHighlight.syntax;

      this.callback = (s.hasOwnProperty('callback')) ? s.callback : CodeHighlight.callback;

      /**
       * Link
       */

      if (this.link) {
        let link = document.createElement('link');

        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', this.link);

        document.head.appendChild(link);
      }

      /**
       * Script
       */

      if (this.script) {
        let script = document.createElement('script');

        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', this.script);

        script.onload = () => {
          if (this.callback) {
            this.callback(this.syntax);
          }
        };

        document.head.appendChild(script);
      }

      return this;
    }
  }

  /** @var  {String}  link  CDN for the hightlight.js CSS */
  CodeHighlight.link = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/default.min.css';

  /** @var  {String}  script  CDN for the hightlight.js Script */
  CodeHighlight.script = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/highlight.min.js';

  CodeHighlight.syntax = ['html', 'javascript', 'css', 'sass'];

  /** @var  {Function}  callback  Method to execute when the highlight.js script loads */
  CodeHighlight.callback = function(syntax) {
    hljs.configure({
      languages: syntax
    });

    document.querySelectorAll('pre').forEach(function(pre) {
      if (!pre.hasAttribute('tabindex')) {
        pre.setAttribute('tabindex', '0');
      }

      hljs.highlightBlock(pre);
    });
  };

  /**
   * The Accordion module
   * @class
   */
  class Accordion {
    /**
     * @constructor
     *
     * @return {object} The class
     */
    constructor() {
      this._toggle = new Toggle({
        selector: Accordion.selector
      });

      return this;
    }
  }

  /**
   * The dom selector for the module
   *
   * @type {String}
   */
  Accordion.selector = '[data-js*="accordion"]';

  /**
   * A wrapper around Intersection Observer class
   */
  class Observe {
    constructor(s = {}) {
      if (!s.element) return;

      this.options = (s.options) ? Object.assign(Observe.options, s.options) : Observe.options;

      this.trigger = (s.trigger) ? s.trigger : Observe.trigger;

      this.selectors = (s.selectors) ? s.selectors : Observe.selectors;

      // Instantiate the Intersection Observer
      this.observer = new IntersectionObserver((entries, observer) => {
        this.callback(entries, observer);
      }, this.options);

      // Select all of the items to observe
      let selectorItem = this.selectors.ITEM.replace('{{ item }}',
          s.element.dataset[this.selectors.ITEMS_ATTR]);

      this.items = s.element.querySelectorAll(selectorItem);

      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];

        this.observer.observe(item);
      }
    }

    callback(entries, observer) {
      let prevEntry = entries[0];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        this.trigger(entry, prevEntry, observer);

        prevEntry = entry;
      }
    }
  }

  /** Options for the Intersection Observer API */
  Observe.options = {
    root: null,
    rootMargin: '0px',
    threshold: [0.15]
  };

  /** Placeholder entry function for what happens with items are observed */
  Observe.trigger = entry => {
    console.dir(entry);
    console.dir('Observed! Create a entry trigger function and pass it to the instantiated Observe settings object.');
  };

  /** Main selector for the utility */
  Observe.selector = '[data-js*="observe"]';

  /** Misc. selectors for the observer utility */
  Observe.selectors = {
    ITEM: '[data-js-observe-item="{{ item }}"]',
    ITEMS_ATTR: 'jsObserveItems'
  };

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

  /* eslint-env browser */

  class Disclaimer {
    constructor() {
      this.selectors = Disclaimer.selectors;

      this.classes = Disclaimer.classes;

      document.querySelector('body').addEventListener('click', event => {
        if (!event.target.matches(this.selectors.TOGGLE))
          return;

        this.toggle(event);
      });
    }

    /**
     * Toggles the disclaimer to be visible or invisible
     *
     * @param   {object}  event  The body click event
     *
     * @return  {object}         The disclaimer class
     */
    toggle(event) {
      event.preventDefault();

      let id = event.target.getAttribute('aria-describedby');

      let active = `[aria-describedby="${id}"].${this.classes.ACTIVE}`;

      let triggersActive = document.querySelectorAll(active);
      let disclaimer = document.querySelector(`#${id}`);

      if (triggersActive.length > 0 && disclaimer) {
        disclaimer.classList.remove(this.classes.HIDDEN);
        disclaimer.classList.add(this.classes.ANIMATED);
        disclaimer.classList.add(this.classes.ANIMATION);
        disclaimer.setAttribute('aria-hidden', false);

        // Scroll-to functionality for mobile
        if (window.scrollTo && window.innerWidth < 960) {
          let offset = event.target.offsetTop - event.target.dataset.disclaimerScrollOffset;

          window.scrollTo(0, offset);
        }
      } else {
        disclaimer.classList.add(this.classes.HIDDEN);
        disclaimer.classList.remove(this.classes.ANIMATED);
        disclaimer.classList.remove(this.classes.ANIMATION);
        disclaimer.setAttribute('aria-hidden', true);
      }

      return this;
    }
  }

  Disclaimer.selectors = {
    TOGGLE: '[data-js*="disclaimer"]'
  };

  Disclaimer.classes = {
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    ANIMATED: 'animated',
    ANIMATION: 'fadeInUp'
  };

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

  var freeGlobal$1 = freeGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal$1 || freeSelf || Function('return this')();

  var root$1 = root;

  /** Built-in value references. */
  var Symbol = root$1.Symbol;

  var Symbol$1 = Symbol;

  /** Used for built-in method references. */
  var objectProto$b = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$9 = objectProto$b.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString$1 = objectProto$b.toString;

  /** Built-in value references. */
  var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty$9.call(value, symToStringTag$1),
        tag = value[symToStringTag$1];

    try {
      value[symToStringTag$1] = undefined;
      var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString$1.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag$1] = tag;
      } else {
        delete value[symToStringTag$1];
      }
    }
    return result;
  }

  /** Used for built-in method references. */
  var objectProto$a = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto$a.toString;

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }

  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
      undefinedTag = '[object Undefined]';

  /** Built-in value references. */
  var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag && symToStringTag in Object(value))
      ? getRawTag(value)
      : objectToString(value);
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
      funcTag$1 = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value);
    return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root$1['__core-js_shared__'];

  var coreJsData$1 = coreJsData;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }

  /** Used for built-in method references. */
  var funcProto$2 = Function.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$2 = funcProto$2.toString;

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString$2.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for built-in method references. */
  var funcProto$1 = Function.prototype,
      objectProto$9 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$8 = objectProto$9.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString$1.call(hasOwnProperty$8).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }

  var defineProperty = (function() {
    try {
      var func = getNative(Object, 'defineProperty');
      func({}, '', {});
      return func;
    } catch (e) {}
  }());

  var defineProperty$1 = defineProperty;

  /**
   * The base implementation of `assignValue` and `assignMergeValue` without
   * value checks.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function baseAssignValue(object, key, value) {
    if (key == '__proto__' && defineProperty$1) {
      defineProperty$1(object, key, {
        'configurable': true,
        'enumerable': true,
        'value': value,
        'writable': true
      });
    } else {
      object[key] = value;
    }
  }

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  /** Used for built-in method references. */
  var objectProto$8 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$7 = objectProto$8.hasOwnProperty;

  /**
   * Assigns `value` to `key` of `object` if the existing value is not equivalent
   * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignValue(object, key, value) {
    var objValue = object[key];
    if (!(hasOwnProperty$7.call(object, key) && eq(objValue, value)) ||
        (value === undefined && !(key in object))) {
      baseAssignValue(object, key, value);
    }
  }

  /**
   * Copies properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy properties from.
   * @param {Array} props The property identifiers to copy.
   * @param {Object} [object={}] The object to copy properties to.
   * @param {Function} [customizer] The function to customize copied values.
   * @returns {Object} Returns `object`.
   */
  function copyObject(source, props, object, customizer) {
    var isNew = !object;
    object || (object = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
      var key = props[index];

      var newValue = customizer
        ? customizer(object[key], source[key], key, object, source)
        : undefined;

      if (newValue === undefined) {
        newValue = source[key];
      }
      if (isNew) {
        baseAssignValue(object, key, newValue);
      } else {
        assignValue(object, key, newValue);
      }
    }
    return object;
  }

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  /**
   * A faster alternative to `Function#apply`, this function invokes `func`
   * with the `this` binding of `thisArg` and the arguments of `args`.
   *
   * @private
   * @param {Function} func The function to invoke.
   * @param {*} thisArg The `this` binding of `func`.
   * @param {Array} args The arguments to invoke `func` with.
   * @returns {*} Returns the result of `func`.
   */
  function apply(func, thisArg, args) {
    switch (args.length) {
      case 0: return func.call(thisArg);
      case 1: return func.call(thisArg, args[0]);
      case 2: return func.call(thisArg, args[0], args[1]);
      case 3: return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
  }

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max;

  /**
   * A specialized version of `baseRest` which transforms the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @param {Function} transform The rest array transform.
   * @returns {Function} Returns the new function.
   */
  function overRest(func, start, transform) {
    start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
    return function() {
      var args = arguments,
          index = -1,
          length = nativeMax(args.length - start, 0),
          array = Array(length);

      while (++index < length) {
        array[index] = args[start + index];
      }
      index = -1;
      var otherArgs = Array(start + 1);
      while (++index < start) {
        otherArgs[index] = args[index];
      }
      otherArgs[start] = transform(array);
      return apply(func, this, otherArgs);
    };
  }

  /**
   * Creates a function that returns `value`.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {*} value The value to return from the new function.
   * @returns {Function} Returns the new constant function.
   * @example
   *
   * var objects = _.times(2, _.constant({ 'a': 1 }));
   *
   * console.log(objects);
   * // => [{ 'a': 1 }, { 'a': 1 }]
   *
   * console.log(objects[0] === objects[1]);
   * // => true
   */
  function constant(value) {
    return function() {
      return value;
    };
  }

  /**
   * The base implementation of `setToString` without support for hot loop shorting.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var baseSetToString = !defineProperty$1 ? identity : function(func, string) {
    return defineProperty$1(func, 'toString', {
      'configurable': true,
      'enumerable': false,
      'value': constant(string),
      'writable': true
    });
  };

  var baseSetToString$1 = baseSetToString;

  /** Used to detect hot functions by number of calls within a span of milliseconds. */
  var HOT_COUNT = 800,
      HOT_SPAN = 16;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeNow = Date.now;

  /**
   * Creates a function that'll short out and invoke `identity` instead
   * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
   * milliseconds.
   *
   * @private
   * @param {Function} func The function to restrict.
   * @returns {Function} Returns the new shortable function.
   */
  function shortOut(func) {
    var count = 0,
        lastCalled = 0;

    return function() {
      var stamp = nativeNow(),
          remaining = HOT_SPAN - (stamp - lastCalled);

      lastCalled = stamp;
      if (remaining > 0) {
        if (++count >= HOT_COUNT) {
          return arguments[0];
        }
      } else {
        count = 0;
      }
      return func.apply(undefined, arguments);
    };
  }

  /**
   * Sets the `toString` method of `func` to return `string`.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var setToString = shortOut(baseSetToString$1);

  var setToString$1 = setToString;

  /**
   * The base implementation of `_.rest` which doesn't validate or coerce arguments.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @returns {Function} Returns the new function.
   */
  function baseRest(func, start) {
    return setToString$1(overRest(func, start, identity), func + '');
  }

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$1 = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
  }

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER : length;

    return !!length &&
      (type == 'number' ||
        (type != 'symbol' && reIsUint.test(value))) &&
          (value > -1 && value % 1 == 0 && value < length);
  }

  /**
   * Checks if the given arguments are from an iteratee call.
   *
   * @private
   * @param {*} value The potential iteratee value argument.
   * @param {*} index The potential iteratee index or key argument.
   * @param {*} object The potential iteratee object argument.
   * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
   *  else `false`.
   */
  function isIterateeCall(value, index, object) {
    if (!isObject(object)) {
      return false;
    }
    var type = typeof index;
    if (type == 'number'
          ? (isArrayLike(object) && isIndex(index, object.length))
          : (type == 'string' && index in object)
        ) {
      return eq(object[index], value);
    }
    return false;
  }

  /**
   * Creates a function like `_.assign`.
   *
   * @private
   * @param {Function} assigner The function to assign values.
   * @returns {Function} Returns the new assigner function.
   */
  function createAssigner(assigner) {
    return baseRest(function(object, sources) {
      var index = -1,
          length = sources.length,
          customizer = length > 1 ? sources[length - 1] : undefined,
          guard = length > 2 ? sources[2] : undefined;

      customizer = (assigner.length > 3 && typeof customizer == 'function')
        ? (length--, customizer)
        : undefined;

      if (guard && isIterateeCall(sources[0], sources[1], guard)) {
        customizer = length < 3 ? undefined : customizer;
        length = 1;
      }
      object = Object(object);
      while (++index < length) {
        var source = sources[index];
        if (source) {
          assigner(object, source, index, customizer);
        }
      }
      return object;
    });
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }

  /** `Object#toString` result references. */
  var argsTag$1 = '[object Arguments]';

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag$1;
  }

  /** Used for built-in method references. */
  var objectProto$7 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

  /** Built-in value references. */
  var propertyIsEnumerable = objectProto$7.propertyIsEnumerable;

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
    return isObjectLike(value) && hasOwnProperty$6.call(value, 'callee') &&
      !propertyIsEnumerable.call(value, 'callee');
  };

  var isArguments$1 = isArguments;

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  var isArray$1 = isArray;

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  /** Detect free variable `exports`. */
  var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

  /** Built-in value references. */
  var Buffer = moduleExports$1 ? root$1.Buffer : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse;

  var isBuffer$1 = isBuffer;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag$1 = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag$1 = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag$1] = typedArrayTags[funcTag] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag$1] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike(value) &&
      isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  /** Detect free variable `exports`. */
  var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal$1.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  var nodeUtil$1 = nodeUtil;

  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil$1 && nodeUtil$1.isTypedArray;

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

  var isTypedArray$1 = isTypedArray;

  /** Used for built-in method references. */
  var objectProto$6 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray$1(value),
        isArg = !isArr && isArguments$1(value),
        isBuff = !isArr && !isArg && isBuffer$1(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray$1(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty$5.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }

  /** Used for built-in method references. */
  var objectProto$5 = Object.prototype;

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;

    return value === proto;
  }

  /**
   * This function is like
   * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * except that it includes inherited enumerable properties.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function nativeKeysIn(object) {
    var result = [];
    if (object != null) {
      for (var key in Object(object)) {
        result.push(key);
      }
    }
    return result;
  }

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$4 = objectProto$4.hasOwnProperty;

  /**
   * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeysIn(object) {
    if (!isObject(object)) {
      return nativeKeysIn(object);
    }
    var isProto = isPrototype(object),
        result = [];

    for (var key in object) {
      if (!(key == 'constructor' && (isProto || !hasOwnProperty$4.call(object, key)))) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Creates an array of the own and inherited enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keysIn(new Foo);
   * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
   */
  function keysIn(object) {
    return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
  }

  /**
   * This method is like `_.assignIn` except that it accepts `customizer`
   * which is invoked to produce the assigned values. If `customizer` returns
   * `undefined`, assignment is handled by the method instead. The `customizer`
   * is invoked with five arguments: (objValue, srcValue, key, object, source).
   *
   * **Note:** This method mutates `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @alias extendWith
   * @category Object
   * @param {Object} object The destination object.
   * @param {...Object} sources The source objects.
   * @param {Function} [customizer] The function to customize assigned values.
   * @returns {Object} Returns `object`.
   * @see _.assignWith
   * @example
   *
   * function customizer(objValue, srcValue) {
   *   return _.isUndefined(objValue) ? srcValue : objValue;
   * }
   *
   * var defaults = _.partialRight(_.assignInWith, customizer);
   *
   * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
   * // => { 'a': 1, 'b': 2 }
   */
  var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
    copyObject(source, keysIn(source), object, customizer);
  });

  var assignInWith$1 = assignInWith;

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  /** Built-in value references. */
  var getPrototype = overArg(Object.getPrototypeOf, Object);

  var getPrototype$1 = getPrototype;

  /** `Object#toString` result references. */
  var objectTag = '[object Object]';

  /** Used for built-in method references. */
  var funcProto = Function.prototype,
      objectProto$3 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$3.hasOwnProperty;

  /** Used to infer the `Object` constructor. */
  var objectCtorString = funcToString.call(Object);

  /**
   * Checks if `value` is a plain object, that is, an object created by the
   * `Object` constructor or one with a `[[Prototype]]` of `null`.
   *
   * @static
   * @memberOf _
   * @since 0.8.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   * }
   *
   * _.isPlainObject(new Foo);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   *
   * _.isPlainObject(Object.create(null));
   * // => true
   */
  function isPlainObject(value) {
    if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
      return false;
    }
    var proto = getPrototype$1(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty$3.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor &&
      funcToString.call(Ctor) == objectCtorString;
  }

  /** `Object#toString` result references. */
  var domExcTag = '[object DOMException]',
      errorTag = '[object Error]';

  /**
   * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
   * `SyntaxError`, `TypeError`, or `URIError` object.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
   * @example
   *
   * _.isError(new Error);
   * // => true
   *
   * _.isError(Error);
   * // => false
   */
  function isError(value) {
    if (!isObjectLike(value)) {
      return false;
    }
    var tag = baseGetTag(value);
    return tag == errorTag || tag == domExcTag ||
      (typeof value.message == 'string' && typeof value.name == 'string' && !isPlainObject(value));
  }

  /**
   * Attempts to invoke `func`, returning either the result or the caught error
   * object. Any additional arguments are provided to `func` when it's invoked.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Util
   * @param {Function} func The function to attempt.
   * @param {...*} [args] The arguments to invoke `func` with.
   * @returns {*} Returns the `func` result or error object.
   * @example
   *
   * // Avoid throwing errors for invalid selectors.
   * var elements = _.attempt(function(selector) {
   *   return document.querySelectorAll(selector);
   * }, '>_>');
   *
   * if (_.isError(elements)) {
   *   elements = [];
   * }
   */
  var attempt = baseRest(function(func, args) {
    try {
      return apply(func, undefined, args);
    } catch (e) {
      return isError(e) ? e : new Error(e);
    }
  });

  var attempt$1 = attempt;

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  /**
   * The base implementation of `_.values` and `_.valuesIn` which creates an
   * array of `object` property values corresponding to the property names
   * of `props`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} props The property names to get values for.
   * @returns {Object} Returns the array of property values.
   */
  function baseValues(object, props) {
    return arrayMap(props, function(key) {
      return object[key];
    });
  }

  /** Used for built-in method references. */
  var objectProto$2 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

  /**
   * Used by `_.defaults` to customize its `_.assignIn` use to assign properties
   * of source objects to the destination object for all destination properties
   * that resolve to `undefined`.
   *
   * @private
   * @param {*} objValue The destination value.
   * @param {*} srcValue The source value.
   * @param {string} key The key of the property to assign.
   * @param {Object} object The parent object of `objValue`.
   * @returns {*} Returns the value to assign.
   */
  function customDefaultsAssignIn(objValue, srcValue, key, object) {
    if (objValue === undefined ||
        (eq(objValue, objectProto$2[key]) && !hasOwnProperty$2.call(object, key))) {
      return srcValue;
    }
    return objValue;
  }

  /** Used to escape characters for inclusion in compiled string literals. */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /**
   * Used by `_.template` to escape characters for inclusion in compiled string literals.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr];
  }

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = overArg(Object.keys, Object);

  var nativeKeys$1 = nativeKeys;

  /** Used for built-in method references. */
  var objectProto$1 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys$1(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty$1.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }

  /** Used to match template delimiters. */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  var reInterpolate$1 = reInterpolate;

  /**
   * The base implementation of `_.propertyOf` without support for deep paths.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyOf(object) {
    return function(key) {
      return object == null ? undefined : object[key];
    };
  }

  /** Used to map characters to HTML entities. */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  /**
   * Used by `_.escape` to convert characters to HTML entities.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  var escapeHtmlChar = basePropertyOf(htmlEscapes);

  var escapeHtmlChar$1 = escapeHtmlChar;

  /** `Object#toString` result references. */
  var symbolTag = '[object Symbol]';

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike(value) && baseGetTag(value) == symbolTag);
  }

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined,
      symbolToString = symbolProto ? symbolProto.toString : undefined;

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isArray$1(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return arrayMap(value, baseToString) + '';
    }
    if (isSymbol(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
  }

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : baseToString(value);
  }

  /** Used to match HTML entities and HTML characters. */
  var reUnescapedHtml = /[&<>"']/g,
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

  /**
   * Converts the characters "&", "<", ">", '"', and "'" in `string` to their
   * corresponding HTML entities.
   *
   * **Note:** No other characters are escaped. To escape additional
   * characters use a third-party library like [_he_](https://mths.be/he).
   *
   * Though the ">" character is escaped for symmetry, characters like
   * ">" and "/" don't need escaping in HTML and have no special meaning
   * unless they're part of a tag or unquoted attribute value. See
   * [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
   * (under "semi-related fun fact") for more details.
   *
   * When working with HTML you should always
   * [quote attribute values](http://wonko.com/post/html-escaping) to reduce
   * XSS vectors.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category String
   * @param {string} [string=''] The string to escape.
   * @returns {string} Returns the escaped string.
   * @example
   *
   * _.escape('fred, barney, & pebbles');
   * // => 'fred, barney, &amp; pebbles'
   */
  function escape(string) {
    string = toString(string);
    return (string && reHasUnescapedHtml.test(string))
      ? string.replace(reUnescapedHtml, escapeHtmlChar$1)
      : string;
  }

  /** Used to match template delimiters. */
  var reEscape = /<%-([\s\S]+?)%>/g;

  var reEscape$1 = reEscape;

  /** Used to match template delimiters. */
  var reEvaluate = /<%([\s\S]+?)%>/g;

  var reEvaluate$1 = reEvaluate;

  /**
   * By default, the template delimiters used by lodash are like those in
   * embedded Ruby (ERB) as well as ES2015 template strings. Change the
   * following template settings to use alternative delimiters.
   *
   * @static
   * @memberOf _
   * @type {Object}
   */
  var templateSettings = {

    /**
     * Used to detect `data` property values to be HTML-escaped.
     *
     * @memberOf _.templateSettings
     * @type {RegExp}
     */
    'escape': reEscape$1,

    /**
     * Used to detect code to be evaluated.
     *
     * @memberOf _.templateSettings
     * @type {RegExp}
     */
    'evaluate': reEvaluate$1,

    /**
     * Used to detect `data` property values to inject.
     *
     * @memberOf _.templateSettings
     * @type {RegExp}
     */
    'interpolate': reInterpolate$1,

    /**
     * Used to reference the data object in the template text.
     *
     * @memberOf _.templateSettings
     * @type {string}
     */
    'variable': '',

    /**
     * Used to import variables into the compiled template.
     *
     * @memberOf _.templateSettings
     * @type {Object}
     */
    'imports': {

      /**
       * A reference to the `lodash` function.
       *
       * @memberOf _.templateSettings.imports
       * @type {Function}
       */
      '_': { 'escape': escape }
    }
  };

  var templateSettings$1 = templateSettings;

  /** Error message constants. */
  var INVALID_TEMPL_VAR_ERROR_TEXT = 'Invalid `variable` option passed into `_.template`';

  /** Used to match empty string literals in compiled template source. */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to validate the `validate` option in `_.template` variable.
   *
   * Forbids characters which could potentially change the meaning of the function argument definition:
   * - "()," (modification of function parameters)
   * - "=" (default value)
   * - "[]{}" (destructuring of function parameters)
   * - "/" (beginning of a comment)
   * - whitespace
   */
  var reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;

  /**
   * Used to match
   * [ES template delimiters](http://ecma-international.org/ecma-262/7.0/#sec-template-literal-lexical-components).
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to ensure capturing order of template delimiters. */
  var reNoMatch = /($^)/;

  /** Used to match unescaped characters in compiled string literals. */
  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Creates a compiled template function that can interpolate data properties
   * in "interpolate" delimiters, HTML-escape interpolated data properties in
   * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
   * properties may be accessed as free variables in the template. If a setting
   * object is given, it takes precedence over `_.templateSettings` values.
   *
   * **Note:** In the development build `_.template` utilizes
   * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
   * for easier debugging.
   *
   * For more information on precompiling templates see
   * [lodash's custom builds documentation](https://lodash.com/custom-builds).
   *
   * For more information on Chrome extension sandboxes see
   * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category String
   * @param {string} [string=''] The template string.
   * @param {Object} [options={}] The options object.
   * @param {RegExp} [options.escape=_.templateSettings.escape]
   *  The HTML "escape" delimiter.
   * @param {RegExp} [options.evaluate=_.templateSettings.evaluate]
   *  The "evaluate" delimiter.
   * @param {Object} [options.imports=_.templateSettings.imports]
   *  An object to import into the template as free variables.
   * @param {RegExp} [options.interpolate=_.templateSettings.interpolate]
   *  The "interpolate" delimiter.
   * @param {string} [options.sourceURL='templateSources[n]']
   *  The sourceURL of the compiled template.
   * @param {string} [options.variable='obj']
   *  The data object variable name.
   * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
   * @returns {Function} Returns the compiled template function.
   * @example
   *
   * // Use the "interpolate" delimiter to create a compiled template.
   * var compiled = _.template('hello <%= user %>!');
   * compiled({ 'user': 'fred' });
   * // => 'hello fred!'
   *
   * // Use the HTML "escape" delimiter to escape data property values.
   * var compiled = _.template('<b><%- value %></b>');
   * compiled({ 'value': '<script>' });
   * // => '<b>&lt;script&gt;</b>'
   *
   * // Use the "evaluate" delimiter to execute JavaScript and generate HTML.
   * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
   * compiled({ 'users': ['fred', 'barney'] });
   * // => '<li>fred</li><li>barney</li>'
   *
   * // Use the internal `print` function in "evaluate" delimiters.
   * var compiled = _.template('<% print("hello " + user); %>!');
   * compiled({ 'user': 'barney' });
   * // => 'hello barney!'
   *
   * // Use the ES template literal delimiter as an "interpolate" delimiter.
   * // Disable support by replacing the "interpolate" delimiter.
   * var compiled = _.template('hello ${ user }!');
   * compiled({ 'user': 'pebbles' });
   * // => 'hello pebbles!'
   *
   * // Use backslashes to treat delimiters as plain text.
   * var compiled = _.template('<%= "\\<%- value %\\>" %>');
   * compiled({ 'value': 'ignored' });
   * // => '<%- value %>'
   *
   * // Use the `imports` option to import `jQuery` as `jq`.
   * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
   * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
   * compiled({ 'users': ['fred', 'barney'] });
   * // => '<li>fred</li><li>barney</li>'
   *
   * // Use the `sourceURL` option to specify a custom sourceURL for the template.
   * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
   * compiled(data);
   * // => Find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector.
   *
   * // Use the `variable` option to ensure a with-statement isn't used in the compiled template.
   * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
   * compiled.source;
   * // => function(data) {
   * //   var __t, __p = '';
   * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
   * //   return __p;
   * // }
   *
   * // Use custom template delimiters.
   * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
   * var compiled = _.template('hello {{ user }}!');
   * compiled({ 'user': 'mustache' });
   * // => 'hello mustache!'
   *
   * // Use the `source` property to inline compiled templates for meaningful
   * // line numbers in error messages and stack traces.
   * fs.writeFileSync(path.join(process.cwd(), 'jst.js'), '\
   *   var JST = {\
   *     "main": ' + _.template(mainText).source + '\
   *   };\
   * ');
   */
  function template(string, options, guard) {
    // Based on John Resig's `tmpl` implementation
    // (http://ejohn.org/blog/javascript-micro-templating/)
    // and Laura Doktorova's doT.js (https://github.com/olado/doT).
    var settings = templateSettings$1.imports._.templateSettings || templateSettings$1;

    if (guard && isIterateeCall(string, options, guard)) {
      options = undefined;
    }
    string = toString(string);
    options = assignInWith$1({}, options, settings, customDefaultsAssignIn);

    var imports = assignInWith$1({}, options.imports, settings.imports, customDefaultsAssignIn),
        importsKeys = keys(imports),
        importsValues = baseValues(imports, importsKeys);

    var isEscaping,
        isEvaluating,
        index = 0,
        interpolate = options.interpolate || reNoMatch,
        source = "__p += '";

    // Compile the regexp to match each delimiter.
    var reDelimiters = RegExp(
      (options.escape || reNoMatch).source + '|' +
      interpolate.source + '|' +
      (interpolate === reInterpolate$1 ? reEsTemplate : reNoMatch).source + '|' +
      (options.evaluate || reNoMatch).source + '|$'
    , 'g');

    // Use a sourceURL for easier debugging.
    // The sourceURL gets injected into the source that's eval-ed, so be careful
    // to normalize all kinds of whitespace, so e.g. newlines (and unicode versions of it) can't sneak in
    // and escape the comment, thus injecting code that gets evaled.
    var sourceURL = hasOwnProperty.call(options, 'sourceURL')
      ? ('//# sourceURL=' +
         (options.sourceURL + '').replace(/\s/g, ' ') +
         '\n')
      : '';

    string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
      interpolateValue || (interpolateValue = esTemplateValue);

      // Escape characters that can't be included in string literals.
      source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

      // Replace delimiters with snippets.
      if (escapeValue) {
        isEscaping = true;
        source += "' +\n__e(" + escapeValue + ") +\n'";
      }
      if (evaluateValue) {
        isEvaluating = true;
        source += "';\n" + evaluateValue + ";\n__p += '";
      }
      if (interpolateValue) {
        source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
      }
      index = offset + match.length;

      // The JS engine embedded in Adobe products needs `match` returned in
      // order to produce the correct `offset` value.
      return match;
    });

    source += "';\n";

    // If `variable` is not specified wrap a with-statement around the generated
    // code to add the data object to the top of the scope chain.
    var variable = hasOwnProperty.call(options, 'variable') && options.variable;
    if (!variable) {
      source = 'with (obj) {\n' + source + '\n}\n';
    }
    // Throw an error if a forbidden character was found in `variable`, to prevent
    // potential command injection attacks.
    else if (reForbiddenIdentifierChars.test(variable)) {
      throw new Error(INVALID_TEMPL_VAR_ERROR_TEXT);
    }

    // Cleanup code by stripping empty strings.
    source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
      .replace(reEmptyStringMiddle, '$1')
      .replace(reEmptyStringTrailing, '$1;');

    // Frame code as the function body.
    source = 'function(' + (variable || 'obj') + ') {\n' +
      (variable
        ? ''
        : 'obj || (obj = {});\n'
      ) +
      "var __t, __p = ''" +
      (isEscaping
         ? ', __e = _.escape'
         : ''
      ) +
      (isEvaluating
        ? ', __j = Array.prototype.join;\n' +
          "function print() { __p += __j.call(arguments, '') }\n"
        : ';\n'
      ) +
      source +
      'return __p\n}';

    var result = attempt$1(function() {
      return Function(importsKeys, sourceURL + 'return ' + source)
        .apply(undefined, importsValues);
    });

    // Provide the compiled function's source by its `toString` method or
    // the `source` property as a convenience for inlining compiled templates.
    result.source = source;
    if (isError(result)) {
      throw result;
    }
    return result;
  }

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1,
          iterable = Object(object),
          props = keysFunc(object),
          length = props.length;

      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = createBaseFor();

  var baseFor$1 = baseFor;

  /**
   * The base implementation of `_.forOwn` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Object} Returns `object`.
   */
  function baseForOwn(object, iteratee) {
    return object && baseFor$1(object, iteratee, keys);
  }

  /**
   * Creates a `baseEach` or `baseEachRight` function.
   *
   * @private
   * @param {Function} eachFunc The function to iterate over a collection.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseEach(eachFunc, fromRight) {
    return function(collection, iteratee) {
      if (collection == null) {
        return collection;
      }
      if (!isArrayLike(collection)) {
        return eachFunc(collection, iteratee);
      }
      var length = collection.length,
          index = fromRight ? length : -1,
          iterable = Object(collection);

      while ((fromRight ? index-- : ++index < length)) {
        if (iteratee(iterable[index], index, iterable) === false) {
          break;
        }
      }
      return collection;
    };
  }

  /**
   * The base implementation of `_.forEach` without support for iteratee shorthands.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array|Object} Returns `collection`.
   */
  var baseEach = createBaseEach(baseForOwn);

  var baseEach$1 = baseEach;

  /**
   * Casts `value` to `identity` if it's not a function.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {Function} Returns cast function.
   */
  function castFunction(value) {
    return typeof value == 'function' ? value : identity;
  }

  /**
   * Iterates over elements of `collection` and invokes `iteratee` for each element.
   * The iteratee is invoked with three arguments: (value, index|key, collection).
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * **Note:** As with other "Collections" methods, objects with a "length"
   * property are iterated like arrays. To avoid this behavior use `_.forIn`
   * or `_.forOwn` for object iteration.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @alias each
   * @category Collection
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} [iteratee=_.identity] The function invoked per iteration.
   * @returns {Array|Object} Returns `collection`.
   * @see _.forEachRight
   * @example
   *
   * _.forEach([1, 2], function(value) {
   *   console.log(value);
   * });
   * // => Logs `1` then `2`.
   *
   * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
   *   console.log(key);
   * });
   * // => Logs 'a' then 'b' (iteration order is not guaranteed).
   */
  function forEach(collection, iteratee) {
    var func = isArray$1(collection) ? arrayEach : baseEach$1;
    return func(collection, castFunction(iteratee));
  }

  /**
   * The NearbyStops Module
   *
   * @class
   */
  class NearbyStops {
    /**
     * @constructor
     *
     * @return  {Object}  The NearbyStops class
     */
    constructor() {
      /** @type {Array} Collection of nearby stops DOM elements */
      this._elements = document.querySelectorAll(NearbyStops.selector);

      /** @type {Array} The collection all stops from the data */
      this._stops = [];

      /** @type {Array} The currated collection of stops that will be rendered */
      this._locations = [];

      // Loop through DOM Components.
      forEach(this._elements, (el) => {
        // Fetch the data for the element.
        this._fetch(el, (status, data) => {
          if (status !== 'success') return;

          this._stops = data;
          // Get stops closest to the location.
          this._locations = this._locate(el, this._stops);
          // Assign the color names from patterns stylesheet.
          this._locations = this._assignColors(this._locations);
          // Render the markup for the stops.
          this._render(el, this._locations);
        });
      });

      return this;
    }

    /**
     * This compares the latitude and longitude with the Subway Stops data, sorts
     * the data by distance from closest to farthest, and returns the stop and
     * distances of the stations.
     *
     * @param  {Object}  el     The DOM Component with the data attr options
     * @param  {Object}  stops  All of the stops data to compare to
     *
     * @return {Object}         A collection of the closest stops with distances
     */
    _locate(el, stops) {
      const amount = parseInt(this._opt(el, 'AMOUNT'))
        || NearbyStops.defaults.AMOUNT;
      let loc = JSON.parse(this._opt(el, 'LOCATION'));
      let geo = [];
      let distances = [];

      // 1. Compare lat and lon of current location with list of stops
      for (let i = 0; i < stops.length; i++) {
        geo = stops[i][this._key('ODATA_GEO')][this._key('ODATA_COOR')];
        geo = geo.reverse();
        distances.push({
          'distance': this._equirectangular(loc[0], loc[1], geo[0], geo[1]),
          'stop': i, // index of stop in the data
        });
      }

      // 2. Sort the distances shortest to longest
      distances.sort((a, b) => (a.distance < b.distance) ? -1 : 1);
      distances = distances.slice(0, amount);

      // 3. Return the list of closest stops (number based on Amount option)
      // and replace the stop index with the actual stop data
      for (let x = 0; x < distances.length; x++)
        distances[x].stop = stops[distances[x].stop];

      return distances;
    }

    /**
     * Fetches the stop data from a local source
     *
     * @param  {Object}    el        The NearbyStops DOM element
     * @param  {Function}  callback  The function to execute on success
     *
     * @return {Function}            the fetch promise
     */
    _fetch(el, callback) {
      const headers = {
        'method': 'GET'
      };

      return fetch(this._opt(el, 'ENDPOINT'), headers)
        .then((response) => {
          if (response.ok)
            return response.json();
          else {
            // eslint-disable-next-line no-console
            console.dir(response);
            callback('error', response);
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.dir(error);
          callback('error', error);
        })
        .then((data) => callback('success', data));
    }

    /**
     * Returns distance in miles comparing the latitude and longitude of two
     * points using decimal degrees.
     *
     * @param  {Float}  lat1  Latitude of point 1 (in decimal degrees)
     * @param  {Float}  lon1  Longitude of point 1 (in decimal degrees)
     * @param  {Float}  lat2  Latitude of point 2 (in decimal degrees)
     * @param  {Float}  lon2  Longitude of point 2 (in decimal degrees)
     *
     * @return {Float}        [description]
     */
    _equirectangular(lat1, lon1, lat2, lon2) {
      Math.deg2rad = (deg) => deg * (Math.PI / 180);

      let alpha = Math.abs(lon2) - Math.abs(lon1);
      let x = Math.deg2rad(alpha) * Math.cos(Math.deg2rad(lat1 + lat2) / 2);
      let y = Math.deg2rad(lat1 - lat2);
      let R = 3959; // earth radius in miles;
      let distance = Math.sqrt(x * x + y * y) * R;

      return distance;
    }

    /**
     * Assigns colors to the data using the NearbyStops.truncks dictionary.
     *
     * @param  {Object}  locations  Object of closest locations
     *
     * @return {Object}             Same object with colors assigned to each loc
     */
    _assignColors(locations) {
      let locationLines = [];
      let line = 'S';
      let lines = ['S'];

      // Loop through each location that we are going to display
      for (let i = 0; i < locations.length; i++) {
        // assign the line to a variable to lookup in our color dictionary
        locationLines = locations[i].stop[this._key('ODATA_LINE')].split('-');

        for (let x = 0; x < locationLines.length; x++) {
          line = locationLines[x];

          for (let y = 0; y < NearbyStops.trunks.length; y++) {
            lines = NearbyStops.trunks[y]['LINES'];

            if (lines.indexOf(line) > -1)
              locationLines[x] = {
                'line': line,
                'trunk': NearbyStops.trunks[y]['TRUNK']
              };
          }
        }

        // Add the trunk to the location
        locations[i].trunks = locationLines;
      }

      return locations;
    }

    /**
     * The function to compile and render the location template
     *
     * @param  {Object}  element  The parent DOM element of the component
     * @param  {Object}  data     The data to pass to the template
     *
     * @return {Object}           The NearbyStops class
     */
    _render(element, data) {
      let compiled = template(NearbyStops.templates.SUBWAY, {
        'imports': {
          '_each': forEach
        }
      });

      element.innerHTML = compiled({'stops': data});

      return this;
    }

    /**
     * Get data attribute options
     *
     * @param  {Object}  element  The element to pull the setting from
     * @param  {String}  opt      The key reference to the attribute
     *
     * @return {String}          The setting of the data attribute
     */
    _opt(element, opt) {
      return element.dataset[
        `${NearbyStops.namespace}${NearbyStops.options[opt]}`
      ];
    }

    /**
     * A proxy function for retrieving the proper key
     *
     * @param  {String} key The reference for the stored keys
     *
     * @return {String}     The desired key
     */
    _key(key) {
      return NearbyStops.keys[key];
    }
  }

  /**
   * The dom selector for the module
   *
   * @type {String}
   */
  NearbyStops.selector = '[data-js="nearby-stops"]';

  /**
   * The namespace for the component's JS options. It's primarily used to lookup
   * attributes in an element's dataset
   *
   * @type {String}
   */
  NearbyStops.namespace = 'nearbyStops';

  /**
   * A list of options that can be assigned to the component. It's primarily used
   * to lookup attributes in an element's dataset
   *
   * @type {Object}
   */
  NearbyStops.options = {
    LOCATION: 'Location',
    AMOUNT: 'Amount',
    ENDPOINT: 'Endpoint'
  };

  /**
   * The documentation for the data attr options
   *
   * @type {Object}
   */
  NearbyStops.definition = {
    LOCATION: 'The current location to compare distance to stops.',
    AMOUNT: 'The amount of stops to list.',
    ENDPOINT: 'The endopoint for the data feed.'
  };

  /**
   * [defaults description]
   *
   * @type {Object}
   */
  NearbyStops.defaults = {
    AMOUNT: 3
  };

  /**
   * Storage for some of the data keys
   *
   * @type {Object}
   */
  NearbyStops.keys = {
    ODATA_GEO: 'the_geom',
    ODATA_COOR: 'coordinates',
    ODATA_LINE: 'line'
  };

  /**
   * Templates for the Nearby Stops Component
   *
   * @type {Object}
   */
  NearbyStops.templates = {
    SUBWAY: [
    '<% _each(stops, function(stop) { %>',
    '<li class="c-nearby-stops__stop">',
      '<% var lines = stop.stop.line.split("-") %>',
      '<% _each(stop.trunks, function(trunk) { %>',
      '<% var exp = (trunk.line.indexOf("Express") > -1) ? true : false %>',
      '<% if (exp) trunk.line = trunk.line.split(" ")[0] %>',
      '<span class="',
        'c-nearby-stops__subway<% if (exp) { %>-express<% } %> ',
        '<% if (exp) { %>border-<% } else { %>bg-<% } %><%- trunk.trunk %>',
        '">',
        '<%- trunk.line %>',
        '<% if (exp) { %> <span class="sr-only">Express</span><% } %>',
      '</span>&nbsp;',
      '<% }); %>',
      '<span class="c-nearby-stops__description">',
        '<%- stop.distance.toString().slice(0, 3) %> Miles, ',
        '<%- stop.stop.name %>',
      '</span>',
    '</li>',
    '<% }); %>'
    ].join('')
  };

  /**
   * Color assignment for Subway Train lines, used in conjunction with the
   * background colors defined in config/tokens.js
   * Based on the nomenclature described here;
   *
   * @url https://en.wikipedia.org/wiki/New_York_City_Subway#Nomenclature
   *
   * @type {Array}
   */
  NearbyStops.trunks = [
    {
      TRUNK: 'eighth-avenue',
      LINES: ['A', 'C', 'E'],
    },
    {
      TRUNK: 'sixth-avenue',
      LINES: ['B', 'D', 'F', 'M'],
    },
    {
      TRUNK: 'crosstown',
      LINES: ['G'],
    },
    {
      TRUNK: 'canarsie',
      LINES: ['L'],
    },
    {
      TRUNK: 'nassau',
      LINES: ['J', 'Z'],
    },
    {
      TRUNK: 'broadway',
      LINES: ['N', 'Q', 'R', 'W'],
    },
    {
      TRUNK: 'broadway-seventh-avenue',
      LINES: ['1', '2', '3'],
    },
    {
      TRUNK: 'lexington-avenue',
      LINES: ['4', '5', '6', '6 Express'],
    },
    {
      TRUNK: 'flushing',
      LINES: ['7', '7 Express'],
    },
    {
      TRUNK: 'shuttles',
      LINES: ['S']
    }
  ];

  /**
   * Creates a popover. The constructor is passed an HTML element that serves as
   * the trigger to show or hide the Popover. The popover should have an
   * `aria-describedby` attribute, the value of which is the ID of the popover
   * content to show or hide.
   */
  class Popover {
    /**
     * @param {HTMLElement} el - The trigger element for the component
     *
     * @constructor
     */
    constructor(el) {
      this.trigger = el;

      this.popover = document.getElementById(el.getAttribute('aria-describedby'));

      this.active = false;

      this.popover.classList.add(Popover.CssClass.POPOVER);
      this.popover.classList.add(Popover.CssClass.HIDDEN);

      this.popover.setAttribute('aria-hidden', 'true');
      this.popover.setAttribute('role', 'tooltip');

      // Stop click propagation so clicking on the tip doesn't trigger a
      // click on body, which would close the Popover.
      this.popover.addEventListener('click', event => {
        event.stopPropagation();
      });

      document.querySelector('body').appendChild(this.popover);

      this.trigger.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        this.toggle();
      });

      window.addEventListener('hashchange', () => {
        this.hide();
      });

      Popover.all.push(this);

      return this;
    }

    /**
     * Displays the Popover. Sets a one-time listener on the body to close the
     * popover when a click event bubbles up to it.
     *
     * @method
     *
     * @return {this} Popover
     */
    show() {
      Popover.hideAll();

      this.popover.classList.remove(Popover.CssClass.HIDDEN);

      this.popover.setAttribute('aria-hidden', 'false');

      let body = document.querySelector('body');

      let hidePopoverOnce = () => {
        this.hide();

        body.removeEventListener('click', hidePopoverOnce);
      };

      body.addEventListener('click', hidePopoverOnce);

      window.addEventListener('resize', () => {
        this.reposition();
      });

      this.reposition();

      this.active = true;

      return this;
    }

    /**
     * Hides the tooltip and removes the click event listener on the body.
     * @method
     * @return {this} Popover
     */
    hide() {
      this.popover.classList.add(Popover.CssClass.HIDDEN);

      this.popover.setAttribute('aria-hidden', 'true');

      this.active = false;

      return this;
    }

    /**
     * Toggles the state of the Popover
     *
     * @method
     *
     * @return {this} Popover
     */
    toggle() {
      if (this.active) {
        this.hide();
      } else {
        this.show();
      }

      return this;
    }

    /**
     * Positions the tooltip beneath the triggering element
     *
     * @method
     *
     * @return {this} Popover
     */
    reposition() {
      let pos = {
        'position': 'absolute',
        'left': 'auto',
        'right': 'auto',
        'top': 'auto',
        'bottom': 'auto',
        'width': ''
      };

      let style = (attrs) => Object.keys(attrs)
        .map(key => `${key}: ${attrs[key]}`).join('; ');

      let g = 8; // Gutter. Minimum distance from screen edge.
      let tt = this.popover;
      let tr = this.trigger;
      let w = window;

      // Reset
      this.popover.setAttribute('style', style(pos));

      // Determine left or right alignment.
      if (tt.offsetWidth >= w.innerWidth - (2 * g)) {
        // If the popover is wider than the screen minus gutters, then position
        // the popover to extend to the gutters.
        pos.left = g + 'px';
        pos.right = g + 'px';
        pos.width = 'auto';
      } else if (tr.offsetLeft + tt.offsetWidth + g > w.innerWidth) {
        // If the popover, when left aligned with the trigger, would cause the
        // tip to go offscreen (determined by taking the trigger left offset and
        // adding the popover width and the left gutter) then align the popover
        // to the right side of the trigger element.
        pos.left = 'auto';
        pos.right = w.innerWidth - (tr.offsetLeft + tr.offsetWidth) + 'px';
      } else {
        // Align the popover to the left of the trigger element.
        pos.left = tr.offsetLeft + 'px';
        pos.right = 'auto';
      }

      // Position TT on top if the trigger is below the middle of the window
      if (tr.offsetTop - w.scrollY > w.innerHeight / 2) {
        pos.top = tr.offsetTop - tt.offsetHeight - (g) + 'px';
      } else {
        pos.top = tr.offsetTop + tr.offsetHeight + g + 'px';
      }

      this.popover.setAttribute('style', style(pos));

      return this;
    }
  }

  Popover.selector = '[data-js*="popover"]';

  /**
   * Array of all the instantiated Popovers
   */
  Popover.all = [];

  /**
   * Hide all Popover.
   * @public
   */
  Popover.hideAll = function() {
    Popover.all.forEach(element => {
      element.hide();
    });
  };

  /**
   * CSS classes used by this component.
   * @enum {string}
   */
  Popover.CssClass = {
    HIDDEN: 'hidden',
    POPOVER: 'popover-bubble'
  };

  /* eslint-env browser */

  /**
   * This component handles validation and submission for share by email and
   * share by SMS forms.
   *
   * @class
   */
  class ShareForm {
    /**
     * Class Constructor
     *
     * @param   {Object}  el  The DOM Share Form Element
     *
     * @return  {Object}      The instantiated class
     */
    constructor(element) {
      this.element = element;

      /**
       * Setting class variables to our constants
       */
      this.selector = ShareForm.selector;

      this.selectors = ShareForm.selectors;

      this.classes = ShareForm.classes;

      this.strings = ShareForm.strings;

      this.sent = ShareForm.sent;

      /**
       * Set up masking for phone numbers (if this is a texting module)
       */
      this.phone = this.element.querySelector(this.selectors.PHONE);

      if (this.phone) {
        this.type = 'text';
      } else
        this.type = 'email';

      /**
       * Configure the validation for the form using the form utility
       */
      this.form = new Forms(this.element.querySelector(this.selectors.FORM));

      this.form.strings = this.strings;

      this.form.selectors = {
        'REQUIRED': this.selectors.REQUIRED,
        'ERROR_MESSAGE_PARENT': this.selectors.FORM
      };

      this.form.FORM.addEventListener('submit', (event) => {
        event.preventDefault();

        if (this.form.valid(event) === false)
          return false;

        this.sanitize()
          .processing()
          .submit(event)
          .then(response => response.json())
          .then(response => {
            this.response(response);
          }).catch(data => {
            console.dir(data);
          });
      });

      /**
       * Instantiate the ShareForm's toggle component
       */
      this.toggle = new Toggle({
        element: this.element.querySelector(this.selectors.TOGGLE),
        selector: this.selectors.TOGGLE,
        after: () => {
          this.element.querySelector(this.selectors.INPUT).focus();
        }
      });

      return this;
    }

    /**
     * Serialize and clean any data sent to the server
     *
     * @return  {Object}  The instantiated class
     */
    sanitize() {
      // Serialize the data
      this._data = serialize$1(this.form.FORM, {hash: true});

      // Sanitize the phone number (if there is a phone number)
      if (this.phone && this._data.to) {
        this._data.to = this._data.to.match(/\d/g, 10).join('');
      }

      return this;
    }

    /**
     * Switch the form to the processing state
     *
     * @return  {Object}  The instantiated class
     */
    processing() {
      // Disable the form
      let inputs = this.form.FORM.querySelectorAll(this.selectors.INPUTS);

      for (let i = 0; i < inputs.length; i++)
        inputs[i].setAttribute('disabled', true);

      let button = this.form.FORM.querySelector(this.selectors.SUBMIT);

      button.setAttribute('disabled', true);

      // Show processing state
      this.form.FORM.classList.add(this.classes.PROCESSING);

      return this;
    }

    /**
     * POSTs the serialized form data using the Fetch Method
     *
     * @return  {Promise}  Fetch promise
     */
    submit() {
      // To send the data with the application/x-www-form-urlencoded header
      // we need to use URLSearchParams(); instead of FormData(); which uses
      // multipart/form-data
      let formData = new URLSearchParams();

      Object.keys(this._data).map(k => {
        formData.append(k, this._data[k]);
      });

      let html = document.querySelector('html');

      if (html.hasAttribute('lang'))
        formData.append('lang', html.getAttribute('lang'));

      return fetch(this.form.FORM.getAttribute('action'), {
        method: this.form.FORM.getAttribute('method'),
        body: formData
      });
    }

    /**
     * The response handler
     *
     * @param   {Object}  data  Data from the request
     *
     * @return  {Object}        The instantiated class
     */
    response(data) {
      if (data.success)
        this.success();
      else
        if (data.error === 21211)
          this.feedback('SERVER_TEL_INVALID').enable();
        else
          this.feedback('SERVER').enable();

      console.dir(data);

      return this;
    }

    /**
     * Queues the success message and adds an event listener to reset the form
     * to it's default state.
     *
     * @return  {Object}  The instantiated class
     */
    success() {
      this.form.FORM.classList
        .replace(this.classes.PROCESSING, this.classes.SUCCESS);

      let message = this.form.FORM.querySelector(this.selectors.MSG);

      if (message) {
        message.setAttribute('aria-hidden', 'false');
        message.addAttribute('aria-live', 'polite');
      }

      this.enable();

      this.form.FORM.addEventListener('input', () => {
        this.form.FORM.classList.remove(this.classes.SUCCESS);

        if (message) {
          message.setAttribute('aria-hidden', 'true');
          message.removeAttribute('aria-live');
        }
      });

      // Successful messages hook (fn provided to the class upon instantiation)
      if (this.sent) this.sent(this);

      return this;
    }

    /**
     * Queues the server error message
     *
     * @param   {Object}  response  The error response from the request
     *
     * @return  {Object}            The instantiated class
     */
    error(response) {
      this.feedback('SERVER').enable();

      console.dir(response);

      return this;
    }

    /**
     * Adds a div containing the feedback message to the user and toggles the
     * class of the form
     *
     * @param   {String}  KEY  The key of message paired in messages and classes
     *
     * @return  {Object}       The instantiated class
     */
    feedback(KEY) {
      // Create the new error message
      let message = document.createElement('div');

      // Set the feedback class and insert text
      message.classList.add(`${this.classes[KEY]}${this.classes.MESSAGE}`);
      message.innerHTML = this.strings[KEY];

      // Add message to the form and add feedback class
      this.form.FORM.insertBefore(message, this.form.FORM.childNodes[0]);
      this.form.FORM.classList.add(this.classes[KEY]);

      return this;
    }

    /**
     * Enables the ShareForm (after submitting a request)
     *
     * @return  {Object}  The instantiated class
     */
    enable() {
      // Enable the form
      let inputs = this.form.FORM.querySelectorAll(this.selectors.INPUTS);

      for (let i = 0; i < inputs.length; i++)
        inputs[i].removeAttribute('disabled');

      let button = this.form.FORM.querySelector(this.selectors.SUBMIT);

      button.removeAttribute('disabled');

      // Remove the processing class
      this.form.FORM.classList.remove(this.classes.PROCESSING);

      return this;
    }
  }

  /** The main component selector */
  ShareForm.selector = '[data-js="share-form"]';

  /** Selectors within the component */
  ShareForm.selectors = {
    FORM: 'form',
    INPUTS: 'input',
    PHONE: 'input[type="tel"]',
    SUBMIT: 'button[type="submit"]',
    REQUIRED: '[required="true"]',
    TOGGLE: '[data-js*="share-form-control"]',
    INPUT: '[data-share-form*="input"]',
    MSG: 'data-share-form="message"]'
  };

  /** CSS classes used by this component. */
  ShareForm.classes = {
    ERROR: 'error',
    SERVER: 'error',
    SERVER_TEL_INVALID: 'error',
    MESSAGE: '-message',
    PROCESSING: 'processing',
    SUCCESS: 'success'
  };

  /** Strings used for validation feedback */
  ShareForm.strings = {
    SERVER: 'Something went wrong. Please try again later.',
    SERVER_TEL_INVALID: 'Unable to send to number provided. Please use another number.',
    VALID_REQUIRED: 'This is required',
    VALID_EMAIL_INVALID: 'Please enter a valid email.',
    VALID_TEL_INVALID: 'Please provide 10-digit number with area code.'
  };

  ShareForm.sent = false;

  /**
   * The Attribution module
   *
   * @class
   */
  class Attribution {
    /**
     * @constructor
     *
     * @return  {object}  The class
     */
    constructor() {
      this.selector = Attribution.selector;

      this.toggle = new Toggle({
        selector: this.selector
      });

      return this;
    }
  }

  /** @type  {String}  The dom selector for the module */
  Attribution.selector = '[data-js*="attribution"]';

  /**
   * The Mobile Nav module
   *
   * @class
   */
  class Menu {
    /**
     * @constructor
     *
     * @return  {object}  The class
     */
    constructor() {
      this.selector = Menu.selector;

      this.selectors = Menu.selectors;

      this.toggle = new Toggle({
        selector: this.selector,
        after: toggle => {
          // Shift focus from the open to the close button in the Mobile Menu when toggled
          if (toggle.target.classList.contains(Toggle.activeClass)) {
            toggle.target.querySelector(this.selectors.CLOSE).focus();

            // When the last focusable item in the list looses focus loop to the first
            toggle.focusable.item(toggle.focusable.length - 1)
              .addEventListener('blur', () => {
                toggle.focusable.item(0).focus();
              });
          } else {
            document.querySelector(this.selectors.OPEN).focus();
          }
        }
      });

      return this;
    }
  }

  /** @type  {String}  The dom selector for the module */
  Menu.selector = '[data-js*="menu"]';

  /** @type  {Object}  Additional selectors used by the script */
  Menu.selectors = {
    CLOSE: '[data-js-menu*="close"]',
    OPEN: '[data-js-menu*="open"]'
  };

  class Modal extends Dialog {
    constructor() {
      super();
    }
  }

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
    input: '[data-search*="input"]'
  };

  /* eslint-env browser */

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

  // import ... from '../objects/...';

  /** import modules here as they are written. */

  /**
   * @class  Main pattern module
   */
  class Main {
    /**
     * @constructor  Modules to be executed on main pattern instantiation here
     */
    constructor() {
      new WindowVh();
    }

    /**
     * An API for the Accordion Component
     *
     * @return  {Object}  Instance of Accordion
     */
    accordion() {
      return new Accordion();
    }

    /**
     * An API for the Active Navigation component
     *
     * @return  {Object}  Instance of ActiveNavigation
     */
    activeNavigation(settings = false) {
      return (settings) ? new ActiveNavigation(settings) : new ActiveNavigation();
    }

    /**
     * An API for the Attribution object
     *
     * @return  {Object}  Instance of Attribution
     */
    attribution() {
      return new Attribution();
    }

    /**
     * An API for Code Syntax Highlighting
     *
     * @return  {Object}  Instance of CodeHighlight
     */
    codeHighlight(s = {}) {
      return new CodeHighlight(s);
    }

    /**
     * An API for the Copy Utility
     *
     * @return  {Object}  Instance of Copy
     */
    copy() {
      return new Copy({
        copied: c => c.element.querySelector('[data-js-copy="icon"]')
          .setAttribute('href', `#lucide-check`),
        after: c => c.element.querySelector('[data-js-copy="icon"]')
          .setAttribute('href', `#lucide-copy`)
      });
    }

    /**
     * An API for the Dialog Component
     *
     * @return  {Object}  Instance of Dialog
     */
    dialog() {
      return new Dialog();
    }

    /**
     * An API for the Direction Utility
     *
     * @return  {Object}  Instance of Direction
     */
    direction() {
      return new Direction();
    }

    /**
     * An API for the Disclaimer Component
     *
     * @return  {Object}  Instance of Disclaimer
     */
    disclaimer() {
      return new Disclaimer();
    }

    /**
     * An API for the Icons Utility
     *
     * @param   {String}  path  The path of the icon file
     *
     * @return  {Object}        Instance of Icons
     */
    icons(path = 'svg/svgs.svg') {
      return new Icons(path);
    }

    /**
     * An API for Input Masks
     */
    masks() {
      new MaskDollars();
      new MaskPhone();
    }

    /**
     * An API for the Menu
     *
     * @return  {Object}  Instance of Menu
     */
    menu() {
      return new Menu();
    }

    /**
     * An API for the Modal
     *
     * @return  {Object}  Instance of Modal
     */
    modal() {
      return new Modal();
    }

    /**
     * An API for Nearby Stops
     *
     * @return  {Object}  Instance of NearbyStops
     */
    nearbyStops() {
      return new NearbyStops();
    }

    /**
     * An API for the Newsletter Object
     *
     * @return  {Object}  Instance of Newsletter
     */
    newsletter(endpoint = '') {
      let element = document.querySelector(Newsletter.selector);

      if (element) {
        let newsletter = new Newsletter(element);

        newsletter.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

        window[newsletter.callback] = data => {
          data.response = true;

          data.email = element.querySelector('input[name="EMAIL"]').value;

          window.location = `${endpoint}?` + Object.keys(data)
            .map(k => `${k}=${encodeURI(data[k])}`).join('&');
        };

        return newsletter;
      }
    }

    /**
     * An API for the popover
     */
    popover() {
      (elements => {
        elements.forEach(element => new Popover(element));
      })(document.querySelectorAll(Popover.selector));
    }

    /**
     * An API for setting height properties for various elements.
     *
     * @return  {Object}  Instance of SetHeightProperties
     */
    setHeightProperties() {
      return new SetHeightProperties({
        'elements': [
          {
            'selector': '[data-js="navigation"]',
            'property': '--o-navigation-height'
          },
          {
            'selector': '[data-js="feedback"]',
            'property': '--nyco-feedback-height'
          }
        ]
      });
    }

    /**
     * An API for the Newsletter Object
     *
     * @return  {Object}  Instance of Newsletter
     */
    newsletterForm(element = document.querySelector('[data-js="newsletter-form"]')) {
      let params = new URLSearchParams(window.location.search);
      let response = params.get('response');
      let newsletter = null;

      if (element) {
        newsletter = new Newsletter(element);
        newsletter.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';
      }

      if (response && newsletter) {
        let email = params.get('email');
        let input = element.querySelector('input[name="EMAIL"]');

        input.value = email;

        newsletter._data = {
          'result': params.get('result'),
          'msg': params.get('msg'),
          'EMAIL': email
        };

        newsletter._callback(newsletter._data);
      }

      return newsletter;
    }

    /**
     * An API for the Search
     *
     * @return  {Object}  Instance of Search
     */
    search() {
      return new Search();
    }

    /**
     * An API for the Share Form
     */
    shareForm() {
      (elements => {
        elements.forEach(element => new ShareForm(element));
      })(document.querySelectorAll(ShareForm.selector));
    }

    /**
     * An API for the Step by Step
     */
    stepByStep() {
      /**
       * Instantiate the Program Guide
       */
      (element => {
        if (element) new StepByStep(element);
      })(document.querySelector(StepByStep.selector));
    }

    /**
     * An API for the Themes Utility
     *
     * @return  {Object}  Instance of Themes
     */
    themes() {
      return new Themes({
        themes: [
          {
            label: 'Dark Theme',
            classname: 'default',
            icon: 'lucide-moon'
          },
          {
            label: 'Light Theme',
            classname: 'dark',
            icon: 'lucide-sun'
          }
        ],
        after: thms => document.querySelectorAll(thms.selectors.TOGGLE)
          .forEach(element => {
            element.querySelector('[data-js-themes="icon"]')
              .setAttribute('href', `#${thms.theme.icon}`);
          })
      });
    }

    /**
     * An API for the Toggle Utility
     *
     * @param   {Object}  settings  Settings for the Toggle Class
     *
     * @return  {Object}            Instance of Toggle
     */
    toggle(settings = false) {
      return (settings) ? new Toggle(settings) : new Toggle();
    }

    /**
     * An API for the Track Object
     *
     * @return  {Object}  Instance of Track
     */
    track() {
      return new Track();
    }

    /**
     * An API for Web Share
     *
     * @return  {Object}  Instance of WebShare
     */
    webShare() {
      return new WebShare({
        fallback: () => {
          new Toggle({
            selector: WebShare.selector
          });
        }
      });
    }

    /**
     * API for validating a form.
     *
     * @param  {String}    selector  A custom selector for a form
     * @param  {Function}  submit    A custom event handler for a form
     */
    validate(selector = '[data-js="validate"]', submit = (event) => {event.target.submit();}) {
      (elements => {
        elements.forEach(element => {
          let form = new Forms(element);

          form.submit = submit;

          form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

          form.watch();
        });
      })(document.querySelectorAll(selector));
    }

    /**
     * Validates a form and builds a URL search query on the action based on data.
     *
     * @param  {String}  selector  A custom selector for a form
     */
    validateAndQuery(selector = '[data-js="validate-and-query"]') {
      let element = document.querySelector(selector);

      if (element) {
        let form = new Forms(element);

        form.submit = event => {
          let data = serialize(event.target, {hash: true});

          window.location = `${event.target.action}?` + Object.keys(data)
            .map(k => `${k}=${encodeURI(data[k])}`).join('&');
        };

        form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

        form.watch();
      }
    }
  }

  return Main;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy90b2dnbGUvdG9nZ2xlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy9kaWFsb2cvZGlhbG9nLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy9kaXJlY3Rpb24vZGlyZWN0aW9uLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy9jb3B5L2NvcHkuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL2Zvcm1zL2Zvcm1zLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy9pY29ucy9pY29ucy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jbGVhdmUuanMvZGlzdC9jbGVhdmUtZXNtLmpzIiwiLi4vLi4vc3JjL3V0aWxpdGllcy9tYXNrL21hc2stZG9sbGFycy5qcyIsIi4uLy4uL3NyYy91dGlsaXRpZXMvbWFzay9tYXNrLXBob25lLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2Zvci1jZXJpYWwvZGlzdC9pbmRleC5tanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL25ld3NsZXR0ZXIvbmV3c2xldHRlci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Abnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvc2V0LWhlaWdodC1wcm9wZXJ0aWVzL3NldC1oZWlnaHQtcHJvcGVydGllcy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Abnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvdGhlbWVzL3RoZW1lcy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Abnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvdHJhY2svdHJhY2suanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL3dlYi1zaGFyZS93ZWItc2hhcmUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL3dpbmRvdy12aC93aW5kb3ctdmguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3BhdHRlcm4tZWxlbWVudHMvc3JjL2VsZW1lbnRzL2NvZGUvY29kZS1oaWdobGlnaHQuanMiLCIuLi8uLi9zcmMvY29tcG9uZW50cy9hY2NvcmRpb24vYWNjb3JkaW9uLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy9vYnNlcnZlL29ic2VydmUuanMiLCIuLi8uLi9zcmMvY29tcG9uZW50cy9hY3RpdmUtbmF2aWdhdGlvbi9hY3RpdmUtbmF2aWdhdGlvbi5qcyIsIi4uLy4uL3NyYy9jb21wb25lbnRzL2Rpc2NsYWltZXIvZGlzY2xhaW1lci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2ZyZWVHbG9iYWwuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19yb290LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fU3ltYm9sLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fZ2V0UmF3VGFnLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fb2JqZWN0VG9TdHJpbmcuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19iYXNlR2V0VGFnLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9pc09iamVjdC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvaXNGdW5jdGlvbi5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2NvcmVKc0RhdGEuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19pc01hc2tlZC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX3RvU291cmNlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fYmFzZUlzTmF0aXZlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fZ2V0VmFsdWUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19nZXROYXRpdmUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19kZWZpbmVQcm9wZXJ0eS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2Jhc2VBc3NpZ25WYWx1ZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvZXEuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19hc3NpZ25WYWx1ZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2NvcHlPYmplY3QuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2lkZW50aXR5LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fYXBwbHkuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19vdmVyUmVzdC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvY29uc3RhbnQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19iYXNlU2V0VG9TdHJpbmcuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19zaG9ydE91dC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX3NldFRvU3RyaW5nLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fYmFzZVJlc3QuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2lzTGVuZ3RoLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9pc0FycmF5TGlrZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2lzSW5kZXguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19pc0l0ZXJhdGVlQ2FsbC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2NyZWF0ZUFzc2lnbmVyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fYmFzZVRpbWVzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9pc09iamVjdExpa2UuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19iYXNlSXNBcmd1bWVudHMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2lzQXJndW1lbnRzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9pc0FycmF5LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9zdHViRmFsc2UuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2lzQnVmZmVyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fYmFzZUlzVHlwZWRBcnJheS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2Jhc2VVbmFyeS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX25vZGVVdGlsLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9pc1R5cGVkQXJyYXkuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19hcnJheUxpa2VLZXlzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9faXNQcm90b3R5cGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19uYXRpdmVLZXlzSW4uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19iYXNlS2V5c0luLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9rZXlzSW4uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2Fzc2lnbkluV2l0aC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX292ZXJBcmcuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19nZXRQcm90b3R5cGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2lzUGxhaW5PYmplY3QuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2lzRXJyb3IuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2F0dGVtcHQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19hcnJheU1hcC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2Jhc2VWYWx1ZXMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19jdXN0b21EZWZhdWx0c0Fzc2lnbkluLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fZXNjYXBlU3RyaW5nQ2hhci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX25hdGl2ZUtleXMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19iYXNlS2V5cy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMva2V5cy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX3JlSW50ZXJwb2xhdGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19iYXNlUHJvcGVydHlPZi5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2VzY2FwZUh0bWxDaGFyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9pc1N5bWJvbC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2Jhc2VUb1N0cmluZy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvdG9TdHJpbmcuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL2VzY2FwZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX3JlRXNjYXBlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fcmVFdmFsdWF0ZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvdGVtcGxhdGVTZXR0aW5ncy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvdGVtcGxhdGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19hcnJheUVhY2guanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19jcmVhdGVCYXNlRm9yLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fYmFzZUZvci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2Jhc2VGb3JPd24uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLWVzL19jcmVhdGVCYXNlRWFjaC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gtZXMvX2Jhc2VFYWNoLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9fY2FzdEZ1bmN0aW9uLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC1lcy9mb3JFYWNoLmpzIiwiLi4vLi4vc3JjL2NvbXBvbmVudHMvbmVhcmJ5LXN0b3BzL25lYXJieS1zdG9wcy5qcyIsIi4uLy4uL3NyYy9jb21wb25lbnRzL3BvcG92ZXIvcG9wb3Zlci5qcyIsIi4uLy4uL3NyYy9jb21wb25lbnRzL3NoYXJlLWZvcm0vc2hhcmUtZm9ybS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Abnljb3Bwb3J0dW5pdHkvcGF0dGVybi1hdHRyaWJ1dGlvbi9zcmMvYXR0cmlidXRpb24uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3BhdHRlcm4tbWVudS9zcmMvbWVudS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Abnljb3Bwb3J0dW5pdHkvcGF0dGVybi1tb2RhbC9zcmMvbW9kYWwuanMiLCIuLi8uLi9zcmMvb2JqZWN0cy9zZWFyY2gvc2VhcmNoLmpzIiwiLi4vLi4vc3JjL29iamVjdHMvc3RlcC1ieS1zdGVwL3N0ZXAtYnktc3RlcC5qcyIsIi4uLy4uL3NyYy9qcy9kZWZhdWx0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgU2ltcGxlIFRvZ2dsZSBjbGFzcy4gVGhpcyB3aWxsIHRvZ2dsZSB0aGUgY2xhc3MgJ2FjdGl2ZScgYW5kICdoaWRkZW4nXG4gKiBvbiB0YXJnZXQgZWxlbWVudHMsIGRldGVybWluZWQgYnkgYSBjbGljayBldmVudCBvbiBhIHNlbGVjdGVkIGxpbmsgb3JcbiAqIGVsZW1lbnQuIFRoaXMgd2lsbCBhbHNvIHRvZ2dsZSB0aGUgYXJpYS1oaWRkZW4gYXR0cmlidXRlIGZvciB0YXJnZXRlZFxuICogZWxlbWVudHMgdG8gc3VwcG9ydCBzY3JlZW4gcmVhZGVycy4gVGFyZ2V0IHNldHRpbmdzIGFuZCBvdGhlciBmdW5jdGlvbmFsaXR5XG4gKiBjYW4gYmUgY29udHJvbGxlZCB0aHJvdWdoIGRhdGEgYXR0cmlidXRlcy5cbiAqXG4gKiBUaGlzIHVzZXMgdGhlIC5tYXRjaGVzKCkgbWV0aG9kIHdoaWNoIHdpbGwgcmVxdWlyZSBhIHBvbHlmaWxsIGZvciBJRVxuICogaHR0cHM6Ly9wb2x5ZmlsbC5pby92Mi9kb2NzL2ZlYXR1cmVzLyNFbGVtZW50X3Byb3RvdHlwZV9tYXRjaGVzXG4gKlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIFRvZ2dsZSB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgcyAgU2V0dGluZ3MgZm9yIHRoaXMgVG9nZ2xlIGluc3RhbmNlXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gICAgIFRoZSBjbGFzc1xuICAgKi9cbiAgY29uc3RydWN0b3Iocykge1xuICAgIC8vIENyZWF0ZSBhbiBvYmplY3QgdG8gc3RvcmUgZXhpc3RpbmcgdG9nZ2xlIGxpc3RlbmVycyAoaWYgaXQgZG9lc24ndCBleGlzdClcbiAgICBpZiAoIXdpbmRvdy5oYXNPd25Qcm9wZXJ0eShUb2dnbGUuY2FsbGJhY2spKVxuICAgICAgd2luZG93W1RvZ2dsZS5jYWxsYmFja10gPSBbXTtcblxuICAgIHMgPSAoIXMpID8ge30gOiBzO1xuXG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgIHNlbGVjdG9yOiAocy5zZWxlY3RvcikgPyBzLnNlbGVjdG9yIDogVG9nZ2xlLnNlbGVjdG9yLFxuICAgICAgbmFtZXNwYWNlOiAocy5uYW1lc3BhY2UpID8gcy5uYW1lc3BhY2UgOiBUb2dnbGUubmFtZXNwYWNlLFxuICAgICAgaW5hY3RpdmVDbGFzczogKHMuaW5hY3RpdmVDbGFzcykgPyBzLmluYWN0aXZlQ2xhc3MgOiBUb2dnbGUuaW5hY3RpdmVDbGFzcyxcbiAgICAgIGFjdGl2ZUNsYXNzOiAocy5hY3RpdmVDbGFzcykgPyBzLmFjdGl2ZUNsYXNzIDogVG9nZ2xlLmFjdGl2ZUNsYXNzLFxuICAgICAgYmVmb3JlOiAocy5iZWZvcmUpID8gcy5iZWZvcmUgOiBmYWxzZSxcbiAgICAgIGFmdGVyOiAocy5hZnRlcikgPyBzLmFmdGVyIDogZmFsc2UsXG4gICAgICB2YWxpZDogKHMudmFsaWQpID8gcy52YWxpZCA6IGZhbHNlLFxuICAgICAgZm9jdXNhYmxlOiAocy5oYXNPd25Qcm9wZXJ0eSgnZm9jdXNhYmxlJykpID8gcy5mb2N1c2FibGUgOiB0cnVlLFxuICAgICAganVtcDogKHMuaGFzT3duUHJvcGVydHkoJ2p1bXAnKSkgPyBzLmp1bXAgOiB0cnVlXG4gICAgfTtcblxuICAgIC8vIFN0b3JlIHRoZSBlbGVtZW50IGZvciBwb3RlbnRpYWwgdXNlIGluIGNhbGxiYWNrc1xuICAgIHRoaXMuZWxlbWVudCA9IChzLmVsZW1lbnQpID8gcy5lbGVtZW50IDogZmFsc2U7XG5cbiAgICBpZiAodGhpcy5lbGVtZW50KSB7XG4gICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy50b2dnbGUoZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlIGlzbid0IGFuIGV4aXN0aW5nIGluc3RhbnRpYXRlZCB0b2dnbGUsIGFkZCB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gICAgICBpZiAoIXdpbmRvd1tUb2dnbGUuY2FsbGJhY2tdLmhhc093blByb3BlcnR5KHRoaXMuc2V0dGluZ3Muc2VsZWN0b3IpKSB7XG4gICAgICAgIGxldCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgVG9nZ2xlLmV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGxldCB0Z2dsZUV2ZW50ID0gVG9nZ2xlLmV2ZW50c1tpXTtcblxuICAgICAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcih0Z2dsZUV2ZW50LCBldmVudCA9PiB7XG4gICAgICAgICAgICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKHRoaXMuc2V0dGluZ3Muc2VsZWN0b3IpKVxuICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHRoaXMuZXZlbnQgPSBldmVudDtcblxuICAgICAgICAgICAgbGV0IHR5cGUgPSBldmVudC50eXBlLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGhpc1tldmVudC50eXBlXSAmJlxuICAgICAgICAgICAgICBUb2dnbGUuZWxlbWVudHNbdHlwZV0gJiZcbiAgICAgICAgICAgICAgVG9nZ2xlLmVsZW1lbnRzW3R5cGVdLmluY2x1ZGVzKGV2ZW50LnRhcmdldC50YWdOYW1lKVxuICAgICAgICAgICAgKSB0aGlzW2V2ZW50LnR5cGVdKGV2ZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlY29yZCB0aGF0IGEgdG9nZ2xlIHVzaW5nIHRoaXMgc2VsZWN0b3IgaGFzIGJlZW4gaW5zdGFudGlhdGVkLlxuICAgIC8vIFRoaXMgcHJldmVudHMgZG91YmxlIHRvZ2dsaW5nLlxuICAgIHdpbmRvd1tUb2dnbGUuY2FsbGJhY2tdW3RoaXMuc2V0dGluZ3Muc2VsZWN0b3JdID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENsaWNrIGV2ZW50IGhhbmRsZXJcbiAgICpcbiAgICogQHBhcmFtICB7RXZlbnR9ICBldmVudCAgVGhlIG9yaWdpbmFsIGNsaWNrIGV2ZW50XG4gICAqL1xuICBjbGljayhldmVudCkge1xuICAgIHRoaXMudG9nZ2xlKGV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnB1dC9zZWxlY3QvdGV4dGFyZWEgY2hhbmdlIGV2ZW50IGhhbmRsZXIuIENoZWNrcyB0byBzZWUgaWYgdGhlXG4gICAqIGV2ZW50LnRhcmdldCBpcyB2YWxpZCB0aGVuIHRvZ2dsZXMgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSAge0V2ZW50fSAgZXZlbnQgIFRoZSBvcmlnaW5hbCBpbnB1dCBjaGFuZ2UgZXZlbnRcbiAgICovXG4gIGNoYW5nZShldmVudCkge1xuICAgIGxldCB2YWxpZCA9IGV2ZW50LnRhcmdldC5jaGVja1ZhbGlkaXR5KCk7XG5cbiAgICBpZiAodmFsaWQgJiYgIXRoaXMuaXNBY3RpdmUoZXZlbnQudGFyZ2V0KSkge1xuICAgICAgdGhpcy50b2dnbGUoZXZlbnQpOyAvLyBzaG93XG4gICAgfSBlbHNlIGlmICghdmFsaWQgJiYgdGhpcy5pc0FjdGl2ZShldmVudC50YXJnZXQpKSB7XG4gICAgICB0aGlzLnRvZ2dsZShldmVudCk7IC8vIGhpZGVcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgdG8gc2VlIGlmIHRoZSB0b2dnbGUgaXMgYWN0aXZlXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gIGVsZW1lbnQgIFRoZSB0b2dnbGUgZWxlbWVudCAodHJpZ2dlcilcbiAgICovXG4gIGlzQWN0aXZlKGVsZW1lbnQpIHtcbiAgICBsZXQgYWN0aXZlID0gZmFsc2U7XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcykge1xuICAgICAgYWN0aXZlID0gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcylcbiAgICB9XG5cbiAgICAvLyBpZiAoKSB7XG4gICAgICAvLyBUb2dnbGUuZWxlbWVudEFyaWFSb2xlc1xuICAgICAgLy8gVE9ETzogQWRkIGNhdGNoIHRvIHNlZSBpZiBlbGVtZW50IGFyaWEgcm9sZXMgYXJlIHRvZ2dsZWRcbiAgICAvLyB9XG5cbiAgICAvLyBpZiAoKSB7XG4gICAgICAvLyBUb2dnbGUudGFyZ2V0QXJpYVJvbGVzXG4gICAgICAvLyBUT0RPOiBBZGQgY2F0Y2ggdG8gc2VlIGlmIHRhcmdldCBhcmlhIHJvbGVzIGFyZSB0b2dnbGVkXG4gICAgLy8gfVxuXG4gICAgcmV0dXJuIGFjdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHRhcmdldCBvZiB0aGUgdG9nZ2xlIGVsZW1lbnQgKHRyaWdnZXIpXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gIGVsICBUaGUgdG9nZ2xlIGVsZW1lbnQgKHRyaWdnZXIpXG4gICAqL1xuICBnZXRUYXJnZXQoZWxlbWVudCkge1xuICAgIGxldCB0YXJnZXQgPSBmYWxzZTtcblxuICAgIC8qKiBBbmNob3IgTGlua3MgKi9cbiAgICB0YXJnZXQgPSAoZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2hyZWYnKSkgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpKSA6IHRhcmdldDtcblxuICAgIC8qKiBUb2dnbGUgQ29udHJvbHMgKi9cbiAgICB0YXJnZXQgPSAoZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSkgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgIyR7ZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKX1gKSA6IHRhcmdldDtcblxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHRvZ2dsZSBldmVudCBwcm94eSBmb3IgZ2V0dGluZyBhbmQgc2V0dGluZyB0aGUgZWxlbWVudC9zIGFuZCB0YXJnZXRcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgZXZlbnQgIFRoZSBtYWluIGNsaWNrIGV2ZW50XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICBUaGUgVG9nZ2xlIGluc3RhbmNlXG4gICAqL1xuICB0b2dnbGUoZXZlbnQpIHtcbiAgICBsZXQgZWxlbWVudCA9IGV2ZW50LnRhcmdldDtcbiAgICBsZXQgdGFyZ2V0ID0gZmFsc2U7XG4gICAgbGV0IGZvY3VzYWJsZSA9IFtdO1xuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRhcmdldCA9IHRoaXMuZ2V0VGFyZ2V0KGVsZW1lbnQpO1xuXG4gICAgLyoqIEZvY3VzYWJsZSBDaGlsZHJlbiAqL1xuICAgIGZvY3VzYWJsZSA9ICh0YXJnZXQpID9cbiAgICAgIHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKFRvZ2dsZS5lbEZvY3VzYWJsZS5qb2luKCcsICcpKSA6IGZvY3VzYWJsZTtcblxuICAgIC8qKiBNYWluIEZ1bmN0aW9uYWxpdHkgKi9cbiAgICBpZiAoIXRhcmdldCkgcmV0dXJuIHRoaXM7XG4gICAgdGhpcy5lbGVtZW50VG9nZ2xlKGVsZW1lbnQsIHRhcmdldCwgZm9jdXNhYmxlKTtcblxuICAgIC8qKiBVbmRvICovXG4gICAgaWYgKGVsZW1lbnQuZGF0YXNldFtgJHt0aGlzLnNldHRpbmdzLm5hbWVzcGFjZX1VbmRvYF0pIHtcbiAgICAgIGNvbnN0IHVuZG8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICBlbGVtZW50LmRhdGFzZXRbYCR7dGhpcy5zZXR0aW5ncy5uYW1lc3BhY2V9VW5kb2BdXG4gICAgICApO1xuXG4gICAgICB1bmRvLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuZWxlbWVudFRvZ2dsZShlbGVtZW50LCB0YXJnZXQpO1xuICAgICAgICB1bmRvLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgb3RoZXIgdG9nZ2xlcyB0aGF0IG1pZ2h0IGNvbnRyb2wgdGhlIHNhbWUgZWxlbWVudFxuICAgKlxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgICBlbGVtZW50ICBUaGUgdG9nZ2xpbmcgZWxlbWVudFxuICAgKlxuICAgKiBAcmV0dXJuICB7Tm9kZUxpc3R9ICAgICAgICAgICBMaXN0IG9mIG90aGVyIHRvZ2dsaW5nIGVsZW1lbnRzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQgY29udHJvbCB0aGUgdGFyZ2V0XG4gICAqL1xuICBnZXRPdGhlcnMoZWxlbWVudCkge1xuICAgIGxldCBzZWxlY3RvciA9IGZhbHNlO1xuXG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCdocmVmJykpIHtcbiAgICAgIHNlbGVjdG9yID0gYFtocmVmPVwiJHtlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpfVwiXWA7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnYXJpYS1jb250cm9scycpKSB7XG4gICAgICBzZWxlY3RvciA9IGBbYXJpYS1jb250cm9scz1cIiR7ZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKX1cIl1gO1xuICAgIH1cblxuICAgIHJldHVybiAoc2VsZWN0b3IpID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikgOiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlIHRoZSBUb2dnbGUgVGFyZ2V0J3MgZm9jdXNhYmxlIGNoaWxkcmVuIGZyb20gZm9jdXMuXG4gICAqIElmIGFuIGVsZW1lbnQgaGFzIHRoZSBkYXRhLWF0dHJpYnV0ZSBgZGF0YS10b2dnbGUtdGFiaW5kZXhgXG4gICAqIGl0IHdpbGwgdXNlIHRoYXQgYXMgdGhlIGRlZmF1bHQgdGFiIGluZGV4IG9mIHRoZSBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gICB7Tm9kZUxpc3R9ICBlbGVtZW50cyAgTGlzdCBvZiBmb2N1c2FibGUgZWxlbWVudHNcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgICAgICAgIFRoZSBUb2dnbGUgSW5zdGFuY2VcbiAgICovXG4gIHRvZ2dsZUZvY3VzYWJsZShlbGVtZW50cykge1xuICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBsZXQgdGFiaW5kZXggPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcblxuICAgICAgaWYgKHRhYmluZGV4ID09PSAnLTEnKSB7XG4gICAgICAgIGxldCBkYXRhRGVmYXVsdCA9IGVsZW1lbnRcbiAgICAgICAgICAuZ2V0QXR0cmlidXRlKGBkYXRhLSR7VG9nZ2xlLm5hbWVzcGFjZX0tdGFiaW5kZXhgKTtcblxuICAgICAgICBpZiAoZGF0YURlZmF1bHQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCBkYXRhRGVmYXVsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogSnVtcHMgdG8gRWxlbWVudCB2aXNpYmx5IGFuZCBzaGlmdHMgZm9jdXNcbiAgICogdG8gdGhlIGVsZW1lbnQgYnkgc2V0dGluZyB0aGUgdGFiaW5kZXhcbiAgICpcbiAgICogQHBhcmFtICAge09iamVjdH0gIGVsZW1lbnQgIFRoZSBUb2dnbGluZyBFbGVtZW50XG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICB0YXJnZXQgICBUaGUgVGFyZ2V0IEVsZW1lbnRcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgICAgIFRoZSBUb2dnbGUgaW5zdGFuY2VcbiAgICovXG4gIGp1bXBUbyhlbGVtZW50LCB0YXJnZXQpIHtcbiAgICAvLyBSZXNldCB0aGUgaGlzdG9yeSBzdGF0ZS4gVGhpcyB3aWxsIGNsZWFyIG91dFxuICAgIC8vIHRoZSBoYXNoIHdoZW4gdGhlIHRhcmdldCBpcyB0b2dnbGVkIGNsb3NlZFxuICAgIGhpc3RvcnkucHVzaFN0YXRlKCcnLCAnJyxcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuXG4gICAgLy8gRm9jdXMgaWYgYWN0aXZlXG4gICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnModGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcykpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblxuICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xuICAgICAgdGFyZ2V0LmZvY3VzKHtwcmV2ZW50U2Nyb2xsOiB0cnVlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG1haW4gdG9nZ2xpbmcgbWV0aG9kIGZvciBhdHRyaWJ1dGVzXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgZWxlbWVudCAgICBUaGUgVG9nZ2xlIGVsZW1lbnRcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICB0YXJnZXQgICAgIFRoZSBUYXJnZXQgZWxlbWVudCB0byB0b2dnbGUgYWN0aXZlL2hpZGRlblxuICAgKiBAcGFyYW0gIHtOb2RlTGlzdH0gIGZvY3VzYWJsZSAgQW55IGZvY3VzYWJsZSBjaGlsZHJlbiBpbiB0aGUgdGFyZ2V0XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICBUaGUgVG9nZ2xlIGluc3RhbmNlXG4gICAqL1xuICBlbGVtZW50VG9nZ2xlKGVsZW1lbnQsIHRhcmdldCwgZm9jdXNhYmxlID0gW10pIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IGF0dHIgPSAnJztcbiAgICBsZXQgdmFsdWUgPSAnJztcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGVsZW1lbnRzIGZvciBwb3RlbnRpYWwgdXNlIGluIGNhbGxiYWNrc1xuICAgICAqL1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLm90aGVycyA9IHRoaXMuZ2V0T3RoZXJzKGVsZW1lbnQpO1xuICAgIHRoaXMuZm9jdXNhYmxlID0gZm9jdXNhYmxlO1xuXG4gICAgLyoqXG4gICAgICogVmFsaWRpdHkgbWV0aG9kIHByb3BlcnR5IHRoYXQgd2lsbCBjYW5jZWwgdGhlIHRvZ2dsZSBpZiBpdCByZXR1cm5zIGZhbHNlXG4gICAgICovXG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy52YWxpZCAmJiAhdGhpcy5zZXR0aW5ncy52YWxpZCh0aGlzKSlcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgLyoqXG4gICAgICogVG9nZ2xpbmcgYmVmb3JlIGhvb2tcbiAgICAgKi9cblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmJlZm9yZSlcbiAgICAgIHRoaXMuc2V0dGluZ3MuYmVmb3JlKHRoaXMpO1xuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIEVsZW1lbnQgYW5kIFRhcmdldCBjbGFzc2VzXG4gICAgICovXG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcykge1xuICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC50b2dnbGUodGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG4gICAgICB0aGlzLnRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgb3RoZXIgdG9nZ2xlcyB0aGF0IGNvbnRyb2wgdGhlIHNhbWUgZWxlbWVudFxuICAgICAgdGhpcy5vdGhlcnMuZm9yRWFjaChvdGhlciA9PiB7XG4gICAgICAgIGlmIChvdGhlciAhPT0gdGhpcy5lbGVtZW50KVxuICAgICAgICAgIG90aGVyLmNsYXNzTGlzdC50b2dnbGUodGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5pbmFjdGl2ZUNsYXNzKVxuICAgICAgdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUodGhpcy5zZXR0aW5ncy5pbmFjdGl2ZUNsYXNzKTtcblxuICAgIC8qKlxuICAgICAqIFRhcmdldCBFbGVtZW50IEFyaWEgQXR0cmlidXRlc1xuICAgICAqL1xuXG4gICAgZm9yIChpID0gMDsgaSA8IFRvZ2dsZS50YXJnZXRBcmlhUm9sZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGF0dHIgPSBUb2dnbGUudGFyZ2V0QXJpYVJvbGVzW2ldO1xuICAgICAgdmFsdWUgPSB0aGlzLnRhcmdldC5nZXRBdHRyaWJ1dGUoYXR0cik7XG5cbiAgICAgIGlmICh2YWx1ZSAhPSAnJyAmJiB2YWx1ZSlcbiAgICAgICAgdGhpcy50YXJnZXQuc2V0QXR0cmlidXRlKGF0dHIsICh2YWx1ZSA9PT0gJ3RydWUnKSA/ICdmYWxzZScgOiAndHJ1ZScpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSB0aGUgdGFyZ2V0J3MgZm9jdXNhYmxlIGNoaWxkcmVuIHRhYmluZGV4XG4gICAgICovXG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5mb2N1c2FibGUpXG4gICAgICB0aGlzLnRvZ2dsZUZvY3VzYWJsZSh0aGlzLmZvY3VzYWJsZSk7XG5cbiAgICAvKipcbiAgICAgKiBKdW1wIHRvIFRhcmdldCBFbGVtZW50IGlmIFRvZ2dsZSBFbGVtZW50IGlzIGFuIGFuY2hvciBsaW5rXG4gICAgICovXG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5qdW1wICYmIHRoaXMuZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2hyZWYnKSlcbiAgICAgIHRoaXMuanVtcFRvKHRoaXMuZWxlbWVudCwgdGhpcy50YXJnZXQpO1xuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIEVsZW1lbnQgKGluY2x1ZGluZyBtdWx0aSB0b2dnbGVzKSBBcmlhIEF0dHJpYnV0ZXNcbiAgICAgKi9cblxuICAgIGZvciAoaSA9IDA7IGkgPCBUb2dnbGUuZWxBcmlhUm9sZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGF0dHIgPSBUb2dnbGUuZWxBcmlhUm9sZXNbaV07XG4gICAgICB2YWx1ZSA9IHRoaXMuZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cik7XG5cbiAgICAgIGlmICh2YWx1ZSAhPSAnJyAmJiB2YWx1ZSlcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyLCAodmFsdWUgPT09ICd0cnVlJykgPyAnZmFsc2UnIDogJ3RydWUnKTtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIG90aGVyIHRvZ2dsZXMgdGhhdCBjb250cm9sIHRoZSBzYW1lIGVsZW1lbnRcbiAgICAgIHRoaXMub3RoZXJzLmZvckVhY2goKG90aGVyKSA9PiB7XG4gICAgICAgIGlmIChvdGhlciAhPT0gdGhpcy5lbGVtZW50ICYmIG90aGVyLmdldEF0dHJpYnV0ZShhdHRyKSlcbiAgICAgICAgICBvdGhlci5zZXRBdHRyaWJ1dGUoYXR0ciwgKHZhbHVlID09PSAndHJ1ZScpID8gJ2ZhbHNlJyA6ICd0cnVlJyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGluZyBjb21wbGV0ZSBob29rXG4gICAgICovXG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5hZnRlcilcbiAgICAgIHRoaXMuc2V0dGluZ3MuYWZ0ZXIodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vKiogQHR5cGUgIHtTdHJpbmd9ICBUaGUgbWFpbiBzZWxlY3RvciB0byBhZGQgdGhlIHRvZ2dsaW5nIGZ1bmN0aW9uIHRvICovXG5Ub2dnbGUuc2VsZWN0b3IgPSAnW2RhdGEtanMqPVwidG9nZ2xlXCJdJztcblxuLyoqIEB0eXBlICB7U3RyaW5nfSAgVGhlIG5hbWVzcGFjZSBmb3Igb3VyIGRhdGEgYXR0cmlidXRlIHNldHRpbmdzICovXG5Ub2dnbGUubmFtZXNwYWNlID0gJ3RvZ2dsZSc7XG5cbi8qKiBAdHlwZSAge1N0cmluZ30gIFRoZSBoaWRlIGNsYXNzICovXG5Ub2dnbGUuaW5hY3RpdmVDbGFzcyA9ICdoaWRkZW4nO1xuXG4vKiogQHR5cGUgIHtTdHJpbmd9ICBUaGUgYWN0aXZlIGNsYXNzICovXG5Ub2dnbGUuYWN0aXZlQ2xhc3MgPSAnYWN0aXZlJztcblxuLyoqIEB0eXBlICB7QXJyYXl9ICBBcmlhIHJvbGVzIHRvIHRvZ2dsZSB0cnVlL2ZhbHNlIG9uIHRoZSB0b2dnbGluZyBlbGVtZW50ICovXG5Ub2dnbGUuZWxBcmlhUm9sZXMgPSBbJ2FyaWEtcHJlc3NlZCcsICdhcmlhLWV4cGFuZGVkJ107XG5cbi8qKiBAdHlwZSAge0FycmF5fSAgQXJpYSByb2xlcyB0byB0b2dnbGUgdHJ1ZS9mYWxzZSBvbiB0aGUgdGFyZ2V0IGVsZW1lbnQgKi9cblRvZ2dsZS50YXJnZXRBcmlhUm9sZXMgPSBbJ2FyaWEtaGlkZGVuJ107XG5cbi8qKiBAdHlwZSAge0FycmF5fSAgRm9jdXNhYmxlIGVsZW1lbnRzIHRvIGhpZGUgd2l0aGluIHRoZSBoaWRkZW4gdGFyZ2V0IGVsZW1lbnQgKi9cblRvZ2dsZS5lbEZvY3VzYWJsZSA9IFtcbiAgJ2EnLCAnYnV0dG9uJywgJ2lucHV0JywgJ3NlbGVjdCcsICd0ZXh0YXJlYScsICdvYmplY3QnLCAnZW1iZWQnLCAnZm9ybScsXG4gICdmaWVsZHNldCcsICdsZWdlbmQnLCAnbGFiZWwnLCAnYXJlYScsICdhdWRpbycsICd2aWRlbycsICdpZnJhbWUnLCAnc3ZnJyxcbiAgJ2RldGFpbHMnLCAndGFibGUnLCAnW3RhYmluZGV4XScsICdbY29udGVudGVkaXRhYmxlXScsICdbdXNlbWFwXSdcbl07XG5cbi8qKiBAdHlwZSAge0FycmF5fSAgS2V5IGF0dHJpYnV0ZSBmb3Igc3RvcmluZyB0b2dnbGVzIGluIHRoZSB3aW5kb3cgKi9cblRvZ2dsZS5jYWxsYmFjayA9IFsnVG9nZ2xlc0NhbGxiYWNrJ107XG5cbi8qKiBAdHlwZSAge0FycmF5fSAgRGVmYXVsdCBldmVudHMgdG8gdG8gd2F0Y2ggZm9yIHRvZ2dsaW5nLiBFYWNoIG11c3QgaGF2ZSBhIGhhbmRsZXIgaW4gdGhlIGNsYXNzIGFuZCBlbGVtZW50cyB0byBsb29rIGZvciBpbiBUb2dnbGUuZWxlbWVudHMgKi9cblRvZ2dsZS5ldmVudHMgPSBbJ2NsaWNrJywgJ2NoYW5nZSddO1xuXG4vKiogQHR5cGUgIHtBcnJheX0gIEVsZW1lbnRzIHRvIGRlbGVnYXRlIHRvIGVhY2ggZXZlbnQgaGFuZGxlciAqL1xuVG9nZ2xlLmVsZW1lbnRzID0ge1xuICBDTElDSzogWydBJywgJ0JVVFRPTiddLFxuICBDSEFOR0U6IFsnU0VMRUNUJywgJ0lOUFVUJywgJ1RFWFRBUkVBJ11cbn07XG5cbmV4cG9ydCBkZWZhdWx0IFRvZ2dsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFRvZ2dsZSBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvdG9nZ2xlL3RvZ2dsZSc7XG5cbi8qKlxuICogQGNsYXNzICBEaWFsb2dcbiAqXG4gKiBVc2FnZVxuICpcbiAqIEVsZW1lbnQgQXR0cmlidXRlcy4gRWl0aGVyIDxhPiBvciA8YnV0dG9uPlxuICpcbiAqIEBhdHRyICBkYXRhLWpzPVwiZGlhbG9nXCIgICAgICAgICAgICAgICBJbnN0YW50aWF0ZXMgdGhlIHRvZ2dsaW5nIG1ldGhvZFxuICogQGF0dHIgIGFyaWEtY29udHJvbHM9XCJcIiAgICAgICAgICAgICAgIFRhcmdldHMgdGhlIGlkIG9mIHRoZSBkaWFsb2dcbiAqIEBhdHRyICBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIiAgICAgICAgICBEZWNsYXJlcyB0YXJnZXQgY2xvc2VkL29wZW4gd2hlbiB0b2dnbGVkXG4gKiBAYXR0ciAgZGF0YS1kaWFsb2c9XCJvcGVuXCIgICAgICAgICAgICAgRGVzaWduYXRlcyB0aGUgcHJpbWFyeSBvcGVuaW5nIGVsZW1lbnQgb2YgdGhlIGRpYWxvZ1xuICogQGF0dHIgIGRhdGEtZGlhbG9nPVwiY2xvc2VcIiAgICAgICAgICAgIERlc2lnbmF0ZXMgdGhlIHByaW1hcnkgY2xvc2luZyBlbGVtZW50IG9mIHRoZSBkaWFsb2dcbiAqIEBhdHRyICBkYXRhLWRpYWxvZy1mb2N1cy1vbi1jbG9zZT1cIlwiICBEZXNpZ25hdGVzIGFuIGFsdGVybmF0ZSBlbGVtZW50IHRvIGZvY3VzIG9uIHdoZW4gdGhlIGRpYWxvZyBjbG9zZXMuIFZhbHVlIG9mIHRoZSBhdHRyaWJ1dGUgaXMgdGhlIGlkIG9mIHRoZSBkaWFsb2cuXG4gKiBAYXR0ciAgZGF0YS1kaWFsb2ctbG9jaz1cInRydWVcIiAgICAgICAgV2V0aGVyIHRvIGxvY2sgc2NyZWVuIHNjcm9sbGluZyB3aGVuIGRpYWxvZyBpcyBvcGVuXG4gKlxuICogVGFyZ2V0IEF0dHJpYnV0ZXMuIEFueSA8ZWxlbWVudD5cbiAqXG4gKiBAYXR0ciAgaWQ9XCJcIiAgICAgICAgICAgICAgIE1hdGNoZXMgYXJpYS1jb250cm9scyBhdHRyIG9mIEVsZW1lbnRcbiAqIEBhdHRyICBjbGFzcz1cImhpZGRlblwiICAgICAgSGlkZGVuIGNsYXNzXG4gKiBAYXR0ciAgYXJpYS1oaWRkZW49XCJ0cnVlXCIgIERlY2xhcmVzIHRhcmdldCBvcGVuL2Nsb3NlZCB3aGVuIHRvZ2dsZWRcbiAqL1xuY2xhc3MgRGlhbG9nIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvciAgSW5zdGFudGlhdGVzIGRpYWxvZyBhbmQgdG9nZ2xlIG1ldGhvZFxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgVGhlIGluc3RhbnRpYXRlZCBkaWFsb2cgd2l0aCBwcm9wZXJ0aWVzXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gRGlhbG9nLnNlbGVjdG9yO1xuXG4gICAgdGhpcy5zZWxlY3RvcnMgPSBEaWFsb2cuc2VsZWN0b3JzO1xuXG4gICAgdGhpcy5jbGFzc2VzID0gRGlhbG9nLmNsYXNzZXM7XG5cbiAgICB0aGlzLmRhdGFBdHRycyA9IERpYWxvZy5kYXRhQXR0cnM7XG5cbiAgICB0aGlzLnRvZ2dsZSA9IG5ldyBUb2dnbGUoe1xuICAgICAgc2VsZWN0b3I6IHRoaXMuc2VsZWN0b3IsXG4gICAgICBhZnRlcjogKHRvZ2dsZSkgPT4ge1xuICAgICAgICBsZXQgYWN0aXZlID0gdG9nZ2xlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoVG9nZ2xlLmFjdGl2ZUNsYXNzKTtcblxuICAgICAgICAvLyBMb2NrIHRoZSBib2R5IGZyb20gc2Nyb2xsaW5nIGlmIGxvY2sgYXR0cmlidXRlIGlzIHByZXNlbnRcbiAgICAgICAgaWYgKGFjdGl2ZSAmJiB0b2dnbGUuZWxlbWVudC5kYXRhc2V0W3RoaXMuZGF0YUF0dHJzLkxPQ0tdID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAvLyBTY3JvbGwgdG8gdGhlIHRvcCBvZiB0aGUgcGFnZVxuICAgICAgICAgIHdpbmRvdy5zY3JvbGwoMCwgMCk7XG5cbiAgICAgICAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyBvbiB0aGUgYm9keVxuICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG4gICAgICAgICAgLy8gV2hlbiB0aGUgbGFzdCBmb2N1c2FibGUgaXRlbSBpbiB0aGUgbGlzdCBsb29zZXMgZm9jdXMgbG9vcCB0byB0aGUgZmlyc3RcbiAgICAgICAgICB0b2dnbGUuZm9jdXNhYmxlLml0ZW0odG9nZ2xlLmZvY3VzYWJsZS5sZW5ndGggLSAxKVxuICAgICAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoKSA9PiB7XG4gICAgICAgICAgICAgIHRvZ2dsZS5mb2N1c2FibGUuaXRlbSgwKS5mb2N1cygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gUmVtb3ZlIGlmIGFsbCBvdGhlciBkaWFsb2cgYm9keSBsb2NrcyBhcmUgaW5hY3RpdmVcbiAgICAgICAgICBsZXQgbG9ja3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFtcbiAgICAgICAgICAgICAgdGhpcy5zZWxlY3RvcixcbiAgICAgICAgICAgICAgdGhpcy5zZWxlY3RvcnMubG9ja3MsXG4gICAgICAgICAgICAgIGAuJHtUb2dnbGUuYWN0aXZlQ2xhc3N9YFxuICAgICAgICAgICAgXS5qb2luKCcnKSk7XG5cbiAgICAgICAgICBpZiAobG9ja3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jykuc3R5bGUub3ZlcmZsb3cgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGb2N1cyBvbiB0aGUgY2xvc2UsIG9wZW4sIG9yIG90aGVyIGZvY3VzIGVsZW1lbnQgaWYgcHJlc2VudFxuICAgICAgICBsZXQgaWQgPSB0b2dnbGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgbGV0IGNvbnRyb2wgPSBgW2FyaWEtY29udHJvbHM9XCIke2lkfVwiXWA7XG4gICAgICAgIGxldCBjbG9zZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuQ0xPU0UgKyBjb250cm9sKTtcbiAgICAgICAgbGV0IG9wZW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3JzLk9QRU4gKyBjb250cm9sKTtcblxuICAgICAgICBsZXQgZm9jdXNPbkNsb3NlID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9ycy5GT0NVU19PTl9DTE9TRS5yZXBsYWNlKCd7eyBJRCB9fScsIGlkKSk7XG5cbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBjbG9zZSkge1xuICAgICAgICAgIGNsb3NlLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3Blbikge1xuICAgICAgICAgIC8vIEFsdGVybmF0aXZlbHkgZm9jdXMgb24gdGhpcyBlbGVtZW50IGlmIGl0IGlzIHByZXNlbnRcbiAgICAgICAgICBpZiAoZm9jdXNPbkNsb3NlKSB7XG4gICAgICAgICAgICBmb2N1c09uQ2xvc2Uuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgICAgZm9jdXNPbkNsb3NlLmZvY3VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wZW4uZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKiBAdHlwZSAge1N0cmluZ30gIE1haW4gRE9NIHNlbGVjdG9yICovXG5EaWFsb2cuc2VsZWN0b3IgPSAnW2RhdGEtanMqPVxcXCJkaWFsb2dcXFwiXSc7XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIEFkZGl0aW9uYWwgc2VsZWN0b3JzIHVzZWQgYnkgdGhlIHNjcmlwdCAqL1xuRGlhbG9nLnNlbGVjdG9ycyA9IHtcbiAgQ0xPU0U6ICdbZGF0YS1kaWFsb2cqPVwiY2xvc2VcIl0nLFxuICBPUEVOOiAnW2RhdGEtZGlhbG9nKj1cIm9wZW5cIl0nLFxuICBMT0NLUzogJ1tkYXRhLWRpYWxvZy1sb2NrPVwidHJ1ZVwiXScsXG4gIEZPQ1VTX09OX0NMT1NFOiAnW2RhdGEtZGlhbG9nLWZvY3VzLW9uLWNsb3NlPVwie3sgSUQgfX1cIl0nXG59O1xuXG4vKiogQHR5cGUgIHtPYmplY3R9ICBEYXRhIGF0dHJpYnV0ZSBuYW1lc3BhY2VzICovXG5EaWFsb2cuZGF0YUF0dHJzID0ge1xuICBMT0NLOiAnZGlhbG9nTG9jaydcbn07XG5cbmV4cG9ydCBkZWZhdWx0IERpYWxvZzsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogU2V0cyB0aGUgcmVhZGluZyBkaXJlY3Rpb24gb2YgdGhlIGRvY3VtZW50IGJhc2VkIG9uIFVSTCBRdWVyeSBQYXJhbWV0ZXJcbiAqIG9yIHRvZ2dsZSBjbGljay4gU3RvcmVzIHRoZSB1c2VyJ3MgcHJlZmVyZW5jZSBpbiBsb2NhbCBzdG9yYWdlLlxuICovXG5jbGFzcyBEaXJlY3Rpb24ge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gIEluc3RhbmNlIG9mIERpcmVjdGlvblxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqXG4gICAgICogU2V0dGluZ3NcbiAgICAgKi9cblxuICAgIHRoaXMuc3RvcmFnZSA9IERpcmVjdGlvbi5zdG9yYWdlO1xuXG4gICAgdGhpcy5zZWxlY3RvcnMgPSBEaXJlY3Rpb24uc2VsZWN0b3JzO1xuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBpbml0aWFsIGRlc2lyZWQgZGlyZWN0aW9uXG4gICAgICovXG5cbiAgICBsZXQgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcblxuICAgIGxldCBkaXIgPSAocGFyYW1zLmdldCgnZGlyJykpID9cbiAgICAgIHBhcmFtcy5nZXQoJ2RpcicpIDogbG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5zdG9yYWdlLkRJUik7XG5cbiAgICBpZiAoZGlyKSB0aGlzLnNldChkaXIpO1xuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGxpc3RlbmVycyBmb3IgdG9nZ2xpbmdcbiAgICAgKi9cblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXModGhpcy5zZWxlY3RvcnMuVE9HR0xFKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLmNsaWNrKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgY2xpY2sgZXZlbnQgaGFuZGxlciBmb3IgdGhlIHRvZ2dsZVxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICBJbnN0YW5jZSBvZiBEaXJlY3Rpb25cbiAgICovXG4gIGNsaWNrKCkge1xuICAgIGxldCBjdXJyZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGlyJyk7XG5cbiAgICBsZXQgZGlyZWN0aW9uID0gKGN1cnJlbnQgPT09ICdydGwnKSA/ICdsdHInIDogJ3J0bCc7XG5cbiAgICB0aGlzLnNldChkaXJlY3Rpb24pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXR0cmlidXRlIG9uIHRoZSByb290IGVsZW1lbnQgYW5kIGluIGxvY2FsIHN0b3JhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBkaXJlY3Rpb24gIFRoZSBkZXNpcmVkIGRpcmVjdGlvbjsgJ2x0cicgb3IgJ3J0bCdcbiAgICpcbiAgICogQHJldHVybiAge0NsYXNzfSAgICAgICAgICAgICAgSW5zdGFuY2Ugb2YgRGlyZWN0aW9uXG4gICAqL1xuICBzZXQoZGlyZWN0aW9uKSB7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGlyJywgZGlyZWN0aW9uKTtcblxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMuc3RvcmFnZS5ESVIsIGRpcmVjdGlvbik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vKipcbiAqIExvY2FsIHN0b3JhZ2Uga2V5c1xuICpcbiAqIEB2YXIge09iamVjdH1cbiAqL1xuRGlyZWN0aW9uLnN0b3JhZ2UgPSB7XG4gIERJUjogJy0tbnljby1kaXJlY3Rpb24nXG59O1xuXG4vKipcbiAqIFNlbGVjdG9yIHN0cmluZ3MgZm9yIHRoZSBjbGFzc1xuICpcbiAqIEB2YXIge09iamVjdH1cbiAqL1xuRGlyZWN0aW9uLnNlbGVjdG9ycyA9IHtcbiAgVE9HR0xFOiAnW2RhdGEtanM9XCJkaXJlY3Rpb25cIl0nXG59O1xuXG5leHBvcnQgZGVmYXVsdCBEaXJlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ29weSB0byBDbGlwYm9hcmQgSGVscGVyXG4gKi9cbmNsYXNzIENvcHkge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBzICBUaGUgc2V0dGluZ3Mgb2JqZWN0LCBtYXkgaW5jbHVkZSAnc2VsZWN0b3InLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgJ2FyaWEnLCAnbm90aWZ5VGltZW91dCcsICdiZWZvcmUnLCAnY29waWVkJyxcbiAgICogICAgICAgICAgICAgICAgICAgICAgIG9yICdhZnRlcicgYXR0cmlidXRlcy5cbiAgICpcbiAgICogQHJldHVybiAge0NsYXNzfSAgICAgIFRoZSBjb25zdHJ1Y3RlZCBpbnN0YW5jZSBvZiBDb3B5LlxuICAgKi9cbiAgY29uc3RydWN0b3Iocykge1xuICAgIC8vIFNldCBhdHRyaWJ1dGVzXG4gICAgdGhpcy5zZWxlY3RvciA9IChzLmhhc093blByb3BlcnR5KCdzZWxlY3RvcicpKSA/IHMuc2VsZWN0b3IgOiBDb3B5LnNlbGVjdG9yO1xuXG4gICAgdGhpcy5zZWxlY3RvcnMgPSAocy5oYXNPd25Qcm9wZXJ0eSgnc2VsZWN0b3JzJykpID8gcy5zZWxlY3RvcnMgOiBDb3B5LnNlbGVjdG9ycztcblxuICAgIHRoaXMuYXJpYSA9IChzLmhhc093blByb3BlcnR5KCdhcmlhJykpID8gcy5hcmlhIDogQ29weS5hcmlhO1xuXG4gICAgdGhpcy5ub3RpZnlUaW1lb3V0ID0gKHMuaGFzT3duUHJvcGVydHkoJ25vdGlmeVRpbWVvdXQnKSkgPyBzLm5vdGlmeVRpbWVvdXQgOiBDb3B5Lm5vdGlmeVRpbWVvdXQ7XG5cbiAgICB0aGlzLmJlZm9yZSA9IChzLmhhc093blByb3BlcnR5KCdiZWZvcmUnKSkgPyBzLmJlZm9yZSA6IENvcHkuYmVmb3JlO1xuXG4gICAgdGhpcy5jb3BpZWQgPSAocy5oYXNPd25Qcm9wZXJ0eSgnY29waWVkJykpID8gcy5jb3BpZWQgOiBDb3B5LmNvcGllZDtcblxuICAgIHRoaXMuYWZ0ZXIgPSAocy5oYXNPd25Qcm9wZXJ0eSgnYWZ0ZXInKSkgPyBzLmFmdGVyIDogQ29weS5hZnRlcjtcblxuICAgIC8vIFNlbGVjdCB0aGUgZW50aXJlIHRleHQgd2hlbiBpdCdzIGZvY3VzZWQgb25cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuc2VsZWN0b3JzLlRBUkdFVFMpLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4gdGhpcy5zZWxlY3QoaXRlbSkpO1xuICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuc2VsZWN0KGl0ZW0pKTtcbiAgICB9KTtcblxuICAgIC8vIFRoZSBtYWluIGNsaWNrIGV2ZW50IGZvciB0aGUgY2xhc3NcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKHRoaXMuc2VsZWN0b3IpKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIHRoaXMuZWxlbWVudCA9IGV2ZW50LnRhcmdldDtcblxuICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLmFyaWEsIGZhbHNlKTtcblxuICAgICAgdGhpcy50YXJnZXQgPSB0aGlzLmVsZW1lbnQuZGF0YXNldC5jb3B5O1xuXG4gICAgICB0aGlzLmJlZm9yZSh0aGlzKTtcblxuICAgICAgaWYgKHRoaXMuY29weSh0aGlzLnRhcmdldCkpIHtcbiAgICAgICAgdGhpcy5jb3BpZWQodGhpcyk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLmFyaWEsIHRydWUpO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmVsZW1lbnRbJ3RpbWVvdXQnXSk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50Wyd0aW1lb3V0J10gPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMuYXJpYSwgZmFsc2UpO1xuXG4gICAgICAgICAgdGhpcy5hZnRlcih0aGlzKTtcbiAgICAgICAgfSwgdGhpcy5ub3RpZnlUaW1lb3V0KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjbGljayBldmVudCBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICB0YXJnZXQgIENvbnRlbnQgb2YgdGFyZ2V0IGRhdGEgYXR0cmlidXRlXG4gICAqXG4gICAqIEByZXR1cm4gIHtCb29sZWFufSAgICAgICAgIFdldGhlciBjb3B5IHdhcyBzdWNjZXNzZnVsIG9yIG5vdFxuICAgKi9cbiAgY29weSh0YXJnZXQpIHtcbiAgICBsZXQgc2VsZWN0b3IgPSB0aGlzLnNlbGVjdG9ycy5UQVJHRVRTLnJlcGxhY2UoJ10nLCBgPVwiJHt0YXJnZXR9XCJdYCk7XG5cbiAgICBsZXQgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIHRoaXMuc2VsZWN0KGlucHV0KTtcblxuICAgIGlmIChuYXZpZ2F0b3IuY2xpcGJvYXJkICYmIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KVxuICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoaW5wdXQudmFsdWUpO1xuICAgIGVsc2UgaWYgKGRvY3VtZW50LmV4ZWNDb21tYW5kKVxuICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVyIGZvciB0aGUgdGV4dCBzZWxlY3Rpb24gbWV0aG9kXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBpbnB1dCAgVGhlIGlucHV0IHdpdGggY29udGVudCB0byBzZWxlY3RcbiAgICovXG4gIHNlbGVjdChpbnB1dCkge1xuICAgIGlucHV0LnNlbGVjdCgpO1xuXG4gICAgaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgOTk5OTkpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIG1haW4gZWxlbWVudCBzZWxlY3Rvci5cbiAqXG4gKiBAdmFyIHtTdHJpbmd9XG4gKi9cbkNvcHkuc2VsZWN0b3IgPSAnW2RhdGEtanMqPVwiY29weVwiXSc7XG5cbi8qKlxuICogVGhlIHNlbGVjdG9ycyBmb3IgdmFyaW91cyBlbGVtZW50cyBxdWVyaWVkIGJ5IHRoZSB1dGlsaXR5LiBSZWZlciB0byB0aGVcbiAqIHNvdXJjZSBmb3IgZGVmYXVsdHMuXG4gKlxuICogQHZhciB7W3R5cGVdfVxuICovXG5Db3B5LnNlbGVjdG9ycyA9IHtcbiAgVEFSR0VUUzogJ1tkYXRhLWNvcHktdGFyZ2V0XSdcbn07XG5cbi8qKlxuICogQnV0dG9uIGFyaWEgcm9sZSB0byB0b2dnbGVcbiAqXG4gKiBAdmFyIHtTdHJpbmd9XG4gKi9cbkNvcHkuYXJpYSA9ICdhcmlhLXByZXNzZWQnO1xuXG4vKipcbiAqIFRpbWVvdXQgZm9yIHRoZSBcIkNvcGllZCFcIiBub3RpZmljYXRpb25cbiAqXG4gKiBAdmFyIHtOdW1iZXJ9XG4gKi9cbkNvcHkubm90aWZ5VGltZW91dCA9IDE1MDA7XG5cbi8qKlxuICogQmVmb3JlIGhvb2suIFRyaWdnZXJzIGJlZm9yZSB0aGUgY2xpY2sgZXZlbnQuXG4gKlxuICogQHZhciB7RnVuY3Rpb259XG4gKi9cbkNvcHkuYmVmb3JlID0gKCkgPT4ge307XG5cbi8qKlxuICogQ29waWVkIGhvb2suIFRyaWdnZXJzIGFmdGVyIGEgc3VjY2Vzc2Z1bCB0aGUgY29weSBldmVudC5cbiAqXG4gKiBAdmFyIHtGdW5jdGlvbn1cbiAqL1xuQ29weS5jb3BpZWQgPSAoKSA9PiB7fTtcblxuLyoqXG4gKiBBZnRlciBob29rLiBUcmlnZ2VycyBhZnRlciB0aGUgY2xpY2sgZXZlbnQuXG4gKlxuICogQHZhciB7RnVuY3Rpb259XG4gKi9cbkNvcHkuYWZ0ZXIgPSAoKSA9PiB7fTtcblxuZXhwb3J0IGRlZmF1bHQgQ29weTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBVdGlsaXRpZXMgZm9yIEZvcm0gY29tcG9uZW50c1xuICogQGNsYXNzXG4gKi9cbmNsYXNzIEZvcm1zIHtcbiAgLyoqXG4gICAqIFRoZSBGb3JtIGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSAge09iamVjdH0gZm9ybSBUaGUgZm9ybSBET00gZWxlbWVudFxuICAgKi9cbiAgY29uc3RydWN0b3IoZm9ybSA9IGZhbHNlKSB7XG4gICAgdGhpcy5GT1JNID0gZm9ybTtcblxuICAgIHRoaXMuc3RyaW5ncyA9IEZvcm1zLnN0cmluZ3M7XG5cbiAgICB0aGlzLnN1Ym1pdCA9IEZvcm1zLnN1Ym1pdDtcblxuICAgIHRoaXMuY2xhc3NlcyA9IEZvcm1zLmNsYXNzZXM7XG5cbiAgICB0aGlzLm1hcmt1cCA9IEZvcm1zLm1hcmt1cDtcblxuICAgIHRoaXMuc2VsZWN0b3JzID0gRm9ybXMuc2VsZWN0b3JzO1xuXG4gICAgdGhpcy5hdHRycyA9IEZvcm1zLmF0dHJzO1xuXG4gICAgdGhpcy5GT1JNLnNldEF0dHJpYnV0ZSgnbm92YWxpZGF0ZScsIHRydWUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogTWFwIHRvZ2dsZWQgY2hlY2tib3ggdmFsdWVzIHRvIGFuIGlucHV0LlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IGV2ZW50IFRoZSBwYXJlbnQgY2xpY2sgZXZlbnQuXG4gICAqIEByZXR1cm4ge0VsZW1lbnR9ICAgICAgVGhlIHRhcmdldCBlbGVtZW50LlxuICAgKi9cbiAgam9pblZhbHVlcyhldmVudCkge1xuICAgIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXMoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXScpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKCFldmVudC50YXJnZXQuY2xvc2VzdCgnW2RhdGEtanMtam9pbi12YWx1ZXNdJykpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgZWwgPSBldmVudC50YXJnZXQuY2xvc2VzdCgnW2RhdGEtanMtam9pbi12YWx1ZXNdJyk7XG4gICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwuZGF0YXNldC5qc0pvaW5WYWx1ZXMpO1xuXG4gICAgdGFyZ2V0LnZhbHVlID0gQXJyYXkuZnJvbShcbiAgICAgICAgZWwucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJylcbiAgICAgIClcbiAgICAgIC5maWx0ZXIoKGUpID0+IChlLnZhbHVlICYmIGUuY2hlY2tlZCkpXG4gICAgICAubWFwKChlKSA9PiBlLnZhbHVlKVxuICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEEgc2ltcGxlIGZvcm0gdmFsaWRhdGlvbiBjbGFzcyB0aGF0IHVzZXMgbmF0aXZlIGZvcm0gdmFsaWRhdGlvbi4gSXQgd2lsbFxuICAgKiBhZGQgYXBwcm9wcmlhdGUgZm9ybSBmZWVkYmFjayBmb3IgZWFjaCBpbnB1dCB0aGF0IGlzIGludmFsaWQgYW5kIG5hdGl2ZVxuICAgKiBsb2NhbGl6ZWQgYnJvd3NlciBtZXNzYWdpbmcuXG4gICAqXG4gICAqIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0xlYXJuL0hUTUwvRm9ybXMvRm9ybV92YWxpZGF0aW9uXG4gICAqIFNlZSBodHRwczovL2Nhbml1c2UuY29tLyNmZWF0PWZvcm0tdmFsaWRhdGlvbiBmb3Igc3VwcG9ydFxuICAgKlxuICAgKiBAcGFyYW0gIHtFdmVudH0gICAgICAgICBldmVudCBUaGUgZm9ybSBzdWJtaXNzaW9uIGV2ZW50XG4gICAqIEByZXR1cm4ge0NsYXNzL0Jvb2xlYW59ICAgICAgIFRoZSBmb3JtIGNsYXNzIG9yIGZhbHNlIGlmIGludmFsaWRcbiAgICovXG4gIHZhbGlkKGV2ZW50KSB7XG4gICAgbGV0IHZhbGlkaXR5ID0gZXZlbnQudGFyZ2V0LmNoZWNrVmFsaWRpdHkoKTtcbiAgICBsZXQgZWxlbWVudHMgPSBldmVudC50YXJnZXQucXVlcnlTZWxlY3RvckFsbCh0aGlzLnNlbGVjdG9ycy5SRVFVSVJFRCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBSZW1vdmUgb2xkIG1lc3NhZ2luZyBpZiBpdCBleGlzdHNcbiAgICAgIGxldCBlbCA9IGVsZW1lbnRzW2ldO1xuXG4gICAgICB0aGlzLnJlc2V0KGVsKTtcblxuICAgICAgLy8gSWYgdGhpcyBpbnB1dCB2YWxpZCwgc2tpcCBtZXNzYWdpbmdcbiAgICAgIGlmIChlbC52YWxpZGl0eS52YWxpZCkgY29udGludWU7XG5cbiAgICAgIHRoaXMuaGlnaGxpZ2h0KGVsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHZhbGlkaXR5KSA/IHRoaXMgOiB2YWxpZGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGZvY3VzIGFuZCBibHVyIGV2ZW50cyB0byBpbnB1dHMgd2l0aCByZXF1aXJlZCBhdHRyaWJ1dGVzXG4gICAqIEBwYXJhbSAgIHtvYmplY3R9ICBmb3JtICBQYXNzaW5nIGEgZm9ybSBpcyBwb3NzaWJsZSwgb3RoZXJ3aXNlIGl0IHdpbGwgdXNlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgZm9ybSBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yLlxuICAgKiBAcmV0dXJuICB7Y2xhc3N9ICAgICAgICAgVGhlIGZvcm0gY2xhc3NcbiAgICovXG4gIHdhdGNoKGZvcm0gPSBmYWxzZSkge1xuICAgIHRoaXMuRk9STSA9IChmb3JtKSA/IGZvcm0gOiB0aGlzLkZPUk07XG5cbiAgICBsZXQgZWxlbWVudHMgPSB0aGlzLkZPUk0ucXVlcnlTZWxlY3RvckFsbCh0aGlzLnNlbGVjdG9ycy5SRVFVSVJFRCk7XG5cbiAgICAvKiogV2F0Y2ggSW5kaXZpZHVhbCBJbnB1dHMgKi9cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBSZW1vdmUgb2xkIG1lc3NhZ2luZyBpZiBpdCBleGlzdHNcbiAgICAgIGxldCBlbCA9IGVsZW1lbnRzW2ldO1xuXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsICgpID0+IHtcbiAgICAgICAgdGhpcy5yZXNldChlbCk7XG4gICAgICB9KTtcblxuICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsICgpID0+IHtcbiAgICAgICAgaWYgKCFlbC52YWxpZGl0eS52YWxpZClcbiAgICAgICAgICB0aGlzLmhpZ2hsaWdodChlbCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKiogU3VibWl0IEV2ZW50ICovXG4gICAgdGhpcy5GT1JNLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKHRoaXMudmFsaWQoZXZlbnQpID09PSBmYWxzZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB0aGlzLnN1Ym1pdChldmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSB2YWxpZGl0eSBtZXNzYWdlIGFuZCBjbGFzc2VzIGZyb20gdGhlIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSAgIHtvYmplY3R9ICBlbCAgVGhlIGlucHV0IGVsZW1lbnRcbiAgICogQHJldHVybiAge2NsYXNzfSAgICAgICBUaGUgZm9ybSBjbGFzc1xuICAgKi9cbiAgcmVzZXQoZWwpIHtcbiAgICBsZXQgY29udGFpbmVyID0gKHRoaXMuc2VsZWN0b3JzLkVSUk9SX01FU1NBR0VfUEFSRU5UKVxuICAgICAgPyBlbC5jbG9zZXN0KHRoaXMuc2VsZWN0b3JzLkVSUk9SX01FU1NBR0VfUEFSRU5UKSA6IGVsLnBhcmVudE5vZGU7XG5cbiAgICBsZXQgbWVzc2FnZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuJyArIHRoaXMuY2xhc3Nlcy5FUlJPUl9NRVNTQUdFKTtcblxuICAgIC8vIFJlbW92ZSBvbGQgbWVzc2FnaW5nIGlmIGl0IGV4aXN0c1xuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuY2xhc3Nlcy5FUlJPUl9DT05UQUlORVIpO1xuICAgIGlmIChtZXNzYWdlKSBtZXNzYWdlLnJlbW92ZSgpO1xuXG4gICAgLy8gUmVtb3ZlIGVycm9yIGNsYXNzIGZyb20gdGhlIGZvcm1cbiAgICBjb250YWluZXIuY2xvc2VzdCgnZm9ybScpLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5jbGFzc2VzLkVSUk9SX0NPTlRBSU5FUik7XG5cbiAgICAvLyBSZW1vdmUgZHluYW1pYyBhdHRyaWJ1dGVzIGZyb20gdGhlIGlucHV0XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKHRoaXMuYXR0cnMuRVJST1JfSU5QVVRbMF0pO1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSh0aGlzLmF0dHJzLkVSUk9SX0xBQkVMKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3BsYXlzIGEgdmFsaWRpdHkgbWVzc2FnZSB0byB0aGUgdXNlci4gSXQgd2lsbCBmaXJzdCB1c2UgYW55IGxvY2FsaXplZFxuICAgKiBzdHJpbmcgcGFzc2VkIHRvIHRoZSBjbGFzcyBmb3IgcmVxdWlyZWQgZmllbGRzIG1pc3NpbmcgaW5wdXQuIElmIHRoZVxuICAgKiBpbnB1dCBpcyBmaWxsZWQgaW4gYnV0IGRvZXNuJ3QgbWF0Y2ggdGhlIHJlcXVpcmVkIHBhdHRlcm4sIGl0IHdpbGwgdXNlXG4gICAqIGEgbG9jYWxpemVkIHN0cmluZyBzZXQgZm9yIHRoZSBzcGVjaWZpYyBpbnB1dCB0eXBlLiBJZiBvbmUgaXNuJ3QgcHJvdmlkZWRcbiAgICogaXQgd2lsbCB1c2UgdGhlIGRlZmF1bHQgYnJvd3NlciBwcm92aWRlZCBtZXNzYWdlLlxuICAgKiBAcGFyYW0gICB7b2JqZWN0fSAgZWwgIFRoZSBpbnZhbGlkIGlucHV0IGVsZW1lbnRcbiAgICogQHJldHVybiAge2NsYXNzfSAgICAgICBUaGUgZm9ybSBjbGFzc1xuICAgKi9cbiAgaGlnaGxpZ2h0KGVsKSB7XG4gICAgbGV0IGNvbnRhaW5lciA9ICh0aGlzLnNlbGVjdG9ycy5FUlJPUl9NRVNTQUdFX1BBUkVOVClcbiAgICAgID8gZWwuY2xvc2VzdCh0aGlzLnNlbGVjdG9ycy5FUlJPUl9NRVNTQUdFX1BBUkVOVCkgOiBlbC5wYXJlbnROb2RlO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBuZXcgZXJyb3IgbWVzc2FnZS5cbiAgICBsZXQgbWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy5tYXJrdXAuRVJST1JfTUVTU0FHRSk7XG4gICAgbGV0IGlkID0gYCR7ZWwuZ2V0QXR0cmlidXRlKCdpZCcpfS0ke3RoaXMuY2xhc3Nlcy5FUlJPUl9NRVNTQUdFfWA7XG5cbiAgICAvLyBHZXQgdGhlIGVycm9yIG1lc3NhZ2UgZnJvbSBsb2NhbGl6ZWQgc3RyaW5ncyAoaWYgc2V0KS5cbiAgICBpZiAoZWwudmFsaWRpdHkudmFsdWVNaXNzaW5nICYmIHRoaXMuc3RyaW5ncy5WQUxJRF9SRVFVSVJFRClcbiAgICAgIG1lc3NhZ2UuaW5uZXJIVE1MID0gdGhpcy5zdHJpbmdzLlZBTElEX1JFUVVJUkVEO1xuICAgIGVsc2UgaWYgKCFlbC52YWxpZGl0eS52YWxpZCAmJlxuICAgICAgdGhpcy5zdHJpbmdzW2BWQUxJRF8ke2VsLnR5cGUudG9VcHBlckNhc2UoKX1fSU5WQUxJRGBdKSB7XG4gICAgICBsZXQgc3RyaW5nS2V5ID0gYFZBTElEXyR7ZWwudHlwZS50b1VwcGVyQ2FzZSgpfV9JTlZBTElEYDtcbiAgICAgIG1lc3NhZ2UuaW5uZXJIVE1MID0gdGhpcy5zdHJpbmdzW3N0cmluZ0tleV07XG4gICAgfSBlbHNlXG4gICAgICBtZXNzYWdlLmlubmVySFRNTCA9IGVsLnZhbGlkYXRpb25NZXNzYWdlO1xuXG4gICAgLy8gU2V0IGFyaWEgYXR0cmlidXRlcyBhbmQgY3NzIGNsYXNzZXMgdG8gdGhlIG1lc3NhZ2VcbiAgICBtZXNzYWdlLnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7XG4gICAgbWVzc2FnZS5zZXRBdHRyaWJ1dGUodGhpcy5hdHRycy5FUlJPUl9NRVNTQUdFWzBdLFxuICAgICAgdGhpcy5hdHRycy5FUlJPUl9NRVNTQUdFWzFdKTtcbiAgICBtZXNzYWdlLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc2VzLkVSUk9SX01FU1NBR0UpO1xuXG4gICAgLy8gQWRkIHRoZSBlcnJvciBjbGFzcyBhbmQgZXJyb3IgbWVzc2FnZSB0byB0aGUgZG9tLlxuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKHRoaXMuY2xhc3Nlcy5FUlJPUl9DT05UQUlORVIpO1xuICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUobWVzc2FnZSwgY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xuXG4gICAgLy8gQWRkIHRoZSBlcnJvciBjbGFzcyB0byB0aGUgZm9ybVxuICAgIGNvbnRhaW5lci5jbG9zZXN0KCdmb3JtJykuY2xhc3NMaXN0LmFkZCh0aGlzLmNsYXNzZXMuRVJST1JfQ09OVEFJTkVSKTtcblxuICAgIC8vIEFkZCBkeW5hbWljIGF0dHJpYnV0ZXMgdG8gdGhlIGlucHV0XG4gICAgZWwuc2V0QXR0cmlidXRlKHRoaXMuYXR0cnMuRVJST1JfSU5QVVRbMF0sIHRoaXMuYXR0cnMuRVJST1JfSU5QVVRbMV0pO1xuICAgIGVsLnNldEF0dHJpYnV0ZSh0aGlzLmF0dHJzLkVSUk9SX0xBQkVMLCBpZCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vKipcbiAqIEEgZGljdGlvbmFpcnkgb2Ygc3RyaW5ncyBpbiB0aGUgZm9ybWF0LlxuICoge1xuICogICAnVkFMSURfUkVRVUlSRUQnOiAnVGhpcyBpcyByZXF1aXJlZCcsXG4gKiAgICdWQUxJRF97eyBUWVBFIH19X0lOVkFMSUQnOiAnSW52YWxpZCdcbiAqIH1cbiAqL1xuRm9ybXMuc3RyaW5ncyA9IHt9O1xuXG4vKiogUGxhY2Vob2xkZXIgZm9yIHRoZSBzdWJtaXQgZnVuY3Rpb24gKi9cbkZvcm1zLnN1Ym1pdCA9IGZ1bmN0aW9uKCkge307XG5cbi8qKiBDbGFzc2VzIGZvciB2YXJpb3VzIGNvbnRhaW5lcnMgKi9cbkZvcm1zLmNsYXNzZXMgPSB7XG4gICdFUlJPUl9NRVNTQUdFJzogJ2Vycm9yLW1lc3NhZ2UnLCAvLyBlcnJvciBjbGFzcyBmb3IgdGhlIHZhbGlkaXR5IG1lc3NhZ2VcbiAgJ0VSUk9SX0NPTlRBSU5FUic6ICdlcnJvcicsIC8vIGNsYXNzIGZvciB0aGUgdmFsaWRpdHkgbWVzc2FnZSBwYXJlbnRcbiAgJ0VSUk9SX0ZPUk0nOiAnZXJyb3InXG59O1xuXG4vKiogSFRNTCB0YWdzIGFuZCBtYXJrdXAgZm9yIHZhcmlvdXMgZWxlbWVudHMgKi9cbkZvcm1zLm1hcmt1cCA9IHtcbiAgJ0VSUk9SX01FU1NBR0UnOiAnZGl2Jyxcbn07XG5cbi8qKiBET00gU2VsZWN0b3JzIGZvciB2YXJpb3VzIGVsZW1lbnRzICovXG5Gb3Jtcy5zZWxlY3RvcnMgPSB7XG4gICdSRVFVSVJFRCc6ICdbcmVxdWlyZWQ9XCJ0cnVlXCJdJywgLy8gU2VsZWN0b3IgZm9yIHJlcXVpcmVkIGlucHV0IGVsZW1lbnRzXG4gICdFUlJPUl9NRVNTQUdFX1BBUkVOVCc6IGZhbHNlXG59O1xuXG4vKiogQXR0cmlidXRlcyBmb3IgdmFyaW91cyBlbGVtZW50cyAqL1xuRm9ybXMuYXR0cnMgPSB7XG4gICdFUlJPUl9NRVNTQUdFJzogWydhcmlhLWxpdmUnLCAncG9saXRlJ10sIC8vIEF0dHJpYnV0ZSBmb3IgdmFsaWQgZXJyb3IgbWVzc2FnZVxuICAnRVJST1JfSU5QVVQnOiBbJ2FyaWEtaW52YWxpZCcsICd0cnVlJ10sXG4gICdFUlJPUl9MQUJFTCc6ICdhcmlhLWRlc2NyaWJlZGJ5J1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRm9ybXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVGhlIEljb24gbW9kdWxlXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgSWNvbnMge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSAge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgaWNvbiBmaWxlXG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhlIGNsYXNzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYXRoKSB7XG4gICAgcGF0aCA9IChwYXRoKSA/IHBhdGggOiBJY29ucy5wYXRoO1xuXG4gICAgZmV0Y2gocGF0aClcbiAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2Uub2spXG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpXG4gICAgICAgICAgICBjb25zb2xlLmRpcihyZXNwb25zZSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJylcbiAgICAgICAgICBjb25zb2xlLmRpcihlcnJvcik7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3Qgc3ByaXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHNwcml0ZS5pbm5lckhUTUwgPSBkYXRhO1xuICAgICAgICBzcHJpdGUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIHRydWUpO1xuICAgICAgICBzcHJpdGUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBub25lOycpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNwcml0ZSk7XG4gICAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKiBAdHlwZSB7U3RyaW5nfSBUaGUgcGF0aCBvZiB0aGUgaWNvbiBmaWxlICovXG5JY29ucy5wYXRoID0gJ3N2Zy9pY29ucy5zdmcnO1xuXG5leHBvcnQgZGVmYXVsdCBJY29ucztcbiIsInZhciBjb21tb25qc0dsb2JhbCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDoge307XG5cbnZhciBOdW1lcmFsRm9ybWF0dGVyID0gZnVuY3Rpb24gKG51bWVyYWxEZWNpbWFsTWFyayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyYWxJbnRlZ2VyU2NhbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmFsRGVjaW1hbFNjYWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJhbFRob3VzYW5kc0dyb3VwU3R5bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmFsUG9zaXRpdmVPbmx5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaXBMZWFkaW5nWmVyb2VzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbkJlZm9yZVByZWZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhaWxQcmVmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIpIHtcbiAgICB2YXIgb3duZXIgPSB0aGlzO1xuXG4gICAgb3duZXIubnVtZXJhbERlY2ltYWxNYXJrID0gbnVtZXJhbERlY2ltYWxNYXJrIHx8ICcuJztcbiAgICBvd25lci5udW1lcmFsSW50ZWdlclNjYWxlID0gbnVtZXJhbEludGVnZXJTY2FsZSA+IDAgPyBudW1lcmFsSW50ZWdlclNjYWxlIDogMDtcbiAgICBvd25lci5udW1lcmFsRGVjaW1hbFNjYWxlID0gbnVtZXJhbERlY2ltYWxTY2FsZSA+PSAwID8gbnVtZXJhbERlY2ltYWxTY2FsZSA6IDI7XG4gICAgb3duZXIubnVtZXJhbFRob3VzYW5kc0dyb3VwU3R5bGUgPSBudW1lcmFsVGhvdXNhbmRzR3JvdXBTdHlsZSB8fCBOdW1lcmFsRm9ybWF0dGVyLmdyb3VwU3R5bGUudGhvdXNhbmQ7XG4gICAgb3duZXIubnVtZXJhbFBvc2l0aXZlT25seSA9ICEhbnVtZXJhbFBvc2l0aXZlT25seTtcbiAgICBvd25lci5zdHJpcExlYWRpbmdaZXJvZXMgPSBzdHJpcExlYWRpbmdaZXJvZXMgIT09IGZhbHNlO1xuICAgIG93bmVyLnByZWZpeCA9IChwcmVmaXggfHwgcHJlZml4ID09PSAnJykgPyBwcmVmaXggOiAnJztcbiAgICBvd25lci5zaWduQmVmb3JlUHJlZml4ID0gISFzaWduQmVmb3JlUHJlZml4O1xuICAgIG93bmVyLnRhaWxQcmVmaXggPSAhIXRhaWxQcmVmaXg7XG4gICAgb3duZXIuZGVsaW1pdGVyID0gKGRlbGltaXRlciB8fCBkZWxpbWl0ZXIgPT09ICcnKSA/IGRlbGltaXRlciA6ICcsJztcbiAgICBvd25lci5kZWxpbWl0ZXJSRSA9IGRlbGltaXRlciA/IG5ldyBSZWdFeHAoJ1xcXFwnICsgZGVsaW1pdGVyLCAnZycpIDogJyc7XG59O1xuXG5OdW1lcmFsRm9ybWF0dGVyLmdyb3VwU3R5bGUgPSB7XG4gICAgdGhvdXNhbmQ6ICd0aG91c2FuZCcsXG4gICAgbGFraDogICAgICdsYWtoJyxcbiAgICB3YW46ICAgICAgJ3dhbicsXG4gICAgbm9uZTogICAgICdub25lJyAgICBcbn07XG5cbk51bWVyYWxGb3JtYXR0ZXIucHJvdG90eXBlID0ge1xuICAgIGdldFJhd1ZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UodGhpcy5kZWxpbWl0ZXJSRSwgJycpLnJlcGxhY2UodGhpcy5udW1lcmFsRGVjaW1hbE1hcmssICcuJyk7XG4gICAgfSxcblxuICAgIGZvcm1hdDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBhcnRzLCBwYXJ0U2lnbiwgcGFydFNpZ25BbmRQcmVmaXgsIHBhcnRJbnRlZ2VyLCBwYXJ0RGVjaW1hbCA9ICcnO1xuXG4gICAgICAgIC8vIHN0cmlwIGFscGhhYmV0IGxldHRlcnNcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9bQS1aYS16XS9nLCAnJylcbiAgICAgICAgICAgIC8vIHJlcGxhY2UgdGhlIGZpcnN0IGRlY2ltYWwgbWFyayB3aXRoIHJlc2VydmVkIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAucmVwbGFjZShvd25lci5udW1lcmFsRGVjaW1hbE1hcmssICdNJylcblxuICAgICAgICAgICAgLy8gc3RyaXAgbm9uIG51bWVyaWMgbGV0dGVycyBleGNlcHQgbWludXMgYW5kIFwiTVwiXG4gICAgICAgICAgICAvLyB0aGlzIGlzIHRvIGVuc3VyZSBwcmVmaXggaGFzIGJlZW4gc3RyaXBwZWRcbiAgICAgICAgICAgIC5yZXBsYWNlKC9bXlxcZE0tXS9nLCAnJylcblxuICAgICAgICAgICAgLy8gcmVwbGFjZSB0aGUgbGVhZGluZyBtaW51cyB3aXRoIHJlc2VydmVkIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAucmVwbGFjZSgvXlxcLS8sICdOJylcblxuICAgICAgICAgICAgLy8gc3RyaXAgdGhlIG90aGVyIG1pbnVzIHNpZ24gKGlmIHByZXNlbnQpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFwtL2csICcnKVxuXG4gICAgICAgICAgICAvLyByZXBsYWNlIHRoZSBtaW51cyBzaWduIChpZiBwcmVzZW50KVxuICAgICAgICAgICAgLnJlcGxhY2UoJ04nLCBvd25lci5udW1lcmFsUG9zaXRpdmVPbmx5ID8gJycgOiAnLScpXG5cbiAgICAgICAgICAgIC8vIHJlcGxhY2UgZGVjaW1hbCBtYXJrXG4gICAgICAgICAgICAucmVwbGFjZSgnTScsIG93bmVyLm51bWVyYWxEZWNpbWFsTWFyayk7XG5cbiAgICAgICAgLy8gc3RyaXAgYW55IGxlYWRpbmcgemVyb3NcbiAgICAgICAgaWYgKG93bmVyLnN0cmlwTGVhZGluZ1plcm9lcykge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9eKC0pPzArKD89XFxkKS8sICckMScpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFydFNpZ24gPSB2YWx1ZS5zbGljZSgwLCAxKSA9PT0gJy0nID8gJy0nIDogJyc7XG4gICAgICAgIGlmICh0eXBlb2Ygb3duZXIucHJlZml4ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAob3duZXIuc2lnbkJlZm9yZVByZWZpeCkge1xuICAgICAgICAgICAgICAgIHBhcnRTaWduQW5kUHJlZml4ID0gcGFydFNpZ24gKyBvd25lci5wcmVmaXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcnRTaWduQW5kUHJlZml4ID0gb3duZXIucHJlZml4ICsgcGFydFNpZ247XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJ0U2lnbkFuZFByZWZpeCA9IHBhcnRTaWduO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYXJ0SW50ZWdlciA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh2YWx1ZS5pbmRleE9mKG93bmVyLm51bWVyYWxEZWNpbWFsTWFyaykgPj0gMCkge1xuICAgICAgICAgICAgcGFydHMgPSB2YWx1ZS5zcGxpdChvd25lci5udW1lcmFsRGVjaW1hbE1hcmspO1xuICAgICAgICAgICAgcGFydEludGVnZXIgPSBwYXJ0c1swXTtcbiAgICAgICAgICAgIHBhcnREZWNpbWFsID0gb3duZXIubnVtZXJhbERlY2ltYWxNYXJrICsgcGFydHNbMV0uc2xpY2UoMCwgb3duZXIubnVtZXJhbERlY2ltYWxTY2FsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihwYXJ0U2lnbiA9PT0gJy0nKSB7XG4gICAgICAgICAgICBwYXJ0SW50ZWdlciA9IHBhcnRJbnRlZ2VyLnNsaWNlKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG93bmVyLm51bWVyYWxJbnRlZ2VyU2NhbGUgPiAwKSB7XG4gICAgICAgICAgcGFydEludGVnZXIgPSBwYXJ0SW50ZWdlci5zbGljZSgwLCBvd25lci5udW1lcmFsSW50ZWdlclNjYWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAob3duZXIubnVtZXJhbFRob3VzYW5kc0dyb3VwU3R5bGUpIHtcbiAgICAgICAgY2FzZSBOdW1lcmFsRm9ybWF0dGVyLmdyb3VwU3R5bGUubGFraDpcbiAgICAgICAgICAgIHBhcnRJbnRlZ2VyID0gcGFydEludGVnZXIucmVwbGFjZSgvKFxcZCkoPz0oXFxkXFxkKStcXGQkKS9nLCAnJDEnICsgb3duZXIuZGVsaW1pdGVyKTtcblxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBOdW1lcmFsRm9ybWF0dGVyLmdyb3VwU3R5bGUud2FuOlxuICAgICAgICAgICAgcGFydEludGVnZXIgPSBwYXJ0SW50ZWdlci5yZXBsYWNlKC8oXFxkKSg/PShcXGR7NH0pKyQpL2csICckMScgKyBvd25lci5kZWxpbWl0ZXIpO1xuXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE51bWVyYWxGb3JtYXR0ZXIuZ3JvdXBTdHlsZS50aG91c2FuZDpcbiAgICAgICAgICAgIHBhcnRJbnRlZ2VyID0gcGFydEludGVnZXIucmVwbGFjZSgvKFxcZCkoPz0oXFxkezN9KSskKS9nLCAnJDEnICsgb3duZXIuZGVsaW1pdGVyKTtcblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3duZXIudGFpbFByZWZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnRTaWduICsgcGFydEludGVnZXIudG9TdHJpbmcoKSArIChvd25lci5udW1lcmFsRGVjaW1hbFNjYWxlID4gMCA/IHBhcnREZWNpbWFsLnRvU3RyaW5nKCkgOiAnJykgKyBvd25lci5wcmVmaXg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFydFNpZ25BbmRQcmVmaXggKyBwYXJ0SW50ZWdlci50b1N0cmluZygpICsgKG93bmVyLm51bWVyYWxEZWNpbWFsU2NhbGUgPiAwID8gcGFydERlY2ltYWwudG9TdHJpbmcoKSA6ICcnKTtcbiAgICB9XG59O1xuXG52YXIgTnVtZXJhbEZvcm1hdHRlcl8xID0gTnVtZXJhbEZvcm1hdHRlcjtcblxudmFyIERhdGVGb3JtYXR0ZXIgPSBmdW5jdGlvbiAoZGF0ZVBhdHRlcm4sIGRhdGVNaW4sIGRhdGVNYXgpIHtcbiAgICB2YXIgb3duZXIgPSB0aGlzO1xuXG4gICAgb3duZXIuZGF0ZSA9IFtdO1xuICAgIG93bmVyLmJsb2NrcyA9IFtdO1xuICAgIG93bmVyLmRhdGVQYXR0ZXJuID0gZGF0ZVBhdHRlcm47XG4gICAgb3duZXIuZGF0ZU1pbiA9IGRhdGVNaW5cbiAgICAgIC5zcGxpdCgnLScpXG4gICAgICAucmV2ZXJzZSgpXG4gICAgICAubWFwKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHgsIDEwKTtcbiAgICAgIH0pO1xuICAgIGlmIChvd25lci5kYXRlTWluLmxlbmd0aCA9PT0gMikgb3duZXIuZGF0ZU1pbi51bnNoaWZ0KDApO1xuXG4gICAgb3duZXIuZGF0ZU1heCA9IGRhdGVNYXhcbiAgICAgIC5zcGxpdCgnLScpXG4gICAgICAucmV2ZXJzZSgpXG4gICAgICAubWFwKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHgsIDEwKTtcbiAgICAgIH0pO1xuICAgIGlmIChvd25lci5kYXRlTWF4Lmxlbmd0aCA9PT0gMikgb3duZXIuZGF0ZU1heC51bnNoaWZ0KDApO1xuICAgIFxuICAgIG93bmVyLmluaXRCbG9ja3MoKTtcbn07XG5cbkRhdGVGb3JtYXR0ZXIucHJvdG90eXBlID0ge1xuICAgIGluaXRCbG9ja3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcztcbiAgICAgICAgb3duZXIuZGF0ZVBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ1knKSB7XG4gICAgICAgICAgICAgICAgb3duZXIuYmxvY2tzLnB1c2goNCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG93bmVyLmJsb2Nrcy5wdXNoKDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0SVNPRm9ybWF0RGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgZGF0ZSA9IG93bmVyLmRhdGU7XG5cbiAgICAgICAgcmV0dXJuIGRhdGVbMl0gPyAoXG4gICAgICAgICAgICBkYXRlWzJdICsgJy0nICsgb3duZXIuYWRkTGVhZGluZ1plcm8oZGF0ZVsxXSkgKyAnLScgKyBvd25lci5hZGRMZWFkaW5nWmVybyhkYXRlWzBdKVxuICAgICAgICApIDogJyc7XG4gICAgfSxcblxuICAgIGdldEJsb2NrczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9ja3M7XG4gICAgfSxcblxuICAgIGdldFZhbGlkYXRlZERhdGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCByZXN1bHQgPSAnJztcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1teXFxkXS9nLCAnJyk7XG5cbiAgICAgICAgb3duZXIuYmxvY2tzLmZvckVhY2goZnVuY3Rpb24gKGxlbmd0aCwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YiA9IHZhbHVlLnNsaWNlKDAsIGxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgIHN1YjAgPSBzdWIuc2xpY2UoMCwgMSksXG4gICAgICAgICAgICAgICAgICAgIHJlc3QgPSB2YWx1ZS5zbGljZShsZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChvd25lci5kYXRlUGF0dGVybltpbmRleF0pIHtcbiAgICAgICAgICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YiA9PT0gJzAwJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzAxJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJzZUludChzdWIwLCAxMCkgPiAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMCcgKyBzdWIwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnNlSW50KHN1YiwgMTApID4gMzEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICczMSc7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgICAgICBpZiAoc3ViID09PSAnMDAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAnMDEnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnNlSW50KHN1YjAsIDEwKSA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICcwJyArIHN1YjA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyc2VJbnQoc3ViLCAxMCkgPiAxMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzEyJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBzdWI7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgcmVtYWluaW5nIHN0cmluZ1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Rml4ZWREYXRlU3RyaW5nKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIGdldEZpeGVkRGF0ZVN0cmluZzogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIGRhdGVQYXR0ZXJuID0gb3duZXIuZGF0ZVBhdHRlcm4sIGRhdGUgPSBbXSxcbiAgICAgICAgICAgIGRheUluZGV4ID0gMCwgbW9udGhJbmRleCA9IDAsIHllYXJJbmRleCA9IDAsXG4gICAgICAgICAgICBkYXlTdGFydEluZGV4ID0gMCwgbW9udGhTdGFydEluZGV4ID0gMCwgeWVhclN0YXJ0SW5kZXggPSAwLFxuICAgICAgICAgICAgZGF5LCBtb250aCwgeWVhciwgZnVsbFllYXJEb25lID0gZmFsc2U7XG5cbiAgICAgICAgLy8gbW0tZGQgfHwgZGQtbW1cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gNCAmJiBkYXRlUGF0dGVyblswXS50b0xvd2VyQ2FzZSgpICE9PSAneScgJiYgZGF0ZVBhdHRlcm5bMV0udG9Mb3dlckNhc2UoKSAhPT0gJ3knKSB7XG4gICAgICAgICAgICBkYXlTdGFydEluZGV4ID0gZGF0ZVBhdHRlcm5bMF0gPT09ICdkJyA/IDAgOiAyO1xuICAgICAgICAgICAgbW9udGhTdGFydEluZGV4ID0gMiAtIGRheVN0YXJ0SW5kZXg7XG4gICAgICAgICAgICBkYXkgPSBwYXJzZUludCh2YWx1ZS5zbGljZShkYXlTdGFydEluZGV4LCBkYXlTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIG1vbnRoID0gcGFyc2VJbnQodmFsdWUuc2xpY2UobW9udGhTdGFydEluZGV4LCBtb250aFN0YXJ0SW5kZXggKyAyKSwgMTApO1xuXG4gICAgICAgICAgICBkYXRlID0gdGhpcy5nZXRGaXhlZERhdGUoZGF5LCBtb250aCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB5eXl5LW1tLWRkIHx8IHl5eXktZGQtbW0gfHwgbW0tZGQteXl5eSB8fCBkZC1tbS15eXl5IHx8IGRkLXl5eXktbW0gfHwgbW0teXl5eS1kZFxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSA4KSB7XG4gICAgICAgICAgICBkYXRlUGF0dGVybi5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgICAgICBkYXlJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgICAgICAgICAgICAgbW9udGhJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB5ZWFySW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHllYXJTdGFydEluZGV4ID0geWVhckluZGV4ICogMjtcbiAgICAgICAgICAgIGRheVN0YXJ0SW5kZXggPSAoZGF5SW5kZXggPD0geWVhckluZGV4KSA/IGRheUluZGV4ICogMiA6IChkYXlJbmRleCAqIDIgKyAyKTtcbiAgICAgICAgICAgIG1vbnRoU3RhcnRJbmRleCA9IChtb250aEluZGV4IDw9IHllYXJJbmRleCkgPyBtb250aEluZGV4ICogMiA6IChtb250aEluZGV4ICogMiArIDIpO1xuXG4gICAgICAgICAgICBkYXkgPSBwYXJzZUludCh2YWx1ZS5zbGljZShkYXlTdGFydEluZGV4LCBkYXlTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIG1vbnRoID0gcGFyc2VJbnQodmFsdWUuc2xpY2UobW9udGhTdGFydEluZGV4LCBtb250aFN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgeWVhciA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKHllYXJTdGFydEluZGV4LCB5ZWFyU3RhcnRJbmRleCArIDQpLCAxMCk7XG5cbiAgICAgICAgICAgIGZ1bGxZZWFyRG9uZSA9IHZhbHVlLnNsaWNlKHllYXJTdGFydEluZGV4LCB5ZWFyU3RhcnRJbmRleCArIDQpLmxlbmd0aCA9PT0gNDtcblxuICAgICAgICAgICAgZGF0ZSA9IHRoaXMuZ2V0Rml4ZWREYXRlKGRheSwgbW9udGgsIHllYXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbW0teXkgfHwgeXktbW1cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gNCAmJiAoZGF0ZVBhdHRlcm5bMF0gPT09ICd5JyB8fCBkYXRlUGF0dGVyblsxXSA9PT0gJ3knKSkge1xuICAgICAgICAgICAgbW9udGhTdGFydEluZGV4ID0gZGF0ZVBhdHRlcm5bMF0gPT09ICdtJyA/IDAgOiAyO1xuICAgICAgICAgICAgeWVhclN0YXJ0SW5kZXggPSAyIC0gbW9udGhTdGFydEluZGV4O1xuICAgICAgICAgICAgbW9udGggPSBwYXJzZUludCh2YWx1ZS5zbGljZShtb250aFN0YXJ0SW5kZXgsIG1vbnRoU3RhcnRJbmRleCArIDIpLCAxMCk7XG4gICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodmFsdWUuc2xpY2UoeWVhclN0YXJ0SW5kZXgsIHllYXJTdGFydEluZGV4ICsgMiksIDEwKTtcblxuICAgICAgICAgICAgZnVsbFllYXJEb25lID0gdmFsdWUuc2xpY2UoeWVhclN0YXJ0SW5kZXgsIHllYXJTdGFydEluZGV4ICsgMikubGVuZ3RoID09PSAyO1xuXG4gICAgICAgICAgICBkYXRlID0gWzAsIG1vbnRoLCB5ZWFyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1tLXl5eXkgfHwgeXl5eS1tbVxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSA2ICYmIChkYXRlUGF0dGVyblswXSA9PT0gJ1knIHx8IGRhdGVQYXR0ZXJuWzFdID09PSAnWScpKSB7XG4gICAgICAgICAgICBtb250aFN0YXJ0SW5kZXggPSBkYXRlUGF0dGVyblswXSA9PT0gJ20nID8gMCA6IDQ7XG4gICAgICAgICAgICB5ZWFyU3RhcnRJbmRleCA9IDIgLSAwLjUgKiBtb250aFN0YXJ0SW5kZXg7XG4gICAgICAgICAgICBtb250aCA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKG1vbnRoU3RhcnRJbmRleCwgbW9udGhTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIHllYXIgPSBwYXJzZUludCh2YWx1ZS5zbGljZSh5ZWFyU3RhcnRJbmRleCwgeWVhclN0YXJ0SW5kZXggKyA0KSwgMTApO1xuXG4gICAgICAgICAgICBmdWxsWWVhckRvbmUgPSB2YWx1ZS5zbGljZSh5ZWFyU3RhcnRJbmRleCwgeWVhclN0YXJ0SW5kZXggKyA0KS5sZW5ndGggPT09IDQ7XG5cbiAgICAgICAgICAgIGRhdGUgPSBbMCwgbW9udGgsIHllYXJdO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0ZSA9IG93bmVyLmdldFJhbmdlRml4ZWREYXRlKGRhdGUpO1xuICAgICAgICBvd25lci5kYXRlID0gZGF0ZTtcblxuICAgICAgICB2YXIgcmVzdWx0ID0gZGF0ZS5sZW5ndGggPT09IDAgPyB2YWx1ZSA6IGRhdGVQYXR0ZXJuLnJlZHVjZShmdW5jdGlvbiAocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY3VycmVudCkge1xuICAgICAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgKGRhdGVbMF0gPT09IDAgPyAnJyA6IG93bmVyLmFkZExlYWRpbmdaZXJvKGRhdGVbMF0pKTtcbiAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIChkYXRlWzFdID09PSAwID8gJycgOiBvd25lci5hZGRMZWFkaW5nWmVybyhkYXRlWzFdKSk7XG4gICAgICAgICAgICBjYXNlICd5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyAoZnVsbFllYXJEb25lID8gb3duZXIuYWRkTGVhZGluZ1plcm9Gb3JZZWFyKGRhdGVbMl0sIGZhbHNlKSA6ICcnKTtcbiAgICAgICAgICAgIGNhc2UgJ1knOlxuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIChmdWxsWWVhckRvbmUgPyBvd25lci5hZGRMZWFkaW5nWmVyb0ZvclllYXIoZGF0ZVsyXSwgdHJ1ZSkgOiAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICcnKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBnZXRSYW5nZUZpeGVkRGF0ZTogZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIGRhdGVQYXR0ZXJuID0gb3duZXIuZGF0ZVBhdHRlcm4sXG4gICAgICAgICAgICBkYXRlTWluID0gb3duZXIuZGF0ZU1pbiB8fCBbXSxcbiAgICAgICAgICAgIGRhdGVNYXggPSBvd25lci5kYXRlTWF4IHx8IFtdO1xuXG4gICAgICAgIGlmICghZGF0ZS5sZW5ndGggfHwgKGRhdGVNaW4ubGVuZ3RoIDwgMyAmJiBkYXRlTWF4Lmxlbmd0aCA8IDMpKSByZXR1cm4gZGF0ZTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgZGF0ZVBhdHRlcm4uZmluZChmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICByZXR1cm4geC50b0xvd2VyQ2FzZSgpID09PSAneSc7XG4gICAgICAgICAgfSkgJiZcbiAgICAgICAgICBkYXRlWzJdID09PSAwXG4gICAgICAgICkgcmV0dXJuIGRhdGU7XG5cbiAgICAgICAgaWYgKGRhdGVNYXgubGVuZ3RoICYmIChkYXRlTWF4WzJdIDwgZGF0ZVsyXSB8fCAoXG4gICAgICAgICAgZGF0ZU1heFsyXSA9PT0gZGF0ZVsyXSAmJiAoZGF0ZU1heFsxXSA8IGRhdGVbMV0gfHwgKFxuICAgICAgICAgICAgZGF0ZU1heFsxXSA9PT0gZGF0ZVsxXSAmJiBkYXRlTWF4WzBdIDwgZGF0ZVswXVxuICAgICAgICAgICkpXG4gICAgICAgICkpKSByZXR1cm4gZGF0ZU1heDtcblxuICAgICAgICBpZiAoZGF0ZU1pbi5sZW5ndGggJiYgKGRhdGVNaW5bMl0gPiBkYXRlWzJdIHx8IChcbiAgICAgICAgICBkYXRlTWluWzJdID09PSBkYXRlWzJdICYmIChkYXRlTWluWzFdID4gZGF0ZVsxXSB8fCAoXG4gICAgICAgICAgICBkYXRlTWluWzFdID09PSBkYXRlWzFdICYmIGRhdGVNaW5bMF0gPiBkYXRlWzBdXG4gICAgICAgICAgKSlcbiAgICAgICAgKSkpIHJldHVybiBkYXRlTWluO1xuXG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH0sXG5cbiAgICBnZXRGaXhlZERhdGU6IGZ1bmN0aW9uIChkYXksIG1vbnRoLCB5ZWFyKSB7XG4gICAgICAgIGRheSA9IE1hdGgubWluKGRheSwgMzEpO1xuICAgICAgICBtb250aCA9IE1hdGgubWluKG1vbnRoLCAxMik7XG4gICAgICAgIHllYXIgPSBwYXJzZUludCgoeWVhciB8fCAwKSwgMTApO1xuXG4gICAgICAgIGlmICgobW9udGggPCA3ICYmIG1vbnRoICUgMiA9PT0gMCkgfHwgKG1vbnRoID4gOCAmJiBtb250aCAlIDIgPT09IDEpKSB7XG4gICAgICAgICAgICBkYXkgPSBNYXRoLm1pbihkYXksIG1vbnRoID09PSAyID8gKHRoaXMuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpIDogMzApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFtkYXksIG1vbnRoLCB5ZWFyXTtcbiAgICB9LFxuXG4gICAgaXNMZWFwWWVhcjogZnVuY3Rpb24gKHllYXIpIHtcbiAgICAgICAgcmV0dXJuICgoeWVhciAlIDQgPT09IDApICYmICh5ZWFyICUgMTAwICE9PSAwKSkgfHwgKHllYXIgJSA0MDAgPT09IDApO1xuICAgIH0sXG5cbiAgICBhZGRMZWFkaW5nWmVybzogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICByZXR1cm4gKG51bWJlciA8IDEwID8gJzAnIDogJycpICsgbnVtYmVyO1xuICAgIH0sXG5cbiAgICBhZGRMZWFkaW5nWmVyb0ZvclllYXI6IGZ1bmN0aW9uIChudW1iZXIsIGZ1bGxZZWFyTW9kZSkge1xuICAgICAgICBpZiAoZnVsbFllYXJNb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gKG51bWJlciA8IDEwID8gJzAwMCcgOiAobnVtYmVyIDwgMTAwID8gJzAwJyA6IChudW1iZXIgPCAxMDAwID8gJzAnIDogJycpKSkgKyBudW1iZXI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKG51bWJlciA8IDEwID8gJzAnIDogJycpICsgbnVtYmVyO1xuICAgIH1cbn07XG5cbnZhciBEYXRlRm9ybWF0dGVyXzEgPSBEYXRlRm9ybWF0dGVyO1xuXG52YXIgVGltZUZvcm1hdHRlciA9IGZ1bmN0aW9uICh0aW1lUGF0dGVybiwgdGltZUZvcm1hdCkge1xuICAgIHZhciBvd25lciA9IHRoaXM7XG5cbiAgICBvd25lci50aW1lID0gW107XG4gICAgb3duZXIuYmxvY2tzID0gW107XG4gICAgb3duZXIudGltZVBhdHRlcm4gPSB0aW1lUGF0dGVybjtcbiAgICBvd25lci50aW1lRm9ybWF0ID0gdGltZUZvcm1hdDtcbiAgICBvd25lci5pbml0QmxvY2tzKCk7XG59O1xuXG5UaW1lRm9ybWF0dGVyLnByb3RvdHlwZSA9IHtcbiAgICBpbml0QmxvY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXM7XG4gICAgICAgIG93bmVyLnRpbWVQYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb3duZXIuYmxvY2tzLnB1c2goMik7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRJU09Gb3JtYXRUaW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICB0aW1lID0gb3duZXIudGltZTtcblxuICAgICAgICByZXR1cm4gdGltZVsyXSA/IChcbiAgICAgICAgICAgIG93bmVyLmFkZExlYWRpbmdaZXJvKHRpbWVbMF0pICsgJzonICsgb3duZXIuYWRkTGVhZGluZ1plcm8odGltZVsxXSkgKyAnOicgKyBvd25lci5hZGRMZWFkaW5nWmVybyh0aW1lWzJdKVxuICAgICAgICApIDogJyc7XG4gICAgfSxcblxuICAgIGdldEJsb2NrczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9ja3M7XG4gICAgfSxcblxuICAgIGdldFRpbWVGb3JtYXRPcHRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXM7XG4gICAgICAgIGlmIChTdHJpbmcob3duZXIudGltZUZvcm1hdCkgPT09ICcxMicpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbWF4SG91ckZpcnN0RGlnaXQ6IDEsXG4gICAgICAgICAgICAgICAgbWF4SG91cnM6IDEyLFxuICAgICAgICAgICAgICAgIG1heE1pbnV0ZXNGaXJzdERpZ2l0OiA1LFxuICAgICAgICAgICAgICAgIG1heE1pbnV0ZXM6IDYwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1heEhvdXJGaXJzdERpZ2l0OiAyLFxuICAgICAgICAgICAgbWF4SG91cnM6IDIzLFxuICAgICAgICAgICAgbWF4TWludXRlc0ZpcnN0RGlnaXQ6IDUsXG4gICAgICAgICAgICBtYXhNaW51dGVzOiA2MFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBnZXRWYWxpZGF0ZWRUaW1lOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcmVzdWx0ID0gJyc7XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9bXlxcZF0vZywgJycpO1xuXG4gICAgICAgIHZhciB0aW1lRm9ybWF0T3B0aW9ucyA9IG93bmVyLmdldFRpbWVGb3JtYXRPcHRpb25zKCk7XG5cbiAgICAgICAgb3duZXIuYmxvY2tzLmZvckVhY2goZnVuY3Rpb24gKGxlbmd0aCwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YiA9IHZhbHVlLnNsaWNlKDAsIGxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgIHN1YjAgPSBzdWIuc2xpY2UoMCwgMSksXG4gICAgICAgICAgICAgICAgICAgIHJlc3QgPSB2YWx1ZS5zbGljZShsZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChvd25lci50aW1lUGF0dGVybltpbmRleF0pIHtcblxuICAgICAgICAgICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VJbnQoc3ViMCwgMTApID4gdGltZUZvcm1hdE9wdGlvbnMubWF4SG91ckZpcnN0RGlnaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICcwJyArIHN1YjA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyc2VJbnQoc3ViLCAxMCkgPiB0aW1lRm9ybWF0T3B0aW9ucy5tYXhIb3Vycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gdGltZUZvcm1hdE9wdGlvbnMubWF4SG91cnMgKyAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUludChzdWIwLCAxMCkgPiB0aW1lRm9ybWF0T3B0aW9ucy5tYXhNaW51dGVzRmlyc3REaWdpdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViID0gJzAnICsgc3ViMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJzZUludChzdWIsIDEwKSA+IHRpbWVGb3JtYXRPcHRpb25zLm1heE1pbnV0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YiA9IHRpbWVGb3JtYXRPcHRpb25zLm1heE1pbnV0ZXMgKyAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gc3ViO1xuXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHJlbWFpbmluZyBzdHJpbmdcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEZpeGVkVGltZVN0cmluZyhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICBnZXRGaXhlZFRpbWVTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCB0aW1lUGF0dGVybiA9IG93bmVyLnRpbWVQYXR0ZXJuLCB0aW1lID0gW10sXG4gICAgICAgICAgICBzZWNvbmRJbmRleCA9IDAsIG1pbnV0ZUluZGV4ID0gMCwgaG91ckluZGV4ID0gMCxcbiAgICAgICAgICAgIHNlY29uZFN0YXJ0SW5kZXggPSAwLCBtaW51dGVTdGFydEluZGV4ID0gMCwgaG91clN0YXJ0SW5kZXggPSAwLFxuICAgICAgICAgICAgc2Vjb25kLCBtaW51dGUsIGhvdXI7XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gNikge1xuICAgICAgICAgICAgdGltZVBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbiAodHlwZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kSW5kZXggPSBpbmRleCAqIDI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgICAgICBtaW51dGVJbmRleCA9IGluZGV4ICogMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnaCc6XG4gICAgICAgICAgICAgICAgICAgIGhvdXJJbmRleCA9IGluZGV4ICogMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGhvdXJTdGFydEluZGV4ID0gaG91ckluZGV4O1xuICAgICAgICAgICAgbWludXRlU3RhcnRJbmRleCA9IG1pbnV0ZUluZGV4O1xuICAgICAgICAgICAgc2Vjb25kU3RhcnRJbmRleCA9IHNlY29uZEluZGV4O1xuXG4gICAgICAgICAgICBzZWNvbmQgPSBwYXJzZUludCh2YWx1ZS5zbGljZShzZWNvbmRTdGFydEluZGV4LCBzZWNvbmRTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIG1pbnV0ZSA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKG1pbnV0ZVN0YXJ0SW5kZXgsIG1pbnV0ZVN0YXJ0SW5kZXggKyAyKSwgMTApO1xuICAgICAgICAgICAgaG91ciA9IHBhcnNlSW50KHZhbHVlLnNsaWNlKGhvdXJTdGFydEluZGV4LCBob3VyU3RhcnRJbmRleCArIDIpLCAxMCk7XG5cbiAgICAgICAgICAgIHRpbWUgPSB0aGlzLmdldEZpeGVkVGltZShob3VyLCBtaW51dGUsIHNlY29uZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSA0ICYmIG93bmVyLnRpbWVQYXR0ZXJuLmluZGV4T2YoJ3MnKSA8IDApIHtcbiAgICAgICAgICAgIHRpbWVQYXR0ZXJuLmZvckVhY2goZnVuY3Rpb24gKHR5cGUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZUluZGV4ID0gaW5kZXggKiAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgICAgICAgICAgICAgaG91ckluZGV4ID0gaW5kZXggKiAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaG91clN0YXJ0SW5kZXggPSBob3VySW5kZXg7XG4gICAgICAgICAgICBtaW51dGVTdGFydEluZGV4ID0gbWludXRlSW5kZXg7XG5cbiAgICAgICAgICAgIHNlY29uZCA9IDA7XG4gICAgICAgICAgICBtaW51dGUgPSBwYXJzZUludCh2YWx1ZS5zbGljZShtaW51dGVTdGFydEluZGV4LCBtaW51dGVTdGFydEluZGV4ICsgMiksIDEwKTtcbiAgICAgICAgICAgIGhvdXIgPSBwYXJzZUludCh2YWx1ZS5zbGljZShob3VyU3RhcnRJbmRleCwgaG91clN0YXJ0SW5kZXggKyAyKSwgMTApO1xuXG4gICAgICAgICAgICB0aW1lID0gdGhpcy5nZXRGaXhlZFRpbWUoaG91ciwgbWludXRlLCBzZWNvbmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgb3duZXIudGltZSA9IHRpbWU7XG5cbiAgICAgICAgcmV0dXJuIHRpbWUubGVuZ3RoID09PSAwID8gdmFsdWUgOiB0aW1lUGF0dGVybi5yZWR1Y2UoZnVuY3Rpb24gKHByZXZpb3VzLCBjdXJyZW50KSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIG93bmVyLmFkZExlYWRpbmdaZXJvKHRpbWVbMl0pO1xuICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzICsgb3duZXIuYWRkTGVhZGluZ1plcm8odGltZVsxXSk7XG4gICAgICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldmlvdXMgKyBvd25lci5hZGRMZWFkaW5nWmVybyh0aW1lWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgJycpO1xuICAgIH0sXG5cbiAgICBnZXRGaXhlZFRpbWU6IGZ1bmN0aW9uIChob3VyLCBtaW51dGUsIHNlY29uZCkge1xuICAgICAgICBzZWNvbmQgPSBNYXRoLm1pbihwYXJzZUludChzZWNvbmQgfHwgMCwgMTApLCA2MCk7XG4gICAgICAgIG1pbnV0ZSA9IE1hdGgubWluKG1pbnV0ZSwgNjApO1xuICAgICAgICBob3VyID0gTWF0aC5taW4oaG91ciwgNjApO1xuXG4gICAgICAgIHJldHVybiBbaG91ciwgbWludXRlLCBzZWNvbmRdO1xuICAgIH0sXG5cbiAgICBhZGRMZWFkaW5nWmVybzogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICByZXR1cm4gKG51bWJlciA8IDEwID8gJzAnIDogJycpICsgbnVtYmVyO1xuICAgIH1cbn07XG5cbnZhciBUaW1lRm9ybWF0dGVyXzEgPSBUaW1lRm9ybWF0dGVyO1xuXG52YXIgUGhvbmVGb3JtYXR0ZXIgPSBmdW5jdGlvbiAoZm9ybWF0dGVyLCBkZWxpbWl0ZXIpIHtcbiAgICB2YXIgb3duZXIgPSB0aGlzO1xuXG4gICAgb3duZXIuZGVsaW1pdGVyID0gKGRlbGltaXRlciB8fCBkZWxpbWl0ZXIgPT09ICcnKSA/IGRlbGltaXRlciA6ICcgJztcbiAgICBvd25lci5kZWxpbWl0ZXJSRSA9IGRlbGltaXRlciA/IG5ldyBSZWdFeHAoJ1xcXFwnICsgZGVsaW1pdGVyLCAnZycpIDogJyc7XG5cbiAgICBvd25lci5mb3JtYXR0ZXIgPSBmb3JtYXR0ZXI7XG59O1xuXG5QaG9uZUZvcm1hdHRlci5wcm90b3R5cGUgPSB7XG4gICAgc2V0Rm9ybWF0dGVyOiBmdW5jdGlvbiAoZm9ybWF0dGVyKSB7XG4gICAgICAgIHRoaXMuZm9ybWF0dGVyID0gZm9ybWF0dGVyO1xuICAgIH0sXG5cbiAgICBmb3JtYXQ6IGZ1bmN0aW9uIChwaG9uZU51bWJlcikge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzO1xuXG4gICAgICAgIG93bmVyLmZvcm1hdHRlci5jbGVhcigpO1xuXG4gICAgICAgIC8vIG9ubHkga2VlcCBudW1iZXIgYW5kICtcbiAgICAgICAgcGhvbmVOdW1iZXIgPSBwaG9uZU51bWJlci5yZXBsYWNlKC9bXlxcZCtdL2csICcnKTtcblxuICAgICAgICAvLyBzdHJpcCBub24tbGVhZGluZyArXG4gICAgICAgIHBob25lTnVtYmVyID0gcGhvbmVOdW1iZXIucmVwbGFjZSgvXlxcKy8sICdCJykucmVwbGFjZSgvXFwrL2csICcnKS5yZXBsYWNlKCdCJywgJysnKTtcblxuICAgICAgICAvLyBzdHJpcCBkZWxpbWl0ZXJcbiAgICAgICAgcGhvbmVOdW1iZXIgPSBwaG9uZU51bWJlci5yZXBsYWNlKG93bmVyLmRlbGltaXRlclJFLCAnJyk7XG5cbiAgICAgICAgdmFyIHJlc3VsdCA9ICcnLCBjdXJyZW50LCB2YWxpZGF0ZWQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaU1heCA9IHBob25lTnVtYmVyLmxlbmd0aDsgaSA8IGlNYXg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudCA9IG93bmVyLmZvcm1hdHRlci5pbnB1dERpZ2l0KHBob25lTnVtYmVyLmNoYXJBdChpKSk7XG5cbiAgICAgICAgICAgIC8vIGhhcyAoKS0gb3Igc3BhY2UgaW5zaWRlXG4gICAgICAgICAgICBpZiAoL1tcXHMoKS1dL2cudGVzdChjdXJyZW50KSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGN1cnJlbnQ7XG5cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBjdXJyZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBlbHNlOiBvdmVyIGxlbmd0aCBpbnB1dFxuICAgICAgICAgICAgICAgIC8vIGl0IHR1cm5zIHRvIGludmFsaWQgbnVtYmVyIGFnYWluXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdHJpcCAoKVxuICAgICAgICAvLyBlLmcuIFVTOiA3MTYxMjM0NTY3IHJldHVybnMgKDcxNikgMTIzLTQ1NjdcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoL1soKV0vZywgJycpO1xuICAgICAgICAvLyByZXBsYWNlIGxpYnJhcnkgZGVsaW1pdGVyIHdpdGggdXNlciBjdXN0b21pemVkIGRlbGltaXRlclxuICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSgvW1xccy1dL2csIG93bmVyLmRlbGltaXRlcik7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59O1xuXG52YXIgUGhvbmVGb3JtYXR0ZXJfMSA9IFBob25lRm9ybWF0dGVyO1xuXG52YXIgQ3JlZGl0Q2FyZERldGVjdG9yID0ge1xuICAgIGJsb2Nrczoge1xuICAgICAgICB1YXRwOiAgICAgICAgICBbNCwgNSwgNl0sXG4gICAgICAgIGFtZXg6ICAgICAgICAgIFs0LCA2LCA1XSxcbiAgICAgICAgZGluZXJzOiAgICAgICAgWzQsIDYsIDRdLFxuICAgICAgICBkaXNjb3ZlcjogICAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIG1hc3RlcmNhcmQ6ICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgZGFua29ydDogICAgICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICBpbnN0YXBheW1lbnQ6ICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIGpjYjE1OiAgICAgICAgIFs0LCA2LCA1XSxcbiAgICAgICAgamNiOiAgICAgICAgICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICBtYWVzdHJvOiAgICAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIHZpc2E6ICAgICAgICAgIFs0LCA0LCA0LCA0XSxcbiAgICAgICAgbWlyOiAgICAgICAgICAgWzQsIDQsIDQsIDRdLFxuICAgICAgICB1bmlvblBheTogICAgICBbNCwgNCwgNCwgNF0sXG4gICAgICAgIGdlbmVyYWw6ICAgICAgIFs0LCA0LCA0LCA0XVxuICAgIH0sXG5cbiAgICByZToge1xuICAgICAgICAvLyBzdGFydHMgd2l0aCAxOyAxNSBkaWdpdHMsIG5vdCBzdGFydHMgd2l0aCAxODAwIChqY2IgY2FyZClcbiAgICAgICAgdWF0cDogL14oPyExODAwKTFcXGR7MCwxNH0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDM0LzM3OyAxNSBkaWdpdHNcbiAgICAgICAgYW1leDogL14zWzQ3XVxcZHswLDEzfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggNjAxMS82NS82NDQtNjQ5OyAxNiBkaWdpdHNcbiAgICAgICAgZGlzY292ZXI6IC9eKD86NjAxMXw2NVxcZHswLDJ9fDY0WzQtOV1cXGQ/KVxcZHswLDEyfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggMzAwLTMwNS8zMDkgb3IgMzYvMzgvMzk7IDE0IGRpZ2l0c1xuICAgICAgICBkaW5lcnM6IC9eMyg/OjAoWzAtNV18OSl8WzY4OV1cXGQ/KVxcZHswLDExfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggNTEtNTUvMjIyMeKAkzI3MjA7IDE2IGRpZ2l0c1xuICAgICAgICBtYXN0ZXJjYXJkOiAvXig1WzEtNV1cXGR7MCwyfXwyMlsyLTldXFxkezAsMX18MlszLTddXFxkezAsMn0pXFxkezAsMTJ9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCA1MDE5LzQxNzUvNDU3MTsgMTYgZGlnaXRzXG4gICAgICAgIGRhbmtvcnQ6IC9eKDUwMTl8NDE3NXw0NTcxKVxcZHswLDEyfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggNjM3LTYzOTsgMTYgZGlnaXRzXG4gICAgICAgIGluc3RhcGF5bWVudDogL142M1s3LTldXFxkezAsMTN9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCAyMTMxLzE4MDA7IDE1IGRpZ2l0c1xuICAgICAgICBqY2IxNTogL14oPzoyMTMxfDE4MDApXFxkezAsMTF9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCAyMTMxLzE4MDAvMzU7IDE2IGRpZ2l0c1xuICAgICAgICBqY2I6IC9eKD86MzVcXGR7MCwyfSlcXGR7MCwxMn0vLFxuXG4gICAgICAgIC8vIHN0YXJ0cyB3aXRoIDUwLzU2LTU4LzYzMDQvNjc7IDE2IGRpZ2l0c1xuICAgICAgICBtYWVzdHJvOiAvXig/OjVbMDY3OF1cXGR7MCwyfXw2MzA0fDY3XFxkezAsMn0pXFxkezAsMTJ9LyxcblxuICAgICAgICAvLyBzdGFydHMgd2l0aCAyMjsgMTYgZGlnaXRzXG4gICAgICAgIG1pcjogL14yMjBbMC00XVxcZHswLDEyfS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggNDsgMTYgZGlnaXRzXG4gICAgICAgIHZpc2E6IC9eNFxcZHswLDE1fS8sXG5cbiAgICAgICAgLy8gc3RhcnRzIHdpdGggNjIvODE7IDE2IGRpZ2l0c1xuICAgICAgICB1bmlvblBheTogL14oNjJ8ODEpXFxkezAsMTR9L1xuICAgIH0sXG5cbiAgICBnZXRTdHJpY3RCbG9ja3M6IGZ1bmN0aW9uIChibG9jaykge1xuICAgICAgdmFyIHRvdGFsID0gYmxvY2sucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50KSB7XG4gICAgICAgIHJldHVybiBwcmV2ICsgY3VycmVudDtcbiAgICAgIH0sIDApO1xuXG4gICAgICByZXR1cm4gYmxvY2suY29uY2F0KDE5IC0gdG90YWwpO1xuICAgIH0sXG5cbiAgICBnZXRJbmZvOiBmdW5jdGlvbiAodmFsdWUsIHN0cmljdE1vZGUpIHtcbiAgICAgICAgdmFyIGJsb2NrcyA9IENyZWRpdENhcmREZXRlY3Rvci5ibG9ja3MsXG4gICAgICAgICAgICByZSA9IENyZWRpdENhcmREZXRlY3Rvci5yZTtcblxuICAgICAgICAvLyBTb21lIGNyZWRpdCBjYXJkIGNhbiBoYXZlIHVwIHRvIDE5IGRpZ2l0cyBudW1iZXIuXG4gICAgICAgIC8vIFNldCBzdHJpY3RNb2RlIHRvIHRydWUgd2lsbCByZW1vdmUgdGhlIDE2IG1heC1sZW5ndGggcmVzdHJhaW4sXG4gICAgICAgIC8vIGhvd2V2ZXIsIEkgbmV2ZXIgZm91bmQgYW55IHdlYnNpdGUgdmFsaWRhdGUgY2FyZCBudW1iZXIgbGlrZVxuICAgICAgICAvLyB0aGlzLCBoZW5jZSBwcm9iYWJseSB5b3UgZG9uJ3Qgd2FudCB0byBlbmFibGUgdGhpcyBvcHRpb24uXG4gICAgICAgIHN0cmljdE1vZGUgPSAhIXN0cmljdE1vZGU7XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHJlKSB7XG4gICAgICAgICAgICBpZiAocmVba2V5XS50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaGVkQmxvY2tzID0gYmxvY2tzW2tleV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZToga2V5LFxuICAgICAgICAgICAgICAgICAgICBibG9ja3M6IHN0cmljdE1vZGUgPyB0aGlzLmdldFN0cmljdEJsb2NrcyhtYXRjaGVkQmxvY2tzKSA6IG1hdGNoZWRCbG9ja3NcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICd1bmtub3duJyxcbiAgICAgICAgICAgIGJsb2Nrczogc3RyaWN0TW9kZSA/IHRoaXMuZ2V0U3RyaWN0QmxvY2tzKGJsb2Nrcy5nZW5lcmFsKSA6IGJsb2Nrcy5nZW5lcmFsXG4gICAgICAgIH07XG4gICAgfVxufTtcblxudmFyIENyZWRpdENhcmREZXRlY3Rvcl8xID0gQ3JlZGl0Q2FyZERldGVjdG9yO1xuXG52YXIgVXRpbCA9IHtcbiAgICBub29wOiBmdW5jdGlvbiAoKSB7XG4gICAgfSxcblxuICAgIHN0cmlwOiBmdW5jdGlvbiAodmFsdWUsIHJlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKHJlLCAnJyk7XG4gICAgfSxcblxuICAgIGdldFBvc3REZWxpbWl0ZXI6IGZ1bmN0aW9uICh2YWx1ZSwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKSB7XG4gICAgICAgIC8vIHNpbmdsZSBkZWxpbWl0ZXJcbiAgICAgICAgaWYgKGRlbGltaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuc2xpY2UoLWRlbGltaXRlci5sZW5ndGgpID09PSBkZWxpbWl0ZXIgPyBkZWxpbWl0ZXIgOiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG11bHRpcGxlIGRlbGltaXRlcnNcbiAgICAgICAgdmFyIG1hdGNoZWREZWxpbWl0ZXIgPSAnJztcbiAgICAgICAgZGVsaW1pdGVycy5mb3JFYWNoKGZ1bmN0aW9uIChjdXJyZW50KSB7XG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UoLWN1cnJlbnQubGVuZ3RoKSA9PT0gY3VycmVudCkge1xuICAgICAgICAgICAgICAgIG1hdGNoZWREZWxpbWl0ZXIgPSBjdXJyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbWF0Y2hlZERlbGltaXRlcjtcbiAgICB9LFxuXG4gICAgZ2V0RGVsaW1pdGVyUkVCeURlbGltaXRlcjogZnVuY3Rpb24gKGRlbGltaXRlcikge1xuICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChkZWxpbWl0ZXIucmVwbGFjZSgvKFsuPyorXiRbXFxdXFxcXCgpe318LV0pL2csICdcXFxcJDEnKSwgJ2cnKTtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dEN1cnNvclBvc2l0aW9uOiBmdW5jdGlvbiAocHJldlBvcywgb2xkVmFsdWUsIG5ld1ZhbHVlLCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpIHtcbiAgICAgIC8vIElmIGN1cnNvciB3YXMgYXQgdGhlIGVuZCBvZiB2YWx1ZSwganVzdCBwbGFjZSBpdCBiYWNrLlxuICAgICAgLy8gQmVjYXVzZSBuZXcgdmFsdWUgY291bGQgY29udGFpbiBhZGRpdGlvbmFsIGNoYXJzLlxuICAgICAgaWYgKG9sZFZhbHVlLmxlbmd0aCA9PT0gcHJldlBvcykge1xuICAgICAgICAgIHJldHVybiBuZXdWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcmV2UG9zICsgdGhpcy5nZXRQb3NpdGlvbk9mZnNldChwcmV2UG9zLCBvbGRWYWx1ZSwgbmV3VmFsdWUsIGRlbGltaXRlciAsZGVsaW1pdGVycyk7XG4gICAgfSxcblxuICAgIGdldFBvc2l0aW9uT2Zmc2V0OiBmdW5jdGlvbiAocHJldlBvcywgb2xkVmFsdWUsIG5ld1ZhbHVlLCBkZWxpbWl0ZXIsIGRlbGltaXRlcnMpIHtcbiAgICAgICAgdmFyIG9sZFJhd1ZhbHVlLCBuZXdSYXdWYWx1ZSwgbGVuZ3RoT2Zmc2V0O1xuXG4gICAgICAgIG9sZFJhd1ZhbHVlID0gdGhpcy5zdHJpcERlbGltaXRlcnMob2xkVmFsdWUuc2xpY2UoMCwgcHJldlBvcyksIGRlbGltaXRlciwgZGVsaW1pdGVycyk7XG4gICAgICAgIG5ld1Jhd1ZhbHVlID0gdGhpcy5zdHJpcERlbGltaXRlcnMobmV3VmFsdWUuc2xpY2UoMCwgcHJldlBvcyksIGRlbGltaXRlciwgZGVsaW1pdGVycyk7XG4gICAgICAgIGxlbmd0aE9mZnNldCA9IG9sZFJhd1ZhbHVlLmxlbmd0aCAtIG5ld1Jhd1ZhbHVlLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gKGxlbmd0aE9mZnNldCAhPT0gMCkgPyAobGVuZ3RoT2Zmc2V0IC8gTWF0aC5hYnMobGVuZ3RoT2Zmc2V0KSkgOiAwO1xuICAgIH0sXG5cbiAgICBzdHJpcERlbGltaXRlcnM6IGZ1bmN0aW9uICh2YWx1ZSwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXM7XG5cbiAgICAgICAgLy8gc2luZ2xlIGRlbGltaXRlclxuICAgICAgICBpZiAoZGVsaW1pdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHZhciBkZWxpbWl0ZXJSRSA9IGRlbGltaXRlciA/IG93bmVyLmdldERlbGltaXRlclJFQnlEZWxpbWl0ZXIoZGVsaW1pdGVyKSA6ICcnO1xuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShkZWxpbWl0ZXJSRSwgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbXVsdGlwbGUgZGVsaW1pdGVyc1xuICAgICAgICBkZWxpbWl0ZXJzLmZvckVhY2goZnVuY3Rpb24gKGN1cnJlbnQpIHtcbiAgICAgICAgICAgIGN1cnJlbnQuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZShvd25lci5nZXREZWxpbWl0ZXJSRUJ5RGVsaW1pdGVyKGxldHRlciksICcnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcblxuICAgIGhlYWRTdHI6IGZ1bmN0aW9uIChzdHIsIGxlbmd0aCkge1xuICAgICAgICByZXR1cm4gc3RyLnNsaWNlKDAsIGxlbmd0aCk7XG4gICAgfSxcblxuICAgIGdldE1heExlbmd0aDogZnVuY3Rpb24gKGJsb2Nrcykge1xuICAgICAgICByZXR1cm4gYmxvY2tzLnJlZHVjZShmdW5jdGlvbiAocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cyArIGN1cnJlbnQ7XG4gICAgICAgIH0sIDApO1xuICAgIH0sXG5cbiAgICAvLyBzdHJpcCBwcmVmaXhcbiAgICAvLyBCZWZvcmUgdHlwZSAgfCAgIEFmdGVyIHR5cGUgICAgfCAgICAgUmV0dXJuIHZhbHVlXG4gICAgLy8gUEVGSVgtLi4uICAgIHwgICBQRUZJWC0uLi4gICAgIHwgICAgICcnXG4gICAgLy8gUFJFRklYLTEyMyAgIHwgICBQRUZJWC0xMjMgICAgIHwgICAgIDEyM1xuICAgIC8vIFBSRUZJWC0xMjMgICB8ICAgUFJFRklYLTIzICAgICB8ICAgICAyM1xuICAgIC8vIFBSRUZJWC0xMjMgICB8ICAgUFJFRklYLTEyMzQgICB8ICAgICAxMjM0XG4gICAgZ2V0UHJlZml4U3RyaXBwZWRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlLCBwcmVmaXgsIHByZWZpeExlbmd0aCwgcHJldlJlc3VsdCwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzLCBub0ltbWVkaWF0ZVByZWZpeCwgdGFpbFByZWZpeCwgc2lnbkJlZm9yZVByZWZpeCkge1xuICAgICAgICAvLyBObyBwcmVmaXhcbiAgICAgICAgaWYgKHByZWZpeExlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbHVlIGlzIHByZWZpeFxuICAgICAgICBpZiAodmFsdWUgPT09IHByZWZpeCAmJiB2YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2lnbkJlZm9yZVByZWZpeCAmJiAodmFsdWUuc2xpY2UoMCwgMSkgPT0gJy0nKSkge1xuICAgICAgICAgICAgdmFyIHByZXYgPSAocHJldlJlc3VsdC5zbGljZSgwLCAxKSA9PSAnLScpID8gcHJldlJlc3VsdC5zbGljZSgxKSA6IHByZXZSZXN1bHQ7XG4gICAgICAgICAgICByZXR1cm4gJy0nICsgdGhpcy5nZXRQcmVmaXhTdHJpcHBlZFZhbHVlKHZhbHVlLnNsaWNlKDEpLCBwcmVmaXgsIHByZWZpeExlbmd0aCwgcHJldiwgZGVsaW1pdGVyLCBkZWxpbWl0ZXJzLCBub0ltbWVkaWF0ZVByZWZpeCwgdGFpbFByZWZpeCwgc2lnbkJlZm9yZVByZWZpeCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmUgcmVzdWx0IHByZWZpeCBzdHJpbmcgZG9lcyBub3QgbWF0Y2ggcHJlLWRlZmluZWQgcHJlZml4XG4gICAgICAgIGlmIChwcmV2UmVzdWx0LnNsaWNlKDAsIHByZWZpeExlbmd0aCkgIT09IHByZWZpeCAmJiAhdGFpbFByZWZpeCkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGZpcnN0IHRpbWUgdXNlciBlbnRlcmVkIHNvbWV0aGluZ1xuICAgICAgICAgICAgaWYgKG5vSW1tZWRpYXRlUHJlZml4ICYmICFwcmV2UmVzdWx0ICYmIHZhbHVlKSByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldlJlc3VsdC5zbGljZSgtcHJlZml4TGVuZ3RoKSAhPT0gcHJlZml4ICYmIHRhaWxQcmVmaXgpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBmaXJzdCB0aW1lIHVzZXIgZW50ZXJlZCBzb21ldGhpbmdcbiAgICAgICAgICAgIGlmIChub0ltbWVkaWF0ZVByZWZpeCAmJiAhcHJldlJlc3VsdCAmJiB2YWx1ZSkgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByZXZWYWx1ZSA9IHRoaXMuc3RyaXBEZWxpbWl0ZXJzKHByZXZSZXN1bHQsIGRlbGltaXRlciwgZGVsaW1pdGVycyk7XG5cbiAgICAgICAgLy8gTmV3IHZhbHVlIGhhcyBpc3N1ZSwgc29tZW9uZSB0eXBlZCBpbiBiZXR3ZWVuIHByZWZpeCBsZXR0ZXJzXG4gICAgICAgIC8vIFJldmVydCB0byBwcmUgdmFsdWVcbiAgICAgICAgaWYgKHZhbHVlLnNsaWNlKDAsIHByZWZpeExlbmd0aCkgIT09IHByZWZpeCAmJiAhdGFpbFByZWZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHByZXZWYWx1ZS5zbGljZShwcmVmaXhMZW5ndGgpO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLnNsaWNlKC1wcmVmaXhMZW5ndGgpICE9PSBwcmVmaXggJiYgdGFpbFByZWZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHByZXZWYWx1ZS5zbGljZSgwLCAtcHJlZml4TGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBObyBpc3N1ZSwgc3RyaXAgcHJlZml4IGZvciBuZXcgdmFsdWVcbiAgICAgICAgcmV0dXJuIHRhaWxQcmVmaXggPyB2YWx1ZS5zbGljZSgwLCAtcHJlZml4TGVuZ3RoKSA6IHZhbHVlLnNsaWNlKHByZWZpeExlbmd0aCk7XG4gICAgfSxcblxuICAgIGdldEZpcnN0RGlmZkluZGV4OiBmdW5jdGlvbiAocHJldiwgY3VycmVudCkge1xuICAgICAgICB2YXIgaW5kZXggPSAwO1xuXG4gICAgICAgIHdoaWxlIChwcmV2LmNoYXJBdChpbmRleCkgPT09IGN1cnJlbnQuY2hhckF0KGluZGV4KSkge1xuICAgICAgICAgICAgaWYgKHByZXYuY2hhckF0KGluZGV4KyspID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICB9LFxuXG4gICAgZ2V0Rm9ybWF0dGVkVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSwgYmxvY2tzLCBibG9ja3NMZW5ndGgsIGRlbGltaXRlciwgZGVsaW1pdGVycywgZGVsaW1pdGVyTGF6eVNob3cpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9ICcnLFxuICAgICAgICAgICAgbXVsdGlwbGVEZWxpbWl0ZXJzID0gZGVsaW1pdGVycy5sZW5ndGggPiAwLFxuICAgICAgICAgICAgY3VycmVudERlbGltaXRlciA9ICcnO1xuXG4gICAgICAgIC8vIG5vIG9wdGlvbnMsIG5vcm1hbCBpbnB1dFxuICAgICAgICBpZiAoYmxvY2tzTGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBibG9ja3MuZm9yRWFjaChmdW5jdGlvbiAobGVuZ3RoLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgc3ViID0gdmFsdWUuc2xpY2UoMCwgbGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdCA9IHZhbHVlLnNsaWNlKGxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICBpZiAobXVsdGlwbGVEZWxpbWl0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnREZWxpbWl0ZXIgPSBkZWxpbWl0ZXJzW2RlbGltaXRlckxhenlTaG93ID8gKGluZGV4IC0gMSkgOiBpbmRleF0gfHwgY3VycmVudERlbGltaXRlcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RGVsaW1pdGVyID0gZGVsaW1pdGVyO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChkZWxpbWl0ZXJMYXp5U2hvdykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gY3VycmVudERlbGltaXRlcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBzdWI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN1YjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc3ViLmxlbmd0aCA9PT0gbGVuZ3RoICYmIGluZGV4IDwgYmxvY2tzTGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGN1cnJlbnREZWxpbWl0ZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgcmVtYWluaW5nIHN0cmluZ1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLy8gbW92ZSBjdXJzb3IgdG8gdGhlIGVuZFxuICAgIC8vIHRoZSBmaXJzdCB0aW1lIHVzZXIgZm9jdXNlcyBvbiBhbiBpbnB1dCB3aXRoIHByZWZpeFxuICAgIGZpeFByZWZpeEN1cnNvcjogZnVuY3Rpb24gKGVsLCBwcmVmaXgsIGRlbGltaXRlciwgZGVsaW1pdGVycykge1xuICAgICAgICBpZiAoIWVsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmFsID0gZWwudmFsdWUsXG4gICAgICAgICAgICBhcHBlbmRpeCA9IGRlbGltaXRlciB8fCAoZGVsaW1pdGVyc1swXSB8fCAnICcpO1xuXG4gICAgICAgIGlmICghZWwuc2V0U2VsZWN0aW9uUmFuZ2UgfHwgIXByZWZpeCB8fCAocHJlZml4Lmxlbmd0aCArIGFwcGVuZGl4Lmxlbmd0aCkgPD0gdmFsLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlbiA9IHZhbC5sZW5ndGggKiAyO1xuXG4gICAgICAgIC8vIHNldCB0aW1lb3V0IHRvIGF2b2lkIGJsaW5rXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UobGVuLCBsZW4pO1xuICAgICAgICB9LCAxKTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2sgaWYgaW5wdXQgZmllbGQgaXMgZnVsbHkgc2VsZWN0ZWRcbiAgICBjaGVja0Z1bGxTZWxlY3Rpb246IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpIHx8IGRvY3VtZW50LmdldFNlbGVjdGlvbigpIHx8IHt9O1xuICAgICAgICByZXR1cm4gc2VsZWN0aW9uLnRvU3RyaW5nKCkubGVuZ3RoID09PSB2YWx1ZS5sZW5ndGg7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAvLyBJZ25vcmVcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBzZXRTZWxlY3Rpb246IGZ1bmN0aW9uIChlbGVtZW50LCBwb3NpdGlvbiwgZG9jKSB7XG4gICAgICAgIGlmIChlbGVtZW50ICE9PSB0aGlzLmdldEFjdGl2ZUVsZW1lbnQoZG9jKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY3Vyc29yIGlzIGFscmVhZHkgaW4gdGhlIGVuZFxuICAgICAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LnZhbHVlLmxlbmd0aCA8PSBwb3NpdGlvbikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbGVtZW50LmNyZWF0ZVRleHRSYW5nZSkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gZWxlbWVudC5jcmVhdGVUZXh0UmFuZ2UoKTtcblxuICAgICAgICAgICAgcmFuZ2UubW92ZSgnY2hhcmFjdGVyJywgcG9zaXRpb24pO1xuICAgICAgICAgICAgcmFuZ2Uuc2VsZWN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UocG9zaXRpb24sIHBvc2l0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RoZSBpbnB1dCBlbGVtZW50IHR5cGUgZG9lcyBub3Qgc3VwcG9ydCBzZWxlY3Rpb24nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRBY3RpdmVFbGVtZW50OiBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICAgICAgdmFyIGFjdGl2ZUVsZW1lbnQgPSBwYXJlbnQuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQgJiYgYWN0aXZlRWxlbWVudC5zaGFkb3dSb290KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBY3RpdmVFbGVtZW50KGFjdGl2ZUVsZW1lbnQuc2hhZG93Um9vdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGl2ZUVsZW1lbnQ7XG4gICAgfSxcblxuICAgIGlzQW5kcm9pZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmF2aWdhdG9yICYmIC9hbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICB9LFxuXG4gICAgLy8gT24gQW5kcm9pZCBjaHJvbWUsIHRoZSBrZXl1cCBhbmQga2V5ZG93biBldmVudHNcbiAgICAvLyBhbHdheXMgcmV0dXJuIGtleSBjb2RlIDIyOSBhcyBhIGNvbXBvc2l0aW9uIHRoYXRcbiAgICAvLyBidWZmZXJzIHRoZSB1c2Vy4oCZcyBrZXlzdHJva2VzXG4gICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9ub3Npci9jbGVhdmUuanMvaXNzdWVzLzE0N1xuICAgIGlzQW5kcm9pZEJhY2tzcGFjZUtleWRvd246IGZ1bmN0aW9uIChsYXN0SW5wdXRWYWx1ZSwgY3VycmVudElucHV0VmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQW5kcm9pZCgpIHx8ICFsYXN0SW5wdXRWYWx1ZSB8fCAhY3VycmVudElucHV0VmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJyZW50SW5wdXRWYWx1ZSA9PT0gbGFzdElucHV0VmFsdWUuc2xpY2UoMCwgLTEpO1xuICAgIH1cbn07XG5cbnZhciBVdGlsXzEgPSBVdGlsO1xuXG4vKipcbiAqIFByb3BzIEFzc2lnbm1lbnRcbiAqXG4gKiBTZXBhcmF0ZSB0aGlzLCBzbyByZWFjdCBtb2R1bGUgY2FuIHNoYXJlIHRoZSB1c2FnZVxuICovXG52YXIgRGVmYXVsdFByb3BlcnRpZXMgPSB7XG4gICAgLy8gTWF5YmUgY2hhbmdlIHRvIG9iamVjdC1hc3NpZ25cbiAgICAvLyBmb3Igbm93IGp1c3Qga2VlcCBpdCBhcyBzaW1wbGVcbiAgICBhc3NpZ246IGZ1bmN0aW9uICh0YXJnZXQsIG9wdHMpIHtcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHt9O1xuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICAvLyBjcmVkaXQgY2FyZFxuICAgICAgICB0YXJnZXQuY3JlZGl0Q2FyZCA9ICEhb3B0cy5jcmVkaXRDYXJkO1xuICAgICAgICB0YXJnZXQuY3JlZGl0Q2FyZFN0cmljdE1vZGUgPSAhIW9wdHMuY3JlZGl0Q2FyZFN0cmljdE1vZGU7XG4gICAgICAgIHRhcmdldC5jcmVkaXRDYXJkVHlwZSA9ICcnO1xuICAgICAgICB0YXJnZXQub25DcmVkaXRDYXJkVHlwZUNoYW5nZWQgPSBvcHRzLm9uQ3JlZGl0Q2FyZFR5cGVDaGFuZ2VkIHx8IChmdW5jdGlvbiAoKSB7fSk7XG5cbiAgICAgICAgLy8gcGhvbmVcbiAgICAgICAgdGFyZ2V0LnBob25lID0gISFvcHRzLnBob25lO1xuICAgICAgICB0YXJnZXQucGhvbmVSZWdpb25Db2RlID0gb3B0cy5waG9uZVJlZ2lvbkNvZGUgfHwgJ0FVJztcbiAgICAgICAgdGFyZ2V0LnBob25lRm9ybWF0dGVyID0ge307XG5cbiAgICAgICAgLy8gdGltZVxuICAgICAgICB0YXJnZXQudGltZSA9ICEhb3B0cy50aW1lO1xuICAgICAgICB0YXJnZXQudGltZVBhdHRlcm4gPSBvcHRzLnRpbWVQYXR0ZXJuIHx8IFsnaCcsICdtJywgJ3MnXTtcbiAgICAgICAgdGFyZ2V0LnRpbWVGb3JtYXQgPSBvcHRzLnRpbWVGb3JtYXQgfHwgJzI0JztcbiAgICAgICAgdGFyZ2V0LnRpbWVGb3JtYXR0ZXIgPSB7fTtcblxuICAgICAgICAvLyBkYXRlXG4gICAgICAgIHRhcmdldC5kYXRlID0gISFvcHRzLmRhdGU7XG4gICAgICAgIHRhcmdldC5kYXRlUGF0dGVybiA9IG9wdHMuZGF0ZVBhdHRlcm4gfHwgWydkJywgJ20nLCAnWSddO1xuICAgICAgICB0YXJnZXQuZGF0ZU1pbiA9IG9wdHMuZGF0ZU1pbiB8fCAnJztcbiAgICAgICAgdGFyZ2V0LmRhdGVNYXggPSBvcHRzLmRhdGVNYXggfHwgJyc7XG4gICAgICAgIHRhcmdldC5kYXRlRm9ybWF0dGVyID0ge307XG5cbiAgICAgICAgLy8gbnVtZXJhbFxuICAgICAgICB0YXJnZXQubnVtZXJhbCA9ICEhb3B0cy5udW1lcmFsO1xuICAgICAgICB0YXJnZXQubnVtZXJhbEludGVnZXJTY2FsZSA9IG9wdHMubnVtZXJhbEludGVnZXJTY2FsZSA+IDAgPyBvcHRzLm51bWVyYWxJbnRlZ2VyU2NhbGUgOiAwO1xuICAgICAgICB0YXJnZXQubnVtZXJhbERlY2ltYWxTY2FsZSA9IG9wdHMubnVtZXJhbERlY2ltYWxTY2FsZSA+PSAwID8gb3B0cy5udW1lcmFsRGVjaW1hbFNjYWxlIDogMjtcbiAgICAgICAgdGFyZ2V0Lm51bWVyYWxEZWNpbWFsTWFyayA9IG9wdHMubnVtZXJhbERlY2ltYWxNYXJrIHx8ICcuJztcbiAgICAgICAgdGFyZ2V0Lm51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlID0gb3B0cy5udW1lcmFsVGhvdXNhbmRzR3JvdXBTdHlsZSB8fCAndGhvdXNhbmQnO1xuICAgICAgICB0YXJnZXQubnVtZXJhbFBvc2l0aXZlT25seSA9ICEhb3B0cy5udW1lcmFsUG9zaXRpdmVPbmx5O1xuICAgICAgICB0YXJnZXQuc3RyaXBMZWFkaW5nWmVyb2VzID0gb3B0cy5zdHJpcExlYWRpbmdaZXJvZXMgIT09IGZhbHNlO1xuICAgICAgICB0YXJnZXQuc2lnbkJlZm9yZVByZWZpeCA9ICEhb3B0cy5zaWduQmVmb3JlUHJlZml4O1xuICAgICAgICB0YXJnZXQudGFpbFByZWZpeCA9ICEhb3B0cy50YWlsUHJlZml4O1xuXG4gICAgICAgIC8vIG90aGVyc1xuICAgICAgICB0YXJnZXQuc3dhcEhpZGRlbklucHV0ID0gISFvcHRzLnN3YXBIaWRkZW5JbnB1dDtcbiAgICAgICAgXG4gICAgICAgIHRhcmdldC5udW1lcmljT25seSA9IHRhcmdldC5jcmVkaXRDYXJkIHx8IHRhcmdldC5kYXRlIHx8ICEhb3B0cy5udW1lcmljT25seTtcblxuICAgICAgICB0YXJnZXQudXBwZXJjYXNlID0gISFvcHRzLnVwcGVyY2FzZTtcbiAgICAgICAgdGFyZ2V0Lmxvd2VyY2FzZSA9ICEhb3B0cy5sb3dlcmNhc2U7XG5cbiAgICAgICAgdGFyZ2V0LnByZWZpeCA9ICh0YXJnZXQuY3JlZGl0Q2FyZCB8fCB0YXJnZXQuZGF0ZSkgPyAnJyA6IChvcHRzLnByZWZpeCB8fCAnJyk7XG4gICAgICAgIHRhcmdldC5ub0ltbWVkaWF0ZVByZWZpeCA9ICEhb3B0cy5ub0ltbWVkaWF0ZVByZWZpeDtcbiAgICAgICAgdGFyZ2V0LnByZWZpeExlbmd0aCA9IHRhcmdldC5wcmVmaXgubGVuZ3RoO1xuICAgICAgICB0YXJnZXQucmF3VmFsdWVUcmltUHJlZml4ID0gISFvcHRzLnJhd1ZhbHVlVHJpbVByZWZpeDtcbiAgICAgICAgdGFyZ2V0LmNvcHlEZWxpbWl0ZXIgPSAhIW9wdHMuY29weURlbGltaXRlcjtcblxuICAgICAgICB0YXJnZXQuaW5pdFZhbHVlID0gKG9wdHMuaW5pdFZhbHVlICE9PSB1bmRlZmluZWQgJiYgb3B0cy5pbml0VmFsdWUgIT09IG51bGwpID8gb3B0cy5pbml0VmFsdWUudG9TdHJpbmcoKSA6ICcnO1xuXG4gICAgICAgIHRhcmdldC5kZWxpbWl0ZXIgPVxuICAgICAgICAgICAgKG9wdHMuZGVsaW1pdGVyIHx8IG9wdHMuZGVsaW1pdGVyID09PSAnJykgPyBvcHRzLmRlbGltaXRlciA6XG4gICAgICAgICAgICAgICAgKG9wdHMuZGF0ZSA/ICcvJyA6XG4gICAgICAgICAgICAgICAgICAgIChvcHRzLnRpbWUgPyAnOicgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKG9wdHMubnVtZXJhbCA/ICcsJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9wdHMucGhvbmUgPyAnICcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICcpKSkpO1xuICAgICAgICB0YXJnZXQuZGVsaW1pdGVyTGVuZ3RoID0gdGFyZ2V0LmRlbGltaXRlci5sZW5ndGg7XG4gICAgICAgIHRhcmdldC5kZWxpbWl0ZXJMYXp5U2hvdyA9ICEhb3B0cy5kZWxpbWl0ZXJMYXp5U2hvdztcbiAgICAgICAgdGFyZ2V0LmRlbGltaXRlcnMgPSBvcHRzLmRlbGltaXRlcnMgfHwgW107XG5cbiAgICAgICAgdGFyZ2V0LmJsb2NrcyA9IG9wdHMuYmxvY2tzIHx8IFtdO1xuICAgICAgICB0YXJnZXQuYmxvY2tzTGVuZ3RoID0gdGFyZ2V0LmJsb2Nrcy5sZW5ndGg7XG5cbiAgICAgICAgdGFyZ2V0LnJvb3QgPSAodHlwZW9mIGNvbW1vbmpzR2xvYmFsID09PSAnb2JqZWN0JyAmJiBjb21tb25qc0dsb2JhbCkgPyBjb21tb25qc0dsb2JhbCA6IHdpbmRvdztcbiAgICAgICAgdGFyZ2V0LmRvY3VtZW50ID0gb3B0cy5kb2N1bWVudCB8fCB0YXJnZXQucm9vdC5kb2N1bWVudDtcblxuICAgICAgICB0YXJnZXQubWF4TGVuZ3RoID0gMDtcblxuICAgICAgICB0YXJnZXQuYmFja3NwYWNlID0gZmFsc2U7XG4gICAgICAgIHRhcmdldC5yZXN1bHQgPSAnJztcblxuICAgICAgICB0YXJnZXQub25WYWx1ZUNoYW5nZWQgPSBvcHRzLm9uVmFsdWVDaGFuZ2VkIHx8IChmdW5jdGlvbiAoKSB7fSk7XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG59O1xuXG52YXIgRGVmYXVsdFByb3BlcnRpZXNfMSA9IERlZmF1bHRQcm9wZXJ0aWVzO1xuXG4vKipcbiAqIENvbnN0cnVjdCBhIG5ldyBDbGVhdmUgaW5zdGFuY2UgYnkgcGFzc2luZyB0aGUgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZyB8IEhUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICovXG52YXIgQ2xlYXZlID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdHMpIHtcbiAgICB2YXIgb3duZXIgPSB0aGlzO1xuICAgIHZhciBoYXNNdWx0aXBsZUVsZW1lbnRzID0gZmFsc2U7XG5cbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG93bmVyLmVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW1lbnQpO1xuICAgICAgICBoYXNNdWx0aXBsZUVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChlbGVtZW50KS5sZW5ndGggPiAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZW9mIGVsZW1lbnQubGVuZ3RoICE9PSAndW5kZWZpbmVkJyAmJiBlbGVtZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgb3duZXIuZWxlbWVudCA9IGVsZW1lbnRbMF07XG4gICAgICAgIGhhc011bHRpcGxlRWxlbWVudHMgPSBlbGVtZW50Lmxlbmd0aCA+IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvd25lci5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW93bmVyLmVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbY2xlYXZlLmpzXSBQbGVhc2UgY2hlY2sgdGhlIGVsZW1lbnQnKTtcbiAgICB9XG5cbiAgICBpZiAoaGFzTXVsdGlwbGVFbGVtZW50cykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgIGNvbnNvbGUud2FybignW2NsZWF2ZS5qc10gTXVsdGlwbGUgaW5wdXQgZmllbGRzIG1hdGNoZWQsIGNsZWF2ZS5qcyB3aWxsIG9ubHkgdGFrZSB0aGUgZmlyc3Qgb25lLicpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBPbGQgSUVcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvcHRzLmluaXRWYWx1ZSA9IG93bmVyLmVsZW1lbnQudmFsdWU7XG5cbiAgICBvd25lci5wcm9wZXJ0aWVzID0gQ2xlYXZlLkRlZmF1bHRQcm9wZXJ0aWVzLmFzc2lnbih7fSwgb3B0cyk7XG5cbiAgICBvd25lci5pbml0KCk7XG59O1xuXG5DbGVhdmUucHJvdG90eXBlID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICAvLyBubyBuZWVkIHRvIHVzZSB0aGlzIGxpYlxuICAgICAgICBpZiAoIXBwcy5udW1lcmFsICYmICFwcHMucGhvbmUgJiYgIXBwcy5jcmVkaXRDYXJkICYmICFwcHMudGltZSAmJiAhcHBzLmRhdGUgJiYgKHBwcy5ibG9ja3NMZW5ndGggPT09IDAgJiYgIXBwcy5wcmVmaXgpKSB7XG4gICAgICAgICAgICBvd25lci5vbklucHV0KHBwcy5pbml0VmFsdWUpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwcHMubWF4TGVuZ3RoID0gQ2xlYXZlLlV0aWwuZ2V0TWF4TGVuZ3RoKHBwcy5ibG9ja3MpO1xuXG4gICAgICAgIG93bmVyLmlzQW5kcm9pZCA9IENsZWF2ZS5VdGlsLmlzQW5kcm9pZCgpO1xuICAgICAgICBvd25lci5sYXN0SW5wdXRWYWx1ZSA9ICcnO1xuICAgICAgICBvd25lci5pc0JhY2t3YXJkID0gJyc7XG5cbiAgICAgICAgb3duZXIub25DaGFuZ2VMaXN0ZW5lciA9IG93bmVyLm9uQ2hhbmdlLmJpbmQob3duZXIpO1xuICAgICAgICBvd25lci5vbktleURvd25MaXN0ZW5lciA9IG93bmVyLm9uS2V5RG93bi5iaW5kKG93bmVyKTtcbiAgICAgICAgb3duZXIub25Gb2N1c0xpc3RlbmVyID0gb3duZXIub25Gb2N1cy5iaW5kKG93bmVyKTtcbiAgICAgICAgb3duZXIub25DdXRMaXN0ZW5lciA9IG93bmVyLm9uQ3V0LmJpbmQob3duZXIpO1xuICAgICAgICBvd25lci5vbkNvcHlMaXN0ZW5lciA9IG93bmVyLm9uQ29weS5iaW5kKG93bmVyKTtcblxuICAgICAgICBvd25lci5pbml0U3dhcEhpZGRlbklucHV0KCk7XG5cbiAgICAgICAgb3duZXIuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIG93bmVyLm9uQ2hhbmdlTGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvd25lci5vbktleURvd25MaXN0ZW5lcik7XG4gICAgICAgIG93bmVyLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBvd25lci5vbkZvY3VzTGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2N1dCcsIG93bmVyLm9uQ3V0TGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NvcHknLCBvd25lci5vbkNvcHlMaXN0ZW5lcik7XG5cblxuICAgICAgICBvd25lci5pbml0UGhvbmVGb3JtYXR0ZXIoKTtcbiAgICAgICAgb3duZXIuaW5pdERhdGVGb3JtYXR0ZXIoKTtcbiAgICAgICAgb3duZXIuaW5pdFRpbWVGb3JtYXR0ZXIoKTtcbiAgICAgICAgb3duZXIuaW5pdE51bWVyYWxGb3JtYXR0ZXIoKTtcblxuICAgICAgICAvLyBhdm9pZCB0b3VjaCBpbnB1dCBmaWVsZCBpZiB2YWx1ZSBpcyBudWxsXG4gICAgICAgIC8vIG90aGVyd2lzZSBGaXJlZm94IHdpbGwgYWRkIHJlZCBib3gtc2hhZG93IGZvciA8aW5wdXQgcmVxdWlyZWQgLz5cbiAgICAgICAgaWYgKHBwcy5pbml0VmFsdWUgfHwgKHBwcy5wcmVmaXggJiYgIXBwcy5ub0ltbWVkaWF0ZVByZWZpeCkpIHtcbiAgICAgICAgICAgIG93bmVyLm9uSW5wdXQocHBzLmluaXRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdFN3YXBIaWRkZW5JbnB1dDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuICAgICAgICBpZiAoIXBwcy5zd2FwSGlkZGVuSW5wdXQpIHJldHVybjtcblxuICAgICAgICB2YXIgaW5wdXRGb3JtYXR0ZXIgPSBvd25lci5lbGVtZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbnB1dEZvcm1hdHRlciwgb3duZXIuZWxlbWVudCk7XG5cbiAgICAgICAgb3duZXIuZWxlbWVudFN3YXBIaWRkZW4gPSBvd25lci5lbGVtZW50O1xuICAgICAgICBvd25lci5lbGVtZW50U3dhcEhpZGRlbi50eXBlID0gJ2hpZGRlbic7XG5cbiAgICAgICAgb3duZXIuZWxlbWVudCA9IGlucHV0Rm9ybWF0dGVyO1xuICAgICAgICBvd25lci5lbGVtZW50LmlkID0gJyc7XG4gICAgfSxcblxuICAgIGluaXROdW1lcmFsRm9ybWF0dGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgaWYgKCFwcHMubnVtZXJhbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcHBzLm51bWVyYWxGb3JtYXR0ZXIgPSBuZXcgQ2xlYXZlLk51bWVyYWxGb3JtYXR0ZXIoXG4gICAgICAgICAgICBwcHMubnVtZXJhbERlY2ltYWxNYXJrLFxuICAgICAgICAgICAgcHBzLm51bWVyYWxJbnRlZ2VyU2NhbGUsXG4gICAgICAgICAgICBwcHMubnVtZXJhbERlY2ltYWxTY2FsZSxcbiAgICAgICAgICAgIHBwcy5udW1lcmFsVGhvdXNhbmRzR3JvdXBTdHlsZSxcbiAgICAgICAgICAgIHBwcy5udW1lcmFsUG9zaXRpdmVPbmx5LFxuICAgICAgICAgICAgcHBzLnN0cmlwTGVhZGluZ1plcm9lcyxcbiAgICAgICAgICAgIHBwcy5wcmVmaXgsXG4gICAgICAgICAgICBwcHMuc2lnbkJlZm9yZVByZWZpeCxcbiAgICAgICAgICAgIHBwcy50YWlsUHJlZml4LFxuICAgICAgICAgICAgcHBzLmRlbGltaXRlclxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBpbml0VGltZUZvcm1hdHRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgaWYgKCFwcHMudGltZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcHBzLnRpbWVGb3JtYXR0ZXIgPSBuZXcgQ2xlYXZlLlRpbWVGb3JtYXR0ZXIocHBzLnRpbWVQYXR0ZXJuLCBwcHMudGltZUZvcm1hdCk7XG4gICAgICAgIHBwcy5ibG9ja3MgPSBwcHMudGltZUZvcm1hdHRlci5nZXRCbG9ja3MoKTtcbiAgICAgICAgcHBzLmJsb2Nrc0xlbmd0aCA9IHBwcy5ibG9ja3MubGVuZ3RoO1xuICAgICAgICBwcHMubWF4TGVuZ3RoID0gQ2xlYXZlLlV0aWwuZ2V0TWF4TGVuZ3RoKHBwcy5ibG9ja3MpO1xuICAgIH0sXG5cbiAgICBpbml0RGF0ZUZvcm1hdHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIGlmICghcHBzLmRhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBwcy5kYXRlRm9ybWF0dGVyID0gbmV3IENsZWF2ZS5EYXRlRm9ybWF0dGVyKHBwcy5kYXRlUGF0dGVybiwgcHBzLmRhdGVNaW4sIHBwcy5kYXRlTWF4KTtcbiAgICAgICAgcHBzLmJsb2NrcyA9IHBwcy5kYXRlRm9ybWF0dGVyLmdldEJsb2NrcygpO1xuICAgICAgICBwcHMuYmxvY2tzTGVuZ3RoID0gcHBzLmJsb2Nrcy5sZW5ndGg7XG4gICAgICAgIHBwcy5tYXhMZW5ndGggPSBDbGVhdmUuVXRpbC5nZXRNYXhMZW5ndGgocHBzLmJsb2Nrcyk7XG4gICAgfSxcblxuICAgIGluaXRQaG9uZUZvcm1hdHRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIGlmICghcHBzLnBob25lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhdmUuQXNZb3VUeXBlRm9ybWF0dGVyIHNob3VsZCBiZSBwcm92aWRlZCBieVxuICAgICAgICAvLyBleHRlcm5hbCBnb29nbGUgY2xvc3VyZSBsaWJcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBwcy5waG9uZUZvcm1hdHRlciA9IG5ldyBDbGVhdmUuUGhvbmVGb3JtYXR0ZXIoXG4gICAgICAgICAgICAgICAgbmV3IHBwcy5yb290LkNsZWF2ZS5Bc1lvdVR5cGVGb3JtYXR0ZXIocHBzLnBob25lUmVnaW9uQ29kZSksXG4gICAgICAgICAgICAgICAgcHBzLmRlbGltaXRlclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW2NsZWF2ZS5qc10gUGxlYXNlIGluY2x1ZGUgcGhvbmUtdHlwZS1mb3JtYXR0ZXIue2NvdW50cnl9LmpzIGxpYicpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uS2V5RG93bjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBjaGFyQ29kZSA9IGV2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGU7XG5cbiAgICAgICAgb3duZXIubGFzdElucHV0VmFsdWUgPSBvd25lci5lbGVtZW50LnZhbHVlO1xuICAgICAgICBvd25lci5pc0JhY2t3YXJkID0gY2hhckNvZGUgPT09IDg7XG4gICAgfSxcblxuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcyxcbiAgICAgICAgICAgIFV0aWwgPSBDbGVhdmUuVXRpbDtcblxuICAgICAgICBvd25lci5pc0JhY2t3YXJkID0gb3duZXIuaXNCYWNrd2FyZCB8fCBldmVudC5pbnB1dFR5cGUgPT09ICdkZWxldGVDb250ZW50QmFja3dhcmQnO1xuXG4gICAgICAgIHZhciBwb3N0RGVsaW1pdGVyID0gVXRpbC5nZXRQb3N0RGVsaW1pdGVyKG93bmVyLmxhc3RJbnB1dFZhbHVlLCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycyk7XG5cbiAgICAgICAgaWYgKG93bmVyLmlzQmFja3dhcmQgJiYgcG9zdERlbGltaXRlcikge1xuICAgICAgICAgICAgcHBzLnBvc3REZWxpbWl0ZXJCYWNrc3BhY2UgPSBwb3N0RGVsaW1pdGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHBzLnBvc3REZWxpbWl0ZXJCYWNrc3BhY2UgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub25JbnB1dCh0aGlzLmVsZW1lbnQudmFsdWUpO1xuICAgIH0sXG5cbiAgICBvbkZvY3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuICAgICAgICBvd25lci5sYXN0SW5wdXRWYWx1ZSA9IG93bmVyLmVsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgaWYgKHBwcy5wcmVmaXggJiYgcHBzLm5vSW1tZWRpYXRlUHJlZml4ICYmICFvd25lci5lbGVtZW50LnZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLm9uSW5wdXQocHBzLnByZWZpeCk7XG4gICAgICAgIH1cblxuICAgICAgICBDbGVhdmUuVXRpbC5maXhQcmVmaXhDdXJzb3Iob3duZXIuZWxlbWVudCwgcHBzLnByZWZpeCwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMpO1xuICAgIH0sXG5cbiAgICBvbkN1dDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCFDbGVhdmUuVXRpbC5jaGVja0Z1bGxTZWxlY3Rpb24odGhpcy5lbGVtZW50LnZhbHVlKSkgcmV0dXJuO1xuICAgICAgICB0aGlzLmNvcHlDbGlwYm9hcmREYXRhKGUpO1xuICAgICAgICB0aGlzLm9uSW5wdXQoJycpO1xuICAgIH0sXG5cbiAgICBvbkNvcHk6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghQ2xlYXZlLlV0aWwuY2hlY2tGdWxsU2VsZWN0aW9uKHRoaXMuZWxlbWVudC52YWx1ZSkpIHJldHVybjtcbiAgICAgICAgdGhpcy5jb3B5Q2xpcGJvYXJkRGF0YShlKTtcbiAgICB9LFxuXG4gICAgY29weUNsaXBib2FyZERhdGE6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBwcHMgPSBvd25lci5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgVXRpbCA9IENsZWF2ZS5VdGlsLFxuICAgICAgICAgICAgaW5wdXRWYWx1ZSA9IG93bmVyLmVsZW1lbnQudmFsdWUsXG4gICAgICAgICAgICB0ZXh0VG9Db3B5ID0gJyc7XG5cbiAgICAgICAgaWYgKCFwcHMuY29weURlbGltaXRlcikge1xuICAgICAgICAgICAgdGV4dFRvQ29weSA9IFV0aWwuc3RyaXBEZWxpbWl0ZXJzKGlucHV0VmFsdWUsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHRUb0NvcHkgPSBpbnB1dFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChlLmNsaXBib2FyZERhdGEpIHtcbiAgICAgICAgICAgICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YSgnVGV4dCcsIHRleHRUb0NvcHkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xpcGJvYXJkRGF0YS5zZXREYXRhKCdUZXh0JywgdGV4dFRvQ29weSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgIC8vICBlbXB0eVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uSW5wdXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLCBwcHMgPSBvd25lci5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgVXRpbCA9IENsZWF2ZS5VdGlsO1xuXG4gICAgICAgIC8vIGNhc2UgMTogZGVsZXRlIG9uZSBtb3JlIGNoYXJhY3RlciBcIjRcIlxuICAgICAgICAvLyAxMjM0KnwgLT4gaGl0IGJhY2tzcGFjZSAtPiAxMjN8XG4gICAgICAgIC8vIGNhc2UgMjogbGFzdCBjaGFyYWN0ZXIgaXMgbm90IGRlbGltaXRlciB3aGljaCBpczpcbiAgICAgICAgLy8gMTJ8MzQqIC0+IGhpdCBiYWNrc3BhY2UgLT4gMXwzNCpcbiAgICAgICAgLy8gbm90ZTogbm8gbmVlZCB0byBhcHBseSB0aGlzIGZvciBudW1lcmFsIG1vZGVcbiAgICAgICAgdmFyIHBvc3REZWxpbWl0ZXJBZnRlciA9IFV0aWwuZ2V0UG9zdERlbGltaXRlcih2YWx1ZSwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMpO1xuICAgICAgICBpZiAoIXBwcy5udW1lcmFsICYmIHBwcy5wb3N0RGVsaW1pdGVyQmFja3NwYWNlICYmICFwb3N0RGVsaW1pdGVyQWZ0ZXIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gVXRpbC5oZWFkU3RyKHZhbHVlLCB2YWx1ZS5sZW5ndGggLSBwcHMucG9zdERlbGltaXRlckJhY2tzcGFjZS5sZW5ndGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGhvbmUgZm9ybWF0dGVyXG4gICAgICAgIGlmIChwcHMucGhvbmUpIHtcbiAgICAgICAgICAgIGlmIChwcHMucHJlZml4ICYmICghcHBzLm5vSW1tZWRpYXRlUHJlZml4IHx8IHZhbHVlLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICBwcHMucmVzdWx0ID0gcHBzLnByZWZpeCArIHBwcy5waG9uZUZvcm1hdHRlci5mb3JtYXQodmFsdWUpLnNsaWNlKHBwcy5wcmVmaXgubGVuZ3RoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHBzLnJlc3VsdCA9IHBwcy5waG9uZUZvcm1hdHRlci5mb3JtYXQodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3duZXIudXBkYXRlVmFsdWVTdGF0ZSgpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBudW1lcmFsIGZvcm1hdHRlclxuICAgICAgICBpZiAocHBzLm51bWVyYWwpIHtcbiAgICAgICAgICAgIC8vIERvIG5vdCBzaG93IHByZWZpeCB3aGVuIG5vSW1tZWRpYXRlUHJlZml4IGlzIHNwZWNpZmllZFxuICAgICAgICAgICAgLy8gVGhpcyBtb3N0bHkgYmVjYXVzZSB3ZSBuZWVkIHRvIHNob3cgdXNlciB0aGUgbmF0aXZlIGlucHV0IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICBpZiAocHBzLnByZWZpeCAmJiBwcHMubm9JbW1lZGlhdGVQcmVmaXggJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcHBzLnJlc3VsdCA9ICcnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcHMucmVzdWx0ID0gcHBzLm51bWVyYWxGb3JtYXR0ZXIuZm9ybWF0KHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG93bmVyLnVwZGF0ZVZhbHVlU3RhdGUoKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGF0ZVxuICAgICAgICBpZiAocHBzLmRhdGUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gcHBzLmRhdGVGb3JtYXR0ZXIuZ2V0VmFsaWRhdGVkRGF0ZSh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aW1lXG4gICAgICAgIGlmIChwcHMudGltZSkge1xuICAgICAgICAgICAgdmFsdWUgPSBwcHMudGltZUZvcm1hdHRlci5nZXRWYWxpZGF0ZWRUaW1lKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0cmlwIGRlbGltaXRlcnNcbiAgICAgICAgdmFsdWUgPSBVdGlsLnN0cmlwRGVsaW1pdGVycyh2YWx1ZSwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMpO1xuXG4gICAgICAgIC8vIHN0cmlwIHByZWZpeFxuICAgICAgICB2YWx1ZSA9IFV0aWwuZ2V0UHJlZml4U3RyaXBwZWRWYWx1ZSh2YWx1ZSwgcHBzLnByZWZpeCwgcHBzLnByZWZpeExlbmd0aCwgcHBzLnJlc3VsdCwgcHBzLmRlbGltaXRlciwgcHBzLmRlbGltaXRlcnMsIHBwcy5ub0ltbWVkaWF0ZVByZWZpeCwgcHBzLnRhaWxQcmVmaXgsIHBwcy5zaWduQmVmb3JlUHJlZml4KTtcblxuICAgICAgICAvLyBzdHJpcCBub24tbnVtZXJpYyBjaGFyYWN0ZXJzXG4gICAgICAgIHZhbHVlID0gcHBzLm51bWVyaWNPbmx5ID8gVXRpbC5zdHJpcCh2YWx1ZSwgL1teXFxkXS9nKSA6IHZhbHVlO1xuXG4gICAgICAgIC8vIGNvbnZlcnQgY2FzZVxuICAgICAgICB2YWx1ZSA9IHBwcy51cHBlcmNhc2UgPyB2YWx1ZS50b1VwcGVyQ2FzZSgpIDogdmFsdWU7XG4gICAgICAgIHZhbHVlID0gcHBzLmxvd2VyY2FzZSA/IHZhbHVlLnRvTG93ZXJDYXNlKCkgOiB2YWx1ZTtcblxuICAgICAgICAvLyBwcmV2ZW50IGZyb20gc2hvd2luZyBwcmVmaXggd2hlbiBubyBpbW1lZGlhdGUgb3B0aW9uIGVuYWJsZWQgd2l0aCBlbXB0eSBpbnB1dCB2YWx1ZVxuICAgICAgICBpZiAocHBzLnByZWZpeCkge1xuICAgICAgICAgICAgaWYgKHBwcy50YWlsUHJlZml4KSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHBwcy5wcmVmaXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcHBzLnByZWZpeCArIHZhbHVlO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vIG5vIGJsb2NrcyBzcGVjaWZpZWQsIG5vIG5lZWQgdG8gZG8gZm9ybWF0dGluZ1xuICAgICAgICAgICAgaWYgKHBwcy5ibG9ja3NMZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBwcHMucmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgb3duZXIudXBkYXRlVmFsdWVTdGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIGNyZWRpdCBjYXJkIHByb3BzXG4gICAgICAgIGlmIChwcHMuY3JlZGl0Q2FyZCkge1xuICAgICAgICAgICAgb3duZXIudXBkYXRlQ3JlZGl0Q2FyZFByb3BzQnlWYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdHJpcCBvdmVyIGxlbmd0aCBjaGFyYWN0ZXJzXG4gICAgICAgIHZhbHVlID0gVXRpbC5oZWFkU3RyKHZhbHVlLCBwcHMubWF4TGVuZ3RoKTtcblxuICAgICAgICAvLyBhcHBseSBibG9ja3NcbiAgICAgICAgcHBzLnJlc3VsdCA9IFV0aWwuZ2V0Rm9ybWF0dGVkVmFsdWUoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHBwcy5ibG9ja3MsIHBwcy5ibG9ja3NMZW5ndGgsXG4gICAgICAgICAgICBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycywgcHBzLmRlbGltaXRlckxhenlTaG93XG4gICAgICAgICk7XG5cbiAgICAgICAgb3duZXIudXBkYXRlVmFsdWVTdGF0ZSgpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDcmVkaXRDYXJkUHJvcHNCeVZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcyxcbiAgICAgICAgICAgIFV0aWwgPSBDbGVhdmUuVXRpbCxcbiAgICAgICAgICAgIGNyZWRpdENhcmRJbmZvO1xuXG4gICAgICAgIC8vIEF0IGxlYXN0IG9uZSBvZiB0aGUgZmlyc3QgNCBjaGFyYWN0ZXJzIGhhcyBjaGFuZ2VkXG4gICAgICAgIGlmIChVdGlsLmhlYWRTdHIocHBzLnJlc3VsdCwgNCkgPT09IFV0aWwuaGVhZFN0cih2YWx1ZSwgNCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWRpdENhcmRJbmZvID0gQ2xlYXZlLkNyZWRpdENhcmREZXRlY3Rvci5nZXRJbmZvKHZhbHVlLCBwcHMuY3JlZGl0Q2FyZFN0cmljdE1vZGUpO1xuXG4gICAgICAgIHBwcy5ibG9ja3MgPSBjcmVkaXRDYXJkSW5mby5ibG9ja3M7XG4gICAgICAgIHBwcy5ibG9ja3NMZW5ndGggPSBwcHMuYmxvY2tzLmxlbmd0aDtcbiAgICAgICAgcHBzLm1heExlbmd0aCA9IFV0aWwuZ2V0TWF4TGVuZ3RoKHBwcy5ibG9ja3MpO1xuXG4gICAgICAgIC8vIGNyZWRpdCBjYXJkIHR5cGUgY2hhbmdlZFxuICAgICAgICBpZiAocHBzLmNyZWRpdENhcmRUeXBlICE9PSBjcmVkaXRDYXJkSW5mby50eXBlKSB7XG4gICAgICAgICAgICBwcHMuY3JlZGl0Q2FyZFR5cGUgPSBjcmVkaXRDYXJkSW5mby50eXBlO1xuXG4gICAgICAgICAgICBwcHMub25DcmVkaXRDYXJkVHlwZUNoYW5nZWQuY2FsbChvd25lciwgcHBzLmNyZWRpdENhcmRUeXBlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGVWYWx1ZVN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsXG4gICAgICAgICAgICBVdGlsID0gQ2xlYXZlLlV0aWwsXG4gICAgICAgICAgICBwcHMgPSBvd25lci5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIGlmICghb3duZXIuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVuZFBvcyA9IG93bmVyLmVsZW1lbnQuc2VsZWN0aW9uRW5kO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSBvd25lci5lbGVtZW50LnZhbHVlO1xuICAgICAgICB2YXIgbmV3VmFsdWUgPSBwcHMucmVzdWx0O1xuXG4gICAgICAgIGVuZFBvcyA9IFV0aWwuZ2V0TmV4dEN1cnNvclBvc2l0aW9uKGVuZFBvcywgb2xkVmFsdWUsIG5ld1ZhbHVlLCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycyk7XG5cbiAgICAgICAgLy8gZml4IEFuZHJvaWQgYnJvd3NlciB0eXBlPVwidGV4dFwiIGlucHV0IGZpZWxkXG4gICAgICAgIC8vIGN1cnNvciBub3QganVtcGluZyBpc3N1ZVxuICAgICAgICBpZiAob3duZXIuaXNBbmRyb2lkKSB7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgb3duZXIuZWxlbWVudC52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIFV0aWwuc2V0U2VsZWN0aW9uKG93bmVyLmVsZW1lbnQsIGVuZFBvcywgcHBzLmRvY3VtZW50LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgb3duZXIuY2FsbE9uVmFsdWVDaGFuZ2VkKCk7XG4gICAgICAgICAgICB9LCAxKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgb3duZXIuZWxlbWVudC52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICBpZiAocHBzLnN3YXBIaWRkZW5JbnB1dCkgb3duZXIuZWxlbWVudFN3YXBIaWRkZW4udmFsdWUgPSBvd25lci5nZXRSYXdWYWx1ZSgpO1xuXG4gICAgICAgIFV0aWwuc2V0U2VsZWN0aW9uKG93bmVyLmVsZW1lbnQsIGVuZFBvcywgcHBzLmRvY3VtZW50LCBmYWxzZSk7XG4gICAgICAgIG93bmVyLmNhbGxPblZhbHVlQ2hhbmdlZCgpO1xuICAgIH0sXG5cbiAgICBjYWxsT25WYWx1ZUNoYW5nZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgcHBzLm9uVmFsdWVDaGFuZ2VkLmNhbGwob3duZXIsIHtcbiAgICAgICAgICAgIHRhcmdldDoge1xuICAgICAgICAgICAgICAgIG5hbWU6IG93bmVyLmVsZW1lbnQubmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHBzLnJlc3VsdCxcbiAgICAgICAgICAgICAgICByYXdWYWx1ZTogb3duZXIuZ2V0UmF3VmFsdWUoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0UGhvbmVSZWdpb25Db2RlOiBmdW5jdGlvbiAocGhvbmVSZWdpb25Db2RlKSB7XG4gICAgICAgIHZhciBvd25lciA9IHRoaXMsIHBwcyA9IG93bmVyLnByb3BlcnRpZXM7XG5cbiAgICAgICAgcHBzLnBob25lUmVnaW9uQ29kZSA9IHBob25lUmVnaW9uQ29kZTtcbiAgICAgICAgb3duZXIuaW5pdFBob25lRm9ybWF0dGVyKCk7XG4gICAgICAgIG93bmVyLm9uQ2hhbmdlKCk7XG4gICAgfSxcblxuICAgIHNldFJhd1ZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcywgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwgPyB2YWx1ZS50b1N0cmluZygpIDogJyc7XG5cbiAgICAgICAgaWYgKHBwcy5udW1lcmFsKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoJy4nLCBwcHMubnVtZXJhbERlY2ltYWxNYXJrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBwcy5wb3N0RGVsaW1pdGVyQmFja3NwYWNlID0gZmFsc2U7XG5cbiAgICAgICAgb3duZXIuZWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBvd25lci5vbklucHV0KHZhbHVlKTtcbiAgICB9LFxuXG4gICAgZ2V0UmF3VmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG93bmVyID0gdGhpcyxcbiAgICAgICAgICAgIHBwcyA9IG93bmVyLnByb3BlcnRpZXMsXG4gICAgICAgICAgICBVdGlsID0gQ2xlYXZlLlV0aWwsXG4gICAgICAgICAgICByYXdWYWx1ZSA9IG93bmVyLmVsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgaWYgKHBwcy5yYXdWYWx1ZVRyaW1QcmVmaXgpIHtcbiAgICAgICAgICAgIHJhd1ZhbHVlID0gVXRpbC5nZXRQcmVmaXhTdHJpcHBlZFZhbHVlKHJhd1ZhbHVlLCBwcHMucHJlZml4LCBwcHMucHJlZml4TGVuZ3RoLCBwcHMucmVzdWx0LCBwcHMuZGVsaW1pdGVyLCBwcHMuZGVsaW1pdGVycywgcHBzLm5vSW1tZWRpYXRlUHJlZml4LCBwcHMudGFpbFByZWZpeCwgcHBzLnNpZ25CZWZvcmVQcmVmaXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBwcy5udW1lcmFsKSB7XG4gICAgICAgICAgICByYXdWYWx1ZSA9IHBwcy5udW1lcmFsRm9ybWF0dGVyLmdldFJhd1ZhbHVlKHJhd1ZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJhd1ZhbHVlID0gVXRpbC5zdHJpcERlbGltaXRlcnMocmF3VmFsdWUsIHBwcy5kZWxpbWl0ZXIsIHBwcy5kZWxpbWl0ZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByYXdWYWx1ZTtcbiAgICB9LFxuXG4gICAgZ2V0SVNPRm9ybWF0RGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICByZXR1cm4gcHBzLmRhdGUgPyBwcHMuZGF0ZUZvcm1hdHRlci5nZXRJU09Gb3JtYXREYXRlKCkgOiAnJztcbiAgICB9LFxuXG4gICAgZ2V0SVNPRm9ybWF0VGltZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzLFxuICAgICAgICAgICAgcHBzID0gb3duZXIucHJvcGVydGllcztcblxuICAgICAgICByZXR1cm4gcHBzLnRpbWUgPyBwcHMudGltZUZvcm1hdHRlci5nZXRJU09Gb3JtYXRUaW1lKCkgOiAnJztcbiAgICB9LFxuXG4gICAgZ2V0Rm9ybWF0dGVkVmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9LFxuXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3duZXIgPSB0aGlzO1xuXG4gICAgICAgIG93bmVyLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBvd25lci5vbkNoYW5nZUxpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb3duZXIub25LZXlEb3duTGlzdGVuZXIpO1xuICAgICAgICBvd25lci5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgb3duZXIub25Gb2N1c0xpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjdXQnLCBvd25lci5vbkN1dExpc3RlbmVyKTtcbiAgICAgICAgb3duZXIuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjb3B5Jywgb3duZXIub25Db3B5TGlzdGVuZXIpO1xuICAgIH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJ1tDbGVhdmUgT2JqZWN0XSc7XG4gICAgfVxufTtcblxuQ2xlYXZlLk51bWVyYWxGb3JtYXR0ZXIgPSBOdW1lcmFsRm9ybWF0dGVyXzE7XG5DbGVhdmUuRGF0ZUZvcm1hdHRlciA9IERhdGVGb3JtYXR0ZXJfMTtcbkNsZWF2ZS5UaW1lRm9ybWF0dGVyID0gVGltZUZvcm1hdHRlcl8xO1xuQ2xlYXZlLlBob25lRm9ybWF0dGVyID0gUGhvbmVGb3JtYXR0ZXJfMTtcbkNsZWF2ZS5DcmVkaXRDYXJkRGV0ZWN0b3IgPSBDcmVkaXRDYXJkRGV0ZWN0b3JfMTtcbkNsZWF2ZS5VdGlsID0gVXRpbF8xO1xuQ2xlYXZlLkRlZmF1bHRQcm9wZXJ0aWVzID0gRGVmYXVsdFByb3BlcnRpZXNfMTtcblxuLy8gZm9yIGFuZ3VsYXIgZGlyZWN0aXZlXG4oKHR5cGVvZiBjb21tb25qc0dsb2JhbCA9PT0gJ29iamVjdCcgJiYgY29tbW9uanNHbG9iYWwpID8gY29tbW9uanNHbG9iYWwgOiB3aW5kb3cpWydDbGVhdmUnXSA9IENsZWF2ZTtcblxuLy8gQ29tbW9uSlNcbnZhciBDbGVhdmVfMSA9IENsZWF2ZTtcblxuZXhwb3J0IGRlZmF1bHQgQ2xlYXZlXzE7XG4iLCJpbXBvcnQgQ2xlYXZlIGZyb20gJ2NsZWF2ZS5qcyc7XG5cbmNsYXNzIE1hc2tEb2xsYXJzIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IGRvbGxhcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1qcz1cImRvbGxhcnNcIl0nKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZG9sbGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgbmV3IENsZWF2ZShkb2xsYXJzW2ldLCB7XG4gICAgICAgIG51bWVyYWw6IHRydWUsXG4gICAgICAgIG51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlOiAndGhvdXNhbmQnXG4gICAgICB9KTtcblxuICAgICAgZG9sbGFyc1tpXS5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZXZlbnQgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGxldCBwb3N0Zml4ID0gJyc7XG5cbiAgICAgICAgaWYgKGAke3ZhbHVlfWAuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgICAgICBsZXQgc3BsaXQgPSBgJHt2YWx1ZX1gLnNwbGl0KCcuJyk7XG5cbiAgICAgICAgICBwb3N0Zml4ID0gKHNwbGl0WzFdLmxlbmd0aCA9PSAxKSA/ICcwJyA6IHBvc3RmaXg7XG4gICAgICAgICAgcG9zdGZpeCA9IChzcGxpdFsxXS5sZW5ndGggPT0gMCkgPyAnMDAnIDogcG9zdGZpeDtcbiAgICAgICAgICB2YWx1ZSArPSBwb3N0Zml4O1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlICE9ICcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gJy4wMCc7XG4gICAgICAgIH1cblxuICAgICAgICBldmVudC50YXJnZXQudmFsdWUgPSB2YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNYXNrRG9sbGFycztcbiIsImltcG9ydCBDbGVhdmUgZnJvbSAnY2xlYXZlLmpzJztcblxuY2xhc3MgTWFza1Bob25lIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgbGV0IHBob25lcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWpzPVwidGVsXCJdJyk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBob25lcy5sZW5ndGg7IGkrKykge1xuICAgICAgbmV3IENsZWF2ZShwaG9uZXNbaV0sIHtcbiAgICAgICAgbnVtZXJpY09ubHk6IHRydWUsXG4gICAgICAgIGJsb2NrczogWzAsIDMsIDAsIDMsIDRdLFxuICAgICAgICBkZWxpbWl0ZXJzOiBbJygnLCAnKScsICcgJywgJy0nXVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1hc2tQaG9uZTtcbiIsInZhciBlPS9eKD86c3VibWl0fGJ1dHRvbnxpbWFnZXxyZXNldHxmaWxlKSQvaSx0PS9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGtleWdlbikvaSxuPS8oXFxbW15cXFtcXF1dKlxcXSkvZztmdW5jdGlvbiBhKGUsdCxhKXtpZih0Lm1hdGNoKG4pKSFmdW5jdGlvbiBlKHQsbixhKXtpZigwPT09bi5sZW5ndGgpcmV0dXJuIGE7dmFyIHI9bi5zaGlmdCgpLGw9ci5tYXRjaCgvXlxcWyguKz8pXFxdJC8pO2lmKFwiW11cIj09PXIpcmV0dXJuIHQ9dHx8W10sQXJyYXkuaXNBcnJheSh0KT90LnB1c2goZShudWxsLG4sYSkpOih0Ll92YWx1ZXM9dC5fdmFsdWVzfHxbXSx0Ll92YWx1ZXMucHVzaChlKG51bGwsbixhKSkpLHQ7aWYobCl7dmFyIGk9bFsxXSx1PStpO2lzTmFOKHUpPyh0PXR8fHt9KVtpXT1lKHRbaV0sbixhKToodD10fHxbXSlbdV09ZSh0W3VdLG4sYSl9ZWxzZSB0W3JdPWUodFtyXSxuLGEpO3JldHVybiB0fShlLGZ1bmN0aW9uKGUpe3ZhciB0PVtdLGE9bmV3IFJlZ0V4cChuKSxyPS9eKFteXFxbXFxdXSopLy5leGVjKGUpO2ZvcihyWzFdJiZ0LnB1c2goclsxXSk7bnVsbCE9PShyPWEuZXhlYyhlKSk7KXQucHVzaChyWzFdKTtyZXR1cm4gdH0odCksYSk7ZWxzZXt2YXIgcj1lW3RdO3I/KEFycmF5LmlzQXJyYXkocil8fChlW3RdPVtyXSksZVt0XS5wdXNoKGEpKTplW3RdPWF9cmV0dXJuIGV9ZnVuY3Rpb24gcihlLHQsbil7cmV0dXJuIG49KG49U3RyaW5nKG4pKS5yZXBsYWNlKC8oXFxyKT9cXG4vZyxcIlxcclxcblwiKSxuPShuPWVuY29kZVVSSUNvbXBvbmVudChuKSkucmVwbGFjZSgvJTIwL2csXCIrXCIpLGUrKGU/XCImXCI6XCJcIikrZW5jb2RlVVJJQ29tcG9uZW50KHQpK1wiPVwiK259ZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24obixsKXtcIm9iamVjdFwiIT10eXBlb2YgbD9sPXtoYXNoOiEhbH06dm9pZCAwPT09bC5oYXNoJiYobC5oYXNoPSEwKTtmb3IodmFyIGk9bC5oYXNoP3t9OlwiXCIsdT1sLnNlcmlhbGl6ZXJ8fChsLmhhc2g/YTpyKSxzPW4mJm4uZWxlbWVudHM/bi5lbGVtZW50czpbXSxjPU9iamVjdC5jcmVhdGUobnVsbCksbz0wO288cy5sZW5ndGg7KytvKXt2YXIgaD1zW29dO2lmKChsLmRpc2FibGVkfHwhaC5kaXNhYmxlZCkmJmgubmFtZSYmdC50ZXN0KGgubm9kZU5hbWUpJiYhZS50ZXN0KGgudHlwZSkpe3ZhciBwPWgubmFtZSxmPWgudmFsdWU7aWYoXCJjaGVja2JveFwiIT09aC50eXBlJiZcInJhZGlvXCIhPT1oLnR5cGV8fChoLmNoZWNrZWQ/XCJvblwiPT09aC52YWx1ZT9mPSEwOlwib2ZmXCI9PT1oLnZhbHVlJiYoZj0hMSk6Zj12b2lkIDApLGwuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWgudHlwZXx8aC5jaGVja2VkfHwoZj0hMSksXCJyYWRpb1wiPT09aC50eXBlJiYoY1toLm5hbWVdfHxoLmNoZWNrZWQ/aC5jaGVja2VkJiYoY1toLm5hbWVdPSEwKTpjW2gubmFtZV09ITEpLG51bGw9PWYmJlwicmFkaW9cIj09aC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIWYpY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWgudHlwZSlpPXUoaSxwLGYpO2Vsc2V7Zj1bXTtmb3IodmFyIHY9aC5vcHRpb25zLG09ITEsZD0wO2Q8di5sZW5ndGg7KytkKXt2YXIgeT12W2RdO3kuc2VsZWN0ZWQmJih5LnZhbHVlfHxsLmVtcHR5JiYheS52YWx1ZSkmJihtPSEwLGk9bC5oYXNoJiZcIltdXCIhPT1wLnNsaWNlKHAubGVuZ3RoLTIpP3UoaSxwK1wiW11cIix5LnZhbHVlKTp1KGkscCx5LnZhbHVlKSl9IW0mJmwuZW1wdHkmJihpPXUoaSxwLFwiXCIpKX19fWlmKGwuZW1wdHkpZm9yKHZhciBwIGluIGMpY1twXXx8KGk9dShpLHAsXCJcIikpO3JldHVybiBpfVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXgubWpzLm1hcFxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgRm9ybXMgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL2Zvcm1zL2Zvcm1zJztcbmltcG9ydCBzZXJpYWxpemUgZnJvbSAnZm9yLWNlcmlhbCc7XG5cbi8qKlxuICogQGNsYXNzICBUaGUgTmV3c2xldHRlciBtb2R1bGVcbiAqL1xuY2xhc3MgTmV3c2xldHRlciB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtICAge09iamVjdH0gIGVsZW1lbnQgIFRoZSBOZXdzbGV0dGVyIERPTSBPYmplY3RcbiAgICpcbiAgICogQHJldHVybiAge0NsYXNzfSAgICAgICAgICAgIFRoZSBpbnN0YW50aWF0ZWQgTmV3c2xldHRlciBvYmplY3RcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICB0aGlzLl9lbCA9IGVsZW1lbnQ7XG5cbiAgICB0aGlzLmtleXMgPSBOZXdzbGV0dGVyLmtleXM7XG5cbiAgICB0aGlzLmVuZHBvaW50cyA9IE5ld3NsZXR0ZXIuZW5kcG9pbnRzO1xuXG4gICAgdGhpcy5zZWxlY3RvcnMgPSBOZXdzbGV0dGVyLnNlbGVjdG9ycztcblxuICAgIHRoaXMuc2VsZWN0b3IgPSBOZXdzbGV0dGVyLnNlbGVjdG9yO1xuXG4gICAgdGhpcy5zdHJpbmdLZXlzID0gTmV3c2xldHRlci5zdHJpbmdLZXlzO1xuXG4gICAgdGhpcy5zdHJpbmdzID0gTmV3c2xldHRlci5zdHJpbmdzO1xuXG4gICAgdGhpcy50ZW1wbGF0ZXMgPSBOZXdzbGV0dGVyLnRlbXBsYXRlcztcblxuICAgIHRoaXMuY2xhc3NlcyA9IE5ld3NsZXR0ZXIuY2xhc3NlcztcblxuICAgIHRoaXMuY2FsbGJhY2sgPSBbXG4gICAgICBOZXdzbGV0dGVyLmNhbGxiYWNrLFxuICAgICAgTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnJlcGxhY2UoJzAuJywgJycpXG4gICAgXS5qb2luKCcnKTtcblxuICAgIC8vIFRoaXMgc2V0cyB0aGUgc2NyaXB0IGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGEgZ2xvYmFsIGZ1bmN0aW9uIHRoYXRcbiAgICAvLyBjYW4gYmUgYWNjZXNzZWQgYnkgdGhlIHRoZSByZXF1ZXN0ZWQgc2NyaXB0LlxuICAgIHdpbmRvd1t0aGlzLmNhbGxiYWNrXSA9IChkYXRhKSA9PiB7XG4gICAgICB0aGlzLl9jYWxsYmFjayhkYXRhKTtcbiAgICB9O1xuXG4gICAgdGhpcy5mb3JtID0gbmV3IEZvcm1zKHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKSk7XG5cbiAgICB0aGlzLmZvcm0uc3RyaW5ncyA9IHRoaXMuc3RyaW5ncztcblxuICAgIHRoaXMuZm9ybS5zdWJtaXQgPSAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHRoaXMuX3N1Ym1pdChldmVudClcbiAgICAgICAgLnRoZW4odGhpcy5fb25sb2FkKVxuICAgICAgICAuY2F0Y2godGhpcy5fb25lcnJvcik7XG4gICAgfTtcblxuICAgIHRoaXMuZm9ybS53YXRjaCgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGZvcm0gc3VibWlzc2lvbiBtZXRob2QuIFJlcXVlc3RzIGEgc2NyaXB0IHdpdGggYSBjYWxsYmFjayBmdW5jdGlvblxuICAgKiB0byBiZSBleGVjdXRlZCBvbiBvdXIgcGFnZS4gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpbGwgYmUgcGFzc2VkIHRoZVxuICAgKiByZXNwb25zZSBhcyBhIEpTT04gb2JqZWN0IChmdW5jdGlvbiBwYXJhbWV0ZXIpLlxuICAgKlxuICAgKiBAcGFyYW0gICB7RXZlbnR9ICAgIGV2ZW50ICBUaGUgZm9ybSBzdWJtaXNzaW9uIGV2ZW50XG4gICAqXG4gICAqIEByZXR1cm4gIHtQcm9taXNlfSAgICAgICAgIEEgcHJvbWlzZSBjb250YWluaW5nIHRoZSBuZXcgc2NyaXB0IGNhbGxcbiAgICovXG4gIF9zdWJtaXQoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgLy8gU2VyaWFsaXplIHRoZSBkYXRhXG4gICAgdGhpcy5fZGF0YSA9IHNlcmlhbGl6ZShldmVudC50YXJnZXQsIHtoYXNoOiB0cnVlfSk7XG5cbiAgICAvLyBTd2l0Y2ggdGhlIGFjdGlvbiB0byBwb3N0LWpzb24uIFRoaXMgY3JlYXRlcyBhbiBlbmRwb2ludCBmb3IgbWFpbGNoaW1wXG4gICAgLy8gdGhhdCBhY3RzIGFzIGEgc2NyaXB0IHRoYXQgY2FuIGJlIGxvYWRlZCBvbnRvIG91ciBwYWdlLlxuICAgIGxldCBhY3Rpb24gPSBldmVudC50YXJnZXQuYWN0aW9uLnJlcGxhY2UoXG4gICAgICBgJHt0aGlzLmVuZHBvaW50cy5NQUlOfT9gLCBgJHt0aGlzLmVuZHBvaW50cy5NQUlOX0pTT059P2BcbiAgICApO1xuXG4gICAgLy8gQWRkIG91ciBwYXJhbXMgdG8gdGhlIGFjdGlvblxuICAgIGFjdGlvbiA9IGFjdGlvbiArIHNlcmlhbGl6ZShldmVudC50YXJnZXQsIHtzZXJpYWxpemVyOiAoLi4ucGFyYW1zKSA9PiB7XG4gICAgICBsZXQgcHJldiA9ICh0eXBlb2YgcGFyYW1zWzBdID09PSAnc3RyaW5nJykgPyBwYXJhbXNbMF0gOiAnJztcblxuICAgICAgcmV0dXJuIGAke3ByZXZ9JiR7cGFyYW1zWzFdfT0ke3BhcmFtc1syXX1gO1xuICAgIH19KTtcblxuICAgIC8vIEFwcGVuZCB0aGUgY2FsbGJhY2sgcmVmZXJlbmNlLiBNYWlsY2hpbXAgd2lsbCB3cmFwIHRoZSBKU09OIHJlc3BvbnNlIGluXG4gICAgLy8gb3VyIGNhbGxiYWNrIG1ldGhvZC4gT25jZSB3ZSBsb2FkIHRoZSBzY3JpcHQgdGhlIGNhbGxiYWNrIHdpbGwgZXhlY3V0ZS5cbiAgICBhY3Rpb24gPSBgJHthY3Rpb259JmM9d2luZG93LiR7dGhpcy5jYWxsYmFja31gO1xuXG4gICAgLy8gQ3JlYXRlIGEgcHJvbWlzZSB0aGF0IGFwcGVuZHMgdGhlIHNjcmlwdCByZXNwb25zZSBvZiB0aGUgcG9zdC1qc29uIG1ldGhvZFxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgc2NyaXB0Lm9ubG9hZCA9IHJlc29sdmU7XG4gICAgICBzY3JpcHQub25lcnJvciA9IHJlamVjdDtcbiAgICAgIHNjcmlwdC5hc3luYyA9IHRydWU7XG4gICAgICBzY3JpcHQuc3JjID0gZW5jb2RlVVJJKGFjdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHNjcmlwdCBvbmxvYWQgcmVzb2x1dGlvblxuICAgKlxuICAgKiBAcGFyYW0gICB7RXZlbnR9ICBldmVudCAgVGhlIHNjcmlwdCBvbiBsb2FkIGV2ZW50XG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gICAgICAgICBUaGUgTmV3c2xldHRlciBjbGFzc1xuICAgKi9cbiAgX29ubG9hZChldmVudCkge1xuICAgIGV2ZW50LnBhdGhbMF0ucmVtb3ZlKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2NyaXB0IG9uIGVycm9yIHJlc29sdXRpb25cbiAgICpcbiAgICogQHBhcmFtICAge09iamVjdH0gIGVycm9yICBUaGUgc2NyaXB0IG9uIGVycm9yIGxvYWQgZXZlbnRcbiAgICpcbiAgICogQHJldHVybiAge0NsYXNzfSAgICAgICAgICBUaGUgTmV3c2xldHRlciBjbGFzc1xuICAgKi9cbiAgX29uZXJyb3IoZXJyb3IpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSBjb25zb2xlLmRpcihlcnJvcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIHRoZSBNYWlsQ2hpbXAgU2NyaXB0IGNhbGxcbiAgICpcbiAgICogQHBhcmFtICAge09iamVjdH0gIGRhdGEgIFRoZSBzdWNjZXNzL2Vycm9yIG1lc3NhZ2UgZnJvbSBNYWlsQ2hpbXBcbiAgICpcbiAgICogQHJldHVybiAge0NsYXNzfSAgICAgICAgVGhlIE5ld3NsZXR0ZXIgY2xhc3NcbiAgICovXG4gIF9jYWxsYmFjayhkYXRhKSB7XG4gICAgaWYgKHRoaXNbYF8ke2RhdGFbdGhpcy5fa2V5KCdNQ19SRVNVTFQnKV19YF0pIHtcbiAgICAgIHRoaXNbYF8ke2RhdGFbdGhpcy5fa2V5KCdNQ19SRVNVTFQnKV19YF0oZGF0YS5tc2cpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIGNvbnNvbGUuZGlyKGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pc3Npb24gZXJyb3IgaGFuZGxlclxuICAgKlxuICAgKiBAcGFyYW0gICB7c3RyaW5nfSAgbXNnICBUaGUgZXJyb3IgbWVzc2FnZVxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICBUaGUgTmV3c2xldHRlciBjbGFzc1xuICAgKi9cbiAgX2Vycm9yKG1zZykge1xuICAgIHRoaXMuX2VsZW1lbnRzUmVzZXQoKTtcbiAgICB0aGlzLl9tZXNzYWdpbmcoJ1dBUk5JTkcnLCBtc2cpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3VibWlzc2lvbiBzdWNjZXNzIGhhbmRsZXJcbiAgICpcbiAgICogQHBhcmFtICAge3N0cmluZ30gIG1zZyAgVGhlIHN1Y2Nlc3MgbWVzc2FnZVxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICBUaGUgTmV3c2xldHRlciBjbGFzc1xuICAgKi9cbiAgX3N1Y2Nlc3MobXNnKSB7XG4gICAgdGhpcy5fZWxlbWVudHNSZXNldCgpO1xuICAgIHRoaXMuX21lc3NhZ2luZygnU1VDQ0VTUycsIG1zZyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVzZW50IHRoZSByZXNwb25zZSBtZXNzYWdlIHRvIHRoZSB1c2VyXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICB0eXBlICBUaGUgbWVzc2FnZSB0eXBlXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBtc2cgICBUaGUgbWVzc2FnZVxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICAgTmV3c2xldHRlclxuICAgKi9cbiAgX21lc3NhZ2luZyh0eXBlLCBtc2cgPSAnbm8gbWVzc2FnZScpIHtcbiAgICBsZXQgc3RyaW5ncyA9IE9iamVjdC5rZXlzKHRoaXMuc3RyaW5nS2V5cyk7XG4gICAgbGV0IGhhbmRsZWQgPSBmYWxzZTtcblxuICAgIGxldCBhbGVydEJveCA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnNbdHlwZV0pO1xuXG4gICAgbGV0IGFsZXJ0Qm94TXNnID0gYWxlcnRCb3gucXVlcnlTZWxlY3RvcihcbiAgICAgIHRoaXMuc2VsZWN0b3JzLkFMRVJUX1RFWFRcbiAgICApO1xuXG4gICAgLy8gR2V0IHRoZSBsb2NhbGl6ZWQgc3RyaW5nLCB0aGVzZSBzaG91bGQgYmUgd3JpdHRlbiB0byB0aGUgRE9NIGFscmVhZHkuXG4gICAgLy8gVGhlIHV0aWxpdHkgY29udGFpbnMgYSBnbG9iYWwgbWV0aG9kIGZvciByZXRyaWV2aW5nIHRoZW0uXG4gICAgbGV0IHN0cmluZ0tleXMgPSBzdHJpbmdzLmZpbHRlcihzID0+IG1zZy5pbmNsdWRlcyh0aGlzLnN0cmluZ0tleXNbc10pKTtcbiAgICBtc2cgPSAoc3RyaW5nS2V5cy5sZW5ndGgpID8gdGhpcy5zdHJpbmdzW3N0cmluZ0tleXNbMF1dIDogbXNnO1xuICAgIGhhbmRsZWQgPSAoc3RyaW5nS2V5cy5sZW5ndGgpID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgLy8gUmVwbGFjZSBzdHJpbmcgdGVtcGxhdGVzIHdpdGggdmFsdWVzIGZyb20gZWl0aGVyIG91ciBmb3JtIGRhdGEgb3JcbiAgICAvLyB0aGUgTmV3c2xldHRlciBzdHJpbmdzIG9iamVjdC5cbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMudGVtcGxhdGVzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBsZXQgdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlc1t4XTtcbiAgICAgIGxldCBrZXkgPSB0ZW1wbGF0ZS5yZXBsYWNlKCd7eyAnLCAnJykucmVwbGFjZSgnIH19JywgJycpO1xuICAgICAgbGV0IHZhbHVlID0gdGhpcy5fZGF0YVtrZXldIHx8IHRoaXMuc3RyaW5nc1trZXldO1xuICAgICAgbGV0IHJlZyA9IG5ldyBSZWdFeHAodGVtcGxhdGUsICdnaScpO1xuXG4gICAgICBtc2cgPSBtc2cucmVwbGFjZShyZWcsICh2YWx1ZSkgPyB2YWx1ZSA6ICcnKTtcbiAgICB9XG5cbiAgICBpZiAoaGFuZGxlZCkge1xuICAgICAgYWxlcnRCb3hNc2cuaW5uZXJIVE1MID0gbXNnO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ0VSUk9SJykge1xuICAgICAgYWxlcnRCb3hNc2cuaW5uZXJIVE1MID0gdGhpcy5zdHJpbmdzLkVSUl9QTEVBU0VfVFJZX0xBVEVSO1xuICAgIH1cblxuICAgIGlmIChhbGVydEJveCkgdGhpcy5fZWxlbWVudFNob3coYWxlcnRCb3gsIGFsZXJ0Qm94TXNnKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBtYWluIHRvZ2dsaW5nIG1ldGhvZFxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICBOZXdzbGV0dGVyXG4gICAqL1xuICBfZWxlbWVudHNSZXNldCgpIHtcbiAgICBsZXQgdGFyZ2V0cyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5zZWxlY3RvcnMuQUxFUlRTKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0cy5sZW5ndGg7IGkrKylcbiAgICAgIGlmICghdGFyZ2V0c1tpXS5jbGFzc0xpc3QuY29udGFpbnModGhpcy5jbGFzc2VzLkhJRERFTikpIHtcbiAgICAgICAgdGFyZ2V0c1tpXS5jbGFzc0xpc3QuYWRkKHRoaXMuY2xhc3Nlcy5ISURERU4pO1xuXG4gICAgICAgIHRoaXMuY2xhc3Nlcy5BTklNQVRFLnNwbGl0KCcgJykuZm9yRWFjaCgoaXRlbSkgPT5cbiAgICAgICAgICB0YXJnZXRzW2ldLmNsYXNzTGlzdC5yZW1vdmUoaXRlbSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBTY3JlZW4gUmVhZGVyc1xuICAgICAgICB0YXJnZXRzW2ldLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICB0YXJnZXRzW2ldLnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuQUxFUlRfVEVYVClcbiAgICAgICAgICAuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAnb2ZmJyk7XG4gICAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbWFpbiB0b2dnbGluZyBtZXRob2RcbiAgICpcbiAgICogQHBhcmFtICAge29iamVjdH0gIHRhcmdldCAgIE1lc3NhZ2UgY29udGFpbmVyXG4gICAqIEBwYXJhbSAgIHtvYmplY3R9ICBjb250ZW50ICBDb250ZW50IHRoYXQgY2hhbmdlcyBkeW5hbWljYWxseSB0aGF0IHNob3VsZFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmUgYW5ub3VuY2VkIHRvIHNjcmVlbiByZWFkZXJzLlxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICAgICAgTmV3c2xldHRlclxuICAgKi9cbiAgX2VsZW1lbnRTaG93KHRhcmdldCwgY29udGVudCkge1xuICAgIHRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKHRoaXMuY2xhc3Nlcy5ISURERU4pO1xuXG4gICAgdGhpcy5jbGFzc2VzLkFOSU1BVEUuc3BsaXQoJyAnKS5mb3JFYWNoKChpdGVtKSA9PlxuICAgICAgdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoaXRlbSlcbiAgICApO1xuXG4gICAgLy8gU2NyZWVuIFJlYWRlcnNcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuXG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgIGNvbnRlbnQuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm94eSBmdW5jdGlvbiBmb3IgcmV0cmlldmluZyB0aGUgcHJvcGVyIGtleVxuICAgKlxuICAgKiBAcGFyYW0gICB7c3RyaW5nfSAga2V5ICBUaGUgcmVmZXJlbmNlIGZvciB0aGUgc3RvcmVkIGtleXMuXG4gICAqXG4gICAqIEByZXR1cm4gIHtzdHJpbmd9ICAgICAgIFRoZSBkZXNpcmVkIGtleS5cbiAgICovXG4gIF9rZXkoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMua2V5c1trZXldO1xuICB9XG59XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIEFQSSBkYXRhIGtleXMgKi9cbk5ld3NsZXR0ZXIua2V5cyA9IHtcbiAgTUNfUkVTVUxUOiAncmVzdWx0JyxcbiAgTUNfTVNHOiAnbXNnJ1xufTtcblxuLyoqIEB0eXBlICB7T2JqZWN0fSAgQVBJIGVuZHBvaW50cyAqL1xuTmV3c2xldHRlci5lbmRwb2ludHMgPSB7XG4gIE1BSU46ICcvcG9zdCcsXG4gIE1BSU5fSlNPTjogJy9wb3N0LWpzb24nXG59O1xuXG4vKiogQHR5cGUgIHtTdHJpbmd9ICBUaGUgTWFpbGNoaW1wIGNhbGxiYWNrIHJlZmVyZW5jZS4gKi9cbk5ld3NsZXR0ZXIuY2FsbGJhY2sgPSAnTmV3c2xldHRlckNhbGxiYWNrJztcblxuLyoqIEB0eXBlICB7T2JqZWN0fSAgRE9NIHNlbGVjdG9ycyBmb3IgdGhlIGluc3RhbmNlJ3MgY29uY2VybnMgKi9cbk5ld3NsZXR0ZXIuc2VsZWN0b3JzID0ge1xuICBFTEVNRU5UOiAnW2RhdGEtanM9XCJuZXdzbGV0dGVyXCJdJyxcbiAgQUxFUlRTOiAnW2RhdGEtanMqPVwiYWxlcnRcIl0nLFxuICBXQVJOSU5HOiAnW2RhdGEtanM9XCJhbGVydC13YXJuaW5nXCJdJyxcbiAgU1VDQ0VTUzogJ1tkYXRhLWpzPVwiYWxlcnQtc3VjY2Vzc1wiXScsXG4gIEFMRVJUX1RFWFQ6ICdbZGF0YS1qcy1hbGVydD1cInRleHRcIl0nXG59O1xuXG4vKiogQHR5cGUgIHtTdHJpbmd9ICBUaGUgbWFpbiBET00gc2VsZWN0b3IgZm9yIHRoZSBpbnN0YW5jZSAqL1xuTmV3c2xldHRlci5zZWxlY3RvciA9IE5ld3NsZXR0ZXIuc2VsZWN0b3JzLkVMRU1FTlQ7XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIFN0cmluZyByZWZlcmVuY2VzIGZvciB0aGUgaW5zdGFuY2UgKi9cbk5ld3NsZXR0ZXIuc3RyaW5nS2V5cyA9IHtcbiAgU1VDQ0VTU19DT05GSVJNX0VNQUlMOiAnQWxtb3N0IGZpbmlzaGVkLi4uJyxcbiAgRVJSX1BMRUFTRV9FTlRFUl9WQUxVRTogJ1BsZWFzZSBlbnRlciBhIHZhbHVlJyxcbiAgRVJSX1RPT19NQU5ZX1JFQ0VOVDogJ3RvbyBtYW55JyxcbiAgRVJSX0FMUkVBRFlfU1VCU0NSSUJFRDogJ2lzIGFscmVhZHkgc3Vic2NyaWJlZCcsXG4gIEVSUl9JTlZBTElEX0VNQUlMOiAnbG9va3MgZmFrZSBvciBpbnZhbGlkJ1xufTtcblxuLyoqIEB0eXBlICB7T2JqZWN0fSAgQXZhaWxhYmxlIHN0cmluZ3MgKi9cbk5ld3NsZXR0ZXIuc3RyaW5ncyA9IHtcbiAgVkFMSURfUkVRVUlSRUQ6ICdUaGlzIGZpZWxkIGlzIHJlcXVpcmVkLicsXG4gIFZBTElEX0VNQUlMX1JFUVVJUkVEOiAnRW1haWwgaXMgcmVxdWlyZWQuJyxcbiAgVkFMSURfRU1BSUxfSU5WQUxJRDogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGVtYWlsLicsXG4gIFZBTElEX0NIRUNLQk9YX0JPUk9VR0g6ICdQbGVhc2Ugc2VsZWN0IGEgYm9yb3VnaC4nLFxuICBFUlJfUExFQVNFX1RSWV9MQVRFUjogJ1RoZXJlIHdhcyBhbiBlcnJvciB3aXRoIHlvdXIgc3VibWlzc2lvbi4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4nLFxuICBTVUNDRVNTX0NPTkZJUk1fRU1BSUw6ICdBbG1vc3QgZmluaXNoZWQuLi4gV2UgbmVlZCB0byBjb25maXJtIHlvdXIgZW1haWwgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ2FkZHJlc3MuIFRvIGNvbXBsZXRlIHRoZSBzdWJzY3JpcHRpb24gcHJvY2VzcywgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3BsZWFzZSBjbGljayB0aGUgbGluayBpbiB0aGUgZW1haWwgd2UganVzdCBzZW50IHlvdS4nLFxuICBFUlJfUExFQVNFX0VOVEVSX1ZBTFVFOiAnUGxlYXNlIGVudGVyIGEgdmFsdWUnLFxuICBFUlJfVE9PX01BTllfUkVDRU5UOiAnUmVjaXBpZW50IFwie3sgRU1BSUwgfX1cIiBoYXMgdG9vICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAnbWFueSByZWNlbnQgc2lnbnVwIHJlcXVlc3RzJyxcbiAgRVJSX0FMUkVBRFlfU1VCU0NSSUJFRDogJ3t7IEVNQUlMIH19IGlzIGFscmVhZHkgc3Vic2NyaWJlZCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RvIGxpc3Qge3sgTElTVF9OQU1FIH19LicsXG4gIEVSUl9JTlZBTElEX0VNQUlMOiAnVGhpcyBlbWFpbCBhZGRyZXNzIGxvb2tzIGZha2Ugb3IgaW52YWxpZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAnUGxlYXNlIGVudGVyIGEgcmVhbCBlbWFpbCBhZGRyZXNzLicsXG4gIExJU1RfTkFNRTogJ05ld3NsZXR0ZXInXG59O1xuXG4vKiogQHR5cGUgIHtBcnJheX0gIFBsYWNlaG9sZGVycyB0aGF0IHdpbGwgYmUgcmVwbGFjZWQgaW4gbWVzc2FnZSBzdHJpbmdzICovXG5OZXdzbGV0dGVyLnRlbXBsYXRlcyA9IFtcbiAgJ3t7IEVNQUlMIH19JyxcbiAgJ3t7IExJU1RfTkFNRSB9fSdcbl07XG5cbk5ld3NsZXR0ZXIuY2xhc3NlcyA9IHtcbiAgQU5JTUFURTogJ2FuaW1hdGVkIGZhZGVJblVwJyxcbiAgSElEREVOOiAnaGlkZGVuJ1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTmV3c2xldHRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY2xhc3MgU2V0SGVpZ2h0UHJvcGVydGllcyB7XG4gIGNvbnN0cnVjdG9yIChzKSB7XG4gICAgdGhpcy5lbGVtZW50cyA9IChzLmVsZW1lbnRzKSA/IHMuZWxlbWVudHMgOiBTZXRIZWlnaHRQcm9wZXJ0aWVzLmVsZW1lbnRzO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLmVsZW1lbnRzW2ldWydzZWxlY3RvciddKSkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHRoaXMuc2V0UHJvcGVydHkodGhpcy5lbGVtZW50c1tpXSkpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gdGhpcy5zZXRQcm9wZXJ0eSh0aGlzLmVsZW1lbnRzW2ldKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkodGhpcy5lbGVtZW50c1tpXVsncHJvcGVydHknXSwgJzBweCcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldFByb3BlcnR5KGUpIHtcbiAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZVsnc2VsZWN0b3InXSk7XG5cbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoZVsncHJvcGVydHknXSwgYCR7ZWxlbWVudC5jbGllbnRIZWlnaHR9cHhgKTtcbiAgfVxufVxuXG5TZXRIZWlnaHRQcm9wZXJ0aWVzLmVsZW1lbnRzID0gW107XG5cbmV4cG9ydCBkZWZhdWx0IFNldEhlaWdodFByb3BlcnRpZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ3ljbGVzIHRocm91Z2ggYSBwcmVkZWZpbmVkIG9iamVjdCBvZiB0aGVtZSBjbGFzc25hbWVzIGFuZCB0b2dnbGVzIHRoZW0gb25cbiAqIHRoZSBkb2N1bWVudCBlbGVtZW50IGJhc2VkIG9uIGEgY2xpY2sgZXZlbnQuIFVzZXMgbG9jYWwgc3RvcmFnZSB0byBzYXZlIGFuZFxuICogcmVmZXIgdG8gYSB1c2VyJ3MgcHJlZmVyZW5jZSBiYXNlZCBvbiB0aGUgbGFzdCB0aGVtZSBzZWxlY3RlZC5cbiAqL1xuY2xhc3MgVGhlbWVzIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgcyAgVGhlIHNldHRpbmdzIG9iamVjdCwgbWF5IGluY2x1ZGUgJ3N0b3JhZ2UnLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgJ3NlbGVjdG9ycycsIG9yICd0aGVtZScgYXR0cmlidXRlc1xuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgVGhlIGNvbnN0cnVjdGVkIGluc3RhbmNlIG9mIFRoZW1lcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHMgPSB7fSkge1xuICAgIC8qKlxuICAgICAqIFNldHRpbmdzXG4gICAgICovXG5cbiAgICB0aGlzLnN0b3JhZ2UgPSAocy5oYXNPd25Qcm9wZXJ0eSgnc3RvcmFnZScpKSA/XG4gICAgICBPYmplY3QuYXNzaWduKFRoZW1lcy5zdG9yYWdlLCBzLnN0b3JhZ2UpIDogVGhlbWVzLnN0b3JhZ2U7XG5cbiAgICB0aGlzLnNlbGVjdG9ycyA9IChzLmhhc093blByb3BlcnR5KCdzZWxlY3RvcnMnKSkgP1xuICAgICAgT2JqZWN0LmFzc2lnbihUaGVtZXMuc2VsZWN0b3JzLCBzLnNlbGVjdG9ycykgOiBUaGVtZXMuc2VsZWN0b3JzO1xuXG4gICAgdGhpcy50aGVtZXMgPSAocy5oYXNPd25Qcm9wZXJ0eSgndGhlbWVzJykpID8gcy50aGVtZXMgOiBUaGVtZXMudGhlbWVzO1xuXG4gICAgdGhpcy5hZnRlciA9IChzLmhhc093blByb3BlcnR5KCdhZnRlcicpKSA/IHMuYWZ0ZXIgOiBUaGVtZXMuYWZ0ZXI7XG5cbiAgICB0aGlzLmJlZm9yZSA9IChzLmhhc093blByb3BlcnR5KCdiZWZvcmUnKSkgPyBzLmJlZm9yZSA6IFRoZW1lcy5iZWZvcmU7XG5cbiAgICAvKipcbiAgICAgKiBHZXQgaW5pdGlhbCB1c2VyIHByZWZlcmVuY2VcbiAgICAgKi9cblxuICAgIHRoaXMucHJlZmVyZW5jZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMuc3RvcmFnZS5USEVNRSk7XG5cbiAgICBpZiAodGhpcy5wcmVmZXJlbmNlKVxuICAgICAgdGhpcy5zZXQoSlNPTi5wYXJzZSh0aGlzLnByZWZlcmVuY2UpKTtcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBsaXN0ZW5lcnNcbiAgICAgKi9cblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXModGhpcy5zZWxlY3RvcnMuVE9HR0xFKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLnRhcmdldCA9IGV2ZW50LnRhcmdldDtcblxuICAgICAgdGhpcy5iZWZvcmUodGhpcyk7XG5cbiAgICAgIHRoaXMuY2xpY2soZXZlbnQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGNsaWNrIGhhbmRsZXIgZm9yIHRoZW1lIGN5Y2xpbmcuXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBldmVudCAgVGhlIG9yaWdpbmFsIGNsaWNrIGV2ZW50IHRoYXQgaW52b2tlZCB0aGUgbWV0aG9kXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gICAgICAgICAgVGhlIFRoZW1lcyBpbnN0YW5jZVxuICAgKi9cbiAgY2xpY2soZXZlbnQpIHtcbiAgICAvLyBHZXQgYXZhaWxhYmxlIHRoZW1lIGNsYXNzbmFtZXNcbiAgICBsZXQgY3ljbGUgPSB0aGlzLnRoZW1lcy5tYXAodCA9PiB0LmNsYXNzbmFtZSk7XG5cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGRvY3VtZW50IGhhcyBhbnkgb2YgdGhlIHRoZW1lIGNsYXNzIHNldHRpbmdzIGFscmVhZHlcbiAgICBsZXQgaW50ZXJzZWN0aW9uID0gY3ljbGUuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgcmV0dXJuIFsuLi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0XS5pbmNsdWRlcyhpdGVtKVxuICAgIH0pO1xuXG4gICAgLy8gRmluZCB0aGUgc3RhcnRpbmcgaW5kZXhcbiAgICBsZXQgc3RhcnQgPSAoaW50ZXJzZWN0aW9uLmxlbmd0aCA9PT0gMCkgPyAwIDogY3ljbGUuaW5kZXhPZihpbnRlcnNlY3Rpb25bMF0pO1xuICAgIGxldCB0aGVtZSA9ICh0eXBlb2YgY3ljbGVbc3RhcnQgKyAxXSA9PT0gJ3VuZGVmaW5lZCcpID8gY3ljbGVbMF0gOiBjeWNsZVtzdGFydCArIDFdO1xuXG4gICAgLy8gVG9nZ2xlIGVsZW1lbnRzXG4gICAgdGhpcy5yZW1vdmUodGhpcy50aGVtZXMuZmluZCh0ID0+IHQuY2xhc3NuYW1lID09PSBjeWNsZVtzdGFydF0pKVxuICAgICAgLnNldCh0aGlzLnRoZW1lcy5maW5kKHQgPT4gdC5jbGFzc25hbWUgPT09IHRoZW1lKSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcmVtb3ZlIG1ldGhvZCBmb3IgdGhlIHRoZW1lLiBSZXNldHMgYWxsIGVsZW1lbnQgY2xhc3NlcyBhbmQgbG9jYWwgc3RvcmFnZS5cbiAgICpcbiAgICogQHBhcmFtICAge09iamVjdH0gIHRoZW1lICBUaGUgdGhlbWUgdG8gcmVtb3ZlXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gICAgICAgICAgVGhlIFRoZW1lcyBpbnN0YW5jZVxuICAgKi9cbiAgcmVtb3ZlKHRoZW1lKSB7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodGhlbWUuY2xhc3NuYW1lKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5zZWxlY3RvcnMuVE9HR0xFKVxuICAgICAgLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShgJHt0aGVtZS5jbGFzc25hbWV9JHt0aGlzLnNlbGVjdG9ycy5BQ1RJVkV9YCk7XG4gICAgICB9KTtcblxuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMuc3RvcmFnZS5USEVNRSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2V0dGVyIG1ldGhvZCBmb3IgdGhlbWUuIEFkZHMgZWxlbWVudCBjbGFzc2VzIGFuZCBzZXRzIGxvY2FsIHN0b3JhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICB0aGVtZSAgVGhlIHRoZW1lIG9iamVjdCBpbmNsdWRpbmcgY2xhc3NuYW1lIGFuZCBsYWJlbFxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICAgIFRoZSBUaGVtZXMgaW5zdGFuY2VcbiAgICovXG4gIHNldCh0aGVtZSkge1xuICAgIHRoaXMudGhlbWUgPSB0aGVtZTtcblxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMudGhlbWUuY2xhc3NuYW1lKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5zZWxlY3RvcnMuVE9HR0xFKVxuICAgICAgLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChgJHt0aGlzLnRoZW1lLmNsYXNzbmFtZX0ke3RoaXMuc2VsZWN0b3JzLkFDVElWRX1gKTtcbiAgICAgIH0pO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLnNlbGVjdG9ycy5MQUJFTClcbiAgICAgIC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gdGhpcy50aGVtZS5sYWJlbDtcbiAgICAgIH0pO1xuXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5zdG9yYWdlLlRIRU1FLCBKU09OLnN0cmluZ2lmeSh0aGVtZSkpO1xuXG4gICAgdGhpcy5hZnRlcih0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59O1xuXG4vKipcbiAqIFRoZSBzdG9yYWdlIGtleXMgdXNlZCBieSB0aGUgc2NyaXB0IGZvciBsb2NhbCBzdG9yYWdlLiBUaGUgZGVmYXVsdCBpc1xuICogYC0tbnljby10aGVtZWAgZm9yIHRoZSB0aGVtZSBwcmVmZXJlbmNlLlxuICpcbiAqIEB2YXIge09iamVjdH1cbiAqL1xuVGhlbWVzLnN0b3JhZ2UgPSB7XG4gIFRIRU1FOiAnLS1ueWNvLXRoZW1lJ1xufTtcblxuLyoqXG4gKiBUaGUgc2VsZWN0b3JzIGZvciB2YXJpb3VzIGVsZW1lbnRzIHF1ZXJpZWQgYnkgdGhlIHV0aWxpdHkuIFJlZmVyIHRvIHRoZVxuICogc291cmNlIGZvciBkZWZhdWx0cy5cbiAqXG4gKiBAdmFyIHtPYmplY3R9XG4gKi9cblRoZW1lcy5zZWxlY3RvcnMgPSB7XG4gIFRPR0dMRTogJ1tkYXRhLWpzPVwidGhlbWVzXCJdJyxcbiAgTEFCRUw6ICdbZGF0YS1qcy10aGVtZXM9XCJsYWJlbFwiXScsXG4gIEFDVElWRTogJzphY3RpdmUnXG59O1xuXG4vKipcbiAqIFRoZSBwcmVkZWZpbmVkIHRoZW1lIE9iamVjdHMgdG8gY3ljbGUgdGhyb3VnaCwgZWFjaCB3aXRoIGEgY29ycmVzcG9uZGluZ1xuICogaHVtYW4tcmVhZGFibGUgdGV4dCBsYWJlbCBhbmQgY2xhc3NuYW1lLiBUaGUgZGVmYXVsdCBpbmNsdWRlcyB0d28gdGhlbWVzO1xuICogYGRlZmF1bHRgIGxhYmVsbGVkIFwiTGlnaHRcIiB0aGVtZSBhbmQgYGRhcmtgIGxhYmVsbGVkIFwiRGFya1wiLlxuICpcbiAqIEB2YXIge0FycmF5fVxuICovXG5UaGVtZXMudGhlbWVzID0gW1xuICB7XG4gICAgbGFiZWw6ICdMaWdodCcsXG4gICAgY2xhc3NuYW1lOiAnZGVmYXVsdCdcbiAgfSxcbiAge1xuICAgIGxhYmVsOiAnRGFyaycsXG4gICAgY2xhc3NuYW1lOiAnZGFyaydcbiAgfVxuXTtcblxuLyoqXG4gKiBCZWZvcmUgaG9va1xuICpcbiAqIEByZXR1cm4gIHtGdW5jdGlvbn0gIFRyaWdnZXJzIGJlZm9yZSB0aGUgY2xpY2sgZXZlbnQuXG4gKi9cblRoZW1lcy5iZWZvcmUgPSAoKSA9PiB7fTtcblxuLyoqXG4gKiBBZnRlciBob29rXG4gKlxuICogQHJldHVybiAge0Z1bmN0aW9ufSAgVHJpZ2dlcnMgYWZ0ZXIgdGhlIGNsaWNrIGV2ZW50LlxuICovXG5UaGVtZXMuYWZ0ZXIgPSAoKSA9PiB7fTtcblxuZXhwb3J0IGRlZmF1bHQgVGhlbWVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRyYWNraW5nIGJ1cyBmb3IgR29vZ2xlIGFuYWx5dGljcyBhbmQgV2VidHJlbmRzLlxuICovXG5jbGFzcyBUcmFjayB7XG4gIGNvbnN0cnVjdG9yKHMpIHtcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuXG4gICAgcyA9ICghcykgPyB7fSA6IHM7XG5cbiAgICB0aGlzLl9zZXR0aW5ncyA9IHtcbiAgICAgIHNlbGVjdG9yOiAocy5zZWxlY3RvcikgPyBzLnNlbGVjdG9yIDogVHJhY2suc2VsZWN0b3IsXG4gICAgfTtcblxuICAgIHRoaXMuZGVzaW5hdGlvbnMgPSBUcmFjay5kZXN0aW5hdGlvbnM7XG5cbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKHRoaXMuX3NldHRpbmdzLnNlbGVjdG9yKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICBsZXQga2V5ID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQudHJhY2tLZXk7XG4gICAgICBsZXQgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQudGFyZ2V0LmRhdGFzZXQudHJhY2tEYXRhKTtcblxuICAgICAgdGhpcy50cmFjayhrZXksIGRhdGEpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVHJhY2tpbmcgZnVuY3Rpb24gd3JhcHBlclxuICAgKlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAga2V5ICAgVGhlIGtleSBvciBldmVudCBvZiB0aGUgZGF0YVxuICAgKiBAcGFyYW0gIHtDb2xsZWN0aW9ufSAgZGF0YSAgVGhlIGRhdGEgdG8gdHJhY2tcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgIFRoZSBmaW5hbCBkYXRhIG9iamVjdFxuICAgKi9cbiAgdHJhY2soa2V5LCBkYXRhKSB7XG4gICAgLy8gU2V0IHRoZSBwYXRoIG5hbWUgYmFzZWQgb24gdGhlIGxvY2F0aW9uXG4gICAgY29uc3QgZCA9IGRhdGEubWFwKGVsID0+IHtcbiAgICAgICAgaWYgKGVsLmhhc093blByb3BlcnR5KFRyYWNrLmtleSkpXG4gICAgICAgICAgZWxbVHJhY2sua2V5XSA9IGAke3dpbmRvdy5sb2NhdGlvbi5wYXRobmFtZX0vJHtlbFtUcmFjay5rZXldfWBcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgfSk7XG5cbiAgICBsZXQgd3QgPSB0aGlzLndlYnRyZW5kcyhrZXksIGQpO1xuICAgIGxldCBnYSA9IHRoaXMuZ3RhZyhrZXksIGQpO1xuXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKVxuICAgICAgY29uc29sZS5kaXIoeydUcmFjayc6IFt3dCwgZ2FdfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG5cbiAgICByZXR1cm4gZDtcbiAgfTtcblxuICAvKipcbiAgICogRGF0YSBidXMgZm9yIHRyYWNraW5nIHZpZXdzIGluIFdlYnRyZW5kcyBhbmQgR29vZ2xlIEFuYWx5dGljc1xuICAgKlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgYXBwICAgVGhlIG5hbWUgb2YgdGhlIFNpbmdsZSBQYWdlIEFwcGxpY2F0aW9uIHRvIHRyYWNrXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICAgICBrZXkgICBUaGUga2V5IG9yIGV2ZW50IG9mIHRoZSBkYXRhXG4gICAqIEBwYXJhbSAge0NvbGxlY3Rpb259ICBkYXRhICBUaGUgZGF0YSB0byB0cmFja1xuICAgKi9cbiAgdmlldyhhcHAsIGtleSwgZGF0YSkge1xuICAgIGxldCB3dCA9IHRoaXMud2VidHJlbmRzKGtleSwgZGF0YSk7XG4gICAgbGV0IGdhID0gdGhpcy5ndGFnVmlldyhhcHAsIGtleSk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpXG4gICAgICBjb25zb2xlLmRpcih7J1RyYWNrJzogW3d0LCBnYV19KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgfTtcblxuICAvKipcbiAgICogUHVzaCBFdmVudHMgdG8gV2VidHJlbmRzXG4gICAqXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICAgICBrZXkgICBUaGUga2V5IG9yIGV2ZW50IG9mIHRoZSBkYXRhXG4gICAqIEBwYXJhbSAge0NvbGxlY3Rpb259ICBkYXRhICBUaGUgZGF0YSB0byB0cmFja1xuICAgKi9cbiAgd2VidHJlbmRzKGtleSwgZGF0YSkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBXZWJ0cmVuZHMgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICB0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICF0aGlzLmRlc2luYXRpb25zLmluY2x1ZGVzKCd3ZWJ0cmVuZHMnKVxuICAgIClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBldmVudCA9IFt7XG4gICAgICAnV1QudGknOiBrZXlcbiAgICB9XTtcblxuICAgIGlmIChkYXRhWzBdICYmIGRhdGFbMF0uaGFzT3duUHJvcGVydHkoVHJhY2sua2V5KSlcbiAgICAgIGV2ZW50LnB1c2goe1xuICAgICAgICAnRENTLmRjc3VyaSc6IGRhdGFbMF1bVHJhY2sua2V5XVxuICAgICAgfSk7XG4gICAgZWxzZVxuICAgICAgT2JqZWN0LmFzc2lnbihldmVudCwgZGF0YSk7XG5cbiAgICAvLyBGb3JtYXQgZGF0YSBmb3IgV2VidHJlbmRzXG4gICAgbGV0IHd0ZCA9IHthcmdzYTogZXZlbnQuZmxhdE1hcChlID0+IHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlKS5mbGF0TWFwKGsgPT4gW2ssIGVba11dKTtcbiAgICB9KX07XG5cbiAgICAvLyBJZiAnYWN0aW9uJyBpcyB1c2VkIGFzIHRoZSBrZXkgKGZvciBndGFnLmpzKSwgc3dpdGNoIGl0IHRvIFdlYnRyZW5kc1xuICAgIGxldCBhY3Rpb24gPSBkYXRhLmFyZ3NhLmluZGV4T2YoJ2FjdGlvbicpO1xuXG4gICAgaWYgKGFjdGlvbikgZGF0YS5hcmdzYVthY3Rpb25dID0gJ0RDUy5kY3N1cmknO1xuXG4gICAgLy8gV2VidHJlbmRzIGRvZXNuJ3Qgc2VuZCB0aGUgcGFnZSB2aWV3IGZvciBNdWx0aVRyYWNrLCBhZGQgcGF0aCB0byB1cmxcbiAgICBsZXQgZGNzdXJpID0gZGF0YS5hcmdzYS5pbmRleE9mKCdEQ1MuZGNzdXJpJyk7XG5cbiAgICBpZiAoZGNzdXJpKVxuICAgICAgZGF0YS5hcmdzYVtkY3N1cmkgKyAxXSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGRhdGEuYXJnc2FbZGNzdXJpICsgMV07XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuICAgIGlmICh0eXBlb2YgV2VidHJlbmRzICE9PSAndW5kZWZpbmVkJylcbiAgICAgIFdlYnRyZW5kcy5tdWx0aVRyYWNrKHd0ZCk7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cblxuICAgIHJldHVybiBbJ1dlYnRyZW5kcycsIHd0ZF07XG4gIH07XG5cbiAgLyoqXG4gICAqIFB1c2ggQ2xpY2sgRXZlbnRzIHRvIEdvb2dsZSBBbmFseXRpY3NcbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgICAgIGtleSAgIFRoZSBrZXkgb3IgZXZlbnQgb2YgdGhlIGRhdGFcbiAgICogQHBhcmFtICB7Q29sbGVjdGlvbn0gIGRhdGEgIFRoZSBkYXRhIHRvIHRyYWNrXG4gICAqL1xuICBndGFnKGtleSwgZGF0YSkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBndGFnID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgdHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAhdGhpcy5kZXNpbmF0aW9ucy5pbmNsdWRlcygnZ3RhZycpXG4gICAgKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHVyaSA9IGRhdGEuZmluZCgoZWxlbWVudCkgPT4gZWxlbWVudC5oYXNPd25Qcm9wZXJ0eShUcmFjay5rZXkpKTtcblxuICAgIGxldCBldmVudCA9IHtcbiAgICAgICdldmVudF9jYXRlZ29yeSc6IGtleVxuICAgIH07XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuICAgIGd0YWcoVHJhY2sua2V5LCB1cmlbVHJhY2sua2V5XSwgZXZlbnQpO1xuICAgIC8qIGVzbGludC1lbmFibGUgbm8tdW5kZWYgKi9cblxuICAgIHJldHVybiBbJ2d0YWcnLCBUcmFjay5rZXksIHVyaVtUcmFjay5rZXldLCBldmVudF07XG4gIH07XG5cbiAgLyoqXG4gICAqIFB1c2ggU2NyZWVuIFZpZXcgRXZlbnRzIHRvIEdvb2dsZSBBbmFseXRpY3NcbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgYXBwICBUaGUgbmFtZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICogQHBhcmFtICB7U3RyaW5nfSAga2V5ICBUaGUga2V5IG9yIGV2ZW50IG9mIHRoZSBkYXRhXG4gICAqL1xuICBndGFnVmlldyhhcHAsIGtleSkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBndGFnID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgdHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAhdGhpcy5kZXNpbmF0aW9ucy5pbmNsdWRlcygnZ3RhZycpXG4gICAgKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHZpZXcgPSB7XG4gICAgICBhcHBfbmFtZTogYXBwLFxuICAgICAgc2NyZWVuX25hbWU6IGtleVxuICAgIH07XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuICAgIGd0YWcoJ2V2ZW50JywgJ3NjcmVlbl92aWV3Jywgdmlldyk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby11bmRlZiAqL1xuXG4gICAgcmV0dXJuIFsnZ3RhZycsIFRyYWNrLmtleSwgJ3NjcmVlbl92aWV3Jywgdmlld107XG4gIH07XG59XG5cbi8qKiBAdHlwZSB7U3RyaW5nfSBUaGUgbWFpbiBzZWxlY3RvciB0byBhZGQgdGhlIHRyYWNraW5nIGZ1bmN0aW9uIHRvICovXG5UcmFjay5zZWxlY3RvciA9ICdbZGF0YS1qcyo9XCJ0cmFja1wiXSc7XG5cbi8qKiBAdHlwZSB7U3RyaW5nfSBUaGUgbWFpbiBldmVudCB0cmFja2luZyBrZXkgdG8gbWFwIHRvIFdlYnRyZW5kcyBEQ1MudXJpICovXG5UcmFjay5rZXkgPSAnZXZlbnQnO1xuXG4vKiogQHR5cGUge0FycmF5fSBXaGF0IGRlc3RpbmF0aW9ucyB0byBwdXNoIGRhdGEgdG8gKi9cblRyYWNrLmRlc3RpbmF0aW9ucyA9IFtcbiAgJ3dlYnRyZW5kcycsXG4gICdndGFnJ1xuXTtcblxuZXhwb3J0IGRlZmF1bHQgVHJhY2s7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgdGhlIG5hdmlnYXRvci5zaGFyZSgpIEFQSVxuICovXG5jbGFzcyBXZWJTaGFyZSB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKHMgPSB7fSkge1xuICAgIHRoaXMuc2VsZWN0b3IgPSAocy5zZWxlY3RvcikgPyBzLnNlbGVjdG9yIDogV2ViU2hhcmUuc2VsZWN0b3I7XG5cbiAgICB0aGlzLmNhbGxiYWNrID0gKHMuY2FsbGJhY2spID8gcy5jYWxsYmFjayA6IFdlYlNoYXJlLmNhbGxiYWNrO1xuXG4gICAgdGhpcy5mYWxsYmFjayA9IChzLmZhbGxiYWNrKSA/IHMuZmFsbGJhY2sgOiBXZWJTaGFyZS5mYWxsYmFjaztcblxuICAgIHRoaXMuZmFsbGJhY2tDb25kaXRpb24gPSAocy5mYWxsYmFja0NvbmRpdGlvbikgPyBzLmZhbGxiYWNrQ29uZGl0aW9uIDogV2ViU2hhcmUuZmFsbGJhY2tDb25kaXRpb247XG5cbiAgICBpZiAodGhpcy5mYWxsYmFja0NvbmRpdGlvbigpKSB7XG4gICAgICAvLyBSZW1vdmUgZmFsbGJhY2sgYXJpYSB0b2dnbGluZyBhdHRyaWJ1dGVzXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuc2VsZWN0b3IpLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGl0ZW0ucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJyk7XG4gICAgICAgIGl0ZW0ucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJyk7XG4gICAgICB9KTtcblxuICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciB0aGUgc2hhcmUgY2xpY2tcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKCFldmVudC50YXJnZXQubWF0Y2hlcyh0aGlzLnNlbGVjdG9yKSlcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuXG4gICAgICAgIHRoaXMuZGF0YSA9IEpTT04ucGFyc2UodGhpcy5lbGVtZW50LmRhdGFzZXQud2ViU2hhcmUpO1xuXG4gICAgICAgIHRoaXMuc2hhcmUodGhpcy5kYXRhKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZVxuICAgICAgdGhpcy5mYWxsYmFjaygpOyAvLyBFeGVjdXRlIHRoZSBmYWxsYmFja1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogV2ViIFNoYXJlIEFQSSBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBkYXRhICBBbiBvYmplY3QgY29udGFpbmluZyB0aXRsZSwgdXJsLCBhbmQgdGV4dC5cbiAgICpcbiAgICogQHJldHVybiAge1Byb21pc2V9ICAgICAgIFRoZSByZXNwb25zZSBvZiB0aGUgLnNoYXJlKCkgbWV0aG9kLlxuICAgKi9cbiAgc2hhcmUoZGF0YSA9IHt9KSB7XG4gICAgcmV0dXJuIG5hdmlnYXRvci5zaGFyZShkYXRhKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgdGhpcy5jYWxsYmFjayhkYXRhKTtcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKVxuICAgICAgICAgIGNvbnNvbGUuZGlyKGVycik7XG4gICAgICB9KTtcbiAgfVxufVxuXG4vKiogVGhlIGh0bWwgc2VsZWN0b3IgZm9yIHRoZSBjb21wb25lbnQgKi9cbldlYlNoYXJlLnNlbGVjdG9yID0gJ1tkYXRhLWpzKj1cIndlYi1zaGFyZVwiXSc7XG5cbi8qKiBQbGFjZWhvbGRlciBjYWxsYmFjayBmb3IgYSBzdWNjZXNzZnVsIHNlbmQgKi9cbldlYlNoYXJlLmNhbGxiYWNrID0gKCkgPT4ge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJylcbiAgICBjb25zb2xlLmRpcignU3VjY2VzcyEnKTtcbn07XG5cbi8qKiBQbGFjZWhvbGRlciBmb3IgdGhlIFdlYlNoYXJlIGZhbGxiYWNrICovXG5XZWJTaGFyZS5mYWxsYmFjayA9ICgpID0+IHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpXG4gICAgY29uc29sZS5kaXIoJ0ZhbGxiYWNrIScpO1xufTtcblxuLyoqIENvbmRpdGlvbmFsIGZ1bmN0aW9uIGZvciB0aGUgV2ViIFNoYXJlIGZhbGxiYWNrICovXG5XZWJTaGFyZS5mYWxsYmFja0NvbmRpdGlvbiA9ICgpID0+IHtcbiAgcmV0dXJuIG5hdmlnYXRvci5zaGFyZTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdlYlNoYXJlO1xuIiwiLyoqXG4gKiBAY2xhc3MgIFNldCB0aGUgdGhlIGNzcyB2YXJpYWJsZSAnLS0xMDB2aCcgdG8gdGhlIHNpemUgb2YgdGhlIFdpbmRvdydzIGlubmVyIGhlaWdodC5cbiAqL1xuY2xhc3MgV2luZG93Vmgge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yICBTZXQgZXZlbnQgbGlzdGVuZXJzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzID0ge30pIHtcbiAgICB0aGlzLnByb3BlcnR5ID0gKHMucHJvcGVydHkpID8gcy5wcm9wZXJ0eSA6IFdpbmRvd1ZoLnByb3BlcnR5O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7dGhpcy5zZXQoKX0pO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHt0aGlzLnNldCgpfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjc3MgdmFyaWFibGUgcHJvcGVydHlcbiAgICovXG4gIHNldCgpIHtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGVcbiAgICAgIC5zZXRQcm9wZXJ0eSh0aGlzLnByb3BlcnR5LCBgJHt3aW5kb3cuaW5uZXJIZWlnaHR9cHhgKTtcbiAgfVxufVxuXG4vKiogQHBhcmFtICB7U3RyaW5nfSAgcHJvcGVydHkgIFRoZSBjc3MgdmFyaWFibGUgc3RyaW5nIHRvIHNldCAqL1xuV2luZG93VmgucHJvcGVydHkgPSAnLS0xMDB2aCc7XG5cbmV4cG9ydCBkZWZhdWx0IFdpbmRvd1ZoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jbGFzcyBDb2RlSGlnaGxpZ2h0IHtcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIEhpZ2hsaWdodC5qc1xuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgSW5zdGFuY2Ugb2YgQ29kZVxuICAgKi9cbiAgY29uc3RydWN0b3IocyA9IHt9KSB7XG4gICAgdGhpcy5saW5rID0gKHMuaGFzT3duUHJvcGVydHkoJ2xpbmsnKSkgPyBzLmxpbmsgOiBDb2RlSGlnaGxpZ2h0Lmxpbms7XG5cbiAgICB0aGlzLnNjcmlwdCA9IChzLmhhc093blByb3BlcnR5KCdzY3JpcHQnKSkgPyBzLnNjcmlwdCA6IENvZGVIaWdobGlnaHQuc2NyaXB0O1xuXG4gICAgdGhpcy5zeW50YXggPSAocy5oYXNPd25Qcm9wZXJ0eSgnc3ludGF4JykpID8gcy5zeW50YXggOiBDb2RlSGlnaGxpZ2h0LnN5bnRheDtcblxuICAgIHRoaXMuY2FsbGJhY2sgPSAocy5oYXNPd25Qcm9wZXJ0eSgnY2FsbGJhY2snKSkgPyBzLmNhbGxiYWNrIDogQ29kZUhpZ2hsaWdodC5jYWxsYmFjaztcblxuICAgIC8qKlxuICAgICAqIExpbmtcbiAgICAgKi9cblxuICAgIGlmICh0aGlzLmxpbmspIHtcbiAgICAgIGxldCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuXG4gICAgICBsaW5rLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICAgIGxpbmsuc2V0QXR0cmlidXRlKCdocmVmJywgdGhpcy5saW5rKTtcblxuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY3JpcHRcbiAgICAgKi9cblxuICAgIGlmICh0aGlzLnNjcmlwdCkge1xuICAgICAgbGV0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgICBzY3JpcHQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvamF2YXNjcmlwdCcpO1xuICAgICAgc2NyaXB0LnNldEF0dHJpYnV0ZSgnc3JjJywgdGhpcy5zY3JpcHQpO1xuXG4gICAgICBzY3JpcHQub25sb2FkID0gKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jYWxsYmFjaykge1xuICAgICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5zeW50YXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vKiogQHZhciAge1N0cmluZ30gIGxpbmsgIENETiBmb3IgdGhlIGhpZ2h0bGlnaHQuanMgQ1NTICovXG5Db2RlSGlnaGxpZ2h0LmxpbmsgPSAnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL2hpZ2hsaWdodGpzL2Nkbi1yZWxlYXNlQDkuMTguMS9idWlsZC9zdHlsZXMvZGVmYXVsdC5taW4uY3NzJztcblxuLyoqIEB2YXIgIHtTdHJpbmd9ICBzY3JpcHQgIENETiBmb3IgdGhlIGhpZ2h0bGlnaHQuanMgU2NyaXB0ICovXG5Db2RlSGlnaGxpZ2h0LnNjcmlwdCA9ICdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvZ2gvaGlnaGxpZ2h0anMvY2RuLXJlbGVhc2VAOS4xOC4xL2J1aWxkL2hpZ2hsaWdodC5taW4uanMnO1xuXG5Db2RlSGlnaGxpZ2h0LnN5bnRheCA9IFsnaHRtbCcsICdqYXZhc2NyaXB0JywgJ2NzcycsICdzYXNzJ107XG5cbi8qKiBAdmFyICB7RnVuY3Rpb259ICBjYWxsYmFjayAgTWV0aG9kIHRvIGV4ZWN1dGUgd2hlbiB0aGUgaGlnaGxpZ2h0LmpzIHNjcmlwdCBsb2FkcyAqL1xuQ29kZUhpZ2hsaWdodC5jYWxsYmFjayA9IGZ1bmN0aW9uKHN5bnRheCkge1xuICBobGpzLmNvbmZpZ3VyZSh7XG4gICAgbGFuZ3VhZ2VzOiBzeW50YXhcbiAgfSk7XG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgncHJlJykuZm9yRWFjaChmdW5jdGlvbihwcmUpIHtcbiAgICBpZiAoIXByZS5oYXNBdHRyaWJ1dGUoJ3RhYmluZGV4JykpIHtcbiAgICAgIHByZS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzAnKTtcbiAgICB9XG5cbiAgICBobGpzLmhpZ2hsaWdodEJsb2NrKHByZSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBDb2RlSGlnaGxpZ2h0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgVG9nZ2xlIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy90b2dnbGUvdG9nZ2xlJztcblxuLyoqXG4gKiBUaGUgQWNjb3JkaW9uIG1vZHVsZVxuICogQGNsYXNzXG4gKi9cbmNsYXNzIEFjY29yZGlvbiB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICpcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgY2xhc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RvZ2dsZSA9IG5ldyBUb2dnbGUoe1xuICAgICAgc2VsZWN0b3I6IEFjY29yZGlvbi5zZWxlY3RvclxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgZG9tIHNlbGVjdG9yIGZvciB0aGUgbW9kdWxlXG4gKlxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuQWNjb3JkaW9uLnNlbGVjdG9yID0gJ1tkYXRhLWpzKj1cImFjY29yZGlvblwiXSc7XG5cbmV4cG9ydCBkZWZhdWx0IEFjY29yZGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIEludGVyc2VjdGlvbiBPYnNlcnZlciBjbGFzc1xuICovXG5jbGFzcyBPYnNlcnZlIHtcbiAgY29uc3RydWN0b3IocyA9IHt9KSB7XG4gICAgaWYgKCFzLmVsZW1lbnQpIHJldHVybjtcblxuICAgIHRoaXMub3B0aW9ucyA9IChzLm9wdGlvbnMpID8gT2JqZWN0LmFzc2lnbihPYnNlcnZlLm9wdGlvbnMsIHMub3B0aW9ucykgOiBPYnNlcnZlLm9wdGlvbnM7XG5cbiAgICB0aGlzLnRyaWdnZXIgPSAocy50cmlnZ2VyKSA/IHMudHJpZ2dlciA6IE9ic2VydmUudHJpZ2dlcjtcblxuICAgIHRoaXMuc2VsZWN0b3JzID0gKHMuc2VsZWN0b3JzKSA/IHMuc2VsZWN0b3JzIDogT2JzZXJ2ZS5zZWxlY3RvcnM7XG5cbiAgICAvLyBJbnN0YW50aWF0ZSB0aGUgSW50ZXJzZWN0aW9uIE9ic2VydmVyXG4gICAgdGhpcy5vYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcigoZW50cmllcywgb2JzZXJ2ZXIpID0+IHtcbiAgICAgIHRoaXMuY2FsbGJhY2soZW50cmllcywgb2JzZXJ2ZXIpO1xuICAgIH0sIHRoaXMub3B0aW9ucyk7XG5cbiAgICAvLyBTZWxlY3QgYWxsIG9mIHRoZSBpdGVtcyB0byBvYnNlcnZlXG4gICAgbGV0IHNlbGVjdG9ySXRlbSA9IHRoaXMuc2VsZWN0b3JzLklURU0ucmVwbGFjZSgne3sgaXRlbSB9fScsXG4gICAgICAgIHMuZWxlbWVudC5kYXRhc2V0W3RoaXMuc2VsZWN0b3JzLklURU1TX0FUVFJdKTtcblxuICAgIHRoaXMuaXRlbXMgPSBzLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvckl0ZW0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtc1tpXTtcblxuICAgICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKGl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIGNhbGxiYWNrKGVudHJpZXMsIG9ic2VydmVyKSB7XG4gICAgbGV0IHByZXZFbnRyeSA9IGVudHJpZXNbMF07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gZW50cmllc1tpXTtcblxuICAgICAgdGhpcy50cmlnZ2VyKGVudHJ5LCBwcmV2RW50cnksIG9ic2VydmVyKTtcblxuICAgICAgcHJldkVudHJ5ID0gZW50cnk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgSW50ZXJzZWN0aW9uIE9ic2VydmVyIEFQSSAqL1xuT2JzZXJ2ZS5vcHRpb25zID0ge1xuICByb290OiBudWxsLFxuICByb290TWFyZ2luOiAnMHB4JyxcbiAgdGhyZXNob2xkOiBbMC4xNV1cbn07XG5cbi8qKiBQbGFjZWhvbGRlciBlbnRyeSBmdW5jdGlvbiBmb3Igd2hhdCBoYXBwZW5zIHdpdGggaXRlbXMgYXJlIG9ic2VydmVkICovXG5PYnNlcnZlLnRyaWdnZXIgPSBlbnRyeSA9PiB7XG4gIGNvbnNvbGUuZGlyKGVudHJ5KTtcbiAgY29uc29sZS5kaXIoJ09ic2VydmVkISBDcmVhdGUgYSBlbnRyeSB0cmlnZ2VyIGZ1bmN0aW9uIGFuZCBwYXNzIGl0IHRvIHRoZSBpbnN0YW50aWF0ZWQgT2JzZXJ2ZSBzZXR0aW5ncyBvYmplY3QuJyk7XG59O1xuXG4vKiogTWFpbiBzZWxlY3RvciBmb3IgdGhlIHV0aWxpdHkgKi9cbk9ic2VydmUuc2VsZWN0b3IgPSAnW2RhdGEtanMqPVwib2JzZXJ2ZVwiXSc7XG5cbi8qKiBNaXNjLiBzZWxlY3RvcnMgZm9yIHRoZSBvYnNlcnZlciB1dGlsaXR5ICovXG5PYnNlcnZlLnNlbGVjdG9ycyA9IHtcbiAgSVRFTTogJ1tkYXRhLWpzLW9ic2VydmUtaXRlbT1cInt7IGl0ZW0gfX1cIl0nLFxuICBJVEVNU19BVFRSOiAnanNPYnNlcnZlSXRlbXMnXG59O1xuXG5leHBvcnQgZGVmYXVsdCBPYnNlcnZlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgT2JzZXJ2ZSBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvb2JzZXJ2ZS9vYnNlcnZlJztcblxuY2xhc3MgQWN0aXZlTmF2aWdhdGlvbiB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSAgVGhlIGluc3RhbnRpYXRlZCBwYXR0ZXJuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzID0ge30pIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gKHMuc2VsZWN0b3IpID8gcy5zZWxlY3RvciA6IEFjdGl2ZU5hdmlnYXRpb24uc2VsZWN0b3I7XG5cbiAgICB0aGlzLnNlbGVjdG9ycyA9IChzLnNlbGVjdG9ycykgP1xuICAgICAgT2JqZWN0LmFzc2lnbihBY3RpdmVOYXZpZ2F0aW9uLnNlbGVjdG9ycywgcy5zZWxlY3RvcnMpIDogQWN0aXZlTmF2aWdhdGlvbi5zZWxlY3RvcnM7XG5cbiAgICB0aGlzLm9ic2VydmVPcHRpb25zID0gKHMub2JzZXJ2ZU9wdGlvbnMpID9cbiAgICAgIE9iamVjdC5hc3NpZ24oQWN0aXZlTmF2aWdhdGlvbi5vYnNlcnZlT3B0aW9ucywgcy5vYnNlcnZlT3B0aW9ucykgOiBBY3RpdmVOYXZpZ2F0aW9uLm9ic2VydmVPcHRpb25zO1xuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIGZvciB0b2dnbGluZyB0aGUganVtcCBuYXZpZ2F0aW9uIGl0ZW0sIHVzZWQgYnkgdGhlIGNsaWNrIGV2ZW50XG4gICAgICogaGFuZGxlciBhbmQgdGhlIGludGVyc2VjdGlvbiBvYnNlcnZlciBldmVudCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHZhciBOb2RlRWxlbWVudFxuICAgICAqL1xuICAgICBjb25zdCBqdW1wQ2xhc3NUb2dnbGUgPSBpdGVtID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbS5wYXJlbnROb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHNpYmxpbmcgPSBpdGVtLnBhcmVudE5vZGUuY2hpbGRyZW5baV07XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0b3JzLkZPQ1VTX0FUVFIgaW4gc2libGluZy5kYXRhc2V0KSB7XG4gICAgICAgICAgbGV0IGNsYXNzQWN0aXZlID0gc2libGluZy5kYXRhc2V0LmFjdGl2ZU5hdmlnYXRpb25JdGVtLnNwbGl0KCcgJyk7XG4gICAgICAgICAgbGV0IGNsYXNzSW5hY3RpdmUgPSBzaWJsaW5nLmRhdGFzZXQuaW5hY3RpdmVOYXZpZ2F0aW9uSXRlbS5zcGxpdCgnICcpO1xuXG4gICAgICAgICAgaWYgKHNpYmxpbmcuY2xhc3NMaXN0LmNvbnRhaW5zKC4uLmNsYXNzQWN0aXZlKSkge1xuICAgICAgICAgICAgc2libGluZy5jbGFzc0xpc3QucmVtb3ZlKC4uLmNsYXNzQWN0aXZlKTtcbiAgICAgICAgICAgIHNpYmxpbmcuY2xhc3NMaXN0LmFkZCguLi5jbGFzc0luYWN0aXZlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaXRlbS5jbGFzc0xpc3QucmVtb3ZlKC4uLml0ZW0uZGF0YXNldC5pbmFjdGl2ZU5hdmlnYXRpb25JdGVtLnNwbGl0KCcgJykpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKC4uLml0ZW0uZGF0YXNldC5hY3RpdmVOYXZpZ2F0aW9uSXRlbS5zcGxpdCgnICcpKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2xpY2sgZXZlbnQgaGFuZGxlciBmb3IganVtcCBuYXZpZ2F0aW9uIGl0ZW1zXG4gICAgICpcbiAgICAgKiBAdmFyIE5vZGVFbGVtZW50XG4gICAgICovXG4gICAgKGVsZW1lbnQgPT4ge1xuICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGFjdGl2ZU5hdmlnYXRpb24gPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2FbZGF0YS1hY3RpdmUtbmF2aWdhdGlvbi1pdGVtXScpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWN0aXZlTmF2aWdhdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGEgPSBhY3RpdmVOYXZpZ2F0aW9uW2ldO1xuXG4gICAgICAgICAgYS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICBqdW1wQ2xhc3NUb2dnbGUoZXZlbnQudGFyZ2V0KTtcblxuICAgICAgICAgICAgICBsZXQgaXRlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpKTtcbiAgICAgICAgICAgICAgbGV0IGZvY3VzSXRlbSA9IGl0ZW0ucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9ycy5GT0NVUyk7XG5cbiAgICAgICAgICAgICAgaWYgKGZvY3VzSXRlbSkge1xuICAgICAgICAgICAgICAgIGZvY3VzSXRlbS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgICAgICAgICAgZm9jdXNJdGVtLmZvY3VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3IpKTtcblxuICAgIC8qKlxuICAgICAqIEludGVyc2VjdGlvbiBPYnNlcnZlciBldmVudCBoYW5kbGVyIGZvciBqdW1wIG5hdmlnYXRpb24gaXRlbXNcbiAgICAgKlxuICAgICAqIEB2YXIgTm9kZUVsZW1lbnRMaXN0XG4gICAgICovXG4gICAgKGVsZW1lbnRzID0+IHtcbiAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIG5ldyBPYnNlcnZlKHtcbiAgICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICAgIG9wdGlvbnM6IHRoaXMub2JzZXJ2ZU9wdGlvbnMsXG4gICAgICAgICAgc2VsZWN0b3JzOiB7XG4gICAgICAgICAgICBJVEVNOiB0aGlzLnNlbGVjdG9ycy5PQlNFUlZFX0lURU0sXG4gICAgICAgICAgICBJVEVNU19BVFRSOiB0aGlzLnNlbGVjdG9ycy5PQlNFUlZFX0lURU1TX0FUVFJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRyaWdnZXI6IChlbnRyeSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFlbnRyeS5pc0ludGVyc2VjdGluZykgcmV0dXJuO1xuXG4gICAgICAgICAgICBsZXQganVtcEl0ZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBhW2hyZWY9XCIjJHtlbnRyeS50YXJnZXQuaWR9XCJdYCk7XG5cbiAgICAgICAgICAgIGlmICghanVtcEl0ZW0pIHJldHVybjtcblxuICAgICAgICAgICAganVtcEl0ZW0uY2xvc2VzdCh0aGlzLnNlbGVjdG9ycy5TQ1JPTEwpLnNjcm9sbFRvKHtcbiAgICAgICAgICAgICAgbGVmdDoganVtcEl0ZW0ub2Zmc2V0TGVmdCxcbiAgICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgICBiZWhhdmlvcjogJ3Ntb290aCdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgZm9jdXNJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5zZWxlY3RvcnMuRk9DVVMpO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZvY3VzSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgZm9jdXNJdGVtc1tpXS5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGp1bXBDbGFzc1RvZ2dsZShqdW1wSXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5zZWxlY3RvcnMuT0JTRVJWRSkpO1xuICB9XG59XG5cbi8qKiBAdHlwZSB7U3RyaW5nfSAgTWFpbiBET00gc2VsZWN0b3IgKi9cbkFjdGl2ZU5hdmlnYXRpb24uc2VsZWN0b3IgPSAnW2RhdGEtanMqPVxcXCJhY3RpdmUtbmF2aWdhdGlvblxcXCJdJztcblxuLyoqIEB0eXBlIHtPYmplY3R9ICBTZWxlY3RvcnMgZm9yIHRoZSBlbGVtZW50ICovXG5BY3RpdmVOYXZpZ2F0aW9uLnNlbGVjdG9ycyA9IHtcbiAgT0JTRVJWRTogJ1tkYXRhLWFjdGl2ZS1uYXZpZ2F0aW9uPVwib2JzZXJ2ZVwiXScsXG4gIE9CU0VSVkVfSVRFTTogJ1tkYXRhLWFjdGl2ZS1uYXZpZ2F0aW9uLW9ic2VydmUtaXRlbT1cInt7IGl0ZW0gfX1cIl0nLFxuICBPQlNFUlZFX0lURU1TX0FUVFI6ICdhY3RpdmVOYXZpZ2F0aW9uT2JzZXJ2ZUl0ZW1zJyxcbiAgU0NST0xMOiAnW2RhdGEtYWN0aXZlLW5hdmlnYXRpb249XCJzY3JvbGxcIl0nLFxuICBGT0NVUzogJ1tkYXRhLWFjdGl2ZS1uYXZpZ2F0aW9uLWl0ZW09XCJmb2N1c1wiXScsXG4gIEZPQ1VTX0FUVFI6ICdhY3RpdmVOYXZpZ2F0aW9uSXRlbSdcbn07XG5cbi8qKiBAdHlwZSB7T2JqZWN0fSAgT2JzZXJ2YXRpb24gdXRpbGl0eSBvcHRpb25zICovXG5BY3RpdmVOYXZpZ2F0aW9uLm9ic2VydmVPcHRpb25zID0ge1xuICByb290OiBudWxsLFxuICByb290TWFyZ2luOiAnMHB4JyxcbiAgdGhyZXNob2xkOiBbMC4xNV1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFjdGl2ZU5hdmlnYXRpb247XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbid1c2Ugc3RyaWN0JztcblxuY2xhc3MgRGlzY2xhaW1lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc2VsZWN0b3JzID0gRGlzY2xhaW1lci5zZWxlY3RvcnM7XG5cbiAgICB0aGlzLmNsYXNzZXMgPSBEaXNjbGFpbWVyLmNsYXNzZXM7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKHRoaXMuc2VsZWN0b3JzLlRPR0dMRSkpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgdGhpcy50b2dnbGUoZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGRpc2NsYWltZXIgdG8gYmUgdmlzaWJsZSBvciBpbnZpc2libGVcbiAgICpcbiAgICogQHBhcmFtICAge29iamVjdH0gIGV2ZW50ICBUaGUgYm9keSBjbGljayBldmVudFxuICAgKlxuICAgKiBAcmV0dXJuICB7b2JqZWN0fSAgICAgICAgIFRoZSBkaXNjbGFpbWVyIGNsYXNzXG4gICAqL1xuICB0b2dnbGUoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgbGV0IGlkID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScpO1xuXG4gICAgbGV0IGFjdGl2ZSA9IGBbYXJpYS1kZXNjcmliZWRieT1cIiR7aWR9XCJdLiR7dGhpcy5jbGFzc2VzLkFDVElWRX1gO1xuXG4gICAgbGV0IHRyaWdnZXJzQWN0aXZlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhY3RpdmUpO1xuICAgIGxldCBkaXNjbGFpbWVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgIyR7aWR9YCk7XG5cbiAgICBpZiAodHJpZ2dlcnNBY3RpdmUubGVuZ3RoID4gMCAmJiBkaXNjbGFpbWVyKSB7XG4gICAgICBkaXNjbGFpbWVyLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5jbGFzc2VzLkhJRERFTik7XG4gICAgICBkaXNjbGFpbWVyLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc2VzLkFOSU1BVEVEKTtcbiAgICAgIGRpc2NsYWltZXIuY2xhc3NMaXN0LmFkZCh0aGlzLmNsYXNzZXMuQU5JTUFUSU9OKTtcbiAgICAgIGRpc2NsYWltZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIGZhbHNlKTtcblxuICAgICAgLy8gU2Nyb2xsLXRvIGZ1bmN0aW9uYWxpdHkgZm9yIG1vYmlsZVxuICAgICAgaWYgKHdpbmRvdy5zY3JvbGxUbyAmJiB3aW5kb3cuaW5uZXJXaWR0aCA8IFNDUkVFTl9ERVNLVE9QKSB7XG4gICAgICAgIGxldCBvZmZzZXQgPSBldmVudC50YXJnZXQub2Zmc2V0VG9wIC0gZXZlbnQudGFyZ2V0LmRhdGFzZXQuZGlzY2xhaW1lclNjcm9sbE9mZnNldDtcblxuICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgb2Zmc2V0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZGlzY2xhaW1lci5jbGFzc0xpc3QuYWRkKHRoaXMuY2xhc3Nlcy5ISURERU4pO1xuICAgICAgZGlzY2xhaW1lci5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuY2xhc3Nlcy5BTklNQVRFRCk7XG4gICAgICBkaXNjbGFpbWVyLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5jbGFzc2VzLkFOSU1BVElPTik7XG4gICAgICBkaXNjbGFpbWVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5EaXNjbGFpbWVyLnNlbGVjdG9ycyA9IHtcbiAgVE9HR0xFOiAnW2RhdGEtanMqPVwiZGlzY2xhaW1lclwiXSdcbn07XG5cbkRpc2NsYWltZXIuY2xhc3NlcyA9IHtcbiAgQUNUSVZFOiAnYWN0aXZlJyxcbiAgSElEREVOOiAnaGlkZGVuJyxcbiAgQU5JTUFURUQ6ICdhbmltYXRlZCcsXG4gIEFOSU1BVElPTjogJ2ZhZGVJblVwJ1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRGlzY2xhaW1lcjtcbiIsIi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsICYmIGdsb2JhbC5PYmplY3QgPT09IE9iamVjdCAmJiBnbG9iYWw7XG5cbmV4cG9ydCBkZWZhdWx0IGZyZWVHbG9iYWw7XG4iLCJpbXBvcnQgZnJlZUdsb2JhbCBmcm9tICcuL19mcmVlR2xvYmFsLmpzJztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG5leHBvcnQgZGVmYXVsdCByb290O1xuIiwiaW1wb3J0IHJvb3QgZnJvbSAnLi9fcm9vdC5qcyc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5leHBvcnQgZGVmYXVsdCBTeW1ib2w7XG4iLCJpbXBvcnQgU3ltYm9sIGZyb20gJy4vX1N5bWJvbC5qcyc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBuYXRpdmVPYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1Ub1N0cmluZ1RhZyA9IFN5bWJvbCA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VHZXRUYWdgIHdoaWNoIGlnbm9yZXMgYFN5bWJvbC50b1N0cmluZ1RhZ2AgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHJhdyBgdG9TdHJpbmdUYWdgLlxuICovXG5mdW5jdGlvbiBnZXRSYXdUYWcodmFsdWUpIHtcbiAgdmFyIGlzT3duID0gaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgc3ltVG9TdHJpbmdUYWcpLFxuICAgICAgdGFnID0gdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuXG4gIHRyeSB7XG4gICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdW5kZWZpbmVkO1xuICAgIHZhciB1bm1hc2tlZCA9IHRydWU7XG4gIH0gY2F0Y2ggKGUpIHt9XG5cbiAgdmFyIHJlc3VsdCA9IG5hdGl2ZU9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICBpZiAodW5tYXNrZWQpIHtcbiAgICBpZiAoaXNPd24pIHtcbiAgICAgIHZhbHVlW3N5bVRvU3RyaW5nVGFnXSA9IHRhZztcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHZhbHVlW3N5bVRvU3RyaW5nVGFnXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2V0UmF3VGFnO1xuIiwiLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyB1c2luZyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IG9iamVjdFRvU3RyaW5nO1xuIiwiaW1wb3J0IFN5bWJvbCBmcm9tICcuL19TeW1ib2wuanMnO1xuaW1wb3J0IGdldFJhd1RhZyBmcm9tICcuL19nZXRSYXdUYWcuanMnO1xuaW1wb3J0IG9iamVjdFRvU3RyaW5nIGZyb20gJy4vX29iamVjdFRvU3RyaW5nLmpzJztcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG51bGxUYWcgPSAnW29iamVjdCBOdWxsXScsXG4gICAgdW5kZWZpbmVkVGFnID0gJ1tvYmplY3QgVW5kZWZpbmVkXSc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBnZXRUYWdgIHdpdGhvdXQgZmFsbGJhY2tzIGZvciBidWdneSBlbnZpcm9ubWVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgYHRvU3RyaW5nVGFnYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUdldFRhZyh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkVGFnIDogbnVsbFRhZztcbiAgfVxuICByZXR1cm4gKHN5bVRvU3RyaW5nVGFnICYmIHN5bVRvU3RyaW5nVGFnIGluIE9iamVjdCh2YWx1ZSkpXG4gICAgPyBnZXRSYXdUYWcodmFsdWUpXG4gICAgOiBvYmplY3RUb1N0cmluZyh2YWx1ZSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGJhc2VHZXRUYWc7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZVxuICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICogb2YgYE9iamVjdGAuIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgaXNPYmplY3Q7XG4iLCJpbXBvcnQgYmFzZUdldFRhZyBmcm9tICcuL19iYXNlR2V0VGFnLmpzJztcbmltcG9ydCBpc09iamVjdCBmcm9tICcuL2lzT2JqZWN0LmpzJztcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFzeW5jVGFnID0gJ1tvYmplY3QgQXN5bmNGdW5jdGlvbl0nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXScsXG4gICAgcHJveHlUYWcgPSAnW29iamVjdCBQcm94eV0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDkgd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXlzIGFuZCBvdGhlciBjb25zdHJ1Y3RvcnMuXG4gIHZhciB0YWcgPSBiYXNlR2V0VGFnKHZhbHVlKTtcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWcgfHwgdGFnID09IGFzeW5jVGFnIHx8IHRhZyA9PSBwcm94eVRhZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgaXNGdW5jdGlvbjtcbiIsImltcG9ydCByb290IGZyb20gJy4vX3Jvb3QuanMnO1xuXG4vKiogVXNlZCB0byBkZXRlY3Qgb3ZlcnJlYWNoaW5nIGNvcmUtanMgc2hpbXMuICovXG52YXIgY29yZUpzRGF0YSA9IHJvb3RbJ19fY29yZS1qc19zaGFyZWRfXyddO1xuXG5leHBvcnQgZGVmYXVsdCBjb3JlSnNEYXRhO1xuIiwiaW1wb3J0IGNvcmVKc0RhdGEgZnJvbSAnLi9fY29yZUpzRGF0YS5qcyc7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBtZXRob2RzIG1hc3F1ZXJhZGluZyBhcyBuYXRpdmUuICovXG52YXIgbWFza1NyY0tleSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHVpZCA9IC9bXi5dKyQvLmV4ZWMoY29yZUpzRGF0YSAmJiBjb3JlSnNEYXRhLmtleXMgJiYgY29yZUpzRGF0YS5rZXlzLklFX1BST1RPIHx8ICcnKTtcbiAgcmV0dXJuIHVpZCA/ICgnU3ltYm9sKHNyYylfMS4nICsgdWlkKSA6ICcnO1xufSgpKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYGZ1bmNgIGhhcyBpdHMgc291cmNlIG1hc2tlZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYGZ1bmNgIGlzIG1hc2tlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc01hc2tlZChmdW5jKSB7XG4gIHJldHVybiAhIW1hc2tTcmNLZXkgJiYgKG1hc2tTcmNLZXkgaW4gZnVuYyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGlzTWFza2VkO1xuIiwiLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgZGVjb21waWxlZCBzb3VyY2Ugb2YgZnVuY3Rpb25zLiAqL1xudmFyIGZ1bmNUb1N0cmluZyA9IGZ1bmNQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDb252ZXJ0cyBgZnVuY2AgdG8gaXRzIHNvdXJjZSBjb2RlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc291cmNlIGNvZGUuXG4gKi9cbmZ1bmN0aW9uIHRvU291cmNlKGZ1bmMpIHtcbiAgaWYgKGZ1bmMgIT0gbnVsbCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZnVuY1RvU3RyaW5nLmNhbGwoZnVuYyk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIChmdW5jICsgJycpO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cbiAgcmV0dXJuICcnO1xufVxuXG5leHBvcnQgZGVmYXVsdCB0b1NvdXJjZTtcbiIsImltcG9ydCBpc0Z1bmN0aW9uIGZyb20gJy4vaXNGdW5jdGlvbi5qcyc7XG5pbXBvcnQgaXNNYXNrZWQgZnJvbSAnLi9faXNNYXNrZWQuanMnO1xuaW1wb3J0IGlzT2JqZWN0IGZyb20gJy4vaXNPYmplY3QuanMnO1xuaW1wb3J0IHRvU291cmNlIGZyb20gJy4vX3RvU291cmNlLmpzJztcblxuLyoqXG4gKiBVc2VkIHRvIG1hdGNoIGBSZWdFeHBgXG4gKiBbc3ludGF4IGNoYXJhY3RlcnNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXBhdHRlcm5zKS5cbiAqL1xudmFyIHJlUmVnRXhwQ2hhciA9IC9bXFxcXF4kLiorPygpW1xcXXt9fF0vZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGhvc3QgY29uc3RydWN0b3JzIChTYWZhcmkpLiAqL1xudmFyIHJlSXNIb3N0Q3RvciA9IC9eXFxbb2JqZWN0IC4rP0NvbnN0cnVjdG9yXFxdJC87XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGUsXG4gICAgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZnVuY1RvU3RyaW5nID0gZnVuY1Byb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlLiAqL1xudmFyIHJlSXNOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgZnVuY1RvU3RyaW5nLmNhbGwoaGFzT3duUHJvcGVydHkpLnJlcGxhY2UocmVSZWdFeHBDaGFyLCAnXFxcXCQmJylcbiAgLnJlcGxhY2UoL2hhc093blByb3BlcnR5fChmdW5jdGlvbikuKj8oPz1cXFxcXFwoKXwgZm9yIC4rPyg/PVxcXFxcXF0pL2csICckMS4qPycpICsgJyQnXG4pO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzTmF0aXZlYCB3aXRob3V0IGJhZCBzaGltIGNoZWNrcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbixcbiAqICBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc05hdGl2ZSh2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSB8fCBpc01hc2tlZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHBhdHRlcm4gPSBpc0Z1bmN0aW9uKHZhbHVlKSA/IHJlSXNOYXRpdmUgOiByZUlzSG9zdEN0b3I7XG4gIHJldHVybiBwYXR0ZXJuLnRlc3QodG9Tb3VyY2UodmFsdWUpKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZUlzTmF0aXZlO1xuIiwiLyoqXG4gKiBHZXRzIHRoZSB2YWx1ZSBhdCBga2V5YCBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3RdIFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBwcm9wZXJ0eSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gZ2V0VmFsdWUob2JqZWN0LCBrZXkpIHtcbiAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGdldFZhbHVlO1xuIiwiaW1wb3J0IGJhc2VJc05hdGl2ZSBmcm9tICcuL19iYXNlSXNOYXRpdmUuanMnO1xuaW1wb3J0IGdldFZhbHVlIGZyb20gJy4vX2dldFZhbHVlLmpzJztcblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IGdldFZhbHVlKG9iamVjdCwga2V5KTtcbiAgcmV0dXJuIGJhc2VJc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2V0TmF0aXZlO1xuIiwiaW1wb3J0IGdldE5hdGl2ZSBmcm9tICcuL19nZXROYXRpdmUuanMnO1xuXG52YXIgZGVmaW5lUHJvcGVydHkgPSAoZnVuY3Rpb24oKSB7XG4gIHRyeSB7XG4gICAgdmFyIGZ1bmMgPSBnZXROYXRpdmUoT2JqZWN0LCAnZGVmaW5lUHJvcGVydHknKTtcbiAgICBmdW5jKHt9LCAnJywge30pO1xuICAgIHJldHVybiBmdW5jO1xuICB9IGNhdGNoIChlKSB7fVxufSgpKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lUHJvcGVydHk7XG4iLCJpbXBvcnQgZGVmaW5lUHJvcGVydHkgZnJvbSAnLi9fZGVmaW5lUHJvcGVydHkuanMnO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBhc3NpZ25WYWx1ZWAgYW5kIGBhc3NpZ25NZXJnZVZhbHVlYCB3aXRob3V0XG4gKiB2YWx1ZSBjaGVja3MuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGFzc2lnbi5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGFzc2lnbi5cbiAqL1xuZnVuY3Rpb24gYmFzZUFzc2lnblZhbHVlKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICBpZiAoa2V5ID09ICdfX3Byb3RvX18nICYmIGRlZmluZVByb3BlcnR5KSB7XG4gICAgZGVmaW5lUHJvcGVydHkob2JqZWN0LCBrZXksIHtcbiAgICAgICdjb25maWd1cmFibGUnOiB0cnVlLFxuICAgICAgJ2VudW1lcmFibGUnOiB0cnVlLFxuICAgICAgJ3ZhbHVlJzogdmFsdWUsXG4gICAgICAnd3JpdGFibGUnOiB0cnVlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBiYXNlQXNzaWduVmFsdWU7XG4iLCIvKipcbiAqIFBlcmZvcm1zIGFcbiAqIFtgU2FtZVZhbHVlWmVyb2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXNhbWV2YWx1ZXplcm8pXG4gKiBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmUgZXF1aXZhbGVudC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEgfTtcbiAqIHZhciBvdGhlciA9IHsgJ2EnOiAxIH07XG4gKlxuICogXy5lcShvYmplY3QsIG9iamVjdCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcShvYmplY3QsIG90aGVyKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcSgnYScsICdhJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcSgnYScsIE9iamVjdCgnYScpKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcShOYU4sIE5hTik7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGVxKHZhbHVlLCBvdGhlcikge1xuICByZXR1cm4gdmFsdWUgPT09IG90aGVyIHx8ICh2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZXE7XG4iLCJpbXBvcnQgYmFzZUFzc2lnblZhbHVlIGZyb20gJy4vX2Jhc2VBc3NpZ25WYWx1ZS5qcyc7XG5pbXBvcnQgZXEgZnJvbSAnLi9lcS5qcyc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQXNzaWducyBgdmFsdWVgIHRvIGBrZXlgIG9mIGBvYmplY3RgIGlmIHRoZSBleGlzdGluZyB2YWx1ZSBpcyBub3QgZXF1aXZhbGVudFxuICogdXNpbmcgW2BTYW1lVmFsdWVaZXJvYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtc2FtZXZhbHVlemVybylcbiAqIGZvciBlcXVhbGl0eSBjb21wYXJpc29ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gYXNzaWduLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gYXNzaWduLlxuICovXG5mdW5jdGlvbiBhc3NpZ25WYWx1ZShvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgdmFyIG9ialZhbHVlID0gb2JqZWN0W2tleV07XG4gIGlmICghKGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpICYmIGVxKG9ialZhbHVlLCB2YWx1ZSkpIHx8XG4gICAgICAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiAhKGtleSBpbiBvYmplY3QpKSkge1xuICAgIGJhc2VBc3NpZ25WYWx1ZShvYmplY3QsIGtleSwgdmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzc2lnblZhbHVlO1xuIiwiaW1wb3J0IGFzc2lnblZhbHVlIGZyb20gJy4vX2Fzc2lnblZhbHVlLmpzJztcbmltcG9ydCBiYXNlQXNzaWduVmFsdWUgZnJvbSAnLi9fYmFzZUFzc2lnblZhbHVlLmpzJztcblxuLyoqXG4gKiBDb3BpZXMgcHJvcGVydGllcyBvZiBgc291cmNlYCB0byBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyBmcm9tLlxuICogQHBhcmFtIHtBcnJheX0gcHJvcHMgVGhlIHByb3BlcnR5IGlkZW50aWZpZXJzIHRvIGNvcHkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdD17fV0gVGhlIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgdG8uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb3BpZWQgdmFsdWVzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gY29weU9iamVjdChzb3VyY2UsIHByb3BzLCBvYmplY3QsIGN1c3RvbWl6ZXIpIHtcbiAgdmFyIGlzTmV3ID0gIW9iamVjdDtcbiAgb2JqZWN0IHx8IChvYmplY3QgPSB7fSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuXG4gICAgdmFyIG5ld1ZhbHVlID0gY3VzdG9taXplclxuICAgICAgPyBjdXN0b21pemVyKG9iamVjdFtrZXldLCBzb3VyY2Vba2V5XSwga2V5LCBvYmplY3QsIHNvdXJjZSlcbiAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgaWYgKG5ld1ZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG5ld1ZhbHVlID0gc291cmNlW2tleV07XG4gICAgfVxuICAgIGlmIChpc05ldykge1xuICAgICAgYmFzZUFzc2lnblZhbHVlKG9iamVjdCwga2V5LCBuZXdWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2lnblZhbHVlKG9iamVjdCwga2V5LCBuZXdWYWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmplY3Q7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNvcHlPYmplY3Q7XG4iLCIvKipcbiAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IGl0IHJlY2VpdmVzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBzaW5jZSAwLjEuMFxuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsXG4gKiBAcGFyYW0geyp9IHZhbHVlIEFueSB2YWx1ZS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIGB2YWx1ZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICdhJzogMSB9O1xuICpcbiAqIGNvbnNvbGUubG9nKF8uaWRlbnRpdHkob2JqZWN0KSA9PT0gb2JqZWN0KTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpZGVudGl0eTtcbiIsIi8qKlxuICogQSBmYXN0ZXIgYWx0ZXJuYXRpdmUgdG8gYEZ1bmN0aW9uI2FwcGx5YCwgdGhpcyBmdW5jdGlvbiBpbnZva2VzIGBmdW5jYFxuICogd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgYHRoaXNBcmdgIGFuZCB0aGUgYXJndW1lbnRzIG9mIGBhcmdzYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gaW52b2tlLlxuICogQHBhcmFtIHsqfSB0aGlzQXJnIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIFRoZSBhcmd1bWVudHMgdG8gaW52b2tlIGBmdW5jYCB3aXRoLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc3VsdCBvZiBgZnVuY2AuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5KGZ1bmMsIHRoaXNBcmcsIGFyZ3MpIHtcbiAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnKTtcbiAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYXJnc1swXSk7XG4gICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFyZ3NbMF0sIGFyZ3NbMV0pO1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdKTtcbiAgfVxuICByZXR1cm4gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXBwbHk7XG4iLCJpbXBvcnQgYXBwbHkgZnJvbSAnLi9fYXBwbHkuanMnO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXg7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlUmVzdGAgd2hpY2ggdHJhbnNmb3JtcyB0aGUgcmVzdCBhcnJheS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgYSByZXN0IHBhcmFtZXRlciB0by5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9ZnVuYy5sZW5ndGgtMV0gVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZXN0IHBhcmFtZXRlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRyYW5zZm9ybSBUaGUgcmVzdCBhcnJheSB0cmFuc2Zvcm0uXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gb3ZlclJlc3QoZnVuYywgc3RhcnQsIHRyYW5zZm9ybSkge1xuICBzdGFydCA9IG5hdGl2ZU1heChzdGFydCA9PT0gdW5kZWZpbmVkID8gKGZ1bmMubGVuZ3RoIC0gMSkgOiBzdGFydCwgMCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gbmF0aXZlTWF4KGFyZ3MubGVuZ3RoIC0gc3RhcnQsIDApLFxuICAgICAgICBhcnJheSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgYXJyYXlbaW5kZXhdID0gYXJnc1tzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgaW5kZXggPSAtMTtcbiAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICB3aGlsZSAoKytpbmRleCA8IHN0YXJ0KSB7XG4gICAgICBvdGhlckFyZ3NbaW5kZXhdID0gYXJnc1tpbmRleF07XG4gICAgfVxuICAgIG90aGVyQXJnc1tzdGFydF0gPSB0cmFuc2Zvcm0oYXJyYXkpO1xuICAgIHJldHVybiBhcHBseShmdW5jLCB0aGlzLCBvdGhlckFyZ3MpO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBvdmVyUmVzdDtcbiIsIi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBgdmFsdWVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMi40LjBcbiAqIEBjYXRlZ29yeSBVdGlsXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byByZXR1cm4gZnJvbSB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY29uc3RhbnQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3RzID0gXy50aW1lcygyLCBfLmNvbnN0YW50KHsgJ2EnOiAxIH0pKTtcbiAqXG4gKiBjb25zb2xlLmxvZyhvYmplY3RzKTtcbiAqIC8vID0+IFt7ICdhJzogMSB9LCB7ICdhJzogMSB9XVxuICpcbiAqIGNvbnNvbGUubG9nKG9iamVjdHNbMF0gPT09IG9iamVjdHNbMV0pO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBjb25zdGFudCh2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjb25zdGFudDtcbiIsImltcG9ydCBjb25zdGFudCBmcm9tICcuL2NvbnN0YW50LmpzJztcbmltcG9ydCBkZWZpbmVQcm9wZXJ0eSBmcm9tICcuL19kZWZpbmVQcm9wZXJ0eS5qcyc7XG5pbXBvcnQgaWRlbnRpdHkgZnJvbSAnLi9pZGVudGl0eS5qcyc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYHNldFRvU3RyaW5nYCB3aXRob3V0IHN1cHBvcnQgZm9yIGhvdCBsb29wIHNob3J0aW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdHJpbmcgVGhlIGB0b1N0cmluZ2AgcmVzdWx0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIGBmdW5jYC5cbiAqL1xudmFyIGJhc2VTZXRUb1N0cmluZyA9ICFkZWZpbmVQcm9wZXJ0eSA/IGlkZW50aXR5IDogZnVuY3Rpb24oZnVuYywgc3RyaW5nKSB7XG4gIHJldHVybiBkZWZpbmVQcm9wZXJ0eShmdW5jLCAndG9TdHJpbmcnLCB7XG4gICAgJ2NvbmZpZ3VyYWJsZSc6IHRydWUsXG4gICAgJ2VudW1lcmFibGUnOiBmYWxzZSxcbiAgICAndmFsdWUnOiBjb25zdGFudChzdHJpbmcpLFxuICAgICd3cml0YWJsZSc6IHRydWVcbiAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBiYXNlU2V0VG9TdHJpbmc7XG4iLCIvKiogVXNlZCB0byBkZXRlY3QgaG90IGZ1bmN0aW9ucyBieSBudW1iZXIgb2YgY2FsbHMgd2l0aGluIGEgc3BhbiBvZiBtaWxsaXNlY29uZHMuICovXG52YXIgSE9UX0NPVU5UID0gODAwLFxuICAgIEhPVF9TUEFOID0gMTY7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVOb3cgPSBEYXRlLm5vdztcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCdsbCBzaG9ydCBvdXQgYW5kIGludm9rZSBgaWRlbnRpdHlgIGluc3RlYWRcbiAqIG9mIGBmdW5jYCB3aGVuIGl0J3MgY2FsbGVkIGBIT1RfQ09VTlRgIG9yIG1vcmUgdGltZXMgaW4gYEhPVF9TUEFOYFxuICogbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byByZXN0cmljdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHNob3J0YWJsZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gc2hvcnRPdXQoZnVuYykge1xuICB2YXIgY291bnQgPSAwLFxuICAgICAgbGFzdENhbGxlZCA9IDA7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFtcCA9IG5hdGl2ZU5vdygpLFxuICAgICAgICByZW1haW5pbmcgPSBIT1RfU1BBTiAtIChzdGFtcCAtIGxhc3RDYWxsZWQpO1xuXG4gICAgbGFzdENhbGxlZCA9IHN0YW1wO1xuICAgIGlmIChyZW1haW5pbmcgPiAwKSB7XG4gICAgICBpZiAoKytjb3VudCA+PSBIT1RfQ09VTlQpIHtcbiAgICAgICAgcmV0dXJuIGFyZ3VtZW50c1swXTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY291bnQgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gZnVuYy5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IHNob3J0T3V0O1xuIiwiaW1wb3J0IGJhc2VTZXRUb1N0cmluZyBmcm9tICcuL19iYXNlU2V0VG9TdHJpbmcuanMnO1xuaW1wb3J0IHNob3J0T3V0IGZyb20gJy4vX3Nob3J0T3V0LmpzJztcblxuLyoqXG4gKiBTZXRzIHRoZSBgdG9TdHJpbmdgIG1ldGhvZCBvZiBgZnVuY2AgdG8gcmV0dXJuIGBzdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdHJpbmcgVGhlIGB0b1N0cmluZ2AgcmVzdWx0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIGBmdW5jYC5cbiAqL1xudmFyIHNldFRvU3RyaW5nID0gc2hvcnRPdXQoYmFzZVNldFRvU3RyaW5nKTtcblxuZXhwb3J0IGRlZmF1bHQgc2V0VG9TdHJpbmc7XG4iLCJpbXBvcnQgaWRlbnRpdHkgZnJvbSAnLi9pZGVudGl0eS5qcyc7XG5pbXBvcnQgb3ZlclJlc3QgZnJvbSAnLi9fb3ZlclJlc3QuanMnO1xuaW1wb3J0IHNldFRvU3RyaW5nIGZyb20gJy4vX3NldFRvU3RyaW5nLmpzJztcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5yZXN0YCB3aGljaCBkb2Vzbid0IHZhbGlkYXRlIG9yIGNvZXJjZSBhcmd1bWVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGFwcGx5IGEgcmVzdCBwYXJhbWV0ZXIgdG8uXG4gKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0PWZ1bmMubGVuZ3RoLTFdIFRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgcmVzdCBwYXJhbWV0ZXIuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZVJlc3QoZnVuYywgc3RhcnQpIHtcbiAgcmV0dXJuIHNldFRvU3RyaW5nKG92ZXJSZXN0KGZ1bmMsIHN0YXJ0LCBpZGVudGl0eSksIGZ1bmMgKyAnJyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGJhc2VSZXN0O1xuIiwiLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgbG9vc2VseSBiYXNlZCBvblxuICogW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTGVuZ3RoKDMpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNMZW5ndGgoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmXG4gICAgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpc0xlbmd0aDtcbiIsImltcG9ydCBpc0Z1bmN0aW9uIGZyb20gJy4vaXNGdW5jdGlvbi5qcyc7XG5pbXBvcnQgaXNMZW5ndGggZnJvbSAnLi9pc0xlbmd0aC5qcyc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZS4gQSB2YWx1ZSBpcyBjb25zaWRlcmVkIGFycmF5LWxpa2UgaWYgaXQnc1xuICogbm90IGEgZnVuY3Rpb24gYW5kIGhhcyBhIGB2YWx1ZS5sZW5ndGhgIHRoYXQncyBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiBvclxuICogZXF1YWwgdG8gYDBgIGFuZCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoJ2FiYycpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgIWlzRnVuY3Rpb24odmFsdWUpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpc0FycmF5TGlrZTtcbiIsIi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgdW5zaWduZWQgaW50ZWdlciB2YWx1ZXMuICovXG52YXIgcmVJc1VpbnQgPSAvXig/OjB8WzEtOV1cXGQqKSQvO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGluZGV4LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgbGVuZ3RoID0gbGVuZ3RoID09IG51bGwgPyBNQVhfU0FGRV9JTlRFR0VSIDogbGVuZ3RoO1xuXG4gIHJldHVybiAhIWxlbmd0aCAmJlxuICAgICh0eXBlID09ICdudW1iZXInIHx8XG4gICAgICAodHlwZSAhPSAnc3ltYm9sJyAmJiByZUlzVWludC50ZXN0KHZhbHVlKSkpICYmXG4gICAgICAgICh2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDwgbGVuZ3RoKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgaXNJbmRleDtcbiIsImltcG9ydCBlcSBmcm9tICcuL2VxLmpzJztcbmltcG9ydCBpc0FycmF5TGlrZSBmcm9tICcuL2lzQXJyYXlMaWtlLmpzJztcbmltcG9ydCBpc0luZGV4IGZyb20gJy4vX2lzSW5kZXguanMnO1xuaW1wb3J0IGlzT2JqZWN0IGZyb20gJy4vaXNPYmplY3QuanMnO1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnRzIGFyZSBmcm9tIGFuIGl0ZXJhdGVlIGNhbGwuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHBvdGVudGlhbCBpdGVyYXRlZSB2YWx1ZSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gaW5kZXggVGhlIHBvdGVudGlhbCBpdGVyYXRlZSBpbmRleCBvciBrZXkgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IG9iamVjdCBUaGUgcG90ZW50aWFsIGl0ZXJhdGVlIG9iamVjdCBhcmd1bWVudC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYXJndW1lbnRzIGFyZSBmcm9tIGFuIGl0ZXJhdGVlIGNhbGwsXG4gKiAgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0l0ZXJhdGVlQ2FsbCh2YWx1ZSwgaW5kZXgsIG9iamVjdCkge1xuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHR5cGUgPSB0eXBlb2YgaW5kZXg7XG4gIGlmICh0eXBlID09ICdudW1iZXInXG4gICAgICAgID8gKGlzQXJyYXlMaWtlKG9iamVjdCkgJiYgaXNJbmRleChpbmRleCwgb2JqZWN0Lmxlbmd0aCkpXG4gICAgICAgIDogKHR5cGUgPT0gJ3N0cmluZycgJiYgaW5kZXggaW4gb2JqZWN0KVxuICAgICAgKSB7XG4gICAgcmV0dXJuIGVxKG9iamVjdFtpbmRleF0sIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGlzSXRlcmF0ZWVDYWxsO1xuIiwiaW1wb3J0IGJhc2VSZXN0IGZyb20gJy4vX2Jhc2VSZXN0LmpzJztcbmltcG9ydCBpc0l0ZXJhdGVlQ2FsbCBmcm9tICcuL19pc0l0ZXJhdGVlQ2FsbC5qcyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGxpa2UgYF8uYXNzaWduYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gYXNzaWduZXIgVGhlIGZ1bmN0aW9uIHRvIGFzc2lnbiB2YWx1ZXMuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBhc3NpZ25lciBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQXNzaWduZXIoYXNzaWduZXIpIHtcbiAgcmV0dXJuIGJhc2VSZXN0KGZ1bmN0aW9uKG9iamVjdCwgc291cmNlcykge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBzb3VyY2VzLmxlbmd0aCxcbiAgICAgICAgY3VzdG9taXplciA9IGxlbmd0aCA+IDEgPyBzb3VyY2VzW2xlbmd0aCAtIDFdIDogdW5kZWZpbmVkLFxuICAgICAgICBndWFyZCA9IGxlbmd0aCA+IDIgPyBzb3VyY2VzWzJdIDogdW5kZWZpbmVkO1xuXG4gICAgY3VzdG9taXplciA9IChhc3NpZ25lci5sZW5ndGggPiAzICYmIHR5cGVvZiBjdXN0b21pemVyID09ICdmdW5jdGlvbicpXG4gICAgICA/IChsZW5ndGgtLSwgY3VzdG9taXplcilcbiAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgaWYgKGd1YXJkICYmIGlzSXRlcmF0ZWVDYWxsKHNvdXJjZXNbMF0sIHNvdXJjZXNbMV0sIGd1YXJkKSkge1xuICAgICAgY3VzdG9taXplciA9IGxlbmd0aCA8IDMgPyB1bmRlZmluZWQgOiBjdXN0b21pemVyO1xuICAgICAgbGVuZ3RoID0gMTtcbiAgICB9XG4gICAgb2JqZWN0ID0gT2JqZWN0KG9iamVjdCk7XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW2luZGV4XTtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgYXNzaWduZXIob2JqZWN0LCBzb3VyY2UsIGluZGV4LCBjdXN0b21pemVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZUFzc2lnbmVyO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy50aW1lc2Agd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZSBzaG9ydGhhbmRzXG4gKiBvciBtYXggYXJyYXkgbGVuZ3RoIGNoZWNrcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IG4gVGhlIG51bWJlciBvZiB0aW1lcyB0byBpbnZva2UgYGl0ZXJhdGVlYC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUaW1lcyhuLCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IEFycmF5KG4pO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbikge1xuICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShpbmRleCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZVRpbWVzO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGlzT2JqZWN0TGlrZTtcbiIsImltcG9ydCBiYXNlR2V0VGFnIGZyb20gJy4vX2Jhc2VHZXRUYWcuanMnO1xuaW1wb3J0IGlzT2JqZWN0TGlrZSBmcm9tICcuL2lzT2JqZWN0TGlrZS5qcyc7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcmdzVGFnID0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNBcmd1bWVudHNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGBhcmd1bWVudHNgIG9iamVjdCxcbiAqL1xuZnVuY3Rpb24gYmFzZUlzQXJndW1lbnRzKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGJhc2VHZXRUYWcodmFsdWUpID09IGFyZ3NUYWc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGJhc2VJc0FyZ3VtZW50cztcbiIsImltcG9ydCBiYXNlSXNBcmd1bWVudHMgZnJvbSAnLi9fYmFzZUlzQXJndW1lbnRzLmpzJztcbmltcG9ydCBpc09iamVjdExpa2UgZnJvbSAnLi9pc09iamVjdExpa2UuanMnO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IG9iamVjdFByb3RvLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGxpa2VseSBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LFxuICogIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcmd1bWVudHMgPSBiYXNlSXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSkgPyBiYXNlSXNBcmd1bWVudHMgOiBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiZcbiAgICAhcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgaXNBcmd1bWVudHM7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXksIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzQXJyYXkoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuZXhwb3J0IGRlZmF1bHQgaXNBcnJheTtcbiIsIi8qKlxuICogVGhpcyBtZXRob2QgcmV0dXJucyBgZmFsc2VgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4xMy4wXG4gKiBAY2F0ZWdvcnkgVXRpbFxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50aW1lcygyLCBfLnN0dWJGYWxzZSk7XG4gKiAvLyA9PiBbZmFsc2UsIGZhbHNlXVxuICovXG5mdW5jdGlvbiBzdHViRmFsc2UoKSB7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgc3R1YkZhbHNlO1xuIiwiaW1wb3J0IHJvb3QgZnJvbSAnLi9fcm9vdC5qcyc7XG5pbXBvcnQgc3R1YkZhbHNlIGZyb20gJy4vc3R1YkZhbHNlLmpzJztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYC4gKi9cbnZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSBmcmVlRXhwb3J0cyAmJiB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblxuLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYC4gKi9cbnZhciBtb2R1bGVFeHBvcnRzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLmV4cG9ydHMgPT09IGZyZWVFeHBvcnRzO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBCdWZmZXIgPSBtb2R1bGVFeHBvcnRzID8gcm9vdC5CdWZmZXIgOiB1bmRlZmluZWQ7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVJc0J1ZmZlciA9IEJ1ZmZlciA/IEJ1ZmZlci5pc0J1ZmZlciA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGJ1ZmZlci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMy4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGJ1ZmZlciwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQnVmZmVyKG5ldyBCdWZmZXIoMikpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNCdWZmZXIobmV3IFVpbnQ4QXJyYXkoMikpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQnVmZmVyID0gbmF0aXZlSXNCdWZmZXIgfHwgc3R1YkZhbHNlO1xuXG5leHBvcnQgZGVmYXVsdCBpc0J1ZmZlcjtcbiIsImltcG9ydCBiYXNlR2V0VGFnIGZyb20gJy4vX2Jhc2VHZXRUYWcuanMnO1xuaW1wb3J0IGlzTGVuZ3RoIGZyb20gJy4vaXNMZW5ndGguanMnO1xuaW1wb3J0IGlzT2JqZWN0TGlrZSBmcm9tICcuL2lzT2JqZWN0TGlrZS5qcyc7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcmdzVGFnID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgYXJyYXlUYWcgPSAnW29iamVjdCBBcnJheV0nLFxuICAgIGJvb2xUYWcgPSAnW29iamVjdCBCb29sZWFuXScsXG4gICAgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICBlcnJvclRhZyA9ICdbb2JqZWN0IEVycm9yXScsXG4gICAgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG4gICAgbWFwVGFnID0gJ1tvYmplY3QgTWFwXScsXG4gICAgbnVtYmVyVGFnID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XScsXG4gICAgcmVnZXhwVGFnID0gJ1tvYmplY3QgUmVnRXhwXScsXG4gICAgc2V0VGFnID0gJ1tvYmplY3QgU2V0XScsXG4gICAgc3RyaW5nVGFnID0gJ1tvYmplY3QgU3RyaW5nXScsXG4gICAgd2Vha01hcFRhZyA9ICdbb2JqZWN0IFdlYWtNYXBdJztcblxudmFyIGFycmF5QnVmZmVyVGFnID0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJyxcbiAgICBkYXRhVmlld1RhZyA9ICdbb2JqZWN0IERhdGFWaWV3XScsXG4gICAgZmxvYXQzMlRhZyA9ICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgIGZsb2F0NjRUYWcgPSAnW29iamVjdCBGbG9hdDY0QXJyYXldJyxcbiAgICBpbnQ4VGFnID0gJ1tvYmplY3QgSW50OEFycmF5XScsXG4gICAgaW50MTZUYWcgPSAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgaW50MzJUYWcgPSAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgdWludDhUYWcgPSAnW29iamVjdCBVaW50OEFycmF5XScsXG4gICAgdWludDhDbGFtcGVkVGFnID0gJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICB1aW50MTZUYWcgPSAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgIHVpbnQzMlRhZyA9ICdbb2JqZWN0IFVpbnQzMkFycmF5XSc7XG5cbi8qKiBVc2VkIHRvIGlkZW50aWZ5IGB0b1N0cmluZ1RhZ2AgdmFsdWVzIG9mIHR5cGVkIGFycmF5cy4gKi9cbnZhciB0eXBlZEFycmF5VGFncyA9IHt9O1xudHlwZWRBcnJheVRhZ3NbZmxvYXQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1tmbG9hdDY0VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQ4VGFnXSA9IHR5cGVkQXJyYXlUYWdzW2ludDE2VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1t1aW50OFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDhDbGFtcGVkVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3VpbnQxNlRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDMyVGFnXSA9IHRydWU7XG50eXBlZEFycmF5VGFnc1thcmdzVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2FycmF5VGFnXSA9XG50eXBlZEFycmF5VGFnc1thcnJheUJ1ZmZlclRhZ10gPSB0eXBlZEFycmF5VGFnc1tib29sVGFnXSA9XG50eXBlZEFycmF5VGFnc1tkYXRhVmlld1RhZ10gPSB0eXBlZEFycmF5VGFnc1tkYXRlVGFnXSA9XG50eXBlZEFycmF5VGFnc1tlcnJvclRhZ10gPSB0eXBlZEFycmF5VGFnc1tmdW5jVGFnXSA9XG50eXBlZEFycmF5VGFnc1ttYXBUYWddID0gdHlwZWRBcnJheVRhZ3NbbnVtYmVyVGFnXSA9XG50eXBlZEFycmF5VGFnc1tvYmplY3RUYWddID0gdHlwZWRBcnJheVRhZ3NbcmVnZXhwVGFnXSA9XG50eXBlZEFycmF5VGFnc1tzZXRUYWddID0gdHlwZWRBcnJheVRhZ3Nbc3RyaW5nVGFnXSA9XG50eXBlZEFycmF5VGFnc1t3ZWFrTWFwVGFnXSA9IGZhbHNlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzVHlwZWRBcnJheWAgd2l0aG91dCBOb2RlLmpzIG9wdGltaXphdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB0eXBlZCBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNUeXBlZEFycmF5KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmXG4gICAgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiAhIXR5cGVkQXJyYXlUYWdzW2Jhc2VHZXRUYWcodmFsdWUpXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZUlzVHlwZWRBcnJheTtcbiIsIi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udW5hcnlgIHdpdGhvdXQgc3VwcG9ydCBmb3Igc3RvcmluZyBtZXRhZGF0YS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FwIGFyZ3VtZW50cyBmb3IuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBjYXBwZWQgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VVbmFyeShmdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jKHZhbHVlKTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZVVuYXJ5O1xuIiwiaW1wb3J0IGZyZWVHbG9iYWwgZnJvbSAnLi9fZnJlZUdsb2JhbC5qcyc7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AuICovXG52YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgbW9kdWxlYC4gKi9cbnZhciBmcmVlTW9kdWxlID0gZnJlZUV4cG9ydHMgJiYgdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgIW1vZHVsZS5ub2RlVHlwZSAmJiBtb2R1bGU7XG5cbi8qKiBEZXRlY3QgdGhlIHBvcHVsYXIgQ29tbW9uSlMgZXh0ZW5zaW9uIGBtb2R1bGUuZXhwb3J0c2AuICovXG52YXIgbW9kdWxlRXhwb3J0cyA9IGZyZWVNb2R1bGUgJiYgZnJlZU1vZHVsZS5leHBvcnRzID09PSBmcmVlRXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBwcm9jZXNzYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZVByb2Nlc3MgPSBtb2R1bGVFeHBvcnRzICYmIGZyZWVHbG9iYWwucHJvY2VzcztcblxuLyoqIFVzZWQgdG8gYWNjZXNzIGZhc3RlciBOb2RlLmpzIGhlbHBlcnMuICovXG52YXIgbm9kZVV0aWwgPSAoZnVuY3Rpb24oKSB7XG4gIHRyeSB7XG4gICAgLy8gVXNlIGB1dGlsLnR5cGVzYCBmb3IgTm9kZS5qcyAxMCsuXG4gICAgdmFyIHR5cGVzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLnJlcXVpcmUgJiYgZnJlZU1vZHVsZS5yZXF1aXJlKCd1dGlsJykudHlwZXM7XG5cbiAgICBpZiAodHlwZXMpIHtcbiAgICAgIHJldHVybiB0eXBlcztcbiAgICB9XG5cbiAgICAvLyBMZWdhY3kgYHByb2Nlc3MuYmluZGluZygndXRpbCcpYCBmb3IgTm9kZS5qcyA8IDEwLlxuICAgIHJldHVybiBmcmVlUHJvY2VzcyAmJiBmcmVlUHJvY2Vzcy5iaW5kaW5nICYmIGZyZWVQcm9jZXNzLmJpbmRpbmcoJ3V0aWwnKTtcbiAgfSBjYXRjaCAoZSkge31cbn0oKSk7XG5cbmV4cG9ydCBkZWZhdWx0IG5vZGVVdGlsO1xuIiwiaW1wb3J0IGJhc2VJc1R5cGVkQXJyYXkgZnJvbSAnLi9fYmFzZUlzVHlwZWRBcnJheS5qcyc7XG5pbXBvcnQgYmFzZVVuYXJ5IGZyb20gJy4vX2Jhc2VVbmFyeS5qcyc7XG5pbXBvcnQgbm9kZVV0aWwgZnJvbSAnLi9fbm9kZVV0aWwuanMnO1xuXG4vKiBOb2RlLmpzIGhlbHBlciByZWZlcmVuY2VzLiAqL1xudmFyIG5vZGVJc1R5cGVkQXJyYXkgPSBub2RlVXRpbCAmJiBub2RlVXRpbC5pc1R5cGVkQXJyYXk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIHR5cGVkIGFycmF5LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMy4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdHlwZWQgYXJyYXksIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1R5cGVkQXJyYXkobmV3IFVpbnQ4QXJyYXkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNUeXBlZEFycmF5KFtdKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc1R5cGVkQXJyYXkgPSBub2RlSXNUeXBlZEFycmF5ID8gYmFzZVVuYXJ5KG5vZGVJc1R5cGVkQXJyYXkpIDogYmFzZUlzVHlwZWRBcnJheTtcblxuZXhwb3J0IGRlZmF1bHQgaXNUeXBlZEFycmF5O1xuIiwiaW1wb3J0IGJhc2VUaW1lcyBmcm9tICcuL19iYXNlVGltZXMuanMnO1xuaW1wb3J0IGlzQXJndW1lbnRzIGZyb20gJy4vaXNBcmd1bWVudHMuanMnO1xuaW1wb3J0IGlzQXJyYXkgZnJvbSAnLi9pc0FycmF5LmpzJztcbmltcG9ydCBpc0J1ZmZlciBmcm9tICcuL2lzQnVmZmVyLmpzJztcbmltcG9ydCBpc0luZGV4IGZyb20gJy4vX2lzSW5kZXguanMnO1xuaW1wb3J0IGlzVHlwZWRBcnJheSBmcm9tICcuL2lzVHlwZWRBcnJheS5qcyc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiB0aGUgYXJyYXktbGlrZSBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBxdWVyeS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5oZXJpdGVkIFNwZWNpZnkgcmV0dXJuaW5nIGluaGVyaXRlZCBwcm9wZXJ0eSBuYW1lcy5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TGlrZUtleXModmFsdWUsIGluaGVyaXRlZCkge1xuICB2YXIgaXNBcnIgPSBpc0FycmF5KHZhbHVlKSxcbiAgICAgIGlzQXJnID0gIWlzQXJyICYmIGlzQXJndW1lbnRzKHZhbHVlKSxcbiAgICAgIGlzQnVmZiA9ICFpc0FyciAmJiAhaXNBcmcgJiYgaXNCdWZmZXIodmFsdWUpLFxuICAgICAgaXNUeXBlID0gIWlzQXJyICYmICFpc0FyZyAmJiAhaXNCdWZmICYmIGlzVHlwZWRBcnJheSh2YWx1ZSksXG4gICAgICBza2lwSW5kZXhlcyA9IGlzQXJyIHx8IGlzQXJnIHx8IGlzQnVmZiB8fCBpc1R5cGUsXG4gICAgICByZXN1bHQgPSBza2lwSW5kZXhlcyA/IGJhc2VUaW1lcyh2YWx1ZS5sZW5ndGgsIFN0cmluZykgOiBbXSxcbiAgICAgIGxlbmd0aCA9IHJlc3VsdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIga2V5IGluIHZhbHVlKSB7XG4gICAgaWYgKChpbmhlcml0ZWQgfHwgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwga2V5KSkgJiZcbiAgICAgICAgIShza2lwSW5kZXhlcyAmJiAoXG4gICAgICAgICAgIC8vIFNhZmFyaSA5IGhhcyBlbnVtZXJhYmxlIGBhcmd1bWVudHMubGVuZ3RoYCBpbiBzdHJpY3QgbW9kZS5cbiAgICAgICAgICAga2V5ID09ICdsZW5ndGgnIHx8XG4gICAgICAgICAgIC8vIE5vZGUuanMgMC4xMCBoYXMgZW51bWVyYWJsZSBub24taW5kZXggcHJvcGVydGllcyBvbiBidWZmZXJzLlxuICAgICAgICAgICAoaXNCdWZmICYmIChrZXkgPT0gJ29mZnNldCcgfHwga2V5ID09ICdwYXJlbnQnKSkgfHxcbiAgICAgICAgICAgLy8gUGhhbnRvbUpTIDIgaGFzIGVudW1lcmFibGUgbm9uLWluZGV4IHByb3BlcnRpZXMgb24gdHlwZWQgYXJyYXlzLlxuICAgICAgICAgICAoaXNUeXBlICYmIChrZXkgPT0gJ2J1ZmZlcicgfHwga2V5ID09ICdieXRlTGVuZ3RoJyB8fCBrZXkgPT0gJ2J5dGVPZmZzZXQnKSkgfHxcbiAgICAgICAgICAgLy8gU2tpcCBpbmRleCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICBpc0luZGV4KGtleSwgbGVuZ3RoKVxuICAgICAgICApKSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXJyYXlMaWtlS2V5cztcbiIsIi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGEgcHJvdG90eXBlIG9iamVjdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHByb3RvdHlwZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc1Byb3RvdHlwZSh2YWx1ZSkge1xuICB2YXIgQ3RvciA9IHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yLFxuICAgICAgcHJvdG8gPSAodHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yLnByb3RvdHlwZSkgfHwgb2JqZWN0UHJvdG87XG5cbiAgcmV0dXJuIHZhbHVlID09PSBwcm90bztcbn1cblxuZXhwb3J0IGRlZmF1bHQgaXNQcm90b3R5cGU7XG4iLCIvKipcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbGlrZVxuICogW2BPYmplY3Qua2V5c2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5rZXlzKVxuICogZXhjZXB0IHRoYXQgaXQgaW5jbHVkZXMgaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqL1xuZnVuY3Rpb24gbmF0aXZlS2V5c0luKG9iamVjdCkge1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGlmIChvYmplY3QgIT0gbnVsbCkge1xuICAgIGZvciAodmFyIGtleSBpbiBPYmplY3Qob2JqZWN0KSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgbmF0aXZlS2V5c0luO1xuIiwiaW1wb3J0IGlzT2JqZWN0IGZyb20gJy4vaXNPYmplY3QuanMnO1xuaW1wb3J0IGlzUHJvdG90eXBlIGZyb20gJy4vX2lzUHJvdG90eXBlLmpzJztcbmltcG9ydCBuYXRpdmVLZXlzSW4gZnJvbSAnLi9fbmF0aXZlS2V5c0luLmpzJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5rZXlzSW5gIHdoaWNoIGRvZXNuJ3QgdHJlYXQgc3BhcnNlIGFycmF5cyBhcyBkZW5zZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqL1xuZnVuY3Rpb24gYmFzZUtleXNJbihvYmplY3QpIHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIG5hdGl2ZUtleXNJbihvYmplY3QpO1xuICB9XG4gIHZhciBpc1Byb3RvID0gaXNQcm90b3R5cGUob2JqZWN0KSxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICBpZiAoIShrZXkgPT0gJ2NvbnN0cnVjdG9yJyAmJiAoaXNQcm90byB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpKSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZUtleXNJbjtcbiIsImltcG9ydCBhcnJheUxpa2VLZXlzIGZyb20gJy4vX2FycmF5TGlrZUtleXMuanMnO1xuaW1wb3J0IGJhc2VLZXlzSW4gZnJvbSAnLi9fYmFzZUtleXNJbi5qcyc7XG5pbXBvcnQgaXNBcnJheUxpa2UgZnJvbSAnLi9pc0FycmF5TGlrZS5qcyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogTm9uLW9iamVjdCB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gb2JqZWN0cy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDMuMC4wXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmtleXNJbihuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJywgJ2MnXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG5mdW5jdGlvbiBrZXlzSW4ob2JqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5TGlrZShvYmplY3QpID8gYXJyYXlMaWtlS2V5cyhvYmplY3QsIHRydWUpIDogYmFzZUtleXNJbihvYmplY3QpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBrZXlzSW47XG4iLCJpbXBvcnQgY29weU9iamVjdCBmcm9tICcuL19jb3B5T2JqZWN0LmpzJztcbmltcG9ydCBjcmVhdGVBc3NpZ25lciBmcm9tICcuL19jcmVhdGVBc3NpZ25lci5qcyc7XG5pbXBvcnQga2V5c0luIGZyb20gJy4va2V5c0luLmpzJztcblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmFzc2lnbkluYCBleGNlcHQgdGhhdCBpdCBhY2NlcHRzIGBjdXN0b21pemVyYFxuICogd2hpY2ggaXMgaW52b2tlZCB0byBwcm9kdWNlIHRoZSBhc3NpZ25lZCB2YWx1ZXMuIElmIGBjdXN0b21pemVyYCByZXR1cm5zXG4gKiBgdW5kZWZpbmVkYCwgYXNzaWdubWVudCBpcyBoYW5kbGVkIGJ5IHRoZSBtZXRob2QgaW5zdGVhZC4gVGhlIGBjdXN0b21pemVyYFxuICogaXMgaW52b2tlZCB3aXRoIGZpdmUgYXJndW1lbnRzOiAob2JqVmFsdWUsIHNyY1ZhbHVlLCBrZXksIG9iamVjdCwgc291cmNlKS5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgbXV0YXRlcyBgb2JqZWN0YC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAYWxpYXMgZXh0ZW5kV2l0aFxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHsuLi5PYmplY3R9IHNvdXJjZXMgVGhlIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgYXNzaWduZWQgdmFsdWVzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqIEBzZWUgXy5hc3NpZ25XaXRoXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIGN1c3RvbWl6ZXIob2JqVmFsdWUsIHNyY1ZhbHVlKSB7XG4gKiAgIHJldHVybiBfLmlzVW5kZWZpbmVkKG9ialZhbHVlKSA/IHNyY1ZhbHVlIDogb2JqVmFsdWU7XG4gKiB9XG4gKlxuICogdmFyIGRlZmF1bHRzID0gXy5wYXJ0aWFsUmlnaHQoXy5hc3NpZ25JbldpdGgsIGN1c3RvbWl6ZXIpO1xuICpcbiAqIGRlZmF1bHRzKHsgJ2EnOiAxIH0sIHsgJ2InOiAyIH0sIHsgJ2EnOiAzIH0pO1xuICogLy8gPT4geyAnYSc6IDEsICdiJzogMiB9XG4gKi9cbnZhciBhc3NpZ25JbldpdGggPSBjcmVhdGVBc3NpZ25lcihmdW5jdGlvbihvYmplY3QsIHNvdXJjZSwgc3JjSW5kZXgsIGN1c3RvbWl6ZXIpIHtcbiAgY29weU9iamVjdChzb3VyY2UsIGtleXNJbihzb3VyY2UpLCBvYmplY3QsIGN1c3RvbWl6ZXIpO1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGFzc2lnbkluV2l0aDtcbiIsIi8qKlxuICogQ3JlYXRlcyBhIHVuYXJ5IGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCBpdHMgYXJndW1lbnQgdHJhbnNmb3JtZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0cmFuc2Zvcm0gVGhlIGFyZ3VtZW50IHRyYW5zZm9ybS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBvdmVyQXJnKGZ1bmMsIHRyYW5zZm9ybSkge1xuICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIGZ1bmModHJhbnNmb3JtKGFyZykpO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBvdmVyQXJnO1xuIiwiaW1wb3J0IG92ZXJBcmcgZnJvbSAnLi9fb3ZlckFyZy5qcyc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIGdldFByb3RvdHlwZSA9IG92ZXJBcmcoT2JqZWN0LmdldFByb3RvdHlwZU9mLCBPYmplY3QpO1xuXG5leHBvcnQgZGVmYXVsdCBnZXRQcm90b3R5cGU7XG4iLCJpbXBvcnQgYmFzZUdldFRhZyBmcm9tICcuL19iYXNlR2V0VGFnLmpzJztcbmltcG9ydCBnZXRQcm90b3R5cGUgZnJvbSAnLi9fZ2V0UHJvdG90eXBlLmpzJztcbmltcG9ydCBpc09iamVjdExpa2UgZnJvbSAnLi9pc09iamVjdExpa2UuanMnO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0VGFnID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGUsXG4gICAgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZnVuY1RvU3RyaW5nID0gZnVuY1Byb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBpbmZlciB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IuICovXG52YXIgb2JqZWN0Q3RvclN0cmluZyA9IGZ1bmNUb1N0cmluZy5jYWxsKE9iamVjdCk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIHRoYXQgaXMsIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZVxuICogYE9iamVjdGAgY29uc3RydWN0b3Igb3Igb25lIHdpdGggYSBgW1tQcm90b3R5cGVdXWAgb2YgYG51bGxgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC44LjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqIH1cbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QobmV3IEZvbyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoeyAneCc6IDAsICd5JzogMCB9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoT2JqZWN0LmNyZWF0ZShudWxsKSk7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgaWYgKCFpc09iamVjdExpa2UodmFsdWUpIHx8IGJhc2VHZXRUYWcodmFsdWUpICE9IG9iamVjdFRhZykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgcHJvdG8gPSBnZXRQcm90b3R5cGUodmFsdWUpO1xuICBpZiAocHJvdG8gPT09IG51bGwpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgQ3RvciA9IGhhc093blByb3BlcnR5LmNhbGwocHJvdG8sICdjb25zdHJ1Y3RvcicpICYmIHByb3RvLmNvbnN0cnVjdG9yO1xuICByZXR1cm4gdHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yIGluc3RhbmNlb2YgQ3RvciAmJlxuICAgIGZ1bmNUb1N0cmluZy5jYWxsKEN0b3IpID09IG9iamVjdEN0b3JTdHJpbmc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGlzUGxhaW5PYmplY3Q7XG4iLCJpbXBvcnQgYmFzZUdldFRhZyBmcm9tICcuL19iYXNlR2V0VGFnLmpzJztcbmltcG9ydCBpc09iamVjdExpa2UgZnJvbSAnLi9pc09iamVjdExpa2UuanMnO1xuaW1wb3J0IGlzUGxhaW5PYmplY3QgZnJvbSAnLi9pc1BsYWluT2JqZWN0LmpzJztcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGRvbUV4Y1RhZyA9ICdbb2JqZWN0IERPTUV4Y2VwdGlvbl0nLFxuICAgIGVycm9yVGFnID0gJ1tvYmplY3QgRXJyb3JdJztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhbiBgRXJyb3JgLCBgRXZhbEVycm9yYCwgYFJhbmdlRXJyb3JgLCBgUmVmZXJlbmNlRXJyb3JgLFxuICogYFN5bnRheEVycm9yYCwgYFR5cGVFcnJvcmAsIG9yIGBVUklFcnJvcmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMy4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGVycm9yIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRXJyb3IobmV3IEVycm9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRXJyb3IoRXJyb3IpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNFcnJvcih2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0TGlrZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHRhZyA9IGJhc2VHZXRUYWcodmFsdWUpO1xuICByZXR1cm4gdGFnID09IGVycm9yVGFnIHx8IHRhZyA9PSBkb21FeGNUYWcgfHxcbiAgICAodHlwZW9mIHZhbHVlLm1lc3NhZ2UgPT0gJ3N0cmluZycgJiYgdHlwZW9mIHZhbHVlLm5hbWUgPT0gJ3N0cmluZycgJiYgIWlzUGxhaW5PYmplY3QodmFsdWUpKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgaXNFcnJvcjtcbiIsImltcG9ydCBhcHBseSBmcm9tICcuL19hcHBseS5qcyc7XG5pbXBvcnQgYmFzZVJlc3QgZnJvbSAnLi9fYmFzZVJlc3QuanMnO1xuaW1wb3J0IGlzRXJyb3IgZnJvbSAnLi9pc0Vycm9yLmpzJztcblxuLyoqXG4gKiBBdHRlbXB0cyB0byBpbnZva2UgYGZ1bmNgLCByZXR1cm5pbmcgZWl0aGVyIHRoZSByZXN1bHQgb3IgdGhlIGNhdWdodCBlcnJvclxuICogb2JqZWN0LiBBbnkgYWRkaXRpb25hbCBhcmd1bWVudHMgYXJlIHByb3ZpZGVkIHRvIGBmdW5jYCB3aGVuIGl0J3MgaW52b2tlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDMuMC4wXG4gKiBAY2F0ZWdvcnkgVXRpbFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXR0ZW1wdC5cbiAqIEBwYXJhbSB7Li4uKn0gW2FyZ3NdIFRoZSBhcmd1bWVudHMgdG8gaW52b2tlIGBmdW5jYCB3aXRoLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGBmdW5jYCByZXN1bHQgb3IgZXJyb3Igb2JqZWN0LlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCB0aHJvd2luZyBlcnJvcnMgZm9yIGludmFsaWQgc2VsZWN0b3JzLlxuICogdmFyIGVsZW1lbnRzID0gXy5hdHRlbXB0KGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gKiAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAqIH0sICc+Xz4nKTtcbiAqXG4gKiBpZiAoXy5pc0Vycm9yKGVsZW1lbnRzKSkge1xuICogICBlbGVtZW50cyA9IFtdO1xuICogfVxuICovXG52YXIgYXR0ZW1wdCA9IGJhc2VSZXN0KGZ1bmN0aW9uKGZ1bmMsIGFyZ3MpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXBwbHkoZnVuYywgdW5kZWZpbmVkLCBhcmdzKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBpc0Vycm9yKGUpID8gZSA6IG5ldyBFcnJvcihlKTtcbiAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGF0dGVtcHQ7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5tYXBgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZVxuICogc2hvcnRoYW5kcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gW2FycmF5XSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYXJyYXlNYXAoYXJyYXksIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkgPT0gbnVsbCA/IDAgOiBhcnJheS5sZW5ndGgsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhcnJheU1hcDtcbiIsImltcG9ydCBhcnJheU1hcCBmcm9tICcuL19hcnJheU1hcC5qcyc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udmFsdWVzYCBhbmQgYF8udmFsdWVzSW5gIHdoaWNoIGNyZWF0ZXMgYW5cbiAqIGFycmF5IG9mIGBvYmplY3RgIHByb3BlcnR5IHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcm9wZXJ0eSBuYW1lc1xuICogb2YgYHByb3BzYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtBcnJheX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIGdldCB2YWx1ZXMgZm9yLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBiYXNlVmFsdWVzKG9iamVjdCwgcHJvcHMpIHtcbiAgcmV0dXJuIGFycmF5TWFwKHByb3BzLCBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gb2JqZWN0W2tleV07XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBiYXNlVmFsdWVzO1xuIiwiaW1wb3J0IGVxIGZyb20gJy4vZXEuanMnO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgYnkgYF8uZGVmYXVsdHNgIHRvIGN1c3RvbWl6ZSBpdHMgYF8uYXNzaWduSW5gIHVzZSB0byBhc3NpZ24gcHJvcGVydGllc1xuICogb2Ygc291cmNlIG9iamVjdHMgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdCBmb3IgYWxsIGRlc3RpbmF0aW9uIHByb3BlcnRpZXNcbiAqIHRoYXQgcmVzb2x2ZSB0byBgdW5kZWZpbmVkYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSBvYmpWYWx1ZSBUaGUgZGVzdGluYXRpb24gdmFsdWUuXG4gKiBAcGFyYW0geyp9IHNyY1ZhbHVlIFRoZSBzb3VyY2UgdmFsdWUuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGFzc2lnbi5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHBhcmVudCBvYmplY3Qgb2YgYG9ialZhbHVlYC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSB2YWx1ZSB0byBhc3NpZ24uXG4gKi9cbmZ1bmN0aW9uIGN1c3RvbURlZmF1bHRzQXNzaWduSW4ob2JqVmFsdWUsIHNyY1ZhbHVlLCBrZXksIG9iamVjdCkge1xuICBpZiAob2JqVmFsdWUgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgKGVxKG9ialZhbHVlLCBvYmplY3RQcm90b1trZXldKSAmJiAhaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpKSB7XG4gICAgcmV0dXJuIHNyY1ZhbHVlO1xuICB9XG4gIHJldHVybiBvYmpWYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3VzdG9tRGVmYXVsdHNBc3NpZ25JbjtcbiIsIi8qKiBVc2VkIHRvIGVzY2FwZSBjaGFyYWN0ZXJzIGZvciBpbmNsdXNpb24gaW4gY29tcGlsZWQgc3RyaW5nIGxpdGVyYWxzLiAqL1xudmFyIHN0cmluZ0VzY2FwZXMgPSB7XG4gICdcXFxcJzogJ1xcXFwnLFxuICBcIidcIjogXCInXCIsXG4gICdcXG4nOiAnbicsXG4gICdcXHInOiAncicsXG4gICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgJ1xcdTIwMjknOiAndTIwMjknXG59O1xuXG4vKipcbiAqIFVzZWQgYnkgYF8udGVtcGxhdGVgIHRvIGVzY2FwZSBjaGFyYWN0ZXJzIGZvciBpbmNsdXNpb24gaW4gY29tcGlsZWQgc3RyaW5nIGxpdGVyYWxzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gY2hyIFRoZSBtYXRjaGVkIGNoYXJhY3RlciB0byBlc2NhcGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAqL1xuZnVuY3Rpb24gZXNjYXBlU3RyaW5nQ2hhcihjaHIpIHtcbiAgcmV0dXJuICdcXFxcJyArIHN0cmluZ0VzY2FwZXNbY2hyXTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZXNjYXBlU3RyaW5nQ2hhcjtcbiIsImltcG9ydCBvdmVyQXJnIGZyb20gJy4vX292ZXJBcmcuanMnO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlS2V5cyA9IG92ZXJBcmcoT2JqZWN0LmtleXMsIE9iamVjdCk7XG5cbmV4cG9ydCBkZWZhdWx0IG5hdGl2ZUtleXM7XG4iLCJpbXBvcnQgaXNQcm90b3R5cGUgZnJvbSAnLi9faXNQcm90b3R5cGUuanMnO1xuaW1wb3J0IG5hdGl2ZUtleXMgZnJvbSAnLi9fbmF0aXZlS2V5cy5qcyc7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ua2V5c2Agd2hpY2ggZG9lc24ndCB0cmVhdCBzcGFyc2UgYXJyYXlzIGFzIGRlbnNlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICovXG5mdW5jdGlvbiBiYXNlS2V5cyhvYmplY3QpIHtcbiAgaWYgKCFpc1Byb3RvdHlwZShvYmplY3QpKSB7XG4gICAgcmV0dXJuIG5hdGl2ZUtleXMob2JqZWN0KTtcbiAgfVxuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGtleSBpbiBPYmplY3Qob2JqZWN0KSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSAmJiBrZXkgIT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZUtleXM7XG4iLCJpbXBvcnQgYXJyYXlMaWtlS2V5cyBmcm9tICcuL19hcnJheUxpa2VLZXlzLmpzJztcbmltcG9ydCBiYXNlS2V5cyBmcm9tICcuL19iYXNlS2V5cy5qcyc7XG5pbXBvcnQgaXNBcnJheUxpa2UgZnJvbSAnLi9pc0FycmF5TGlrZS5qcyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuIFNlZSB0aGVcbiAqIFtFUyBzcGVjXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3Qua2V5cylcbiAqIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQHN0YXRpY1xuICogQHNpbmNlIDAuMS4wXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5rZXlzKG5ldyBGb28pO1xuICogLy8gPT4gWydhJywgJ2InXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICpcbiAqIF8ua2V5cygnaGknKTtcbiAqIC8vID0+IFsnMCcsICcxJ11cbiAqL1xuZnVuY3Rpb24ga2V5cyhvYmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXlMaWtlKG9iamVjdCkgPyBhcnJheUxpa2VLZXlzKG9iamVjdCkgOiBiYXNlS2V5cyhvYmplY3QpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBrZXlzO1xuIiwiLyoqIFVzZWQgdG8gbWF0Y2ggdGVtcGxhdGUgZGVsaW1pdGVycy4gKi9cbnZhciByZUludGVycG9sYXRlID0gLzwlPShbXFxzXFxTXSs/KSU+L2c7XG5cbmV4cG9ydCBkZWZhdWx0IHJlSW50ZXJwb2xhdGU7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnByb3BlcnR5T2ZgIHdpdGhvdXQgc3VwcG9ydCBmb3IgZGVlcCBwYXRocy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYWNjZXNzb3IgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eU9mKG9iamVjdCkge1xuICByZXR1cm4gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGJhc2VQcm9wZXJ0eU9mO1xuIiwiaW1wb3J0IGJhc2VQcm9wZXJ0eU9mIGZyb20gJy4vX2Jhc2VQcm9wZXJ0eU9mLmpzJztcblxuLyoqIFVzZWQgdG8gbWFwIGNoYXJhY3RlcnMgdG8gSFRNTCBlbnRpdGllcy4gKi9cbnZhciBodG1sRXNjYXBlcyA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnLFxuICBcIidcIjogJyYjMzk7J1xufTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLmVzY2FwZWAgdG8gY29udmVydCBjaGFyYWN0ZXJzIHRvIEhUTUwgZW50aXRpZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaHIgVGhlIG1hdGNoZWQgY2hhcmFjdGVyIHRvIGVzY2FwZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxuICovXG52YXIgZXNjYXBlSHRtbENoYXIgPSBiYXNlUHJvcGVydHlPZihodG1sRXNjYXBlcyk7XG5cbmV4cG9ydCBkZWZhdWx0IGVzY2FwZUh0bWxDaGFyO1xuIiwiaW1wb3J0IGJhc2VHZXRUYWcgZnJvbSAnLi9fYmFzZUdldFRhZy5qcyc7XG5pbXBvcnQgaXNPYmplY3RMaWtlIGZyb20gJy4vaXNPYmplY3RMaWtlLmpzJztcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpc1N5bWJvbDtcbiIsImltcG9ydCBTeW1ib2wgZnJvbSAnLi9fU3ltYm9sLmpzJztcbmltcG9ydCBhcnJheU1hcCBmcm9tICcuL19hcnJheU1hcC5qcyc7XG5pbXBvcnQgaXNBcnJheSBmcm9tICcuL2lzQXJyYXkuanMnO1xuaW1wb3J0IGlzU3ltYm9sIGZyb20gJy4vaXNTeW1ib2wuanMnO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBJTkZJTklUWSA9IDEgLyAwO1xuXG4vKiogVXNlZCB0byBjb252ZXJ0IHN5bWJvbHMgdG8gcHJpbWl0aXZlcyBhbmQgc3RyaW5ncy4gKi9cbnZhciBzeW1ib2xQcm90byA9IFN5bWJvbCA/IFN5bWJvbC5wcm90b3R5cGUgOiB1bmRlZmluZWQsXG4gICAgc3ltYm9sVG9TdHJpbmcgPSBzeW1ib2xQcm90byA/IHN5bWJvbFByb3RvLnRvU3RyaW5nIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnRvU3RyaW5nYCB3aGljaCBkb2Vzbid0IGNvbnZlcnQgbnVsbGlzaFxuICogdmFsdWVzIHRvIGVtcHR5IHN0cmluZ3MuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUb1N0cmluZyh2YWx1ZSkge1xuICAvLyBFeGl0IGVhcmx5IGZvciBzdHJpbmdzIHRvIGF2b2lkIGEgcGVyZm9ybWFuY2UgaGl0IGluIHNvbWUgZW52aXJvbm1lbnRzLlxuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbnZlcnQgdmFsdWVzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgcmV0dXJuIGFycmF5TWFwKHZhbHVlLCBiYXNlVG9TdHJpbmcpICsgJyc7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBzeW1ib2xUb1N0cmluZyA/IHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBiYXNlVG9TdHJpbmc7XG4iLCJpbXBvcnQgYmFzZVRvU3RyaW5nIGZyb20gJy4vX2Jhc2VUb1N0cmluZy5qcyc7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZy4gQW4gZW1wdHkgc3RyaW5nIGlzIHJldHVybmVkIGZvciBgbnVsbGBcbiAqIGFuZCBgdW5kZWZpbmVkYCB2YWx1ZXMuIFRoZSBzaWduIG9mIGAtMGAgaXMgcHJlc2VydmVkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b1N0cmluZyhudWxsKTtcbiAqIC8vID0+ICcnXG4gKlxuICogXy50b1N0cmluZygtMCk7XG4gKiAvLyA9PiAnLTAnXG4gKlxuICogXy50b1N0cmluZyhbMSwgMiwgM10pO1xuICogLy8gPT4gJzEsMiwzJ1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogYmFzZVRvU3RyaW5nKHZhbHVlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgdG9TdHJpbmc7XG4iLCJpbXBvcnQgZXNjYXBlSHRtbENoYXIgZnJvbSAnLi9fZXNjYXBlSHRtbENoYXIuanMnO1xuaW1wb3J0IHRvU3RyaW5nIGZyb20gJy4vdG9TdHJpbmcuanMnO1xuXG4vKiogVXNlZCB0byBtYXRjaCBIVE1MIGVudGl0aWVzIGFuZCBIVE1MIGNoYXJhY3RlcnMuICovXG52YXIgcmVVbmVzY2FwZWRIdG1sID0gL1smPD5cIiddL2csXG4gICAgcmVIYXNVbmVzY2FwZWRIdG1sID0gUmVnRXhwKHJlVW5lc2NhcGVkSHRtbC5zb3VyY2UpO1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBjaGFyYWN0ZXJzIFwiJlwiLCBcIjxcIiwgXCI+XCIsICdcIicsIGFuZCBcIidcIiBpbiBgc3RyaW5nYCB0byB0aGVpclxuICogY29ycmVzcG9uZGluZyBIVE1MIGVudGl0aWVzLlxuICpcbiAqICoqTm90ZToqKiBObyBvdGhlciBjaGFyYWN0ZXJzIGFyZSBlc2NhcGVkLiBUbyBlc2NhcGUgYWRkaXRpb25hbFxuICogY2hhcmFjdGVycyB1c2UgYSB0aGlyZC1wYXJ0eSBsaWJyYXJ5IGxpa2UgW19oZV9dKGh0dHBzOi8vbXRocy5iZS9oZSkuXG4gKlxuICogVGhvdWdoIHRoZSBcIj5cIiBjaGFyYWN0ZXIgaXMgZXNjYXBlZCBmb3Igc3ltbWV0cnksIGNoYXJhY3RlcnMgbGlrZVxuICogXCI+XCIgYW5kIFwiL1wiIGRvbid0IG5lZWQgZXNjYXBpbmcgaW4gSFRNTCBhbmQgaGF2ZSBubyBzcGVjaWFsIG1lYW5pbmdcbiAqIHVubGVzcyB0aGV5J3JlIHBhcnQgb2YgYSB0YWcgb3IgdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlLiBTZWVcbiAqIFtNYXRoaWFzIEJ5bmVucydzIGFydGljbGVdKGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9hbWJpZ3VvdXMtYW1wZXJzYW5kcylcbiAqICh1bmRlciBcInNlbWktcmVsYXRlZCBmdW4gZmFjdFwiKSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFdoZW4gd29ya2luZyB3aXRoIEhUTUwgeW91IHNob3VsZCBhbHdheXNcbiAqIFtxdW90ZSBhdHRyaWJ1dGUgdmFsdWVzXShodHRwOi8vd29ua28uY29tL3Bvc3QvaHRtbC1lc2NhcGluZykgdG8gcmVkdWNlXG4gKiBYU1MgdmVjdG9ycy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgU3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW3N0cmluZz0nJ10gVGhlIHN0cmluZyB0byBlc2NhcGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5lc2NhcGUoJ2ZyZWQsIGJhcm5leSwgJiBwZWJibGVzJyk7XG4gKiAvLyA9PiAnZnJlZCwgYmFybmV5LCAmYW1wOyBwZWJibGVzJ1xuICovXG5mdW5jdGlvbiBlc2NhcGUoc3RyaW5nKSB7XG4gIHN0cmluZyA9IHRvU3RyaW5nKHN0cmluZyk7XG4gIHJldHVybiAoc3RyaW5nICYmIHJlSGFzVW5lc2NhcGVkSHRtbC50ZXN0KHN0cmluZykpXG4gICAgPyBzdHJpbmcucmVwbGFjZShyZVVuZXNjYXBlZEh0bWwsIGVzY2FwZUh0bWxDaGFyKVxuICAgIDogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBlc2NhcGU7XG4iLCIvKiogVXNlZCB0byBtYXRjaCB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLiAqL1xudmFyIHJlRXNjYXBlID0gLzwlLShbXFxzXFxTXSs/KSU+L2c7XG5cbmV4cG9ydCBkZWZhdWx0IHJlRXNjYXBlO1xuIiwiLyoqIFVzZWQgdG8gbWF0Y2ggdGVtcGxhdGUgZGVsaW1pdGVycy4gKi9cbnZhciByZUV2YWx1YXRlID0gLzwlKFtcXHNcXFNdKz8pJT4vZztcblxuZXhwb3J0IGRlZmF1bHQgcmVFdmFsdWF0ZTtcbiIsImltcG9ydCBlc2NhcGUgZnJvbSAnLi9lc2NhcGUuanMnO1xuaW1wb3J0IHJlRXNjYXBlIGZyb20gJy4vX3JlRXNjYXBlLmpzJztcbmltcG9ydCByZUV2YWx1YXRlIGZyb20gJy4vX3JlRXZhbHVhdGUuanMnO1xuaW1wb3J0IHJlSW50ZXJwb2xhdGUgZnJvbSAnLi9fcmVJbnRlcnBvbGF0ZS5qcyc7XG5cbi8qKlxuICogQnkgZGVmYXVsdCwgdGhlIHRlbXBsYXRlIGRlbGltaXRlcnMgdXNlZCBieSBsb2Rhc2ggYXJlIGxpa2UgdGhvc2UgaW5cbiAqIGVtYmVkZGVkIFJ1YnkgKEVSQikgYXMgd2VsbCBhcyBFUzIwMTUgdGVtcGxhdGUgc3RyaW5ncy4gQ2hhbmdlIHRoZVxuICogZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZSBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG52YXIgdGVtcGxhdGVTZXR0aW5ncyA9IHtcblxuICAvKipcbiAgICogVXNlZCB0byBkZXRlY3QgYGRhdGFgIHByb3BlcnR5IHZhbHVlcyB0byBiZSBIVE1MLWVzY2FwZWQuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUge1JlZ0V4cH1cbiAgICovXG4gICdlc2NhcGUnOiByZUVzY2FwZSxcblxuICAvKipcbiAgICogVXNlZCB0byBkZXRlY3QgY29kZSB0byBiZSBldmFsdWF0ZWQuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUge1JlZ0V4cH1cbiAgICovXG4gICdldmFsdWF0ZSc6IHJlRXZhbHVhdGUsXG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZGV0ZWN0IGBkYXRhYCBwcm9wZXJ0eSB2YWx1ZXMgdG8gaW5qZWN0LlxuICAgKlxuICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAqIEB0eXBlIHtSZWdFeHB9XG4gICAqL1xuICAnaW50ZXJwb2xhdGUnOiByZUludGVycG9sYXRlLFxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHJlZmVyZW5jZSB0aGUgZGF0YSBvYmplY3QgaW4gdGhlIHRlbXBsYXRlIHRleHQuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gICd2YXJpYWJsZSc6ICcnLFxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGltcG9ydCB2YXJpYWJsZXMgaW50byB0aGUgY29tcGlsZWQgdGVtcGxhdGUuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gICdpbXBvcnRzJzoge1xuXG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGBsb2Rhc2hgIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5ncy5pbXBvcnRzXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgICdfJzogeyAnZXNjYXBlJzogZXNjYXBlIH1cbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgdGVtcGxhdGVTZXR0aW5ncztcbiIsImltcG9ydCBhc3NpZ25JbldpdGggZnJvbSAnLi9hc3NpZ25JbldpdGguanMnO1xuaW1wb3J0IGF0dGVtcHQgZnJvbSAnLi9hdHRlbXB0LmpzJztcbmltcG9ydCBiYXNlVmFsdWVzIGZyb20gJy4vX2Jhc2VWYWx1ZXMuanMnO1xuaW1wb3J0IGN1c3RvbURlZmF1bHRzQXNzaWduSW4gZnJvbSAnLi9fY3VzdG9tRGVmYXVsdHNBc3NpZ25Jbi5qcyc7XG5pbXBvcnQgZXNjYXBlU3RyaW5nQ2hhciBmcm9tICcuL19lc2NhcGVTdHJpbmdDaGFyLmpzJztcbmltcG9ydCBpc0Vycm9yIGZyb20gJy4vaXNFcnJvci5qcyc7XG5pbXBvcnQgaXNJdGVyYXRlZUNhbGwgZnJvbSAnLi9faXNJdGVyYXRlZUNhbGwuanMnO1xuaW1wb3J0IGtleXMgZnJvbSAnLi9rZXlzLmpzJztcbmltcG9ydCByZUludGVycG9sYXRlIGZyb20gJy4vX3JlSW50ZXJwb2xhdGUuanMnO1xuaW1wb3J0IHRlbXBsYXRlU2V0dGluZ3MgZnJvbSAnLi90ZW1wbGF0ZVNldHRpbmdzLmpzJztcbmltcG9ydCB0b1N0cmluZyBmcm9tICcuL3RvU3RyaW5nLmpzJztcblxuLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xudmFyIElOVkFMSURfVEVNUExfVkFSX0VSUk9SX1RFWFQgPSAnSW52YWxpZCBgdmFyaWFibGVgIG9wdGlvbiBwYXNzZWQgaW50byBgXy50ZW1wbGF0ZWAnO1xuXG4vKiogVXNlZCB0byBtYXRjaCBlbXB0eSBzdHJpbmcgbGl0ZXJhbHMgaW4gY29tcGlsZWQgdGVtcGxhdGUgc291cmNlLiAqL1xudmFyIHJlRW1wdHlTdHJpbmdMZWFkaW5nID0gL1xcYl9fcCBcXCs9ICcnOy9nLFxuICAgIHJlRW1wdHlTdHJpbmdNaWRkbGUgPSAvXFxiKF9fcCBcXCs9KSAnJyBcXCsvZyxcbiAgICByZUVtcHR5U3RyaW5nVHJhaWxpbmcgPSAvKF9fZVxcKC4qP1xcKXxcXGJfX3RcXCkpIFxcK1xcbicnOy9nO1xuXG4vKipcbiAqIFVzZWQgdG8gdmFsaWRhdGUgdGhlIGB2YWxpZGF0ZWAgb3B0aW9uIGluIGBfLnRlbXBsYXRlYCB2YXJpYWJsZS5cbiAqXG4gKiBGb3JiaWRzIGNoYXJhY3RlcnMgd2hpY2ggY291bGQgcG90ZW50aWFsbHkgY2hhbmdlIHRoZSBtZWFuaW5nIG9mIHRoZSBmdW5jdGlvbiBhcmd1bWVudCBkZWZpbml0aW9uOlxuICogLSBcIigpLFwiIChtb2RpZmljYXRpb24gb2YgZnVuY3Rpb24gcGFyYW1ldGVycylcbiAqIC0gXCI9XCIgKGRlZmF1bHQgdmFsdWUpXG4gKiAtIFwiW117fVwiIChkZXN0cnVjdHVyaW5nIG9mIGZ1bmN0aW9uIHBhcmFtZXRlcnMpXG4gKiAtIFwiL1wiIChiZWdpbm5pbmcgb2YgYSBjb21tZW50KVxuICogLSB3aGl0ZXNwYWNlXG4gKi9cbnZhciByZUZvcmJpZGRlbklkZW50aWZpZXJDaGFycyA9IC9bKCk9LHt9XFxbXFxdXFwvXFxzXS87XG5cbi8qKlxuICogVXNlZCB0byBtYXRjaFxuICogW0VTIHRlbXBsYXRlIGRlbGltaXRlcnNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXRlbXBsYXRlLWxpdGVyYWwtbGV4aWNhbC1jb21wb25lbnRzKS5cbiAqL1xudmFyIHJlRXNUZW1wbGF0ZSA9IC9cXCRcXHsoW15cXFxcfV0qKD86XFxcXC5bXlxcXFx9XSopKilcXH0vZztcblxuLyoqIFVzZWQgdG8gZW5zdXJlIGNhcHR1cmluZyBvcmRlciBvZiB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLiAqL1xudmFyIHJlTm9NYXRjaCA9IC8oJF4pLztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggdW5lc2NhcGVkIGNoYXJhY3RlcnMgaW4gY29tcGlsZWQgc3RyaW5nIGxpdGVyYWxzLiAqL1xudmFyIHJlVW5lc2NhcGVkU3RyaW5nID0gL1snXFxuXFxyXFx1MjAyOFxcdTIwMjlcXFxcXS9nO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBjb21waWxlZCB0ZW1wbGF0ZSBmdW5jdGlvbiB0aGF0IGNhbiBpbnRlcnBvbGF0ZSBkYXRhIHByb3BlcnRpZXNcbiAqIGluIFwiaW50ZXJwb2xhdGVcIiBkZWxpbWl0ZXJzLCBIVE1MLWVzY2FwZSBpbnRlcnBvbGF0ZWQgZGF0YSBwcm9wZXJ0aWVzIGluXG4gKiBcImVzY2FwZVwiIGRlbGltaXRlcnMsIGFuZCBleGVjdXRlIEphdmFTY3JpcHQgaW4gXCJldmFsdWF0ZVwiIGRlbGltaXRlcnMuIERhdGFcbiAqIHByb3BlcnRpZXMgbWF5IGJlIGFjY2Vzc2VkIGFzIGZyZWUgdmFyaWFibGVzIGluIHRoZSB0ZW1wbGF0ZS4gSWYgYSBzZXR0aW5nXG4gKiBvYmplY3QgaXMgZ2l2ZW4sIGl0IHRha2VzIHByZWNlZGVuY2Ugb3ZlciBgXy50ZW1wbGF0ZVNldHRpbmdzYCB2YWx1ZXMuXG4gKlxuICogKipOb3RlOioqIEluIHRoZSBkZXZlbG9wbWVudCBidWlsZCBgXy50ZW1wbGF0ZWAgdXRpbGl6ZXNcbiAqIFtzb3VyY2VVUkxzXShodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9kZXZlbG9wZXJ0b29scy9zb3VyY2VtYXBzLyN0b2Mtc291cmNldXJsKVxuICogZm9yIGVhc2llciBkZWJ1Z2dpbmcuXG4gKlxuICogRm9yIG1vcmUgaW5mb3JtYXRpb24gb24gcHJlY29tcGlsaW5nIHRlbXBsYXRlcyBzZWVcbiAqIFtsb2Rhc2gncyBjdXN0b20gYnVpbGRzIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vbG9kYXNoLmNvbS9jdXN0b20tYnVpbGRzKS5cbiAqXG4gKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBDaHJvbWUgZXh0ZW5zaW9uIHNhbmRib3hlcyBzZWVcbiAqIFtDaHJvbWUncyBleHRlbnNpb25zIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vZXh0ZW5zaW9ucy9zYW5kYm94aW5nRXZhbCkuXG4gKlxuICogQHN0YXRpY1xuICogQHNpbmNlIDAuMS4wXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtzdHJpbmc9JyddIFRoZSB0ZW1wbGF0ZSBzdHJpbmcuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7UmVnRXhwfSBbb3B0aW9ucy5lc2NhcGU9Xy50ZW1wbGF0ZVNldHRpbmdzLmVzY2FwZV1cbiAqICBUaGUgSFRNTCBcImVzY2FwZVwiIGRlbGltaXRlci5cbiAqIEBwYXJhbSB7UmVnRXhwfSBbb3B0aW9ucy5ldmFsdWF0ZT1fLnRlbXBsYXRlU2V0dGluZ3MuZXZhbHVhdGVdXG4gKiAgVGhlIFwiZXZhbHVhdGVcIiBkZWxpbWl0ZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuaW1wb3J0cz1fLnRlbXBsYXRlU2V0dGluZ3MuaW1wb3J0c11cbiAqICBBbiBvYmplY3QgdG8gaW1wb3J0IGludG8gdGhlIHRlbXBsYXRlIGFzIGZyZWUgdmFyaWFibGVzLlxuICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLmludGVycG9sYXRlPV8udGVtcGxhdGVTZXR0aW5ncy5pbnRlcnBvbGF0ZV1cbiAqICBUaGUgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zb3VyY2VVUkw9J3RlbXBsYXRlU291cmNlc1tuXSddXG4gKiAgVGhlIHNvdXJjZVVSTCBvZiB0aGUgY29tcGlsZWQgdGVtcGxhdGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudmFyaWFibGU9J29iaiddXG4gKiAgVGhlIGRhdGEgb2JqZWN0IHZhcmlhYmxlIG5hbWUuXG4gKiBAcGFyYW0tIHtPYmplY3R9IFtndWFyZF0gRW5hYmxlcyB1c2UgYXMgYW4gaXRlcmF0ZWUgZm9yIG1ldGhvZHMgbGlrZSBgXy5tYXBgLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjb21waWxlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gVXNlIHRoZSBcImludGVycG9sYXRlXCIgZGVsaW1pdGVyIHRvIGNyZWF0ZSBhIGNvbXBpbGVkIHRlbXBsYXRlLlxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGVsbG8gPCU9IHVzZXIgJT4hJyk7XG4gKiBjb21waWxlZCh7ICd1c2VyJzogJ2ZyZWQnIH0pO1xuICogLy8gPT4gJ2hlbGxvIGZyZWQhJ1xuICpcbiAqIC8vIFVzZSB0aGUgSFRNTCBcImVzY2FwZVwiIGRlbGltaXRlciB0byBlc2NhcGUgZGF0YSBwcm9wZXJ0eSB2YWx1ZXMuXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCc8Yj48JS0gdmFsdWUgJT48L2I+Jyk7XG4gKiBjb21waWxlZCh7ICd2YWx1ZSc6ICc8c2NyaXB0PicgfSk7XG4gKiAvLyA9PiAnPGI+Jmx0O3NjcmlwdCZndDs8L2I+J1xuICpcbiAqIC8vIFVzZSB0aGUgXCJldmFsdWF0ZVwiIGRlbGltaXRlciB0byBleGVjdXRlIEphdmFTY3JpcHQgYW5kIGdlbmVyYXRlIEhUTUwuXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCc8JSBfLmZvckVhY2godXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHsgJT48bGk+PCUtIHVzZXIgJT48L2xpPjwlIH0pOyAlPicpO1xuICogY29tcGlsZWQoeyAndXNlcnMnOiBbJ2ZyZWQnLCAnYmFybmV5J10gfSk7XG4gKiAvLyA9PiAnPGxpPmZyZWQ8L2xpPjxsaT5iYXJuZXk8L2xpPidcbiAqXG4gKiAvLyBVc2UgdGhlIGludGVybmFsIGBwcmludGAgZnVuY3Rpb24gaW4gXCJldmFsdWF0ZVwiIGRlbGltaXRlcnMuXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCc8JSBwcmludChcImhlbGxvIFwiICsgdXNlcik7ICU+IScpO1xuICogY29tcGlsZWQoeyAndXNlcic6ICdiYXJuZXknIH0pO1xuICogLy8gPT4gJ2hlbGxvIGJhcm5leSEnXG4gKlxuICogLy8gVXNlIHRoZSBFUyB0ZW1wbGF0ZSBsaXRlcmFsIGRlbGltaXRlciBhcyBhbiBcImludGVycG9sYXRlXCIgZGVsaW1pdGVyLlxuICogLy8gRGlzYWJsZSBzdXBwb3J0IGJ5IHJlcGxhY2luZyB0aGUgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlci5cbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvICR7IHVzZXIgfSEnKTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXInOiAncGViYmxlcycgfSk7XG4gKiAvLyA9PiAnaGVsbG8gcGViYmxlcyEnXG4gKlxuICogLy8gVXNlIGJhY2tzbGFzaGVzIHRvIHRyZWF0IGRlbGltaXRlcnMgYXMgcGxhaW4gdGV4dC5cbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJzwlPSBcIlxcXFw8JS0gdmFsdWUgJVxcXFw+XCIgJT4nKTtcbiAqIGNvbXBpbGVkKHsgJ3ZhbHVlJzogJ2lnbm9yZWQnIH0pO1xuICogLy8gPT4gJzwlLSB2YWx1ZSAlPidcbiAqXG4gKiAvLyBVc2UgdGhlIGBpbXBvcnRzYCBvcHRpb24gdG8gaW1wb3J0IGBqUXVlcnlgIGFzIGBqcWAuXG4gKiB2YXIgdGV4dCA9ICc8JSBqcS5lYWNoKHVzZXJzLCBmdW5jdGlvbih1c2VyKSB7ICU+PGxpPjwlLSB1c2VyICU+PC9saT48JSB9KTsgJT4nO1xuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSh0ZXh0LCB7ICdpbXBvcnRzJzogeyAnanEnOiBqUXVlcnkgfSB9KTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXJzJzogWydmcmVkJywgJ2Jhcm5leSddIH0pO1xuICogLy8gPT4gJzxsaT5mcmVkPC9saT48bGk+YmFybmV5PC9saT4nXG4gKlxuICogLy8gVXNlIHRoZSBgc291cmNlVVJMYCBvcHRpb24gdG8gc3BlY2lmeSBhIGN1c3RvbSBzb3VyY2VVUkwgZm9yIHRoZSB0ZW1wbGF0ZS5cbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvIDwlPSB1c2VyICU+IScsIHsgJ3NvdXJjZVVSTCc6ICcvYmFzaWMvZ3JlZXRpbmcuanN0JyB9KTtcbiAqIGNvbXBpbGVkKGRhdGEpO1xuICogLy8gPT4gRmluZCB0aGUgc291cmNlIG9mIFwiZ3JlZXRpbmcuanN0XCIgdW5kZXIgdGhlIFNvdXJjZXMgdGFiIG9yIFJlc291cmNlcyBwYW5lbCBvZiB0aGUgd2ViIGluc3BlY3Rvci5cbiAqXG4gKiAvLyBVc2UgdGhlIGB2YXJpYWJsZWAgb3B0aW9uIHRvIGVuc3VyZSBhIHdpdGgtc3RhdGVtZW50IGlzbid0IHVzZWQgaW4gdGhlIGNvbXBpbGVkIHRlbXBsYXRlLlxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGkgPCU9IGRhdGEudXNlciAlPiEnLCB7ICd2YXJpYWJsZSc6ICdkYXRhJyB9KTtcbiAqIGNvbXBpbGVkLnNvdXJjZTtcbiAqIC8vID0+IGZ1bmN0aW9uKGRhdGEpIHtcbiAqIC8vICAgdmFyIF9fdCwgX19wID0gJyc7XG4gKiAvLyAgIF9fcCArPSAnaGkgJyArICgoX190ID0gKCBkYXRhLnVzZXIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArICchJztcbiAqIC8vICAgcmV0dXJuIF9fcDtcbiAqIC8vIH1cbiAqXG4gKiAvLyBVc2UgY3VzdG9tIHRlbXBsYXRlIGRlbGltaXRlcnMuXG4gKiBfLnRlbXBsYXRlU2V0dGluZ3MuaW50ZXJwb2xhdGUgPSAve3soW1xcc1xcU10rPyl9fS9nO1xuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGVsbG8ge3sgdXNlciB9fSEnKTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXInOiAnbXVzdGFjaGUnIH0pO1xuICogLy8gPT4gJ2hlbGxvIG11c3RhY2hlISdcbiAqXG4gKiAvLyBVc2UgdGhlIGBzb3VyY2VgIHByb3BlcnR5IHRvIGlubGluZSBjb21waWxlZCB0ZW1wbGF0ZXMgZm9yIG1lYW5pbmdmdWxcbiAqIC8vIGxpbmUgbnVtYmVycyBpbiBlcnJvciBtZXNzYWdlcyBhbmQgc3RhY2sgdHJhY2VzLlxuICogZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2pzdC5qcycpLCAnXFxcbiAqICAgdmFyIEpTVCA9IHtcXFxuICogICAgIFwibWFpblwiOiAnICsgXy50ZW1wbGF0ZShtYWluVGV4dCkuc291cmNlICsgJ1xcXG4gKiAgIH07XFxcbiAqICcpO1xuICovXG5mdW5jdGlvbiB0ZW1wbGF0ZShzdHJpbmcsIG9wdGlvbnMsIGd1YXJkKSB7XG4gIC8vIEJhc2VkIG9uIEpvaG4gUmVzaWcncyBgdG1wbGAgaW1wbGVtZW50YXRpb25cbiAgLy8gKGh0dHA6Ly9lam9obi5vcmcvYmxvZy9qYXZhc2NyaXB0LW1pY3JvLXRlbXBsYXRpbmcvKVxuICAvLyBhbmQgTGF1cmEgRG9rdG9yb3ZhJ3MgZG9ULmpzIChodHRwczovL2dpdGh1Yi5jb20vb2xhZG8vZG9UKS5cbiAgdmFyIHNldHRpbmdzID0gdGVtcGxhdGVTZXR0aW5ncy5pbXBvcnRzLl8udGVtcGxhdGVTZXR0aW5ncyB8fCB0ZW1wbGF0ZVNldHRpbmdzO1xuXG4gIGlmIChndWFyZCAmJiBpc0l0ZXJhdGVlQ2FsbChzdHJpbmcsIG9wdGlvbnMsIGd1YXJkKSkge1xuICAgIG9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gIH1cbiAgc3RyaW5nID0gdG9TdHJpbmcoc3RyaW5nKTtcbiAgb3B0aW9ucyA9IGFzc2lnbkluV2l0aCh7fSwgb3B0aW9ucywgc2V0dGluZ3MsIGN1c3RvbURlZmF1bHRzQXNzaWduSW4pO1xuXG4gIHZhciBpbXBvcnRzID0gYXNzaWduSW5XaXRoKHt9LCBvcHRpb25zLmltcG9ydHMsIHNldHRpbmdzLmltcG9ydHMsIGN1c3RvbURlZmF1bHRzQXNzaWduSW4pLFxuICAgICAgaW1wb3J0c0tleXMgPSBrZXlzKGltcG9ydHMpLFxuICAgICAgaW1wb3J0c1ZhbHVlcyA9IGJhc2VWYWx1ZXMoaW1wb3J0cywgaW1wb3J0c0tleXMpO1xuXG4gIHZhciBpc0VzY2FwaW5nLFxuICAgICAgaXNFdmFsdWF0aW5nLFxuICAgICAgaW5kZXggPSAwLFxuICAgICAgaW50ZXJwb2xhdGUgPSBvcHRpb25zLmludGVycG9sYXRlIHx8IHJlTm9NYXRjaCxcbiAgICAgIHNvdXJjZSA9IFwiX19wICs9ICdcIjtcblxuICAvLyBDb21waWxlIHRoZSByZWdleHAgdG8gbWF0Y2ggZWFjaCBkZWxpbWl0ZXIuXG4gIHZhciByZURlbGltaXRlcnMgPSBSZWdFeHAoXG4gICAgKG9wdGlvbnMuZXNjYXBlIHx8IHJlTm9NYXRjaCkuc291cmNlICsgJ3wnICtcbiAgICBpbnRlcnBvbGF0ZS5zb3VyY2UgKyAnfCcgK1xuICAgIChpbnRlcnBvbGF0ZSA9PT0gcmVJbnRlcnBvbGF0ZSA/IHJlRXNUZW1wbGF0ZSA6IHJlTm9NYXRjaCkuc291cmNlICsgJ3wnICtcbiAgICAob3B0aW9ucy5ldmFsdWF0ZSB8fCByZU5vTWF0Y2gpLnNvdXJjZSArICd8JCdcbiAgLCAnZycpO1xuXG4gIC8vIFVzZSBhIHNvdXJjZVVSTCBmb3IgZWFzaWVyIGRlYnVnZ2luZy5cbiAgLy8gVGhlIHNvdXJjZVVSTCBnZXRzIGluamVjdGVkIGludG8gdGhlIHNvdXJjZSB0aGF0J3MgZXZhbC1lZCwgc28gYmUgY2FyZWZ1bFxuICAvLyB0byBub3JtYWxpemUgYWxsIGtpbmRzIG9mIHdoaXRlc3BhY2UsIHNvIGUuZy4gbmV3bGluZXMgKGFuZCB1bmljb2RlIHZlcnNpb25zIG9mIGl0KSBjYW4ndCBzbmVhayBpblxuICAvLyBhbmQgZXNjYXBlIHRoZSBjb21tZW50LCB0aHVzIGluamVjdGluZyBjb2RlIHRoYXQgZ2V0cyBldmFsZWQuXG4gIHZhciBzb3VyY2VVUkwgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdzb3VyY2VVUkwnKVxuICAgID8gKCcvLyMgc291cmNlVVJMPScgK1xuICAgICAgIChvcHRpb25zLnNvdXJjZVVSTCArICcnKS5yZXBsYWNlKC9cXHMvZywgJyAnKSArXG4gICAgICAgJ1xcbicpXG4gICAgOiAnJztcblxuICBzdHJpbmcucmVwbGFjZShyZURlbGltaXRlcnMsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGVWYWx1ZSwgaW50ZXJwb2xhdGVWYWx1ZSwgZXNUZW1wbGF0ZVZhbHVlLCBldmFsdWF0ZVZhbHVlLCBvZmZzZXQpIHtcbiAgICBpbnRlcnBvbGF0ZVZhbHVlIHx8IChpbnRlcnBvbGF0ZVZhbHVlID0gZXNUZW1wbGF0ZVZhbHVlKTtcblxuICAgIC8vIEVzY2FwZSBjaGFyYWN0ZXJzIHRoYXQgY2FuJ3QgYmUgaW5jbHVkZWQgaW4gc3RyaW5nIGxpdGVyYWxzLlxuICAgIHNvdXJjZSArPSBzdHJpbmcuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShyZVVuZXNjYXBlZFN0cmluZywgZXNjYXBlU3RyaW5nQ2hhcik7XG5cbiAgICAvLyBSZXBsYWNlIGRlbGltaXRlcnMgd2l0aCBzbmlwcGV0cy5cbiAgICBpZiAoZXNjYXBlVmFsdWUpIHtcbiAgICAgIGlzRXNjYXBpbmcgPSB0cnVlO1xuICAgICAgc291cmNlICs9IFwiJyArXFxuX19lKFwiICsgZXNjYXBlVmFsdWUgKyBcIikgK1xcbidcIjtcbiAgICB9XG4gICAgaWYgKGV2YWx1YXRlVmFsdWUpIHtcbiAgICAgIGlzRXZhbHVhdGluZyA9IHRydWU7XG4gICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGVWYWx1ZSArIFwiO1xcbl9fcCArPSAnXCI7XG4gICAgfVxuICAgIGlmIChpbnRlcnBvbGF0ZVZhbHVlKSB7XG4gICAgICBzb3VyY2UgKz0gXCInICtcXG4oKF9fdCA9IChcIiArIGludGVycG9sYXRlVmFsdWUgKyBcIikpID09IG51bGwgPyAnJyA6IF9fdCkgK1xcbidcIjtcbiAgICB9XG4gICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cbiAgICAvLyBUaGUgSlMgZW5naW5lIGVtYmVkZGVkIGluIEFkb2JlIHByb2R1Y3RzIG5lZWRzIGBtYXRjaGAgcmV0dXJuZWQgaW5cbiAgICAvLyBvcmRlciB0byBwcm9kdWNlIHRoZSBjb3JyZWN0IGBvZmZzZXRgIHZhbHVlLlxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG5cbiAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAvLyBJZiBgdmFyaWFibGVgIGlzIG5vdCBzcGVjaWZpZWQgd3JhcCBhIHdpdGgtc3RhdGVtZW50IGFyb3VuZCB0aGUgZ2VuZXJhdGVkXG4gIC8vIGNvZGUgdG8gYWRkIHRoZSBkYXRhIG9iamVjdCB0byB0aGUgdG9wIG9mIHRoZSBzY29wZSBjaGFpbi5cbiAgdmFyIHZhcmlhYmxlID0gaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAndmFyaWFibGUnKSAmJiBvcHRpb25zLnZhcmlhYmxlO1xuICBpZiAoIXZhcmlhYmxlKSB7XG4gICAgc291cmNlID0gJ3dpdGggKG9iaikge1xcbicgKyBzb3VyY2UgKyAnXFxufVxcbic7XG4gIH1cbiAgLy8gVGhyb3cgYW4gZXJyb3IgaWYgYSBmb3JiaWRkZW4gY2hhcmFjdGVyIHdhcyBmb3VuZCBpbiBgdmFyaWFibGVgLCB0byBwcmV2ZW50XG4gIC8vIHBvdGVudGlhbCBjb21tYW5kIGluamVjdGlvbiBhdHRhY2tzLlxuICBlbHNlIGlmIChyZUZvcmJpZGRlbklkZW50aWZpZXJDaGFycy50ZXN0KHZhcmlhYmxlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihJTlZBTElEX1RFTVBMX1ZBUl9FUlJPUl9URVhUKTtcbiAgfVxuXG4gIC8vIENsZWFudXAgY29kZSBieSBzdHJpcHBpbmcgZW1wdHkgc3RyaW5ncy5cbiAgc291cmNlID0gKGlzRXZhbHVhdGluZyA/IHNvdXJjZS5yZXBsYWNlKHJlRW1wdHlTdHJpbmdMZWFkaW5nLCAnJykgOiBzb3VyY2UpXG4gICAgLnJlcGxhY2UocmVFbXB0eVN0cmluZ01pZGRsZSwgJyQxJylcbiAgICAucmVwbGFjZShyZUVtcHR5U3RyaW5nVHJhaWxpbmcsICckMTsnKTtcblxuICAvLyBGcmFtZSBjb2RlIGFzIHRoZSBmdW5jdGlvbiBib2R5LlxuICBzb3VyY2UgPSAnZnVuY3Rpb24oJyArICh2YXJpYWJsZSB8fCAnb2JqJykgKyAnKSB7XFxuJyArXG4gICAgKHZhcmlhYmxlXG4gICAgICA/ICcnXG4gICAgICA6ICdvYmogfHwgKG9iaiA9IHt9KTtcXG4nXG4gICAgKSArXG4gICAgXCJ2YXIgX190LCBfX3AgPSAnJ1wiICtcbiAgICAoaXNFc2NhcGluZ1xuICAgICAgID8gJywgX19lID0gXy5lc2NhcGUnXG4gICAgICAgOiAnJ1xuICAgICkgK1xuICAgIChpc0V2YWx1YXRpbmdcbiAgICAgID8gJywgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XFxuJyArXG4gICAgICAgIFwiZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XFxuXCJcbiAgICAgIDogJztcXG4nXG4gICAgKSArXG4gICAgc291cmNlICtcbiAgICAncmV0dXJuIF9fcFxcbn0nO1xuXG4gIHZhciByZXN1bHQgPSBhdHRlbXB0KGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBGdW5jdGlvbihpbXBvcnRzS2V5cywgc291cmNlVVJMICsgJ3JldHVybiAnICsgc291cmNlKVxuICAgICAgLmFwcGx5KHVuZGVmaW5lZCwgaW1wb3J0c1ZhbHVlcyk7XG4gIH0pO1xuXG4gIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uJ3Mgc291cmNlIGJ5IGl0cyBgdG9TdHJpbmdgIG1ldGhvZCBvclxuICAvLyB0aGUgYHNvdXJjZWAgcHJvcGVydHkgYXMgYSBjb252ZW5pZW5jZSBmb3IgaW5saW5pbmcgY29tcGlsZWQgdGVtcGxhdGVzLlxuICByZXN1bHQuc291cmNlID0gc291cmNlO1xuICBpZiAoaXNFcnJvcihyZXN1bHQpKSB7XG4gICAgdGhyb3cgcmVzdWx0O1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHRlbXBsYXRlO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uZm9yRWFjaGAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yXG4gKiBpdGVyYXRlZSBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5RWFjaChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheSA9PSBudWxsID8gMCA6IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGlmIChpdGVyYXRlZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkgPT09IGZhbHNlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhcnJheUVhY2g7XG4iLCIvKipcbiAqIENyZWF0ZXMgYSBiYXNlIGZ1bmN0aW9uIGZvciBtZXRob2RzIGxpa2UgYF8uZm9ySW5gIGFuZCBgXy5mb3JPd25gLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJhc2UgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VGb3IoZnJvbVJpZ2h0KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzRnVuYykge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICBpdGVyYWJsZSA9IE9iamVjdChvYmplY3QpLFxuICAgICAgICBwcm9wcyA9IGtleXNGdW5jKG9iamVjdCksXG4gICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcblxuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgdmFyIGtleSA9IHByb3BzW2Zyb21SaWdodCA/IGxlbmd0aCA6ICsraW5kZXhdO1xuICAgICAgaWYgKGl0ZXJhdGVlKGl0ZXJhYmxlW2tleV0sIGtleSwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlQmFzZUZvcjtcbiIsImltcG9ydCBjcmVhdGVCYXNlRm9yIGZyb20gJy4vX2NyZWF0ZUJhc2VGb3IuanMnO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBiYXNlRm9yT3duYCB3aGljaCBpdGVyYXRlcyBvdmVyIGBvYmplY3RgXG4gKiBwcm9wZXJ0aWVzIHJldHVybmVkIGJ5IGBrZXlzRnVuY2AgYW5kIGludm9rZXMgYGl0ZXJhdGVlYCBmb3IgZWFjaCBwcm9wZXJ0eS5cbiAqIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnkgZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBrZXlzRnVuYyBUaGUgZnVuY3Rpb24gdG8gZ2V0IHRoZSBrZXlzIG9mIGBvYmplY3RgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xudmFyIGJhc2VGb3IgPSBjcmVhdGVCYXNlRm9yKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGJhc2VGb3I7XG4iLCJpbXBvcnQgYmFzZUZvciBmcm9tICcuL19iYXNlRm9yLmpzJztcbmltcG9ydCBrZXlzIGZyb20gJy4va2V5cy5qcyc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9yT3duYCB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlIHNob3J0aGFuZHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUZvck93bihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gIHJldHVybiBvYmplY3QgJiYgYmFzZUZvcihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYmFzZUZvck93bjtcbiIsImltcG9ydCBpc0FycmF5TGlrZSBmcm9tICcuL2lzQXJyYXlMaWtlLmpzJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgYGJhc2VFYWNoYCBvciBgYmFzZUVhY2hSaWdodGAgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVhY2hGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYSBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBiYXNlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVCYXNlRWFjaChlYWNoRnVuYywgZnJvbVJpZ2h0KSB7XG4gIHJldHVybiBmdW5jdGlvbihjb2xsZWN0aW9uLCBpdGVyYXRlZSkge1xuICAgIGlmIChjb2xsZWN0aW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgIH1cbiAgICBpZiAoIWlzQXJyYXlMaWtlKGNvbGxlY3Rpb24pKSB7XG4gICAgICByZXR1cm4gZWFjaEZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpO1xuICAgIH1cbiAgICB2YXIgbGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGgsXG4gICAgICAgIGluZGV4ID0gZnJvbVJpZ2h0ID8gbGVuZ3RoIDogLTEsXG4gICAgICAgIGl0ZXJhYmxlID0gT2JqZWN0KGNvbGxlY3Rpb24pO1xuXG4gICAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICAgIGlmIChpdGVyYXRlZShpdGVyYWJsZVtpbmRleF0sIGluZGV4LCBpdGVyYWJsZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlQmFzZUVhY2g7XG4iLCJpbXBvcnQgYmFzZUZvck93biBmcm9tICcuL19iYXNlRm9yT3duLmpzJztcbmltcG9ydCBjcmVhdGVCYXNlRWFjaCBmcm9tICcuL19jcmVhdGVCYXNlRWFjaC5qcyc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9yRWFjaGAgd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZSBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fE9iamVjdH0gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gKi9cbnZhciBiYXNlRWFjaCA9IGNyZWF0ZUJhc2VFYWNoKGJhc2VGb3JPd24pO1xuXG5leHBvcnQgZGVmYXVsdCBiYXNlRWFjaDtcbiIsImltcG9ydCBpZGVudGl0eSBmcm9tICcuL2lkZW50aXR5LmpzJztcblxuLyoqXG4gKiBDYXN0cyBgdmFsdWVgIHRvIGBpZGVudGl0eWAgaWYgaXQncyBub3QgYSBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyBjYXN0IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjYXN0RnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nID8gdmFsdWUgOiBpZGVudGl0eTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2FzdEZ1bmN0aW9uO1xuIiwiaW1wb3J0IGFycmF5RWFjaCBmcm9tICcuL19hcnJheUVhY2guanMnO1xuaW1wb3J0IGJhc2VFYWNoIGZyb20gJy4vX2Jhc2VFYWNoLmpzJztcbmltcG9ydCBjYXN0RnVuY3Rpb24gZnJvbSAnLi9fY2FzdEZ1bmN0aW9uLmpzJztcbmltcG9ydCBpc0FycmF5IGZyb20gJy4vaXNBcnJheS5qcyc7XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBgY29sbGVjdGlvbmAgYW5kIGludm9rZXMgYGl0ZXJhdGVlYCBmb3IgZWFjaCBlbGVtZW50LlxuICogVGhlIGl0ZXJhdGVlIGlzIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS5cbiAqIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnkgZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiAqKk5vdGU6KiogQXMgd2l0aCBvdGhlciBcIkNvbGxlY3Rpb25zXCIgbWV0aG9kcywgb2JqZWN0cyB3aXRoIGEgXCJsZW5ndGhcIlxuICogcHJvcGVydHkgYXJlIGl0ZXJhdGVkIGxpa2UgYXJyYXlzLiBUbyBhdm9pZCB0aGlzIGJlaGF2aW9yIHVzZSBgXy5mb3JJbmBcbiAqIG9yIGBfLmZvck93bmAgZm9yIG9iamVjdCBpdGVyYXRpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGFsaWFzIGVhY2hcbiAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbaXRlcmF0ZWU9Xy5pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICogQHNlZSBfLmZvckVhY2hSaWdodFxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmZvckVhY2goWzEsIDJdLCBmdW5jdGlvbih2YWx1ZSkge1xuICogICBjb25zb2xlLmxvZyh2YWx1ZSk7XG4gKiB9KTtcbiAqIC8vID0+IExvZ3MgYDFgIHRoZW4gYDJgLlxuICpcbiAqIF8uZm9yRWFjaCh7ICdhJzogMSwgJ2InOiAyIH0sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAqICAgY29uc29sZS5sb2coa2V5KTtcbiAqIH0pO1xuICogLy8gPT4gTG9ncyAnYScgdGhlbiAnYicgKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCkuXG4gKi9cbmZ1bmN0aW9uIGZvckVhY2goY29sbGVjdGlvbiwgaXRlcmF0ZWUpIHtcbiAgdmFyIGZ1bmMgPSBpc0FycmF5KGNvbGxlY3Rpb24pID8gYXJyYXlFYWNoIDogYmFzZUVhY2g7XG4gIHJldHVybiBmdW5jKGNvbGxlY3Rpb24sIGNhc3RGdW5jdGlvbihpdGVyYXRlZSkpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmb3JFYWNoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgdGVtcGxhdGUgZnJvbSAnbG9kYXNoLWVzL3RlbXBsYXRlJztcbmltcG9ydCBmb3JFYWNoIGZyb20gJ2xvZGFzaC1lcy9mb3JFYWNoJztcblxuLyoqXG4gKiBUaGUgTmVhcmJ5U3RvcHMgTW9kdWxlXG4gKlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIE5lYXJieVN0b3BzIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgVGhlIE5lYXJieVN0b3BzIGNsYXNzXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvKiogQHR5cGUge0FycmF5fSBDb2xsZWN0aW9uIG9mIG5lYXJieSBzdG9wcyBET00gZWxlbWVudHMgKi9cbiAgICB0aGlzLl9lbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTmVhcmJ5U3RvcHMuc2VsZWN0b3IpO1xuXG4gICAgLyoqIEB0eXBlIHtBcnJheX0gVGhlIGNvbGxlY3Rpb24gYWxsIHN0b3BzIGZyb20gdGhlIGRhdGEgKi9cbiAgICB0aGlzLl9zdG9wcyA9IFtdO1xuXG4gICAgLyoqIEB0eXBlIHtBcnJheX0gVGhlIGN1cnJhdGVkIGNvbGxlY3Rpb24gb2Ygc3RvcHMgdGhhdCB3aWxsIGJlIHJlbmRlcmVkICovXG4gICAgdGhpcy5fbG9jYXRpb25zID0gW107XG5cbiAgICAvLyBMb29wIHRocm91Z2ggRE9NIENvbXBvbmVudHMuXG4gICAgZm9yRWFjaCh0aGlzLl9lbGVtZW50cywgKGVsKSA9PiB7XG4gICAgICAvLyBGZXRjaCB0aGUgZGF0YSBmb3IgdGhlIGVsZW1lbnQuXG4gICAgICB0aGlzLl9mZXRjaChlbCwgKHN0YXR1cywgZGF0YSkgPT4ge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAnc3VjY2VzcycpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9zdG9wcyA9IGRhdGE7XG4gICAgICAgIC8vIEdldCBzdG9wcyBjbG9zZXN0IHRvIHRoZSBsb2NhdGlvbi5cbiAgICAgICAgdGhpcy5fbG9jYXRpb25zID0gdGhpcy5fbG9jYXRlKGVsLCB0aGlzLl9zdG9wcyk7XG4gICAgICAgIC8vIEFzc2lnbiB0aGUgY29sb3IgbmFtZXMgZnJvbSBwYXR0ZXJucyBzdHlsZXNoZWV0LlxuICAgICAgICB0aGlzLl9sb2NhdGlvbnMgPSB0aGlzLl9hc3NpZ25Db2xvcnModGhpcy5fbG9jYXRpb25zKTtcbiAgICAgICAgLy8gUmVuZGVyIHRoZSBtYXJrdXAgZm9yIHRoZSBzdG9wcy5cbiAgICAgICAgdGhpcy5fcmVuZGVyKGVsLCB0aGlzLl9sb2NhdGlvbnMpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNvbXBhcmVzIHRoZSBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHdpdGggdGhlIFN1YndheSBTdG9wcyBkYXRhLCBzb3J0c1xuICAgKiB0aGUgZGF0YSBieSBkaXN0YW5jZSBmcm9tIGNsb3Nlc3QgdG8gZmFydGhlc3QsIGFuZCByZXR1cm5zIHRoZSBzdG9wIGFuZFxuICAgKiBkaXN0YW5jZXMgb2YgdGhlIHN0YXRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBlbCAgICAgVGhlIERPTSBDb21wb25lbnQgd2l0aCB0aGUgZGF0YSBhdHRyIG9wdGlvbnNcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgc3RvcHMgIEFsbCBvZiB0aGUgc3RvcHMgZGF0YSB0byBjb21wYXJlIHRvXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICBBIGNvbGxlY3Rpb24gb2YgdGhlIGNsb3Nlc3Qgc3RvcHMgd2l0aCBkaXN0YW5jZXNcbiAgICovXG4gIF9sb2NhdGUoZWwsIHN0b3BzKSB7XG4gICAgY29uc3QgYW1vdW50ID0gcGFyc2VJbnQodGhpcy5fb3B0KGVsLCAnQU1PVU5UJykpXG4gICAgICB8fCBOZWFyYnlTdG9wcy5kZWZhdWx0cy5BTU9VTlQ7XG4gICAgbGV0IGxvYyA9IEpTT04ucGFyc2UodGhpcy5fb3B0KGVsLCAnTE9DQVRJT04nKSk7XG4gICAgbGV0IGdlbyA9IFtdO1xuICAgIGxldCBkaXN0YW5jZXMgPSBbXTtcblxuICAgIC8vIDEuIENvbXBhcmUgbGF0IGFuZCBsb24gb2YgY3VycmVudCBsb2NhdGlvbiB3aXRoIGxpc3Qgb2Ygc3RvcHNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0b3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBnZW8gPSBzdG9wc1tpXVt0aGlzLl9rZXkoJ09EQVRBX0dFTycpXVt0aGlzLl9rZXkoJ09EQVRBX0NPT1InKV07XG4gICAgICBnZW8gPSBnZW8ucmV2ZXJzZSgpO1xuICAgICAgZGlzdGFuY2VzLnB1c2goe1xuICAgICAgICAnZGlzdGFuY2UnOiB0aGlzLl9lcXVpcmVjdGFuZ3VsYXIobG9jWzBdLCBsb2NbMV0sIGdlb1swXSwgZ2VvWzFdKSxcbiAgICAgICAgJ3N0b3AnOiBpLCAvLyBpbmRleCBvZiBzdG9wIGluIHRoZSBkYXRhXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyAyLiBTb3J0IHRoZSBkaXN0YW5jZXMgc2hvcnRlc3QgdG8gbG9uZ2VzdFxuICAgIGRpc3RhbmNlcy5zb3J0KChhLCBiKSA9PiAoYS5kaXN0YW5jZSA8IGIuZGlzdGFuY2UpID8gLTEgOiAxKTtcbiAgICBkaXN0YW5jZXMgPSBkaXN0YW5jZXMuc2xpY2UoMCwgYW1vdW50KTtcblxuICAgIC8vIDMuIFJldHVybiB0aGUgbGlzdCBvZiBjbG9zZXN0IHN0b3BzIChudW1iZXIgYmFzZWQgb24gQW1vdW50IG9wdGlvbilcbiAgICAvLyBhbmQgcmVwbGFjZSB0aGUgc3RvcCBpbmRleCB3aXRoIHRoZSBhY3R1YWwgc3RvcCBkYXRhXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBkaXN0YW5jZXMubGVuZ3RoOyB4KyspXG4gICAgICBkaXN0YW5jZXNbeF0uc3RvcCA9IHN0b3BzW2Rpc3RhbmNlc1t4XS5zdG9wXTtcblxuICAgIHJldHVybiBkaXN0YW5jZXM7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgc3RvcCBkYXRhIGZyb20gYSBsb2NhbCBzb3VyY2VcbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICBlbCAgICAgICAgVGhlIE5lYXJieVN0b3BzIERPTSBlbGVtZW50XG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgY2FsbGJhY2sgIFRoZSBmdW5jdGlvbiB0byBleGVjdXRlIG9uIHN1Y2Nlc3NcbiAgICpcbiAgICogQHJldHVybiB7RnVuY3Rpb259ICAgICAgICAgICAgdGhlIGZldGNoIHByb21pc2VcbiAgICovXG4gIF9mZXRjaChlbCwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgJ21ldGhvZCc6ICdHRVQnXG4gICAgfTtcblxuICAgIHJldHVybiBmZXRjaCh0aGlzLl9vcHQoZWwsICdFTkRQT0lOVCcpLCBoZWFkZXJzKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5vaylcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSBjb25zb2xlLmRpcihyZXNwb25zZSk7XG4gICAgICAgICAgY2FsbGJhY2soJ2Vycm9yJywgcmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgY29uc29sZS5kaXIoZXJyb3IpO1xuICAgICAgICBjYWxsYmFjaygnZXJyb3InLCBlcnJvcik7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IGNhbGxiYWNrKCdzdWNjZXNzJywgZGF0YSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgZGlzdGFuY2UgaW4gbWlsZXMgY29tcGFyaW5nIHRoZSBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIG9mIHR3b1xuICAgKiBwb2ludHMgdXNpbmcgZGVjaW1hbCBkZWdyZWVzLlxuICAgKlxuICAgKiBAcGFyYW0gIHtGbG9hdH0gIGxhdDEgIExhdGl0dWRlIG9mIHBvaW50IDEgKGluIGRlY2ltYWwgZGVncmVlcylcbiAgICogQHBhcmFtICB7RmxvYXR9ICBsb24xICBMb25naXR1ZGUgb2YgcG9pbnQgMSAoaW4gZGVjaW1hbCBkZWdyZWVzKVxuICAgKiBAcGFyYW0gIHtGbG9hdH0gIGxhdDIgIExhdGl0dWRlIG9mIHBvaW50IDIgKGluIGRlY2ltYWwgZGVncmVlcylcbiAgICogQHBhcmFtICB7RmxvYXR9ICBsb24yICBMb25naXR1ZGUgb2YgcG9pbnQgMiAoaW4gZGVjaW1hbCBkZWdyZWVzKVxuICAgKlxuICAgKiBAcmV0dXJuIHtGbG9hdH0gICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICovXG4gIF9lcXVpcmVjdGFuZ3VsYXIobGF0MSwgbG9uMSwgbGF0MiwgbG9uMikge1xuICAgIE1hdGguZGVnMnJhZCA9IChkZWcpID0+IGRlZyAqIChNYXRoLlBJIC8gMTgwKTtcblxuICAgIGxldCBhbHBoYSA9IE1hdGguYWJzKGxvbjIpIC0gTWF0aC5hYnMobG9uMSk7XG4gICAgbGV0IHggPSBNYXRoLmRlZzJyYWQoYWxwaGEpICogTWF0aC5jb3MoTWF0aC5kZWcycmFkKGxhdDEgKyBsYXQyKSAvIDIpO1xuICAgIGxldCB5ID0gTWF0aC5kZWcycmFkKGxhdDEgLSBsYXQyKTtcbiAgICBsZXQgUiA9IDM5NTk7IC8vIGVhcnRoIHJhZGl1cyBpbiBtaWxlcztcbiAgICBsZXQgZGlzdGFuY2UgPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSkgKiBSO1xuXG4gICAgcmV0dXJuIGRpc3RhbmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2lnbnMgY29sb3JzIHRvIHRoZSBkYXRhIHVzaW5nIHRoZSBOZWFyYnlTdG9wcy50cnVuY2tzIGRpY3Rpb25hcnkuXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gIGxvY2F0aW9ucyAgT2JqZWN0IG9mIGNsb3Nlc3QgbG9jYXRpb25zXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgU2FtZSBvYmplY3Qgd2l0aCBjb2xvcnMgYXNzaWduZWQgdG8gZWFjaCBsb2NcbiAgICovXG4gIF9hc3NpZ25Db2xvcnMobG9jYXRpb25zKSB7XG4gICAgbGV0IGxvY2F0aW9uTGluZXMgPSBbXTtcbiAgICBsZXQgbGluZSA9ICdTJztcbiAgICBsZXQgbGluZXMgPSBbJ1MnXTtcblxuICAgIC8vIExvb3AgdGhyb3VnaCBlYWNoIGxvY2F0aW9uIHRoYXQgd2UgYXJlIGdvaW5nIHRvIGRpc3BsYXlcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gYXNzaWduIHRoZSBsaW5lIHRvIGEgdmFyaWFibGUgdG8gbG9va3VwIGluIG91ciBjb2xvciBkaWN0aW9uYXJ5XG4gICAgICBsb2NhdGlvbkxpbmVzID0gbG9jYXRpb25zW2ldLnN0b3BbdGhpcy5fa2V5KCdPREFUQV9MSU5FJyldLnNwbGl0KCctJyk7XG5cbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbG9jYXRpb25MaW5lcy5sZW5ndGg7IHgrKykge1xuICAgICAgICBsaW5lID0gbG9jYXRpb25MaW5lc1t4XTtcblxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IE5lYXJieVN0b3BzLnRydW5rcy5sZW5ndGg7IHkrKykge1xuICAgICAgICAgIGxpbmVzID0gTmVhcmJ5U3RvcHMudHJ1bmtzW3ldWydMSU5FUyddO1xuXG4gICAgICAgICAgaWYgKGxpbmVzLmluZGV4T2YobGluZSkgPiAtMSlcbiAgICAgICAgICAgIGxvY2F0aW9uTGluZXNbeF0gPSB7XG4gICAgICAgICAgICAgICdsaW5lJzogbGluZSxcbiAgICAgICAgICAgICAgJ3RydW5rJzogTmVhcmJ5U3RvcHMudHJ1bmtzW3ldWydUUlVOSyddXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCB0aGUgdHJ1bmsgdG8gdGhlIGxvY2F0aW9uXG4gICAgICBsb2NhdGlvbnNbaV0udHJ1bmtzID0gbG9jYXRpb25MaW5lcztcbiAgICB9XG5cbiAgICByZXR1cm4gbG9jYXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBjb21waWxlIGFuZCByZW5kZXIgdGhlIGxvY2F0aW9uIHRlbXBsYXRlXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gIGVsZW1lbnQgIFRoZSBwYXJlbnQgRE9NIGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBkYXRhICAgICBUaGUgZGF0YSB0byBwYXNzIHRvIHRoZSB0ZW1wbGF0ZVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICBUaGUgTmVhcmJ5U3RvcHMgY2xhc3NcbiAgICovXG4gIF9yZW5kZXIoZWxlbWVudCwgZGF0YSkge1xuICAgIGxldCBjb21waWxlZCA9IHRlbXBsYXRlKE5lYXJieVN0b3BzLnRlbXBsYXRlcy5TVUJXQVksIHtcbiAgICAgICdpbXBvcnRzJzoge1xuICAgICAgICAnX2VhY2gnOiBmb3JFYWNoXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IGNvbXBpbGVkKHsnc3RvcHMnOiBkYXRhfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZGF0YSBhdHRyaWJ1dGUgb3B0aW9uc1xuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBlbGVtZW50ICBUaGUgZWxlbWVudCB0byBwdWxsIHRoZSBzZXR0aW5nIGZyb21cbiAgICogQHBhcmFtICB7U3RyaW5nfSAgb3B0ICAgICAgVGhlIGtleSByZWZlcmVuY2UgdG8gdGhlIGF0dHJpYnV0ZVxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9ICAgICAgICAgIFRoZSBzZXR0aW5nIG9mIHRoZSBkYXRhIGF0dHJpYnV0ZVxuICAgKi9cbiAgX29wdChlbGVtZW50LCBvcHQpIHtcbiAgICByZXR1cm4gZWxlbWVudC5kYXRhc2V0W1xuICAgICAgYCR7TmVhcmJ5U3RvcHMubmFtZXNwYWNlfSR7TmVhcmJ5U3RvcHMub3B0aW9uc1tvcHRdfWBcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJveHkgZnVuY3Rpb24gZm9yIHJldHJpZXZpbmcgdGhlIHByb3BlciBrZXlcbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSBrZXkgVGhlIHJlZmVyZW5jZSBmb3IgdGhlIHN0b3JlZCBrZXlzXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmluZ30gICAgIFRoZSBkZXNpcmVkIGtleVxuICAgKi9cbiAgX2tleShrZXkpIHtcbiAgICByZXR1cm4gTmVhcmJ5U3RvcHMua2V5c1trZXldO1xuICB9XG59XG5cbi8qKlxuICogVGhlIGRvbSBzZWxlY3RvciBmb3IgdGhlIG1vZHVsZVxuICpcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKi9cbk5lYXJieVN0b3BzLnNlbGVjdG9yID0gJ1tkYXRhLWpzPVwibmVhcmJ5LXN0b3BzXCJdJztcblxuLyoqXG4gKiBUaGUgbmFtZXNwYWNlIGZvciB0aGUgY29tcG9uZW50J3MgSlMgb3B0aW9ucy4gSXQncyBwcmltYXJpbHkgdXNlZCB0byBsb29rdXBcbiAqIGF0dHJpYnV0ZXMgaW4gYW4gZWxlbWVudCdzIGRhdGFzZXRcbiAqXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG5OZWFyYnlTdG9wcy5uYW1lc3BhY2UgPSAnbmVhcmJ5U3RvcHMnO1xuXG4vKipcbiAqIEEgbGlzdCBvZiBvcHRpb25zIHRoYXQgY2FuIGJlIGFzc2lnbmVkIHRvIHRoZSBjb21wb25lbnQuIEl0J3MgcHJpbWFyaWx5IHVzZWRcbiAqIHRvIGxvb2t1cCBhdHRyaWJ1dGVzIGluIGFuIGVsZW1lbnQncyBkYXRhc2V0XG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuTmVhcmJ5U3RvcHMub3B0aW9ucyA9IHtcbiAgTE9DQVRJT046ICdMb2NhdGlvbicsXG4gIEFNT1VOVDogJ0Ftb3VudCcsXG4gIEVORFBPSU5UOiAnRW5kcG9pbnQnXG59O1xuXG4vKipcbiAqIFRoZSBkb2N1bWVudGF0aW9uIGZvciB0aGUgZGF0YSBhdHRyIG9wdGlvbnNcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5OZWFyYnlTdG9wcy5kZWZpbml0aW9uID0ge1xuICBMT0NBVElPTjogJ1RoZSBjdXJyZW50IGxvY2F0aW9uIHRvIGNvbXBhcmUgZGlzdGFuY2UgdG8gc3RvcHMuJyxcbiAgQU1PVU5UOiAnVGhlIGFtb3VudCBvZiBzdG9wcyB0byBsaXN0LicsXG4gIEVORFBPSU5UOiAnVGhlIGVuZG9wb2ludCBmb3IgdGhlIGRhdGEgZmVlZC4nXG59O1xuXG4vKipcbiAqIFtkZWZhdWx0cyBkZXNjcmlwdGlvbl1cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5OZWFyYnlTdG9wcy5kZWZhdWx0cyA9IHtcbiAgQU1PVU5UOiAzXG59O1xuXG4vKipcbiAqIFN0b3JhZ2UgZm9yIHNvbWUgb2YgdGhlIGRhdGEga2V5c1xuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbk5lYXJieVN0b3BzLmtleXMgPSB7XG4gIE9EQVRBX0dFTzogJ3RoZV9nZW9tJyxcbiAgT0RBVEFfQ09PUjogJ2Nvb3JkaW5hdGVzJyxcbiAgT0RBVEFfTElORTogJ2xpbmUnXG59O1xuXG4vKipcbiAqIFRlbXBsYXRlcyBmb3IgdGhlIE5lYXJieSBTdG9wcyBDb21wb25lbnRcbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5OZWFyYnlTdG9wcy50ZW1wbGF0ZXMgPSB7XG4gIFNVQldBWTogW1xuICAnPCUgX2VhY2goc3RvcHMsIGZ1bmN0aW9uKHN0b3ApIHsgJT4nLFxuICAnPGxpIGNsYXNzPVwiYy1uZWFyYnktc3RvcHNfX3N0b3BcIj4nLFxuICAgICc8JSB2YXIgbGluZXMgPSBzdG9wLnN0b3AubGluZS5zcGxpdChcIi1cIikgJT4nLFxuICAgICc8JSBfZWFjaChzdG9wLnRydW5rcywgZnVuY3Rpb24odHJ1bmspIHsgJT4nLFxuICAgICc8JSB2YXIgZXhwID0gKHRydW5rLmxpbmUuaW5kZXhPZihcIkV4cHJlc3NcIikgPiAtMSkgPyB0cnVlIDogZmFsc2UgJT4nLFxuICAgICc8JSBpZiAoZXhwKSB0cnVuay5saW5lID0gdHJ1bmsubGluZS5zcGxpdChcIiBcIilbMF0gJT4nLFxuICAgICc8c3BhbiBjbGFzcz1cIicsXG4gICAgICAnYy1uZWFyYnktc3RvcHNfX3N1YndheTwlIGlmIChleHApIHsgJT4tZXhwcmVzczwlIH0gJT4gJyxcbiAgICAgICc8JSBpZiAoZXhwKSB7ICU+Ym9yZGVyLTwlIH0gZWxzZSB7ICU+YmctPCUgfSAlPjwlLSB0cnVuay50cnVuayAlPicsXG4gICAgICAnXCI+JyxcbiAgICAgICc8JS0gdHJ1bmsubGluZSAlPicsXG4gICAgICAnPCUgaWYgKGV4cCkgeyAlPiA8c3BhbiBjbGFzcz1cInNyLW9ubHlcIj5FeHByZXNzPC9zcGFuPjwlIH0gJT4nLFxuICAgICc8L3NwYW4+Jm5ic3A7JyxcbiAgICAnPCUgfSk7ICU+JyxcbiAgICAnPHNwYW4gY2xhc3M9XCJjLW5lYXJieS1zdG9wc19fZGVzY3JpcHRpb25cIj4nLFxuICAgICAgJzwlLSBzdG9wLmRpc3RhbmNlLnRvU3RyaW5nKCkuc2xpY2UoMCwgMykgJT4gTWlsZXMsICcsXG4gICAgICAnPCUtIHN0b3Auc3RvcC5uYW1lICU+JyxcbiAgICAnPC9zcGFuPicsXG4gICc8L2xpPicsXG4gICc8JSB9KTsgJT4nXG4gIF0uam9pbignJylcbn07XG5cbi8qKlxuICogQ29sb3IgYXNzaWdubWVudCBmb3IgU3Vid2F5IFRyYWluIGxpbmVzLCB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlXG4gKiBiYWNrZ3JvdW5kIGNvbG9ycyBkZWZpbmVkIGluIGNvbmZpZy90b2tlbnMuanNcbiAqIEJhc2VkIG9uIHRoZSBub21lbmNsYXR1cmUgZGVzY3JpYmVkIGhlcmU7XG4gKlxuICogQHVybCBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9OZXdfWW9ya19DaXR5X1N1YndheSNOb21lbmNsYXR1cmVcbiAqXG4gKiBAdHlwZSB7QXJyYXl9XG4gKi9cbk5lYXJieVN0b3BzLnRydW5rcyA9IFtcbiAge1xuICAgIFRSVU5LOiAnZWlnaHRoLWF2ZW51ZScsXG4gICAgTElORVM6IFsnQScsICdDJywgJ0UnXSxcbiAgfSxcbiAge1xuICAgIFRSVU5LOiAnc2l4dGgtYXZlbnVlJyxcbiAgICBMSU5FUzogWydCJywgJ0QnLCAnRicsICdNJ10sXG4gIH0sXG4gIHtcbiAgICBUUlVOSzogJ2Nyb3NzdG93bicsXG4gICAgTElORVM6IFsnRyddLFxuICB9LFxuICB7XG4gICAgVFJVTks6ICdjYW5hcnNpZScsXG4gICAgTElORVM6IFsnTCddLFxuICB9LFxuICB7XG4gICAgVFJVTks6ICduYXNzYXUnLFxuICAgIExJTkVTOiBbJ0onLCAnWiddLFxuICB9LFxuICB7XG4gICAgVFJVTks6ICdicm9hZHdheScsXG4gICAgTElORVM6IFsnTicsICdRJywgJ1InLCAnVyddLFxuICB9LFxuICB7XG4gICAgVFJVTks6ICdicm9hZHdheS1zZXZlbnRoLWF2ZW51ZScsXG4gICAgTElORVM6IFsnMScsICcyJywgJzMnXSxcbiAgfSxcbiAge1xuICAgIFRSVU5LOiAnbGV4aW5ndG9uLWF2ZW51ZScsXG4gICAgTElORVM6IFsnNCcsICc1JywgJzYnLCAnNiBFeHByZXNzJ10sXG4gIH0sXG4gIHtcbiAgICBUUlVOSzogJ2ZsdXNoaW5nJyxcbiAgICBMSU5FUzogWyc3JywgJzcgRXhwcmVzcyddLFxuICB9LFxuICB7XG4gICAgVFJVTks6ICdzaHV0dGxlcycsXG4gICAgTElORVM6IFsnUyddXG4gIH1cbl07XG5cbmV4cG9ydCBkZWZhdWx0IE5lYXJieVN0b3BzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBwb3BvdmVyLiBUaGUgY29uc3RydWN0b3IgaXMgcGFzc2VkIGFuIEhUTUwgZWxlbWVudCB0aGF0IHNlcnZlcyBhc1xuICogdGhlIHRyaWdnZXIgdG8gc2hvdyBvciBoaWRlIHRoZSBQb3BvdmVyLiBUaGUgcG9wb3ZlciBzaG91bGQgaGF2ZSBhblxuICogYGFyaWEtZGVzY3JpYmVkYnlgIGF0dHJpYnV0ZSwgdGhlIHZhbHVlIG9mIHdoaWNoIGlzIHRoZSBJRCBvZiB0aGUgcG9wb3ZlclxuICogY29udGVudCB0byBzaG93IG9yIGhpZGUuXG4gKi9cbmNsYXNzIFBvcG92ZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgdHJpZ2dlciBlbGVtZW50IGZvciB0aGUgY29tcG9uZW50XG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IoZWwpIHtcbiAgICB0aGlzLnRyaWdnZXIgPSBlbDtcblxuICAgIHRoaXMucG9wb3ZlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsLmdldEF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScpKTtcblxuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cbiAgICB0aGlzLnBvcG92ZXIuY2xhc3NMaXN0LmFkZChQb3BvdmVyLkNzc0NsYXNzLlBPUE9WRVIpO1xuICAgIHRoaXMucG9wb3Zlci5jbGFzc0xpc3QuYWRkKFBvcG92ZXIuQ3NzQ2xhc3MuSElEREVOKTtcblxuICAgIHRoaXMucG9wb3Zlci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICB0aGlzLnBvcG92ZXIuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3Rvb2x0aXAnKTtcblxuICAgIC8vIFN0b3AgY2xpY2sgcHJvcGFnYXRpb24gc28gY2xpY2tpbmcgb24gdGhlIHRpcCBkb2Vzbid0IHRyaWdnZXIgYVxuICAgIC8vIGNsaWNrIG9uIGJvZHksIHdoaWNoIHdvdWxkIGNsb3NlIHRoZSBQb3BvdmVyLlxuICAgIHRoaXMucG9wb3Zlci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFwcGVuZENoaWxkKHRoaXMucG9wb3Zlcik7XG5cbiAgICB0aGlzLnRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgIHRoaXMudG9nZ2xlKCk7XG4gICAgfSlcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4ge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfSk7XG5cbiAgICBQb3BvdmVyLmFsbC5wdXNoKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGxheXMgdGhlIFBvcG92ZXIuIFNldHMgYSBvbmUtdGltZSBsaXN0ZW5lciBvbiB0aGUgYm9keSB0byBjbG9zZSB0aGVcbiAgICogcG9wb3ZlciB3aGVuIGEgY2xpY2sgZXZlbnQgYnViYmxlcyB1cCB0byBpdC5cbiAgICpcbiAgICogQG1ldGhvZFxuICAgKlxuICAgKiBAcmV0dXJuIHt0aGlzfSBQb3BvdmVyXG4gICAqL1xuICBzaG93KCkge1xuICAgIFBvcG92ZXIuaGlkZUFsbCgpO1xuXG4gICAgdGhpcy5wb3BvdmVyLmNsYXNzTGlzdC5yZW1vdmUoUG9wb3Zlci5Dc3NDbGFzcy5ISURERU4pO1xuXG4gICAgdGhpcy5wb3BvdmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcblxuICAgIGxldCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuXG4gICAgbGV0IGhpZGVQb3BvdmVyT25jZSA9ICgpID0+IHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuXG4gICAgICBib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGlkZVBvcG92ZXJPbmNlKTtcbiAgICB9O1xuXG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhpZGVQb3BvdmVyT25jZSk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgdGhpcy5yZXBvc2l0aW9uKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlcG9zaXRpb24oKTtcblxuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZGVzIHRoZSB0b29sdGlwIGFuZCByZW1vdmVzIHRoZSBjbGljayBldmVudCBsaXN0ZW5lciBvbiB0aGUgYm9keS5cbiAgICogQG1ldGhvZFxuICAgKiBAcmV0dXJuIHt0aGlzfSBQb3BvdmVyXG4gICAqL1xuICBoaWRlKCkge1xuICAgIHRoaXMucG9wb3Zlci5jbGFzc0xpc3QuYWRkKFBvcG92ZXIuQ3NzQ2xhc3MuSElEREVOKTtcblxuICAgIHRoaXMucG9wb3Zlci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcblxuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBzdGF0ZSBvZiB0aGUgUG9wb3ZlclxuICAgKlxuICAgKiBAbWV0aG9kXG4gICAqXG4gICAqIEByZXR1cm4ge3RoaXN9IFBvcG92ZXJcbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3NpdGlvbnMgdGhlIHRvb2x0aXAgYmVuZWF0aCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50XG4gICAqXG4gICAqIEBtZXRob2RcbiAgICpcbiAgICogQHJldHVybiB7dGhpc30gUG9wb3ZlclxuICAgKi9cbiAgcmVwb3NpdGlvbigpIHtcbiAgICBsZXQgcG9zID0ge1xuICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcbiAgICAgICdsZWZ0JzogJ2F1dG8nLFxuICAgICAgJ3JpZ2h0JzogJ2F1dG8nLFxuICAgICAgJ3RvcCc6ICdhdXRvJyxcbiAgICAgICdib3R0b20nOiAnYXV0bycsXG4gICAgICAnd2lkdGgnOiAnJ1xuICAgIH07XG5cbiAgICBsZXQgc3R5bGUgPSAoYXR0cnMpID0+IE9iamVjdC5rZXlzKGF0dHJzKVxuICAgICAgLm1hcChrZXkgPT4gYCR7a2V5fTogJHthdHRyc1trZXldfWApLmpvaW4oJzsgJyk7XG5cbiAgICBsZXQgZyA9IDg7IC8vIEd1dHRlci4gTWluaW11bSBkaXN0YW5jZSBmcm9tIHNjcmVlbiBlZGdlLlxuICAgIGxldCB0dCA9IHRoaXMucG9wb3ZlcjtcbiAgICBsZXQgdHIgPSB0aGlzLnRyaWdnZXI7XG4gICAgbGV0IHcgPSB3aW5kb3c7XG5cbiAgICAvLyBSZXNldFxuICAgIHRoaXMucG9wb3Zlci5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgc3R5bGUocG9zKSk7XG5cbiAgICAvLyBEZXRlcm1pbmUgbGVmdCBvciByaWdodCBhbGlnbm1lbnQuXG4gICAgaWYgKHR0Lm9mZnNldFdpZHRoID49IHcuaW5uZXJXaWR0aCAtICgyICogZykpIHtcbiAgICAgIC8vIElmIHRoZSBwb3BvdmVyIGlzIHdpZGVyIHRoYW4gdGhlIHNjcmVlbiBtaW51cyBndXR0ZXJzLCB0aGVuIHBvc2l0aW9uXG4gICAgICAvLyB0aGUgcG9wb3ZlciB0byBleHRlbmQgdG8gdGhlIGd1dHRlcnMuXG4gICAgICBwb3MubGVmdCA9IGcgKyAncHgnO1xuICAgICAgcG9zLnJpZ2h0ID0gZyArICdweCc7XG4gICAgICBwb3Mud2lkdGggPSAnYXV0byc7XG4gICAgfSBlbHNlIGlmICh0ci5vZmZzZXRMZWZ0ICsgdHQub2Zmc2V0V2lkdGggKyBnID4gdy5pbm5lcldpZHRoKSB7XG4gICAgICAvLyBJZiB0aGUgcG9wb3Zlciwgd2hlbiBsZWZ0IGFsaWduZWQgd2l0aCB0aGUgdHJpZ2dlciwgd291bGQgY2F1c2UgdGhlXG4gICAgICAvLyB0aXAgdG8gZ28gb2Zmc2NyZWVuIChkZXRlcm1pbmVkIGJ5IHRha2luZyB0aGUgdHJpZ2dlciBsZWZ0IG9mZnNldCBhbmRcbiAgICAgIC8vIGFkZGluZyB0aGUgcG9wb3ZlciB3aWR0aCBhbmQgdGhlIGxlZnQgZ3V0dGVyKSB0aGVuIGFsaWduIHRoZSBwb3BvdmVyXG4gICAgICAvLyB0byB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICAgICAgcG9zLmxlZnQgPSAnYXV0byc7XG4gICAgICBwb3MucmlnaHQgPSB3LmlubmVyV2lkdGggLSAodHIub2Zmc2V0TGVmdCArIHRyLm9mZnNldFdpZHRoKSArICdweCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFsaWduIHRoZSBwb3BvdmVyIHRvIHRoZSBsZWZ0IG9mIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gICAgICBwb3MubGVmdCA9IHRyLm9mZnNldExlZnQgKyAncHgnO1xuICAgICAgcG9zLnJpZ2h0ID0gJ2F1dG8nO1xuICAgIH1cblxuICAgIC8vIFBvc2l0aW9uIFRUIG9uIHRvcCBpZiB0aGUgdHJpZ2dlciBpcyBiZWxvdyB0aGUgbWlkZGxlIG9mIHRoZSB3aW5kb3dcbiAgICBpZiAodHIub2Zmc2V0VG9wIC0gdy5zY3JvbGxZID4gdy5pbm5lckhlaWdodCAvIDIpIHtcbiAgICAgIHBvcy50b3AgPSB0ci5vZmZzZXRUb3AgLSB0dC5vZmZzZXRIZWlnaHQgLSAoZykgKyAncHgnO1xuICAgIH0gZWxzZSB7XG4gICAgICBwb3MudG9wID0gdHIub2Zmc2V0VG9wICsgdHIub2Zmc2V0SGVpZ2h0ICsgZyArICdweCc7XG4gICAgfVxuXG4gICAgdGhpcy5wb3BvdmVyLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBzdHlsZShwb3MpKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cblBvcG92ZXIuc2VsZWN0b3IgPSAnW2RhdGEtanMqPVwicG9wb3ZlclwiXSc7XG5cbi8qKlxuICogQXJyYXkgb2YgYWxsIHRoZSBpbnN0YW50aWF0ZWQgUG9wb3ZlcnNcbiAqL1xuUG9wb3Zlci5hbGwgPSBbXTtcblxuLyoqXG4gKiBIaWRlIGFsbCBQb3BvdmVyLlxuICogQHB1YmxpY1xuICovXG5Qb3BvdmVyLmhpZGVBbGwgPSBmdW5jdGlvbigpIHtcbiAgUG9wb3Zlci5hbGwuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICBlbGVtZW50LmhpZGUoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENTUyBjbGFzc2VzIHVzZWQgYnkgdGhpcyBjb21wb25lbnQuXG4gKiBAZW51bSB7c3RyaW5nfVxuICovXG5Qb3BvdmVyLkNzc0NsYXNzID0ge1xuICBISURERU46ICdoaWRkZW4nLFxuICBQT1BPVkVSOiAncG9wb3Zlci1idWJibGUnXG59O1xuXG5leHBvcnQgZGVmYXVsdCBQb3BvdmVyO1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCBGb3JtcyBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvZm9ybXMvZm9ybXMnO1xuaW1wb3J0IFRvZ2dsZSBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvdG9nZ2xlL3RvZ2dsZSc7XG5cbmltcG9ydCBzZXJpYWxpemUgZnJvbSAnZm9yLWNlcmlhbCc7XG5cbi8qKlxuICogVGhpcyBjb21wb25lbnQgaGFuZGxlcyB2YWxpZGF0aW9uIGFuZCBzdWJtaXNzaW9uIGZvciBzaGFyZSBieSBlbWFpbCBhbmRcbiAqIHNoYXJlIGJ5IFNNUyBmb3Jtcy5cbiAqXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgU2hhcmVGb3JtIHtcbiAgLyoqXG4gICAqIENsYXNzIENvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBlbCAgVGhlIERPTSBTaGFyZSBGb3JtIEVsZW1lbnRcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICBUaGUgaW5zdGFudGlhdGVkIGNsYXNzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblxuICAgIC8qKlxuICAgICAqIFNldHRpbmcgY2xhc3MgdmFyaWFibGVzIHRvIG91ciBjb25zdGFudHNcbiAgICAgKi9cbiAgICB0aGlzLnNlbGVjdG9yID0gU2hhcmVGb3JtLnNlbGVjdG9yO1xuXG4gICAgdGhpcy5zZWxlY3RvcnMgPSBTaGFyZUZvcm0uc2VsZWN0b3JzO1xuXG4gICAgdGhpcy5jbGFzc2VzID0gU2hhcmVGb3JtLmNsYXNzZXM7XG5cbiAgICB0aGlzLnN0cmluZ3MgPSBTaGFyZUZvcm0uc3RyaW5ncztcblxuICAgIHRoaXMuc2VudCA9IFNoYXJlRm9ybS5zZW50O1xuXG4gICAgLyoqXG4gICAgICogU2V0IHVwIG1hc2tpbmcgZm9yIHBob25lIG51bWJlcnMgKGlmIHRoaXMgaXMgYSB0ZXh0aW5nIG1vZHVsZSlcbiAgICAgKi9cbiAgICB0aGlzLnBob25lID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuUEhPTkUpO1xuXG4gICAgaWYgKHRoaXMucGhvbmUpIHtcbiAgICAgIHRoaXMudHlwZSA9ICd0ZXh0JztcbiAgICB9IGVsc2VcbiAgICAgIHRoaXMudHlwZSA9ICdlbWFpbCc7XG5cbiAgICAvKipcbiAgICAgKiBDb25maWd1cmUgdGhlIHZhbGlkYXRpb24gZm9yIHRoZSBmb3JtIHVzaW5nIHRoZSBmb3JtIHV0aWxpdHlcbiAgICAgKi9cbiAgICB0aGlzLmZvcm0gPSBuZXcgRm9ybXModGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuRk9STSkpO1xuXG4gICAgdGhpcy5mb3JtLnN0cmluZ3MgPSB0aGlzLnN0cmluZ3M7XG5cbiAgICB0aGlzLmZvcm0uc2VsZWN0b3JzID0ge1xuICAgICAgJ1JFUVVJUkVEJzogdGhpcy5zZWxlY3RvcnMuUkVRVUlSRUQsXG4gICAgICAnRVJST1JfTUVTU0FHRV9QQVJFTlQnOiB0aGlzLnNlbGVjdG9ycy5GT1JNXG4gICAgfTtcblxuICAgIHRoaXMuZm9ybS5GT1JNLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKHRoaXMuZm9ybS52YWxpZChldmVudCkgPT09IGZhbHNlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHRoaXMuc2FuaXRpemUoKVxuICAgICAgICAucHJvY2Vzc2luZygpXG4gICAgICAgIC5zdWJtaXQoZXZlbnQpXG4gICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHRoaXMucmVzcG9uc2UocmVzcG9uc2UpO1xuICAgICAgICB9KS5jYXRjaChkYXRhID0+IHtcbiAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJylcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEluc3RhbnRpYXRlIHRoZSBTaGFyZUZvcm0ncyB0b2dnbGUgY29tcG9uZW50XG4gICAgICovXG4gICAgdGhpcy50b2dnbGUgPSBuZXcgVG9nZ2xlKHtcbiAgICAgIGVsZW1lbnQ6IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3JzLlRPR0dMRSksXG4gICAgICBzZWxlY3RvcjogdGhpcy5zZWxlY3RvcnMuVE9HR0xFLFxuICAgICAgYWZ0ZXI6ICgpID0+IHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuSU5QVVQpLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXJpYWxpemUgYW5kIGNsZWFuIGFueSBkYXRhIHNlbnQgdG8gdGhlIHNlcnZlclxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgVGhlIGluc3RhbnRpYXRlZCBjbGFzc1xuICAgKi9cbiAgc2FuaXRpemUoKSB7XG4gICAgLy8gU2VyaWFsaXplIHRoZSBkYXRhXG4gICAgdGhpcy5fZGF0YSA9IHNlcmlhbGl6ZSh0aGlzLmZvcm0uRk9STSwge2hhc2g6IHRydWV9KTtcblxuICAgIC8vIFNhbml0aXplIHRoZSBwaG9uZSBudW1iZXIgKGlmIHRoZXJlIGlzIGEgcGhvbmUgbnVtYmVyKVxuICAgIGlmICh0aGlzLnBob25lICYmIHRoaXMuX2RhdGEudG8pIHtcbiAgICAgIHRoaXMuX2RhdGEudG8gPSB0aGlzLl9kYXRhLnRvLm1hdGNoKC9cXGQvZywgMTApLmpvaW4oJycpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN3aXRjaCB0aGUgZm9ybSB0byB0aGUgcHJvY2Vzc2luZyBzdGF0ZVxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgVGhlIGluc3RhbnRpYXRlZCBjbGFzc1xuICAgKi9cbiAgcHJvY2Vzc2luZygpIHtcbiAgICAvLyBEaXNhYmxlIHRoZSBmb3JtXG4gICAgbGV0IGlucHV0cyA9IHRoaXMuZm9ybS5GT1JNLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5zZWxlY3RvcnMuSU5QVVRTKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgaSsrKVxuICAgICAgaW5wdXRzW2ldLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcblxuICAgIGxldCBidXR0b24gPSB0aGlzLmZvcm0uRk9STS5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3JzLlNVQk1JVCk7XG5cbiAgICBidXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuXG4gICAgLy8gU2hvdyBwcm9jZXNzaW5nIHN0YXRlXG4gICAgdGhpcy5mb3JtLkZPUk0uY2xhc3NMaXN0LmFkZCh0aGlzLmNsYXNzZXMuUFJPQ0VTU0lORyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQT1NUcyB0aGUgc2VyaWFsaXplZCBmb3JtIGRhdGEgdXNpbmcgdGhlIEZldGNoIE1ldGhvZFxuICAgKlxuICAgKiBAcmV0dXJuICB7UHJvbWlzZX0gIEZldGNoIHByb21pc2VcbiAgICovXG4gIHN1Ym1pdCgpIHtcbiAgICAvLyBUbyBzZW5kIHRoZSBkYXRhIHdpdGggdGhlIGFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCBoZWFkZXJcbiAgICAvLyB3ZSBuZWVkIHRvIHVzZSBVUkxTZWFyY2hQYXJhbXMoKTsgaW5zdGVhZCBvZiBGb3JtRGF0YSgpOyB3aGljaCB1c2VzXG4gICAgLy8gbXVsdGlwYXJ0L2Zvcm0tZGF0YVxuICAgIGxldCBmb3JtRGF0YSA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoKTtcblxuICAgIE9iamVjdC5rZXlzKHRoaXMuX2RhdGEpLm1hcChrID0+IHtcbiAgICAgIGZvcm1EYXRhLmFwcGVuZChrLCB0aGlzLl9kYXRhW2tdKTtcbiAgICB9KTtcblxuICAgIGxldCBodG1sID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpO1xuXG4gICAgaWYgKGh0bWwuaGFzQXR0cmlidXRlKCdsYW5nJykpXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2xhbmcnLCBodG1sLmdldEF0dHJpYnV0ZSgnbGFuZycpKTtcblxuICAgIHJldHVybiBmZXRjaCh0aGlzLmZvcm0uRk9STS5nZXRBdHRyaWJ1dGUoJ2FjdGlvbicpLCB7XG4gICAgICBtZXRob2Q6IHRoaXMuZm9ybS5GT1JNLmdldEF0dHJpYnV0ZSgnbWV0aG9kJyksXG4gICAgICBib2R5OiBmb3JtRGF0YVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByZXNwb25zZSBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBkYXRhICBEYXRhIGZyb20gdGhlIHJlcXVlc3RcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgIFRoZSBpbnN0YW50aWF0ZWQgY2xhc3NcbiAgICovXG4gIHJlc3BvbnNlKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5zdWNjZXNzKVxuICAgICAgdGhpcy5zdWNjZXNzKCk7XG4gICAgZWxzZVxuICAgICAgaWYgKGRhdGEuZXJyb3IgPT09IDIxMjExKVxuICAgICAgICB0aGlzLmZlZWRiYWNrKCdTRVJWRVJfVEVMX0lOVkFMSUQnKS5lbmFibGUoKTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5mZWVkYmFjaygnU0VSVkVSJykuZW5hYmxlKCk7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJylcbiAgICAgIGNvbnNvbGUuZGlyKGRhdGEpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUXVldWVzIHRoZSBzdWNjZXNzIG1lc3NhZ2UgYW5kIGFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gcmVzZXQgdGhlIGZvcm1cbiAgICogdG8gaXQncyBkZWZhdWx0IHN0YXRlLlxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgVGhlIGluc3RhbnRpYXRlZCBjbGFzc1xuICAgKi9cbiAgc3VjY2VzcygpIHtcbiAgICB0aGlzLmZvcm0uRk9STS5jbGFzc0xpc3RcbiAgICAgIC5yZXBsYWNlKHRoaXMuY2xhc3Nlcy5QUk9DRVNTSU5HLCB0aGlzLmNsYXNzZXMuU1VDQ0VTUyk7XG5cbiAgICBsZXQgbWVzc2FnZSA9IHRoaXMuZm9ybS5GT1JNLnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuTVNHKTtcblxuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICBtZXNzYWdlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICAgIG1lc3NhZ2UuYWRkQXR0cmlidXRlKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XG4gICAgfVxuXG4gICAgdGhpcy5lbmFibGUoKTtcblxuICAgIHRoaXMuZm9ybS5GT1JNLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKCkgPT4ge1xuICAgICAgdGhpcy5mb3JtLkZPUk0uY2xhc3NMaXN0LnJlbW92ZSh0aGlzLmNsYXNzZXMuU1VDQ0VTUyk7XG5cbiAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgIG1lc3NhZ2Uuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICAgIG1lc3NhZ2UucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWxpdmUnKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFN1Y2Nlc3NmdWwgbWVzc2FnZXMgaG9vayAoZm4gcHJvdmlkZWQgdG8gdGhlIGNsYXNzIHVwb24gaW5zdGFudGlhdGlvbilcbiAgICBpZiAodGhpcy5zZW50KSB0aGlzLnNlbnQodGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBRdWV1ZXMgdGhlIHNlcnZlciBlcnJvciBtZXNzYWdlXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICByZXNwb25zZSAgVGhlIGVycm9yIHJlc3BvbnNlIGZyb20gdGhlIHJlcXVlc3RcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgICAgICBUaGUgaW5zdGFudGlhdGVkIGNsYXNzXG4gICAqL1xuICBlcnJvcihyZXNwb25zZSkge1xuICAgIHRoaXMuZmVlZGJhY2soJ1NFUlZFUicpLmVuYWJsZSgpO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpXG4gICAgICBjb25zb2xlLmRpcihyZXNwb25zZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgZGl2IGNvbnRhaW5pbmcgdGhlIGZlZWRiYWNrIG1lc3NhZ2UgdG8gdGhlIHVzZXIgYW5kIHRvZ2dsZXMgdGhlXG4gICAqIGNsYXNzIG9mIHRoZSBmb3JtXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBLRVkgIFRoZSBrZXkgb2YgbWVzc2FnZSBwYWlyZWQgaW4gbWVzc2FnZXMgYW5kIGNsYXNzZXNcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgVGhlIGluc3RhbnRpYXRlZCBjbGFzc1xuICAgKi9cbiAgZmVlZGJhY2soS0VZKSB7XG4gICAgLy8gQ3JlYXRlIHRoZSBuZXcgZXJyb3IgbWVzc2FnZVxuICAgIGxldCBtZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAvLyBTZXQgdGhlIGZlZWRiYWNrIGNsYXNzIGFuZCBpbnNlcnQgdGV4dFxuICAgIG1lc3NhZ2UuY2xhc3NMaXN0LmFkZChgJHt0aGlzLmNsYXNzZXNbS0VZXX0ke3RoaXMuY2xhc3Nlcy5NRVNTQUdFfWApO1xuICAgIG1lc3NhZ2UuaW5uZXJIVE1MID0gdGhpcy5zdHJpbmdzW0tFWV07XG5cbiAgICAvLyBBZGQgbWVzc2FnZSB0byB0aGUgZm9ybSBhbmQgYWRkIGZlZWRiYWNrIGNsYXNzXG4gICAgdGhpcy5mb3JtLkZPUk0uaW5zZXJ0QmVmb3JlKG1lc3NhZ2UsIHRoaXMuZm9ybS5GT1JNLmNoaWxkTm9kZXNbMF0pO1xuICAgIHRoaXMuZm9ybS5GT1JNLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc2VzW0tFWV0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyB0aGUgU2hhcmVGb3JtIChhZnRlciBzdWJtaXR0aW5nIGEgcmVxdWVzdClcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIFRoZSBpbnN0YW50aWF0ZWQgY2xhc3NcbiAgICovXG4gIGVuYWJsZSgpIHtcbiAgICAvLyBFbmFibGUgdGhlIGZvcm1cbiAgICBsZXQgaW5wdXRzID0gdGhpcy5mb3JtLkZPUk0ucXVlcnlTZWxlY3RvckFsbCh0aGlzLnNlbGVjdG9ycy5JTlBVVFMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpKyspXG4gICAgICBpbnB1dHNbaV0ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuXG4gICAgbGV0IGJ1dHRvbiA9IHRoaXMuZm9ybS5GT1JNLnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuU1VCTUlUKTtcblxuICAgIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG5cbiAgICAvLyBSZW1vdmUgdGhlIHByb2Nlc3NpbmcgY2xhc3NcbiAgICB0aGlzLmZvcm0uRk9STS5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuY2xhc3Nlcy5QUk9DRVNTSU5HKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKiBUaGUgbWFpbiBjb21wb25lbnQgc2VsZWN0b3IgKi9cblNoYXJlRm9ybS5zZWxlY3RvciA9ICdbZGF0YS1qcz1cInNoYXJlLWZvcm1cIl0nO1xuXG4vKiogU2VsZWN0b3JzIHdpdGhpbiB0aGUgY29tcG9uZW50ICovXG5TaGFyZUZvcm0uc2VsZWN0b3JzID0ge1xuICBGT1JNOiAnZm9ybScsXG4gIElOUFVUUzogJ2lucHV0JyxcbiAgUEhPTkU6ICdpbnB1dFt0eXBlPVwidGVsXCJdJyxcbiAgU1VCTUlUOiAnYnV0dG9uW3R5cGU9XCJzdWJtaXRcIl0nLFxuICBSRVFVSVJFRDogJ1tyZXF1aXJlZD1cInRydWVcIl0nLFxuICBUT0dHTEU6ICdbZGF0YS1qcyo9XCJzaGFyZS1mb3JtLWNvbnRyb2xcIl0nLFxuICBJTlBVVDogJ1tkYXRhLXNoYXJlLWZvcm0qPVwiaW5wdXRcIl0nLFxuICBNU0c6ICdkYXRhLXNoYXJlLWZvcm09XCJtZXNzYWdlXCJdJ1xufTtcblxuLyoqIENTUyBjbGFzc2VzIHVzZWQgYnkgdGhpcyBjb21wb25lbnQuICovXG5TaGFyZUZvcm0uY2xhc3NlcyA9IHtcbiAgRVJST1I6ICdlcnJvcicsXG4gIFNFUlZFUjogJ2Vycm9yJyxcbiAgU0VSVkVSX1RFTF9JTlZBTElEOiAnZXJyb3InLFxuICBNRVNTQUdFOiAnLW1lc3NhZ2UnLFxuICBQUk9DRVNTSU5HOiAncHJvY2Vzc2luZycsXG4gIFNVQ0NFU1M6ICdzdWNjZXNzJ1xufTtcblxuLyoqIFN0cmluZ3MgdXNlZCBmb3IgdmFsaWRhdGlvbiBmZWVkYmFjayAqL1xuU2hhcmVGb3JtLnN0cmluZ3MgPSB7XG4gIFNFUlZFUjogJ1NvbWV0aGluZyB3ZW50IHdyb25nLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicsXG4gIFNFUlZFUl9URUxfSU5WQUxJRDogJ1VuYWJsZSB0byBzZW5kIHRvIG51bWJlciBwcm92aWRlZC4gUGxlYXNlIHVzZSBhbm90aGVyIG51bWJlci4nLFxuICBWQUxJRF9SRVFVSVJFRDogJ1RoaXMgaXMgcmVxdWlyZWQnLFxuICBWQUxJRF9FTUFJTF9JTlZBTElEOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgZW1haWwuJyxcbiAgVkFMSURfVEVMX0lOVkFMSUQ6ICdQbGVhc2UgcHJvdmlkZSAxMC1kaWdpdCBudW1iZXIgd2l0aCBhcmVhIGNvZGUuJ1xufTtcblxuU2hhcmVGb3JtLnNlbnQgPSBmYWxzZTtcblxuZXhwb3J0IGRlZmF1bHQgU2hhcmVGb3JtO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgVG9nZ2xlIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy90b2dnbGUvdG9nZ2xlJztcblxuLyoqXG4gKiBUaGUgQXR0cmlidXRpb24gbW9kdWxlXG4gKlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIEF0dHJpYnV0aW9uIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcmV0dXJuICB7b2JqZWN0fSAgVGhlIGNsYXNzXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gQXR0cmlidXRpb24uc2VsZWN0b3I7XG5cbiAgICB0aGlzLnRvZ2dsZSA9IG5ldyBUb2dnbGUoe1xuICAgICAgc2VsZWN0b3I6IHRoaXMuc2VsZWN0b3JcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKiBAdHlwZSAge1N0cmluZ30gIFRoZSBkb20gc2VsZWN0b3IgZm9yIHRoZSBtb2R1bGUgKi9cbkF0dHJpYnV0aW9uLnNlbGVjdG9yID0gJ1tkYXRhLWpzKj1cImF0dHJpYnV0aW9uXCJdJztcblxuZXhwb3J0IGRlZmF1bHQgQXR0cmlidXRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL3RvZ2dsZS90b2dnbGUnO1xuXG4vKipcbiAqIFRoZSBNb2JpbGUgTmF2IG1vZHVsZVxuICpcbiAqIEBjbGFzc1xuICovXG5jbGFzcyBNZW51IHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcmV0dXJuICB7b2JqZWN0fSAgVGhlIGNsYXNzXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gTWVudS5zZWxlY3RvcjtcblxuICAgIHRoaXMuc2VsZWN0b3JzID0gTWVudS5zZWxlY3RvcnM7XG5cbiAgICB0aGlzLnRvZ2dsZSA9IG5ldyBUb2dnbGUoe1xuICAgICAgc2VsZWN0b3I6IHRoaXMuc2VsZWN0b3IsXG4gICAgICBhZnRlcjogdG9nZ2xlID0+IHtcbiAgICAgICAgLy8gU2hpZnQgZm9jdXMgZnJvbSB0aGUgb3BlbiB0byB0aGUgY2xvc2UgYnV0dG9uIGluIHRoZSBNb2JpbGUgTWVudSB3aGVuIHRvZ2dsZWRcbiAgICAgICAgaWYgKHRvZ2dsZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFRvZ2dsZS5hY3RpdmVDbGFzcykpIHtcbiAgICAgICAgICB0b2dnbGUudGFyZ2V0LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuQ0xPU0UpLmZvY3VzKCk7XG5cbiAgICAgICAgICAvLyBXaGVuIHRoZSBsYXN0IGZvY3VzYWJsZSBpdGVtIGluIHRoZSBsaXN0IGxvb3NlcyBmb2N1cyBsb29wIHRvIHRoZSBmaXJzdFxuICAgICAgICAgIHRvZ2dsZS5mb2N1c2FibGUuaXRlbSh0b2dnbGUuZm9jdXNhYmxlLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsICgpID0+IHtcbiAgICAgICAgICAgICAgdG9nZ2xlLmZvY3VzYWJsZS5pdGVtKDApLmZvY3VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3JzLk9QRU4pLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKiBAdHlwZSAge1N0cmluZ30gIFRoZSBkb20gc2VsZWN0b3IgZm9yIHRoZSBtb2R1bGUgKi9cbk1lbnUuc2VsZWN0b3IgPSAnW2RhdGEtanMqPVwibWVudVwiXSc7XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIEFkZGl0aW9uYWwgc2VsZWN0b3JzIHVzZWQgYnkgdGhlIHNjcmlwdCAqL1xuTWVudS5zZWxlY3RvcnMgPSB7XG4gIENMT1NFOiAnW2RhdGEtanMtbWVudSo9XCJjbG9zZVwiXScsXG4gIE9QRU46ICdbZGF0YS1qcy1tZW51Kj1cIm9wZW5cIl0nXG59O1xuXG5leHBvcnQgZGVmYXVsdCBNZW51O1xuIiwiaW1wb3J0IERpYWxvZyBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvZGlhbG9nL2RpYWxvZyc7XG5cbmNsYXNzIE1vZGFsIGV4dGVuZHMgRGlhbG9nIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgTW9kYWw7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL3RvZ2dsZS90b2dnbGUnO1xuXG4vKipcbiAqIFRoZSBTZWFyY2ggbW9kdWxlXG4gKlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIFNlYXJjaCB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICpcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgY2xhc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RvZ2dsZSA9IG5ldyBUb2dnbGUoe1xuICAgICAgc2VsZWN0b3I6IFNlYXJjaC5zZWxlY3RvcixcbiAgICAgIGFmdGVyOiAodG9nZ2xlKSA9PiB7XG4gICAgICAgIGxldCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoU2VhcmNoLnNlbGVjdG9yKTtcbiAgICAgICAgbGV0IGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihTZWFyY2guc2VsZWN0b3JzLmlucHV0KTtcblxuICAgICAgICBpZiAoZWwuY2xhc3NOYW1lLmluY2x1ZGVzKCdhY3RpdmUnKSAmJiBpbnB1dCkge1xuICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKlxuICogVGhlIGRvbSBzZWxlY3RvciBmb3IgdGhlIG1vZHVsZVxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuU2VhcmNoLnNlbGVjdG9yID0gJ1tkYXRhLWpzKj1cInNlYXJjaFwiXSc7XG5cblNlYXJjaC5zZWxlY3RvcnMgPSB7XG4gIGlucHV0OiAnW2RhdGEtc2VhcmNoKj1cImlucHV0XCJdJ1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2VhcmNoO1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL3RvZ2dsZS90b2dnbGUnO1xuXG4vKipcbiAqIFBhZ2luYXRlIHRocm91Z2ggYSBzZXJpZXMgb2Ygc3RlcHMgdXNpbmcgY2xpY2sgZXZlbnRzIGFuZCB0aGUgcG9wc3RhdGUgZXZlbnQuXG4gKiBQcmVzZXJ2ZXMgdGhlIHVzZSBvZiBhIFF1ZXJ5IFBhcmFtZXRlciAnc3RlcCcgb25sb2FkIGJ1dCBtaWdyYXRlcyB0byB1c2luZ1xuICogaGFzaGVzIGZvciBzdGVwIGFuY2hvcnMuXG4gKi9cbmNsYXNzIFN0ZXBCeVN0ZXAge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBlbGVtZW50ICBUYXJnZXQgb2YgdGhlIFN0ZXBCeVN0ZXBcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgICAgIEluc3RhbmNlIG9mIFN0ZXBCeVN0ZXBcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgaWYgKCF0aGlzLmVsZW1lbnQpIHJldHVybjtcblxuICAgIHRoaXMuc3RlcHMgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChTdGVwQnlTdGVwLnNlbGVjdG9ycy5TVEVQKTtcblxuICAgIHRoaXMuU1RFUF9UT0dHTElORyA9IGBTVEVQX1RPR0dMSU5HXyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygpLnJlcGxhY2UoJzAuJywgJycpfWA7XG5cbiAgICB0aGlzLnRvZ2dsZSA9IG5ldyBUb2dnbGUoe1xuICAgICAgc2VsZWN0b3I6IFN0ZXBCeVN0ZXAuc2VsZWN0b3JzLkdPVE8sXG4gICAgICAvLyBUT0RPXG4gICAgICAvLyBFbmFibGUvZGlzYWJsZSB0aGUgdG9nZ2xlIG1ldGhvZCdzIGZvY3VzYWJsZSBjaGlsZHJlbiB0b2dnbGluZyBmZWF0dXJlLlxuICAgICAgLy8gVGhlcmUgYXJlIGNvbXBvbmVudHMgd2l0aGluIHRoZSBzdGVwcyB0aGF0IGFsc28gdXNlIHRoZSBUb2dnbGUgdXRpbGl0eVxuICAgICAgLy8gYW5kIHRoaXMgd2lsbCBjb25mbGljdCB3aXRoIHRob3NlIGNvbXBvbmVudHMgZm9jdXNhYmxlIGNoaWxkcmVuLlxuICAgICAgZm9jdXNhYmxlOiBTdGVwQnlTdGVwLmZvY3VzYWJsZUNoaWxkcmVuXG4gICAgfSk7XG5cbiAgICB0aGlzLnRvZ2dsZS5qdW1wVG8gPSB0aGlzLmp1bXBUbzsgLy8gb3ZlcnJpZGUgdGhlIHRvZ2dsZSBpbnN0YW5jZSdzIGp1bXAgbWV0aG9kXG5cbiAgICB0aGlzLmFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTsgLy8gc3ltYm9saWMgZWxlbWVudCBmb3IgdG9nZ2xlIG1ldGhvZFxuXG4gICAgdGhpcy5wcmV2ZW50RGVmYXVsdCA9ICgpID0+IHt9O1xuXG4gICAgLyoqXG4gICAgICogSW5pdFxuICAgICAqL1xuXG4gICAgKGFzeW5jICgpID0+IHtcbiAgICAgIC8qKlxuICAgICAgICogU2hvdyB0aGUgZmlyc3Qgb3IgcXVlcmllZCBzdGVwXG4gICAgICAgKi9cblxuICAgICAgbGV0IHN0ZXAgPSB0aGlzLmdldFF1ZXJpZWRTdGVwKCk7XG5cbiAgICAgIGxldCBxdWVyeSA9IHRoaXMuc3RlcHNbc3RlcF0uZGF0YXNldC5zdGVwO1xuXG4gICAgICAvLyBSZXBsYWNlIHN0ZXAgcXVlcnkgcGFyYW0gd2l0aCBzdGVwIGhhc2hcbiAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uc2VhcmNoKSB7XG4gICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKCcnLCAnJywgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJyMnICsgcXVlcnkpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnRvZ2dsZS50YXJnZXQgPSB0aGlzLnN0ZXBzW3N0ZXBdO1xuICAgICAgdGhpcy50b2dnbGUuZm9jdXNhYmxlID0gW107XG5cbiAgICAgIC8vIEhpZGUgaW5hY3RpdmUgc3RlcHMgdXNpbmcgdGhlIGJlZm9yZSB0b2dnbGUgY2FsbGJhY2tcbiAgICAgIGF3YWl0IHRoaXMuYmVmb3JlKHRoaXMudG9nZ2xlKTtcblxuICAgICAgLyoqXG4gICAgICAgKiBTZXQgZXZlbnQgbGlzdGVuZXJzIGFuZCBjYWxsYmFja3NcbiAgICAgICAqL1xuXG4gICAgICAvKiogQHZhciB7ZnVuY3Rpb259IHZhbGlkICBWYWxpZGl0eSBtZXRob2QgZm9yIHRoZSB0b2dnbGUgKi9cbiAgICAgIHRoaXMudG9nZ2xlLnNldHRpbmdzLnZhbGlkID0gdG9nZ2xlID0+IHtcbiAgICAgICAgcmV0dXJuICF0b2dnbGUuZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModG9nZ2xlLnNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcbiAgICAgIH07XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsICgpID0+IHtcbiAgICAgICAgdGhpcy5wb3BzdGF0ZSgpO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMudG9nZ2xlLnNldHRpbmdzLmJlZm9yZSA9IHRvZ2dsZSA9PiB7XG4gICAgICAgIHRoaXMuYmVmb3JlKHRvZ2dsZSk7XG4gICAgICB9O1xuXG4gICAgICAvKiogQHZhciB7ZnVuY3Rpb259IGFmdGVyICBBZnRlciBjYWxsYmFjayBmb3IgdGhlIHRvZ2dsaW5nIGluc3RhbmNlICovXG4gICAgICB0aGlzLnRvZ2dsZS5zZXR0aW5ncy5hZnRlciA9ICgpID0+IHtcbiAgICAgICAgd2luZG93W3RoaXMuU1RFUF9UT0dHTElOR10gPSBmYWxzZTtcbiAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgcXVlcmllZCBzdGVwIGluZGV4LiBUaGlzIGlzIGJhY2t3YXJkcyBjb21wYXRpYmxlIHdpdGggdGhlIHByZXZpb3VzXG4gICAqIGZ1bmN0aW9uYWxpdHkgdGhhdCB1c2VkIGEgc3RlcCBxdWVyeSBwYXJhbSB0byB0cmFjayBzdGVwcyBhbmQgaGlzdG9yeVxuICAgKlxuICAgKiBAcmV0dXJuICB7SW50ZWdlcn0gIFRoZSBpbmRleCBvZiB0aGUgcXVlcmllZCBzdGVwXG4gICAqL1xuICBnZXRRdWVyaWVkU3RlcCgpIHtcbiAgICBsZXQgc3RlcCA9IDA7XG5cbiAgICBjb25zdCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG5cbiAgICBjb25zdCBzZWFyY2ggPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuXG4gICAgaWYgKGhhc2ggfHwgc2VhcmNoKSB7XG4gICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHNlYXJjaCk7XG5cbiAgICAgIGNvbnN0IHF1ZXJ5ID0gKHNlYXJjaClcbiAgICAgICAgPyBwYXJhbXMuZ2V0KFN0ZXBCeVN0ZXAucGFyYW0pIDogaGFzaC5yZXBsYWNlKCcjJywgJycpO1xuXG4gICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5zdGVwcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgaWYgKHRoaXMuc3RlcHNbaW5kZXhdLmRhdGFzZXQuc3RlcCA9PT0gcXVlcnkpIHtcbiAgICAgICAgICBzdGVwID0gaW5kZXg7XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdGVwO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBwcmltYXJ5IGhhbmRsZXIgZm9yIGJhY2svZm9yd2FyZCBuYXZpZ2F0aW9uIHVzaW5nIHRoZSBicm93c2VyXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBwb3BzdGF0ZSAgV2luZG93IGhpc3RvcnkgZXZlbnQgdG8gbGlzdGVuIHRvXG4gICAqL1xuICBwb3BzdGF0ZSgpIHtcbiAgICBpZiAod2luZG93W3RoaXMuU1RFUF9UT0dHTElOR10pXG4gICAgICByZXR1cm47XG5cbiAgICBjb25zdCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKTtcblxuICAgIGNvbnN0IHN0ZXAgPSBBcnJheS5mcm9tKHRoaXMuc3RlcHMpXG4gICAgICAuZmluZEluZGV4KHMgPT4gcy5kYXRhc2V0LnN0ZXAgPT09IGhhc2gpO1xuXG4gICAgLy8gUmV0dXJuIGlmIGhhc2ggaXMgbm90IGZvdW5kIGluIHN0ZXBzXG4gICAgaWYgKHN0ZXAgPT09IC0xKSByZXR1cm47XG5cbiAgICAvLyBQcmVwIHN5bWJvbGljIGFuY2hvclxuICAgIHRoaXMuYW5jaG9yLmNsYXNzTGlzdC5yZW1vdmUodGhpcy50b2dnbGUuc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuICAgIHRoaXMuYW5jaG9yLnNldEF0dHJpYnV0ZSgnaHJlZicsIGAjJHt0aGlzLnN0ZXBzW3N0ZXBdLmRhdGFzZXQuc3RlcH1gKTtcbiAgICB0aGlzLmFuY2hvci5zZXRBdHRyaWJ1dGUoU3RlcEJ5U3RlcC5hdHRycy5HT1RPLFxuICAgICAgYCR7dGhpcy5zdGVwc1tzdGVwXS5kYXRhc2V0LnN0ZXB9YCk7XG5cbiAgICAvLyBTaG93IHRoZSBzdGVwXG4gICAgdGhpcy50b2dnbGUuZWxlbWVudFRvZ2dsZSh0aGlzLmFuY2hvciwgdGhpcy5zdGVwc1tzdGVwXSwgW10pO1xuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAvKipcbiAgICAgICAqIFNob3cgcG90ZW50aWFsbHkgZm9jdXNhYmxlIGNoaWxkcmVuXG4gICAgICAgKi9cblxuICAgICAgaWYgKFN0ZXBCeVN0ZXAuZm9jdXNhYmxlQ2hpbGRyZW4pIHtcbiAgICAgICAgbGV0IGVsZW1lbnRzID0gdGhpcy5zdGVwc1tzdGVwXS5xdWVyeVNlbGVjdG9yQWxsKFRvZ2dsZS5lbEZvY3VzYWJsZS5qb2luKCcsICcpKTtcblxuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgaXRlbSB0byBmb2N1cyBvbiB3aGVuIHRoZSBzdGVwIGlzIHNob3duXG4gICAgICAgKi9cblxuICAgICAgbGV0IGZvY3VzSXRlbSA9IHRoaXMuc3RlcHNbc3RlcF0ucXVlcnlTZWxlY3RvcihTdGVwQnlTdGVwLnNlbGVjdG9ycy5GT0NVUyk7XG5cbiAgICAgIGlmIChmb2N1c0l0ZW0pIHtcbiAgICAgICAgZm9jdXNJdGVtLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgZm9jdXNJdGVtLmZvY3VzKCk7XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5zY3JvbGwoe3RvcDogdGhpcy5zdGVwc1tzdGVwXS5vZmZzZXRUb3B9KTtcbiAgICB9LCAxMCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIFV0aWxpdHkgYmVmb3JlIGNhbGxiYWNrXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICB0b2dnbGUgIEluc3RhbmNlIG9mIHRoZSBUb2dnbGUgVXRpbGl0eVxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgICAgICAgICBJbnN0YW5jZSBvZiBTdGVwQnlTdGVwXG4gICAqL1xuICBiZWZvcmUodG9nZ2xlKSB7XG4gICAgd2luZG93W3RoaXMuU1RFUF9UT0dHTElOR10gPSB0cnVlO1xuXG4gICAgLy8gUmVtb3ZlIHRoZSBhY3RpdmUgY2xhc3Mgb2YgYWxsIHRvZ2dsZSBlbGVtZW50c1xuICAgIGxldCBvdGhlcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRvZ2dsZS5zZXR0aW5ncy5zZWxlY3Rvcik7XG5cbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IG90aGVycy5sZW5ndGg7IHkrKykge1xuICAgICAgaWYgKG90aGVyc1t5XS5kYXRhc2V0LnN0ZXBHb1RvID09PSB0b2dnbGUudGFyZ2V0LmRhdGFzZXQuc3RlcClcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIG90aGVyc1t5XS5jbGFzc0xpc3QucmVtb3ZlKHRvZ2dsZS5zZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG4gICAgfVxuXG4gICAgLy8gSGlkZSBhbGwgc2VjdGlvbnMgdW5sZXNzIGl0IGlzIHRoZSB0YXJnZXQgc2VjdGlvblxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLnN0ZXBzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgbGV0IHMgPSB0aGlzLnN0ZXBzW2luZGV4XTtcblxuICAgICAgaWYgKHRvZ2dsZS50YXJnZXQgPT09IHMpIGNvbnRpbnVlO1xuXG4gICAgICBzLmNsYXNzTGlzdC5yZW1vdmUodG9nZ2xlLnNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcbiAgICAgIHMuY2xhc3NMaXN0LmFkZCh0b2dnbGUuc2V0dGluZ3MuaW5hY3RpdmVDbGFzcyk7XG4gICAgICBzLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0cnVlKTtcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgaXRlbSB0byBmb2N1cyBvbiB3aGVuIHRoZSBzdGVwIGlzIHNob3duXG4gICAgICAgKi9cblxuICAgICAgbGV0IGZvY3VzSXRlbXMgPSBzLnF1ZXJ5U2VsZWN0b3JBbGwoU3RlcEJ5U3RlcC5zZWxlY3RvcnMuRk9DVVMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZvY3VzSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9jdXNJdGVtc1tpXS5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogSGlkZSB0aGUgZm9jdXNhYmxlIGNoaWxkcmVuIG9mIHRoZSBzdGVwXG4gICAgICAgKi9cblxuICAgICAgaWYgKFN0ZXBCeVN0ZXAuZm9jdXNhYmxlQ2hpbGRyZW4pIHtcbiAgICAgICAgbGV0IGVsZW1lbnRzID0gcy5xdWVyeVNlbGVjdG9yQWxsKFRvZ2dsZS5lbEZvY3VzYWJsZS5qb2luKCcsICcpKTtcblxuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIHJlcGxhY2VzIHRoZSBqdW1wIG1ldGhvZCBpbiB0aGUgdG9nZ2xlLiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBvdmVycmlkZVxuICAgKiB0aGUgaGlzdG9yeSBzdGF0ZSBjbGVhcmluZy4gVGhlIHRvZ2dsZSB1dGlsaXR5IGFzc3VtZXMgdGhhdCBpdCBpcyBnb2luZyB0b1xuICAgKiBiZSB1c2VkIGZvciBvbmUtb2ZmIHRvZ2dsZXMuIE5vdCBzdGVwIGJ5IHN0ZXAgcGFnaW5hdGlvbiB3aXRoIGhpc3RvcnkuXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBlbGVtZW50ICBUb2dnbGUgZWxlbWVudFxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgdGFyZ2V0ICAgVGFyZ2V0IG9mIHRoZSB0b2dnbGVcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgICAgIFRvZ2dsZSBpbnN0YW5jZVxuICAgKi9cbiAganVtcFRvKGVsZW1lbnQsIHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3MpKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cbiAgICAgIGxldCBmb2N1c0l0ZW0gPSB0YXJnZXQucXVlcnlTZWxlY3RvcihTdGVwQnlTdGVwLnNlbGVjdG9ycy5GT0NVUyk7XG5cbiAgICAgIGlmIChmb2N1c0l0ZW0pIHtcbiAgICAgICAgZm9jdXNJdGVtLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgZm9jdXNJdGVtLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBAdmFyIHtTdHJpbmd9IHNlbGVjdG9yICBNYWluIGVsZW1lbnQgc2VsZWN0b3IgKi9cblN0ZXBCeVN0ZXAuc2VsZWN0b3IgPSAnW2RhdGEtanM9XCJzdGVwLWJ5LXN0ZXBcIl0nO1xuXG4vKiogQHZhciB7T2JqZWN0fSBhdHRycyAgU2VsZWN0b3IgYXR0cmlidXRlIG5hbWVzICovXG5TdGVwQnlTdGVwLmF0dHJzID0ge1xuICBTVEVQOiAnZGF0YS1zdGVwJyxcbiAgR09UTzogJ2RhdGEtc3RlcC1nby10bydcbn07XG5cbi8qKiBAdmFyIHtPYmplY3R9IHNlbGVjdG9ycyAgRWxlbWVudCBzZWxlY3RvcnMgKi9cblN0ZXBCeVN0ZXAuc2VsZWN0b3JzID0ge1xuICBTVEVQOiBgWyR7U3RlcEJ5U3RlcC5hdHRycy5TVEVQfV1gLFxuICBHT1RPOiBgWyR7U3RlcEJ5U3RlcC5hdHRycy5HT1RPfV1gLFxuICBGT0NVUzogJ1tkYXRhLXN0ZXAtYnktc3RlcD1cImZvY3VzXCJdJ1xufTtcblxuLyoqIEB2YXIge1N0cmluZ30gcGFyYW0gIFRoZSBxdWVyeSBwYXJhbWV0ZXIgdG8gc3VwcG9ydCBzdGVwIGdvdG8gb25sb2FkICovXG5TdGVwQnlTdGVwLnBhcmFtID0gJ3N0ZXAnO1xuXG4vKiogQHZhciB7Qm9vbGVhbn0gZm9jdXNhYmxlQ2hpbGRyZW4gIFdldGhlciB0aGUgdG9nZ2xlIHRoZSBmb2N1c2FibGUgY2hpbGRyZW4ncyB0YWJpbmRleCB3aGVuIHNob3dpbmcvaGlkaW5nICovXG5TdGVwQnlTdGVwLmZvY3VzYWJsZUNoaWxkcmVuID0gdHJ1ZTtcblxuZXhwb3J0IGRlZmF1bHQgU3RlcEJ5U3RlcDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gVXRpbGl0aWVzXG5pbXBvcnQgRGlhbG9nIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy9kaWFsb2cvZGlhbG9nJztcbmltcG9ydCBEaXJlY3Rpb24gZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL2RpcmVjdGlvbi9kaXJlY3Rpb24nO1xuaW1wb3J0IENvcHkgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL2NvcHkvY29weSc7XG5pbXBvcnQgRm9ybXMgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL2Zvcm1zL2Zvcm1zJztcbmltcG9ydCBJY29ucyBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvaWNvbnMvaWNvbnMnO1xuaW1wb3J0IE1hc2tEb2xsYXJzIGZyb20gJy4uL3V0aWxpdGllcy9tYXNrL21hc2stZG9sbGFycy5qcyc7XG5pbXBvcnQgTWFza1Bob25lIGZyb20gJy4uL3V0aWxpdGllcy9tYXNrL21hc2stcGhvbmUuanMnO1xuaW1wb3J0IE5ld3NsZXR0ZXIgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL25ld3NsZXR0ZXIvbmV3c2xldHRlcic7XG5pbXBvcnQgU2V0SGVpZ2h0UHJvcGVydGllcyBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcHR0cm4tc2NyaXB0cy9zcmMvc2V0LWhlaWdodC1wcm9wZXJ0aWVzL3NldC1oZWlnaHQtcHJvcGVydGllcyc7XG5pbXBvcnQgVGhlbWVzIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy90aGVtZXMvdGhlbWVzJztcbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL3RvZ2dsZS90b2dnbGUnO1xuaW1wb3J0IFRyYWNrIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy90cmFjay90cmFjayc7XG5pbXBvcnQgV2ViU2hhcmUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3B0dHJuLXNjcmlwdHMvc3JjL3dlYi1zaGFyZS93ZWItc2hhcmUnO1xuaW1wb3J0IFdpbmRvd1ZoIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wdHRybi1zY3JpcHRzL3NyYy93aW5kb3ctdmgvd2luZG93LXZoJztcblxuLy8gaW1wb3J0IHNlcmlhbGl6ZSBmcm9tICdmb3ItY2VyaWFsJztcbi8vIEVsZW1lbnRzXG5pbXBvcnQgQ29kZUhpZ2hsaWdodCBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcGF0dGVybi1lbGVtZW50cy9zcmMvZWxlbWVudHMvY29kZS9jb2RlLWhpZ2hsaWdodCc7XG5cbi8vIENvbXBvbmVudHNcbmltcG9ydCBBY2NvcmRpb24gZnJvbSAnLi4vY29tcG9uZW50cy9hY2NvcmRpb24vYWNjb3JkaW9uJztcbmltcG9ydCBBY3RpdmVOYXZpZ2F0aW9uIGZyb20gJy4uL2NvbXBvbmVudHMvYWN0aXZlLW5hdmlnYXRpb24vYWN0aXZlLW5hdmlnYXRpb24nO1xuaW1wb3J0IERpc2NsYWltZXIgZnJvbSAnLi4vY29tcG9uZW50cy9kaXNjbGFpbWVyL2Rpc2NsYWltZXInO1xuaW1wb3J0IE5lYXJieVN0b3BzIGZyb20gJy4uL2NvbXBvbmVudHMvbmVhcmJ5LXN0b3BzL25lYXJieS1zdG9wcyc7XG5pbXBvcnQgUG9wb3ZlciBmcm9tICcuLi9jb21wb25lbnRzL3BvcG92ZXIvcG9wb3Zlcic7XG5pbXBvcnQgU2hhcmVGb3JtIGZyb20gJy4uL2NvbXBvbmVudHMvc2hhcmUtZm9ybS9zaGFyZS1mb3JtJztcbi8vIGltcG9ydCAuLi4gZnJvbSAnLi4vY29tcG9uZW50cy8uLi4nO1xuXG4vLyBPYmplY3RzXG5pbXBvcnQgQXR0cmlidXRpb24gZnJvbSAnQG55Y29wcG9ydHVuaXR5L3BhdHRlcm4tYXR0cmlidXRpb24vc3JjL2F0dHJpYnV0aW9uJztcbmltcG9ydCBNZW51IGZyb20gJ0BueWNvcHBvcnR1bml0eS9wYXR0ZXJuLW1lbnUvc3JjL21lbnUnO1xuaW1wb3J0IE1vZGFsIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wYXR0ZXJuLW1vZGFsL3NyYy9tb2RhbCc7XG5pbXBvcnQgU2VhcmNoIGZyb20gJy4uL29iamVjdHMvc2VhcmNoL3NlYXJjaCc7XG5pbXBvcnQgU3RlcEJ5U3RlcCBmcm9tICcuLi9vYmplY3RzL3N0ZXAtYnktc3RlcC9zdGVwLWJ5LXN0ZXAnO1xuLy8gaW1wb3J0IC4uLiBmcm9tICcuLi9vYmplY3RzLy4uLic7XG5cbi8qKiBpbXBvcnQgbW9kdWxlcyBoZXJlIGFzIHRoZXkgYXJlIHdyaXR0ZW4uICovXG5cbi8qKlxuICogQGNsYXNzICBNYWluIHBhdHRlcm4gbW9kdWxlXG4gKi9cbmNsYXNzIE1haW4ge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yICBNb2R1bGVzIHRvIGJlIGV4ZWN1dGVkIG9uIG1haW4gcGF0dGVybiBpbnN0YW50aWF0aW9uIGhlcmVcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIG5ldyBXaW5kb3dWaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIEFjY29yZGlvbiBDb21wb25lbnRcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIEFjY29yZGlvblxuICAgKi9cbiAgYWNjb3JkaW9uKCkge1xuICAgIHJldHVybiBuZXcgQWNjb3JkaW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgQWN0aXZlIE5hdmlnYXRpb24gY29tcG9uZW50XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBBY3RpdmVOYXZpZ2F0aW9uXG4gICAqL1xuICBhY3RpdmVOYXZpZ2F0aW9uKHNldHRpbmdzID0gZmFsc2UpIHtcbiAgICByZXR1cm4gKHNldHRpbmdzKSA/IG5ldyBBY3RpdmVOYXZpZ2F0aW9uKHNldHRpbmdzKSA6IG5ldyBBY3RpdmVOYXZpZ2F0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgQXR0cmlidXRpb24gb2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBBdHRyaWJ1dGlvblxuICAgKi9cbiAgYXR0cmlidXRpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBBdHRyaWJ1dGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgQ29kZSBTeW50YXggSGlnaGxpZ2h0aW5nXG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBDb2RlSGlnaGxpZ2h0XG4gICAqL1xuICBjb2RlSGlnaGxpZ2h0KHMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgQ29kZUhpZ2hsaWdodChzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBDb3B5IFV0aWxpdHlcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIENvcHlcbiAgICovXG4gIGNvcHkoKSB7XG4gICAgcmV0dXJuIG5ldyBDb3B5KHtcbiAgICAgIGNvcGllZDogYyA9PiBjLmVsZW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtanMtY29weT1cImljb25cIl0nKVxuICAgICAgICAuc2V0QXR0cmlidXRlKCdocmVmJywgYCNsdWNpZGUtY2hlY2tgKSxcbiAgICAgIGFmdGVyOiBjID0+IGMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1qcy1jb3B5PVwiaWNvblwiXScpXG4gICAgICAgIC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBgI2x1Y2lkZS1jb3B5YClcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBEaWFsb2cgQ29tcG9uZW50XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBEaWFsb2dcbiAgICovXG4gIGRpYWxvZygpIHtcbiAgICByZXR1cm4gbmV3IERpYWxvZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIERpcmVjdGlvbiBVdGlsaXR5XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBEaXJlY3Rpb25cbiAgICovXG4gIGRpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERpcmVjdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIERpc2NsYWltZXIgQ29tcG9uZW50XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBEaXNjbGFpbWVyXG4gICAqL1xuICBkaXNjbGFpbWVyKCkge1xuICAgIHJldHVybiBuZXcgRGlzY2xhaW1lcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIEljb25zIFV0aWxpdHlcbiAgICpcbiAgICogQHBhcmFtICAge1N0cmluZ30gIHBhdGggIFRoZSBwYXRoIG9mIHRoZSBpY29uIGZpbGVcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gICAgICAgIEluc3RhbmNlIG9mIEljb25zXG4gICAqL1xuICBpY29ucyhwYXRoID0gJ3N2Zy9zdmdzLnN2ZycpIHtcbiAgICByZXR1cm4gbmV3IEljb25zKHBhdGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgSW5wdXQgTWFza3NcbiAgICovXG4gIG1hc2tzKCkge1xuICAgIG5ldyBNYXNrRG9sbGFycygpO1xuICAgIG5ldyBNYXNrUGhvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBNZW51XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBNZW51XG4gICAqL1xuICBtZW51KCkge1xuICAgIHJldHVybiBuZXcgTWVudSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIE1vZGFsXG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBNb2RhbFxuICAgKi9cbiAgbW9kYWwoKSB7XG4gICAgcmV0dXJuIG5ldyBNb2RhbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgTmVhcmJ5IFN0b3BzXG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBOZWFyYnlTdG9wc1xuICAgKi9cbiAgbmVhcmJ5U3RvcHMoKSB7XG4gICAgcmV0dXJuIG5ldyBOZWFyYnlTdG9wcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIE5ld3NsZXR0ZXIgT2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBOZXdzbGV0dGVyXG4gICAqL1xuICBuZXdzbGV0dGVyKGVuZHBvaW50ID0gJycpIHtcbiAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoTmV3c2xldHRlci5zZWxlY3Rvcik7XG5cbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgbGV0IG5ld3NsZXR0ZXIgPSBuZXcgTmV3c2xldHRlcihlbGVtZW50KTtcblxuICAgICAgbmV3c2xldHRlci5mb3JtLnNlbGVjdG9ycy5FUlJPUl9NRVNTQUdFX1BBUkVOVCA9ICcuYy1xdWVzdGlvbl9fY29udGFpbmVyJztcblxuICAgICAgd2luZG93W25ld3NsZXR0ZXIuY2FsbGJhY2tdID0gZGF0YSA9PiB7XG4gICAgICAgIGRhdGEucmVzcG9uc2UgPSB0cnVlO1xuXG4gICAgICAgIGRhdGEuZW1haWwgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJFTUFJTFwiXScpLnZhbHVlO1xuXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IGAke2VuZHBvaW50fT9gICsgT2JqZWN0LmtleXMoZGF0YSlcbiAgICAgICAgICAubWFwKGsgPT4gYCR7a309JHtlbmNvZGVVUkkoZGF0YVtrXSl9YCkuam9pbignJicpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIG5ld3NsZXR0ZXI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIHBvcG92ZXJcbiAgICovXG4gIHBvcG92ZXIoKSB7XG4gICAgKGVsZW1lbnRzID0+IHtcbiAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiBuZXcgUG9wb3ZlcihlbGVtZW50KSk7XG4gICAgfSkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChQb3BvdmVyLnNlbGVjdG9yKSk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciBzZXR0aW5nIGhlaWdodCBwcm9wZXJ0aWVzIGZvciB2YXJpb3VzIGVsZW1lbnRzLlxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgSW5zdGFuY2Ugb2YgU2V0SGVpZ2h0UHJvcGVydGllc1xuICAgKi9cbiAgc2V0SGVpZ2h0UHJvcGVydGllcygpIHtcbiAgICByZXR1cm4gbmV3IFNldEhlaWdodFByb3BlcnRpZXMoe1xuICAgICAgJ2VsZW1lbnRzJzogW1xuICAgICAgICB7XG4gICAgICAgICAgJ3NlbGVjdG9yJzogJ1tkYXRhLWpzPVwibmF2aWdhdGlvblwiXScsXG4gICAgICAgICAgJ3Byb3BlcnR5JzogJy0tby1uYXZpZ2F0aW9uLWhlaWdodCdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdzZWxlY3Rvcic6ICdbZGF0YS1qcz1cImZlZWRiYWNrXCJdJyxcbiAgICAgICAgICAncHJvcGVydHknOiAnLS1ueWNvLWZlZWRiYWNrLWhlaWdodCdcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIE5ld3NsZXR0ZXIgT2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBOZXdzbGV0dGVyXG4gICAqL1xuICBuZXdzbGV0dGVyRm9ybShlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtanM9XCJuZXdzbGV0dGVyLWZvcm1cIl0nKSkge1xuICAgIGxldCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuICAgIGxldCByZXNwb25zZSA9IHBhcmFtcy5nZXQoJ3Jlc3BvbnNlJyk7XG4gICAgbGV0IG5ld3NsZXR0ZXIgPSBudWxsO1xuXG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIG5ld3NsZXR0ZXIgPSBuZXcgTmV3c2xldHRlcihlbGVtZW50KTtcbiAgICAgIG5ld3NsZXR0ZXIuZm9ybS5zZWxlY3RvcnMuRVJST1JfTUVTU0FHRV9QQVJFTlQgPSAnLmMtcXVlc3Rpb25fX2NvbnRhaW5lcic7XG4gICAgfVxuXG4gICAgaWYgKHJlc3BvbnNlICYmIG5ld3NsZXR0ZXIpIHtcbiAgICAgIGxldCBlbWFpbCA9IHBhcmFtcy5nZXQoJ2VtYWlsJyk7XG4gICAgICBsZXQgaW5wdXQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJFTUFJTFwiXScpO1xuXG4gICAgICBpbnB1dC52YWx1ZSA9IGVtYWlsO1xuXG4gICAgICBuZXdzbGV0dGVyLl9kYXRhID0ge1xuICAgICAgICAncmVzdWx0JzogcGFyYW1zLmdldCgncmVzdWx0JyksXG4gICAgICAgICdtc2cnOiBwYXJhbXMuZ2V0KCdtc2cnKSxcbiAgICAgICAgJ0VNQUlMJzogZW1haWxcbiAgICAgIH07XG5cbiAgICAgIG5ld3NsZXR0ZXIuX2NhbGxiYWNrKG5ld3NsZXR0ZXIuX2RhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdzbGV0dGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIFNlYXJjaFxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgSW5zdGFuY2Ugb2YgU2VhcmNoXG4gICAqL1xuICBzZWFyY2goKSB7XG4gICAgcmV0dXJuIG5ldyBTZWFyY2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBTaGFyZSBGb3JtXG4gICAqL1xuICBzaGFyZUZvcm0oKSB7XG4gICAgKGVsZW1lbnRzID0+IHtcbiAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiBuZXcgU2hhcmVGb3JtKGVsZW1lbnQpKTtcbiAgICB9KShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFNoYXJlRm9ybS5zZWxlY3RvcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIFN0ZXAgYnkgU3RlcFxuICAgKi9cbiAgc3RlcEJ5U3RlcCgpIHtcbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZSB0aGUgUHJvZ3JhbSBHdWlkZVxuICAgICAqL1xuICAgIChlbGVtZW50ID0+IHtcbiAgICAgIGlmIChlbGVtZW50KSBuZXcgU3RlcEJ5U3RlcChlbGVtZW50KTtcbiAgICB9KShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFN0ZXBCeVN0ZXAuc2VsZWN0b3IpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBUaGVtZXMgVXRpbGl0eVxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgSW5zdGFuY2Ugb2YgVGhlbWVzXG4gICAqL1xuICB0aGVtZXMoKSB7XG4gICAgcmV0dXJuIG5ldyBUaGVtZXMoe1xuICAgICAgdGhlbWVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsYWJlbDogJ0RhcmsgVGhlbWUnLFxuICAgICAgICAgIGNsYXNzbmFtZTogJ2RlZmF1bHQnLFxuICAgICAgICAgIGljb246ICdsdWNpZGUtbW9vbidcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxhYmVsOiAnTGlnaHQgVGhlbWUnLFxuICAgICAgICAgIGNsYXNzbmFtZTogJ2RhcmsnLFxuICAgICAgICAgIGljb246ICdsdWNpZGUtc3VuJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgYWZ0ZXI6IHRobXMgPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aG1zLnNlbGVjdG9ycy5UT0dHTEUpXG4gICAgICAgIC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgIGVsZW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtanMtdGhlbWVzPVwiaWNvblwiXScpXG4gICAgICAgICAgICAuc2V0QXR0cmlidXRlKCdocmVmJywgYCMke3RobXMudGhlbWUuaWNvbn1gKTtcbiAgICAgICAgfSlcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBUb2dnbGUgVXRpbGl0eVxuICAgKlxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgc2V0dGluZ3MgIFNldHRpbmdzIGZvciB0aGUgVG9nZ2xlIENsYXNzXG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICAgICAgICAgICAgSW5zdGFuY2Ugb2YgVG9nZ2xlXG4gICAqL1xuICB0b2dnbGUoc2V0dGluZ3MgPSBmYWxzZSkge1xuICAgIHJldHVybiAoc2V0dGluZ3MpID8gbmV3IFRvZ2dsZShzZXR0aW5ncykgOiBuZXcgVG9nZ2xlKCk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgVHJhY2sgT2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBUcmFja1xuICAgKi9cbiAgdHJhY2soKSB7XG4gICAgcmV0dXJuIG5ldyBUcmFjaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgV2ViIFNoYXJlXG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBXZWJTaGFyZVxuICAgKi9cbiAgd2ViU2hhcmUoKSB7XG4gICAgcmV0dXJuIG5ldyBXZWJTaGFyZSh7XG4gICAgICBmYWxsYmFjazogKCkgPT4ge1xuICAgICAgICBuZXcgVG9nZ2xlKHtcbiAgICAgICAgICBzZWxlY3RvcjogV2ViU2hhcmUuc2VsZWN0b3JcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQVBJIGZvciB2YWxpZGF0aW5nIGEgZm9ybS5cbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgICBzZWxlY3RvciAgQSBjdXN0b20gc2VsZWN0b3IgZm9yIGEgZm9ybVxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gIHN1Ym1pdCAgICBBIGN1c3RvbSBldmVudCBoYW5kbGVyIGZvciBhIGZvcm1cbiAgICovXG4gIHZhbGlkYXRlKHNlbGVjdG9yID0gJ1tkYXRhLWpzPVwidmFsaWRhdGVcIl0nLCBzdWJtaXQgPSAoZXZlbnQpID0+IHtldmVudC50YXJnZXQuc3VibWl0KCl9KSB7XG4gICAgKGVsZW1lbnRzID0+IHtcbiAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGxldCBmb3JtID0gbmV3IEZvcm1zKGVsZW1lbnQpO1xuXG4gICAgICAgIGZvcm0uc3VibWl0ID0gc3VibWl0O1xuXG4gICAgICAgIGZvcm0uc2VsZWN0b3JzLkVSUk9SX01FU1NBR0VfUEFSRU5UID0gJy5jLXF1ZXN0aW9uX19jb250YWluZXInO1xuXG4gICAgICAgIGZvcm0ud2F0Y2goKTtcbiAgICAgIH0pO1xuICAgIH0pKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZXMgYSBmb3JtIGFuZCBidWlsZHMgYSBVUkwgc2VhcmNoIHF1ZXJ5IG9uIHRoZSBhY3Rpb24gYmFzZWQgb24gZGF0YS5cbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgc2VsZWN0b3IgIEEgY3VzdG9tIHNlbGVjdG9yIGZvciBhIGZvcm1cbiAgICovXG4gIHZhbGlkYXRlQW5kUXVlcnkoc2VsZWN0b3IgPSAnW2RhdGEtanM9XCJ2YWxpZGF0ZS1hbmQtcXVlcnlcIl0nKSB7XG4gICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBsZXQgZm9ybSA9IG5ldyBGb3JtcyhlbGVtZW50KTtcblxuICAgICAgZm9ybS5zdWJtaXQgPSBldmVudCA9PiB7XG4gICAgICAgIGxldCBkYXRhID0gc2VyaWFsaXplKGV2ZW50LnRhcmdldCwge2hhc2g6IHRydWV9KTtcblxuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBgJHtldmVudC50YXJnZXQuYWN0aW9ufT9gICsgT2JqZWN0LmtleXMoZGF0YSlcbiAgICAgICAgICAubWFwKGsgPT4gYCR7a309JHtlbmNvZGVVUkkoZGF0YVtrXSl9YCkuam9pbignJicpO1xuICAgICAgfTtcblxuICAgICAgZm9ybS5zZWxlY3RvcnMuRVJST1JfTUVTU0FHRV9QQVJFTlQgPSAnLmMtcXVlc3Rpb25fX2NvbnRhaW5lcic7XG5cbiAgICAgIGZvcm0ud2F0Y2goKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTWFpbjtcbiJdLCJuYW1lcyI6WyJDbGVhdmUiLCJzZXJpYWxpemUiLCJmcmVlR2xvYmFsIiwicm9vdCIsIm9iamVjdFByb3RvIiwiaGFzT3duUHJvcGVydHkiLCJuYXRpdmVPYmplY3RUb1N0cmluZyIsInN5bVRvU3RyaW5nVGFnIiwiU3ltYm9sIiwiZnVuY1RhZyIsImNvcmVKc0RhdGEiLCJmdW5jUHJvdG8iLCJmdW5jVG9TdHJpbmciLCJkZWZpbmVQcm9wZXJ0eSIsImJhc2VTZXRUb1N0cmluZyIsInNldFRvU3RyaW5nIiwiTUFYX1NBRkVfSU5URUdFUiIsImFyZ3NUYWciLCJmcmVlRXhwb3J0cyIsImZyZWVNb2R1bGUiLCJtb2R1bGVFeHBvcnRzIiwiZXJyb3JUYWciLCJvYmplY3RUYWciLCJub2RlVXRpbCIsImlzQXJyYXkiLCJpc0FyZ3VtZW50cyIsImlzQnVmZmVyIiwiaXNUeXBlZEFycmF5IiwiZ2V0UHJvdG90eXBlIiwibmF0aXZlS2V5cyIsImVzY2FwZUh0bWxDaGFyIiwicmVFc2NhcGUiLCJyZUV2YWx1YXRlIiwicmVJbnRlcnBvbGF0ZSIsInRlbXBsYXRlU2V0dGluZ3MiLCJhc3NpZ25JbldpdGgiLCJhdHRlbXB0IiwiYmFzZUZvciIsImJhc2VFYWNoIl0sIm1hcHBpbmdzIjoiOzs7RUFFQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxNQUFNLE1BQU0sQ0FBQztFQUNiO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsRUFBRSxXQUFXLENBQUMsQ0FBQyxFQUFFO0VBQ2pCO0VBQ0EsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO0VBQy9DLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDbkM7RUFDQSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdEI7RUFDQSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUc7RUFDcEIsTUFBTSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVE7RUFDM0QsTUFBTSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVM7RUFDL0QsTUFBTSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWE7RUFDL0UsTUFBTSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVc7RUFDdkUsTUFB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QUFDLENBQUM7RUFDdkQsU0FBUztBQUNUO0VBQ0E7RUFDQSxRQUFRLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7RUFDdEYsWUFBWSxlQUFlLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzdELFlBQVksY0FBYyxHQUFHLENBQUMsR0FBRyxlQUFlLENBQUM7RUFDakQsWUFBWSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLGVBQWUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztFQUNwRixZQUFZLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ2pGO0VBQ0EsWUFBWSxZQUFZLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7QUFDeEY7RUFDQSxZQUFZLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDcEMsU0FBUztBQUNUO0VBQ0E7RUFDQSxRQUFRLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7RUFDdEYsWUFBWSxlQUFlLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzdELFlBQVksY0FBYyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsZUFBZSxD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SSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBZ0Isb0JBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMs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QU0sQ0FBQyxTQUFTLENBQUM7QUFDdEU7RUFDQSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMxRTtFQUNBLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ3RFO0VBQ0EsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDMUU7RUFDQTtFQUNBO0VBQ0E7QUFDQTtFQUNBLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0Q7RUFDQSxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVU7RUFDdkIsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDNUM7RUFDQTtFQUNBO0VBQ0E7QUFDQTtFQUNBLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJO0VBQ3RFLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO0VBQ3RELFFBQVEsT0FBTztBQUNmO0VBQ0EsTUFBTSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDakM7RUFDQSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7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
