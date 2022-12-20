'use strict';

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
    })

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

export default Popover;
