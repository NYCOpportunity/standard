<!-- Headers start with h5 ##### -->

##### Global Script

The **Share Form** requires JavaScript for showing and hiding the form input and disclaimer, for form validation, input masking, and submitting the form to an endpoint backend processing. To initialize the **Share Form** and Disclaimer instances from the global script use the following code:

```html
<!-- Global Script -->
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.disclaimer();
  Standard.shareForm();
  Standard.masks();
</script>
```

This will attach event listeners for toggling the form and disclaimer open and form validation and submission.

##### Module Import

For module imports, import the mask utility, Disclaimer and **Share Form** modules from the source. You must pass a DOM selection of each **Share Form** to a new instance of the class. A selector reference is stored in the class.

```javascript
import MaskPhone from '{{ this.package.name }}/{{ this.global.src }}/utilities/mask/mask-phone.js';
import Disclaimer from '{{ this.package.name }}/{{ this.global.src }}/components/disclaimer/disclaimer';
import ShareForm from '{{ this.package.name }}/{{ this.global.src }}/components/share-form/share-form';

new MaskPhone();
new Disclaimer();

let elements = document.querySelectorAll(ShareForm.selector);

elements.forEach(element => {
  new ShareForm(element);
});
```

##### Submit method

When submitted, the script will post the form data to the URL endpoint in the form `action` attribute. Below is an example of the data submitted by the text message form;

```javascript
{
  'action': 'sms_send'
  'url': '{{ MY_URL }}'
  'hash': '{{ MY_HASH }}'
  'GUID': '{{ MY_GUID }}'
  'to': '{{ PHONE_NUMBER or EMAIL_ADDRESS }}'
  'lang': 'en'
}
```

The body can be modified to meet the needs of the application. The endpoint will need to be set up on the server side to direct the request to the email or SMS service of choice.

---

<small><a target="_blank" rel="noopener nofollow" href="https://access.nyc.gov">ACCESS NYC</a> uses the <a target="_blank" rel="noopener" href="https://aws.amazon.com/ses/">Amazon SES</a> service to send emails and the <a target="_blank" rel="noopener nofollow" href="https://www.twilio.com/">Twilio</a> service to send text messages.</small>

##### Response

The proxy service should respond with a JSON object to indicate success or failure of the response.

```javascript
{
  'success': true
}
```

##### Localization

Strings (and other properties) can be passed in an object `{}` to the **Share Form** for localization. View the source link at the top of this page for defaults.

```javascript
let element = document.querySelector(ShareForm.selector);

let shareForm = new ShareForm(element);

shareForm.strings = {
  {{ MY_CUSTOM_STRINGS }}
};
```
