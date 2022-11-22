<!-- Headers start with h5 ##### -->

##### Global Script

The Active Navigation requires JavaScript for functionality. To initialize the Active Navigation instance from the global script use the following code:

```html
<script src="{{ this.package.name }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.activeNavigation();
</script>
```

##### Module Import

For module imports, import the Active Navigation module from the source.

```javascript
import ActiveNavigation from '{{ this.package.name }}/{{ this.global.src }}/components/active-navigation/active-navigation';

new ActiveNavigation();
```

##### Configuration

The instantiated object `ActiveNavigation()` accepts an object with the following attributes:

Attribute         | Description
------------------|-
`selector`        | An alternate selector to the default `'[data-js*=\"active-navigation\"]'`
`selectors`       | An object containing alternate selectors used by the script.
`observeOptions`  | An object containing options for the Intersection Observer API.

The attribute `observeOptions` can be passed containing attributes such as the `threshold` and `rootMargin`. The threshold option represents "a single number or an array of numbers which indicate at what percentage of the target's visibility the observer's callback should be executed." Refer to the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#creating_an_intersection_observer" target="_blank" rel="noopener">MDN Intersection Observer API documentation</a> for more details on what the options do.

```javascript
new ActiveNavigation({
  observeOptions: {
    root: null,
    rootMargin: '0px',
    threshold: [0.15]
  }
});
```