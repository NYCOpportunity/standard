'use strict';

// Utilities
import Dialog from '@nycopportunity/pttrn-scripts/src/dialog/dialog';
import Direction from '@nycopportunity/pttrn-scripts/src/direction/direction';
import Copy from '@nycopportunity/pttrn-scripts/src/copy/copy';
import Forms from '@nycopportunity/pttrn-scripts/src/forms/forms';
import Icons from '@nycopportunity/pttrn-scripts/src/icons/icons';
import Newsletter from '@nycopportunity/pttrn-scripts/src/newsletter/newsletter';
import SetHeightProperties from '@nycopportunity/pttrn-scripts/src/set-height-properties/set-height-properties';
import Themes from '@nycopportunity/pttrn-scripts/src/themes/themes';
import Toggle from '@nycopportunity/pttrn-scripts/src/toggle/toggle';
import Track from '@nycopportunity/pttrn-scripts/src/track/track';
import WebShare from '@nycopportunity/pttrn-scripts/src/web-share/web-share';
import WindowVh from '@nycopportunity/pttrn-scripts/src/window-vh/window-vh';

// import serialize from 'for-cerial';

// Components
import Accordion from '../components/accordion/accordion';
import ActiveNavigation from '../components/active-navigation/active-navigation';
// import ... from '../components/...';

// Objects
import Attribution from '@nycopportunity/pattern-attribution/src/attribution';
import Menu from '@nycopportunity/pattern-menu/src/menu';
// import Search from '../objects/search/search';
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
  activeNavigation() {
    return new ActiveNavigation();
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
   * An API for the Menu
   *
   * @return  {Object}  Instance of Menu
   */
  menu() {
    return new Menu();
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
  validate(selector = '[data-js="validate"]', submit = false) {
    if (document.querySelector(selector)) {
      let form = new Forms(document.querySelector(selector));

      form.submit = (submit) ? submit : (event) => {
        event.target.submit();
      };

      form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

      form.watch();
    }
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

export default Main;
