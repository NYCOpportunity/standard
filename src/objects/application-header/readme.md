<!-- Headers start with h5 ##### -->

The Application Header may be used by either the global stylesheet or module import.

##### Global Stylesheet

The Application Header will display correctly with the global stylesheet.

```html
<link href="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.stylesDist }}" rel="stylesheet">
```

##### Stylesheet Module Import

The Application Header source exists in the <a href="https://github.com/nycopportunity/pattern-application-header/" target="_blank" rel="noopener nofollow">Pattern Application Header</a> module, which is a dependency of the {{ this.package.nice }}. It includes two stylesheets. One sets the default design tokens using <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties" target="_blank" rel="noindex nofollow">CSS Custom Properties</a>, and another adds custom styles.

```scss
@forward '@nycopportunity/pattern-application-header/src/tokens.css';
@forward '@nycopportunity/pattern-application-header/src/_attribution.scss';
```
