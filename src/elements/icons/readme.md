The common method for implementing SVG sprites is to include them in the page dynamically. Then, individual icons are referenced on the page with the `use` tag using their ID which corresponds with their filename.

The SVG sprite for {{ this.package.nice }} icons, including [Custom UI Icons](#custom-ui-icons), [Program Icons](#program-icons), and **Logos** can be referenced at the following path.

```
'{{ this.package.name }}/dist/svg/svgs.svg'
```

A sprite for the <a href="https://github.com/NYCOpportunity/pattern-elements" target="_blank" rel="noopener">Patterns Elements</a> package is found at the following path.

```
'{{ this.package.name }}/dist/svg/pattern-elements.svg'
```

Lastly, a sprite for the <a target="_blank" rel="noopener nofollow" href="https://lucide.dev">Lucide open source</a> library ([described below](#user-interface-ui-icons)) is found at the following path.

```
'{{ this.package.name }}/dist/svg/lucide.svg'
```

Follow the [SVGs Installation](installation#svgs) instructions to add icon sprites to the page dynamically.
