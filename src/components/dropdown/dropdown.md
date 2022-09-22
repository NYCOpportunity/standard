The Dropdown Component is a container for a region of content that can be expanded open or closed using attributes on the primary toggling element: `aria-controls`, `aria-expanded`, and `aria-hidden`. This is similar to the [Accordion Component](accordion), however, it differs in a few ways.

---

Dropdowns may have more than one toggling component as the toggle will shift focus from the "open" toggle element to a designated "close" toggle element. Toggling elements are given the data attributes `data-dialog="open"` or `data-dialog="close"` respectively.

---

They are intended to be a *maximum* height of the browser minus the [Navigation Object](navigation)'s height. Any content that extends beyond that will be scrollable. A dropdown can be set to use this property as the *minimum* height of the page by adding the `.c-dropdown-min` class to the main element (`.c-dropdown`).

---

They can trap the focus of the page and prevent scrolling on the body element like a modal dialog when they occupy the full view of the page. This prevents focusing on elements that are not visible. The data attribute `data-dialog-lock="true"` on the opening toggling element designates this behavior.
