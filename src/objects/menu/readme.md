<!-- Headers start with h5 ##### -->

The Menu may be used by either the global stylesheet or module import.

##### Global Stylesheet and JavaScript

The Menu will display correctly with the global stylesheet.

```html
<link href="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.stylesDist }}" rel="stylesheet">
```

The Menu requires JavaScript for showing, hiding, and screen reader accessibility. To initialize the Menu instance from the global script use the following code:

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.menu();
</script>
```

This function will attach the Menu toggling event to the body of the document.

##### Stylesheet and JavaScript Module Import

The Menu includes two stylesheets. One sets the default design tokens using <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties" target="_blank" rel="noindex nofollow">CSS Custom Properties</a>, and another adds custom styles.

```scss
@forward '@nycopportunity/pattern-menu/src/tokens.css';
@forward '{{ this.package.name }}/objects/menu/_menu.scss';
```

The Menu JavaScript source exists in the <a href="https://github.com/nycopportunity/pattern-menu/" target="_blank" rel="noopener nofollow">Pattern Menu</a> module, which is a dependency of the {{ this.package.nice }}.

```javascript
import Menu from '@nycopportunity/pattern-menu/src/menu';

new Menu();
```
