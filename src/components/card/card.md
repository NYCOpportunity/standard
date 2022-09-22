Cards are thumbnails of content and may include a full or partial set of content-related elements. Further guidance on generic cards can be found on the <a href="https://designsystem.digital.gov/components/card" target="_blank" rel="noopener">U.S. Web Design System (USWDS) site</a>. Cards may contain any of the following elements; title, subtitle, status, summary, feature list, call-to-action, or web share component. At a minimum, the card should have a title with a link to the complete content the card describes.

---

**Call-to-action**; At a minimum, the card should have a title that links to the complete content the card describes. For mobile viewports, the call to action is invisible but covers the entire card, making the whole card tappable for mobile devices.

* **Internal or external**; The call-to-action may link to either internal or external content. Internal content exists on the same website or domain name (including the subdomain). External content exists in an entirely separate domain.

* **New or current window**; The call-to-action may refresh the existing window or open a new window (or tab). Internal content should generally open in the existing window, and external content may open in a new window. Test with users or follow the guidance from Nielson Norman Group on <a href="https://www.nngroup.com/articles/new-browser-windows-and-tabs/" target="_blank" rel="nofollow noopener">"Opening Links in New Browser Windows and Tabs."</a> Links that open in new tabs should have the appropriate `target="_blank"` and `rel="nofollow noopener"` attributes.

* **Link icons**; *Internal* call-to-actions should use the directional arrow icon <svg aria-hidden="true" class="icon-ui rtl:flip"><use href="#feather-arrow-right"></use></svg> in the button element of the card. *External* call-to-actions should use the external link icon <svg aria-hidden="true" class="icon-ui rtl:flip"><use href="#feather-external-link"></use></svg> in the title and button element of the card.

* **Learn more about...**; The call-to-action button label should be more descriptive for screen-readers than only including the text *"Learn More."* Use a full sentence for the link that includes *"Learn more"* + the card title. For example, *"Learn more about commercial driver training."* The card title can be hidden visually using the `.sr-only` CSS utility.

---

The following example is a **"program card"** and is [described in more detail below](#program-card).