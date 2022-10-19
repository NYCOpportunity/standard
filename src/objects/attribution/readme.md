<!-- Headers start with h5 ##### -->

The Attribution may be used by either the global stylesheet or module import.

##### Global Stylesheet and JavaScript

The Attribution will display correctly with the global stylesheet.

```html
<link href="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.stylesDist }}" rel="stylesheet">
```

The "Learn More" toggle in the Attribution requires JavaScript for showing, hiding, and screen reader accessibility. To initialize the Attribution instance from the global script use the following code:

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.attribution();
</script>
```

This function will attach the "Learn More" toggling event to the body of the document.

##### Stylesheet and JavaScript Module Import

The Attribution includes two stylesheets. One sets the default design tokens using <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties" target="_blank" rel="noindex nofollow">CSS Custom Properties</a>, and another adds custom styles.

```scss
@forward '@nycopportunity/pattern-attribution/src/tokens.css';
@forward '{{ this.package.name }}/objects/attribution/_attribution.scss';
```

The Attribution JavaScript source exists in the <a href="https://github.com/nycopportunity/pattern-attribution/" target="_blank" rel="noopener nofollow">Pattern Attribution</a> module, which is a dependency of the {{ this.package.nice }}.

```javascript
import Attribution from '@nycopportunity/pattern-attribution/src/attribution';

new Attribution();
```
