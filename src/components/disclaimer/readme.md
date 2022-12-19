<!-- Headers start with h5 ##### -->

##### Global Script

The **Disclaimer Toggle** requires JavaScript for showing and hiding. It also uses the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> <a href="https://github.com/CityOfNewYork/patterns-scripts/tree/main/src/toggle" target="_blank" rel="noopener nofollow">Toggle Utility</a>. To initialize the Disclaimer instance from the global script use the following code:

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.toggle(); // The Toggle Utility must be instantiated before the Disclaimer
  Standard.disclaimer();
</script>
```

This function will attach the main toggle and disclaimer toggling event to the body of the document.

##### Module Import

For module imports, import the Disclaimer module from the source. The Toggle Utility source exists in the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library, which is a dependency of this library.

```javascript
import Toggle from '@nycopportunity/pttrn-scripts/src/toggle/toggle';
import Disclaimer from '{{ this.package.name }}/{{ this.global.src }}/components/disclaimer/disclaimer';

new Toggle(); // The Toggle Utility must be instantiated before the Disclaimer
new Disclaimer();
```

##### Constants

The module includes a constant named `SCREEN_DESKTOP` which determines wether the browser needs scroll the disclaimer in the browser's view. The Rollup.js configuration replaces this constant in the script during processing with the number `{{ this.tokens.screen.desktop }}` (without the "px") so that when the browser width is less than `{{ this.tokens.screen.desktop }}` wide the viewport will scroll area into view.

This constant will need to be defined or replaced in any project using the module.
