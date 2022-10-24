The Newsletter Object is an embedded MailChimp signup form. More details about embedded MailChimp forms can be found on the [MailChimp website](https://mailchimp.com/help/add-a-signup-form-to-your-website/). This form can work with any Mailchimp subscriber list that is configured through the form action;

```html
form action="https://nyc.us18.list-manage.com/subscribe/post?u={{ mailchimp account }}&id={{ form id }}" method="post" id="mc-embedded-subscribe-form"
```

While the Newsletter Object doesn't require JavaScript, it is needed for submitting the form without leaving the page and for front-end validation.