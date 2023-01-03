Questions request information from a user to guide them into completing a form. This pattern follows the usage guidelines of the <a href="https://designsystem.digital.gov/components/form-controls/" target="_blank" rel="noopener nofollow">U.S. Web Design System (USWDS) Form Component</a>. Forms use different types of questions to gather specific pieces of information. These usually correlate with native form element input types such as text or radio buttons. However, differing native form elements may be used or combined to collect specific types of information.

Below are common Opportunity Standard Questions, interpreting or extending the guidance from their counterparts in the <abbr title="The U.S. Web Design System">USWDS</abbr>. Guidance to inform additional scenarios can be found on the <abbr title="The U.S. Web Design System">USWDS</abbr> site.

#### General Question

The General Question collects text-based information such as numbers, emails, phone numbers, or long-form content. The appropriate input `type` and `validation` pattern attributes should be set based on the requested information type.

---

The `label` element should be used for the question and tied to the input using its `id` attribute. Further guidance on text inputs can be found on the <a href="https://designsystem.digital.gov/components/text-input/" target="_blank" rel="noopener nofollow"><abbr title="The U.S. Web Design System">USWDS</abbr> site</a>.

---

The `inputmode` attribute can be set to an appropriate value to display a virtual keyboard suggesting the data input. Further guidance on the `inputmode` attribute can be found <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode" target="_blank" rel="noopener nofollow">MDN Web Docs</a>.

#### Validation and Accessibility

Proper markup and aria labeling are required for elements within the question component. While they may appear similar stylistically, there is a difference in the markup between questions with one or multiple inputs. Proper `id`, `name`, and `aria` attributes are also required for labels, option inputs, SVG icons, and validation messages.

---

Questions use validation from the <a href="https://github.com/CityOfNewYork/patterns-scripts/tree/main/src/forms" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library. This script will display visual feedback regarding missing or invalid answers and toggle appropriate `aria` attributes for announcing feedback to screen readers. The `aria-live="polite"` attribute on the message declares error messages that are not visible in the default state. Additionally, the `aria-invalid="true"` attribute illustrates to screen readers that the input is not valid, and the `aria-describedby` attribute indicates the input's error description.

---

Validation occurs on the **blur event** or when the user shifts focus away from the input.

---

The Form Utility uses the Constraint Validation API to assess validity based on the input attributes `required` and `pattern`. If any validity constraints are not met, then the localized `validationMessage` is displayed. Examples include "This field is required" or "Please provide a valid ..."
