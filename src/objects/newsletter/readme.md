<!-- Headers start with h5 ##### -->

##### Global Script

The Newsletter Pattern requires JavaScript for submitting the form without leaving the page and for front-end validation.


```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.newsletter('/path/to/full/form');
  Standard.newsletterForm();
</script>
```

`Standard.newsletter('/path/to/full/form')` instantiates the default Newsletter form field. It will pass the data from the MailChimp subscription response as URL parameters to a specified endpoint set as the first (and only) argument.

`Standard.newsletterForm()` instantiates the Full Newsletter form field. It will automatically handle the response passed as URL parameters from the single form field and display the response for the submission.

**Note**. It is recommended that data passed via URL parameters be validated.

##### Module Import

The Newsletter source exists in the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library, which is a dependency of this library. Pass a selected newsletter element that contains the form to the instantiated object and set the parent selector for input validation messaging.

```javascript
import Newsletter from '@nycopportunity/pttrn-scripts/src/newsletter/newsletter';

let element = document.querySelector('[data-js="newsletter-form"]');

let newsletter = new Newsletter(element);

newsletter.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';
```

###### Setting a custom callback

The `Standard.newsletter()` method uses a custom callback to the window that the MailChimp subscription endpoint sends response data to. Below is an example of this.

```javascript
// ...

let newsletter = new Newsletter(element);

// ...

// Use the instantiated Newsletter's unique callback key
window[newsletter.callback] = data => {
  data.response = true;

  // Set email to the data so it is passed along
  data.email = element.querySelector('input[name="EMAIL"]').value;

  // Set the window location to redirect to the form with URL parameters from the response
  window.location = '/path/to/full/form?' + Object.keys(data)
    .map(k => `${k}=${encodeURI(data[k])}`).join('&');
};
```

###### Pre-populating a response

The `Standard.newsletterForm()` Below is an example the global script uses to pre-populate the Newsletter response in the full form using URL parameters.

```javascript
// ...

let newsletter = new Newsletter(element);

// ...

let params = new URLSearchParams(window.location.search);
let email = params.get('email');
let input = element.querySelector('input[name="EMAIL"]');

// Populate the email field on the form
input.value = email;

// Set the instantiated Newsletter's data store
newsletter._data = {
  result: params.get('result'),
  msg: params.get('msg'),
  EMAIL: email
};

// Pass the data to the Newsletter's callback function for displaying messaging
newsletter._callback(newsletter._data);
```

View the `Standard.newsletterForm()` method source at <u>{{ this.global.entry.scripts }}</u> for a full example.
