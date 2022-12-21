The {{ this.package.nice }} includes a few CSS extra utilities that extend the [Tailwindcss](tailwindcss) utility library. On this page; [Animate](#animate), [Cell](#cell), [Direction](#direction), [Material](#material), [Screen Readers](#screen-readers), [Scroll](#scroll), and [Status](#status).

---

#### Animate

The <a href="https://animate.style/" target="_blank" rel="noopener nofollow">Animate.css</a> library is included as a dependency. The animations, `fadeIn` and `fadeInUp` are included.

<div class="bg material flex items-center justify-center p-3 mb-3 animated fadeInUp">
  <small>Animated element<small>
</div>

```html
<div class="animated fadeInUp">
  Animated element
</div>
```

---

#### Cell

`cell-padding` adds the same amount of padding that [Table](tables) cells use, `{{ this.tokens.cell.padding }}`.

<div class="bg material flex items-center justify-center p-3 mb-3 cell-padding">
  <small>Element with table cell padding</small>
</div>

```html
<div class="cell-padding">
  Element with table cell padding
</div>
```

---

#### Direction

`rtl:flip` and `ltr:flip` flip the horizontal direction of elements visually using CSS transformations, based on the reading direction of the document (`rtl` for right-to-left and `ltr` for left-to-right).

<div class="bg material flex items-center justify-center p-3 mb-3">
  <div class="grid grid-cols-2 gap-3">
    <svg class="icon-ui ltr:flip">
      <use href="#lucide-external-link"></use>
    </svg>
    <svg class="icon-ui rtl:flip">
      <use href="#lucide-external-link"></use>
    </svg>
  </div>
</div>

```html
<svg class="icon-ui ltr:flip">
  <use href="#lucide-external-link"></use>
</svg>

<svg class="icon-ui rtl:flip">
  <use href="#lucide-external-link"></use>
</svg>
```

---

#### Material

`material` adds the {{ this.package.nice }} "material" styling to an element. These styles may be borders or drop shadows depending on the configuration of the theme in the <a target="_blank" rel="noopener" href="{{ this.package.cdn.source }}/blob/main/config/tokens.js">tokens configuration</a>. "Material" styles are used in several components, such as [cards](Card), [Accordions](accordion), and [global elements](demos/global) to differentiate them from others in the user interface.

<div class="bg material flex items-center justify-center p-3 mb-3">
  Material Element
</div>

```html
<div class="material">
  Material Element
</div>
```

Below is a description of the material values for {{ this.package.nice }}.

Material Property | Theme  | Value
------------------|--------|-
Shadow Up         | Light  | `{{ this.tokens.colorMode.default.material.shadow-up }}`
Border            | Light  | `{{ this.tokens.colorMode.default.material.border }}`
Border Radius     | Light  | `{{ this.tokens.colorMode.default.material.border-radius }}`
Shadow Up         | Dark   | `{{ this.tokens.colorMode.dark.material.shadow-up }}`
Border            | Dark   | `{{ this.tokens.colorMode.dark.material.border }}`
Border Radius     | Dark   | `{{ this.tokens.colorMode.dark.material.border-radius }}`

---

#### Screen Readers

`sr-only` hides an element visually for screen readers.

<div class="sr-only">
  This text is only visible to screen readers.
</div>

```html
<div class="sr-only">
  This text is only visible to screen readers.
</div>
```

---

#### Scroll

The classes `scroll`, `scroll-x`, `scroll-x-snap-start`, and `scroll-peek` create a horizontally scrolling region that snaps elements in view to the beginning side. `scroll-x-snap-start` can be swapped out with `scroll-x-snap-end` to snap elements in the view to the end side. `scroll-peek` will reveal `{{ this.tokens.dimension.scroll-peek-column-width }}` of the next element to make it visually clear that the window will scroll.

<div class="material py-3 mb-3 scroll scroll-x scroll-x-snap-start scroll-peek">
  <div class="aspect-video material flex items-center justify-center mie-3">
    Element
  </div>
  <div class="aspect-video material flex items-center justify-center mie-3">
    Element
  </div>
  <div class="aspect-video material flex items-center justify-center mie-3">
    Element
  </div>
  <div class="aspect-video material flex items-center justify-center">
    Element
  </div>
</div>

```html
<div class="scroll scroll-x scroll-x-snap-start scroll-peek">
  <div class="mie-3">
    Element
  </div>

  <div class="mie-3">
    Element
  </div>

  <div class="mie-3">
    Element
  </div>

  <div>
    Element
  </div>
</div>
```

---

#### Status

`status-primary`, `status-secondary`, and `status-tertiary` modify the background and text color of an element to match their [Alert](alert) color assignment.

<div class="status-primary material flex items-center justify-center p-3 mb-1">
  Primary Status
</div>

<div class="status-secondary material flex items-center justify-center p-3 mb-1">
  Secondary Status
</div>

<div class="status-tertiary material flex items-center justify-center p-3 mb-3">
  Tertiary Status
</div>

```html
<div class="status-primary">
  Primary Status
</div>

<div class="status-secondary">
  Secondary Status
</div>

<div class="status-tertiary">
  Tertiary Status
</div>
```
