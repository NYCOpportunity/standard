Icons are supplementary visual aids that help add emphasis and meaning. Icons in the {{ this.package.nice }} follow guidance from the <a target="_blank" rel="noopener" href="https://designsystem.digital.gov/components/icon/">U.S. Web Design System (USWDS) Icon component</a> but includes its own set of custom icons and integration of open source icon libraries.

---

It's important to **combine an icon with text** as it is the most certain way of communicating the meaning of the icon. Test with users or follow guidance from Nielson Norman Group on <a href="https://www.nngroup.com/articles/icon-usability/" target="_blank" rel="nofollow noopener">"Icon Usability."</a>.

---

Icons can be implemented using **Scalable Vector Graphic (SVG) sprites** which is a collection of individual icons (SVGs) in a single SVG file. Read more about [Icon Sprite Usage](#icon-sprite-usage) below.

---

If using an icon without a visual label, set the `role` attribute of the `svg` element to `img` and add **alternative text** in the SVG `title` tag for screen readers.

```html
<svg class="icon" role="img">
  <title>Disability accommodation details are available. View this program to learn more.</title>
  <use href="#nyco-accessibility"></use>
</svg>
```

Otherwise, if the icon doesn't add any contextual value as a label or it is already paired with a visible text label, it can be visually hidden by setting its `aria-hidden` attribute to `true`.

```html
<p class="flex items-center">
  <svg class="icon mie-1" aria-hidden="true">
    <use href="#nyco-accessibility"></use>
  </svg> <span>Disability accommodation details are available. View this program to learn more.</span>
<p>
```
