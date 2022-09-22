##### Global Script

The Question Component requires JavaScript for native form validation. To use the validation through the global script use the following code. A optional selector targeting the form may be supplied as the first argument to the `.validate()` method. The second optional argument is a function which handles the form data after it passes validation.

```html
<script src="{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.validate();

  // or

  // Accepts a @selector and @function for submission handling
  Standard.validate('#a-custom-form', function(event) {
    event.preventDefault();

    // Add your own custom submission handler
  });
</script>
```

###### Markup

```html
<form data-js="validate" action="/my/action/" method="post">
  <label for="email">Please enter your email.</label>

  <input type="email" id="email" required="true">

  <button>Submit</button>
</form>
```

Validation messages will appear when the user leaves a **required** question blank (`required="true"` must be set on the `<input>` tag), enters an answer that does not match a specified **pattern** (`pattern="{{ my regular expression }}"` must be set on the `<input>` tag), or tries to submit the form without filling out any required fields.

##### Module Import

The form validation source exists in the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library. Install the `@nycopportunity/pttrn-scripts` module to import the module. This method allows the specification of watching for input errors on blur, setting the error container's selector, and other customizations. Refer to the the source for details.

```javascript
import Forms from '@nycopportunity/patterns-scripts/src/forms/forms';

this.form = new Forms(document.querySelector('#question-demo'));

this.form.submit = (event) => {
  event.preventDefault();
  // Submission handler
};

this.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

this.form.watch();
```
