<!-- Headers start with h5 ##### -->

The Navigation may be used by either the global stylesheet or module import.

##### Global Stylesheet and JavaScript

The Navigation will display correctly with the global stylesheet.

```html
<link href="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.stylesDist }}" rel="stylesheet">
```

The Navigation requires JavaScript to set the `--o-navigation-height` property. This property is used by CSS utilities to add spacing, equal to the height of the navigation, at the bottom of the page to prevent it from covering up content. To initialize the property heights instance from the global script, use the following code:

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.setPropertyHeights();
</script>
```

This property can also be used to calculate layouts, such as the height of the main visible window.

```html
<main style='min-height: var(--100vh); min-height: calc(var(--100vh) - var(--o-navigation-height))'>
  <!-- ... -->
</main>
```

##### Stylesheet and JavaScript Module Import

The Navigation includes two stylesheets. One sets the default design tokens using <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties" target="_blank" rel="noindex nofollow">CSS Custom Properties</a>, and another adds custom styles.

```scss
@forward '@nycopportunity/pattern-navigation/src/tokens.css';
@forward '{{ this.package.name }}/objects/navigation/_navigation.scss';
```

The Navigation JavaScript source uses the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library to set the `--o-navigation-height` property, which is a dependency of the {{ this.package.nice }}. This method allows the specification of multiple properties and element heights.

```javascript
import SetHeightProperties from '@nycopportunity/pttrn-scripts/src/set-height-properties/set-height-properties';

new SetHeightProperties({
  'elements': [
    {
      'selector': '[data-js="navigation"]',
      'property': '--o-navigation-height'
    }
    // Additional elements and properties can be specified here as objects including the selector and propert attributes.
  ]
});
```
