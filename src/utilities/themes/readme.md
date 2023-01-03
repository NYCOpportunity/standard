<!-- Headers start with h5 ##### -->

##### Global Script

The **Theme** toggle requires JavaScript for functionality. It uses the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts, Theme Utility</a> to cycle through themes and setting the users preference to local storage. To use the **Theme** through the global script use the following code:

```html
<script src="{{ this.package.name }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.themes();
</script>
```

This will instantiate the **Theme** toggling element and attach event listeners to the body.

##### Module Import

The Theme Utility source exists in the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library, which is a dependency of this library. This method allows the specification of each theme object and a callback function that will be triggered after the theme is toggled.

```javascript
import Themes from '@nycopportunity/pttrn-scripts/src/themes/themes';

new Themes({
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
```
