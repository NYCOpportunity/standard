<!-- Headers start with h5 ##### -->

The **Modal** may be used by either the global stylesheet or module import.

##### Global Stylesheet and JavaScript

The **Modal** will display correctly with the global stylesheet.

```html
<link href="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.stylesDist }}" rel="stylesheet">
```

The **Modal** requires JavaScript for showing, hiding, and screen reader accessibility. To initialize the **Modal** instance from the global script use the following code:

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.modal();
</script>
```

This function will attach the **Modal** toggling event to the body of the document.

##### Stylesheet and JavaScript Module Import

The **Modal** includes two stylesheets. One sets the default design tokens using <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties" target="_blank" rel="noindex nofollow">CSS Custom Properties</a>, and another adds custom styles.

```scss
@forward '@nycopportunity/pattern-modal/src/tokens.css';
@forward '{{ this.package.name }}/objects/modal/_modal.scss';
```

The **Modal** JavaScript source exists in the <a href="https://github.com/nycopportunity/pattern-modal/" target="_blank" rel="noopener nofollow">Pattern Modal</a> module, which is a dependency of the {{ this.package.nice }}.

```javascript
import Modal from '@nycopportunity/pattern-modal/src/modal';

new Modal();
```
