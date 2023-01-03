#### Getting Started

There are two main methods of installation. The preferred method is to use <a href="https://www.npmjs.com/" target="_blank" rel="noopener nofollow">NPM (Node Package Manager)</a> to install the source in the _node_modules/_ directory of your project. This method enables you to compile the {{ this.package.nice }} with your application's CSS, JavaScript, and SVGs. It also maintains a dependency link with the {{ this.package.nice }} source.

The second option involves using distributed stylesheets and scripts via a public CDN. These are linked to the page using `<link>` and `<script>` tags.

#### Module Install

Run the installation script to install the {{ this.package.nice }} and it's dependencies.

```shell
npm install {{ this.package.name }}
```

All pattern sources in the {{ this.package.nice }} is module-based and can be imported individually. Styling is separated from scripting.

**Dart Sass Modules**

```scss
@forward '{{ this.package.name }}/components/accordion/_accordion.scss';
```

**JavaScript ES Modules**

```javascript
import Accordion from '{{ this.package.name }}/src/components/accordion/accordion';

new Accordion();
```

Where applicable, specific installation and usage instructions are noted for each Pattern in this documentation site.

#### Global Import

All Dart Sass and JavaScript ES dependencies can be imported via their global source.

**Dart Sass Global Import**

```scss
@forward '{{ this.package.name }}/src/scss/_imports.scss';
```

The import file forwards several Sass and CSS files from the source directory and dependencies of the {{ this.package.nice }}. If using the Dart Sass global import, refer to ["Resolving Paths"](#resolving-paths) below for suggestions on how to ensure dependency imports are resolved correctly.

The {{ this.package.nice }} uses Tailwindcss to provide CSS utilities which are generated using PostCSS. Tailwindcss will need to be configured. Refer to ["Tailwindcss"](#tailwindcss) below for suggestions on how to generate utilities.

**JavaScript ES Global Import**

Each module needs to be instantiated individually.

```javascript
import Main from '{{ this.package.name }}/src/js/default'

Main.toggle(); // The Toggle Utility must be instantiated first

Main.accordion();
Main.activeNavigation();
Main.attribution();
Main.codeHighlight();
Main.copy();
Main.dialog();
Main.direction();
Main.disclaimer();
Main.masks();
Main.menu();
Main.modal();
Main.nearbyStops();
Main.popover();
Main.search();
Main.shareForm();
Main.stepByStep();
Main.newsletter();
Main.newsletterForm();
Main.setHeightProperties();
Main.themes();
Main.webShare();
Main.validate();
```

---

#### SVGs

There are 3 icon sprites that need to be included in the DOM. The recommended way is to request and inline them into the page asynchronously using JavaScript. The global script includes a utility and helper function to do this. All that needs to be done is provide a path to where the SVG file is hosted.

**Icon Utility**

```JavaScript
import Icons from '@nycopportunity/pttrn-scripts/src/icons/icons';

new Icons('{{ this.package.name }}/dist/svg/svgs.svg');
new Icons('{{ this.package.name }}/dist/svg/pattern-elements.svg');
new Icons('{{ this.package.name }}/dist/svg/lucide.svg');
```

**Global Script Icon Utility**

The global script provides a wrapper around this utility.

```JavaScript
import Main from '{{ this.package.name }}/src/js/default'

Main.icons('{{ this.package.name }}/dist/svg/svgs.svg');
Main.icons('{{ this.package.name }}/dist/svg/pattern-elements.svg');
Main.icons('{{ this.package.name }}/dist/svg/lucide.svg');
```

Including each sprite can also be done manually by copying and pasting each sprite into the page or template file.

---

#### Tailwindcss

When compiling stylesheets, you may use the PostCSS configuration to generate stylesheets the same way this library does to ensure the correct Tailwindcss utilities are generated. You can require the <a target="_blank" rel="noopener" href="{{ this.package.cdn.source }}/blob/main/config/postcss.js">PostCSS</a> and <a target="_blank" rel="noopener" href="{{ this.package.cdn.source }}/blob/main/config/tailwindcss.js">Tailwindcss</a> configuration files and extend them to meet your needs. The main attributes that need to be configured are `content` and `safelist`. Below is an example PostCSS configuration file that extends the {{ this.package.nice }} configuration.

```JavaScript
let postCssConfig = require('{{ this.package.name }}/config/postcss');
let tailwindcssConfig = require('{{ this.package.name }}/config/tailwindcss');

postCssConfig.plugins = postCssConfig.plugins.map(p => {
  if (p.postcssPlugin === 'tailwindcss') {
    tailwindcssConfig.content = [
      './views/**/*.twig',
      './views/**/*.vue',
      './shortcodes/**/*.php'
    ];

    tailwindcssConfig.safelist = [];

    return require('tailwindcss')(tailwindcssConfig);
  }

  return p;
});

module.exports = postCssConfig;
```

All Tailwindcss utilities can by imported from either following Sass or CSS files. However, since all of the utilities are included in these stylesheets it is recommended to use a CSS purging tool to remove unused styles from your production stylesheet.

```scss
@import '{{ this.package.name }}/{{ this.global.src }}{{ this.global.entry.tailwindsass }}';
// or
@import '{{ this.package.name }}/{{ this.global.dist }}{{ this.global.entry.tailwindcss }}';
```

More information alternative options for installing can be found on the <a href="https://tailwindcss.com/docs/installation" target="_blank" rel="noopener nofollow">Tailwindcss site</a>. Details about using the {{ this.package.nice }} utilities can be found on the [Tailwindcss documentation page](tailwindcss).

---

#### Resolving Paths

If importing the global stylesheet, it is necessary to resolve Sass imports. Several frameworks have different ways of doing this. Below is an example of the Sass `includePaths` option, an array of path strings that attempt to resolve your `@import` (deprecated), `@forward`, or `@use` rules if Sass can't find files locally.

```javascript
Sass.render({
    file: './src/scss/default.scss',
    outFile: 'default.css',
    includePaths: [
      `${process.env.PWD}/node_modules`,
      `${process.env.PWD}/node_modules/@nycopportunity/standard/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/standard/dist`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-application-header/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-attribution/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-elements/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-menu/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-modal/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-navigation/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-typography/src`
    ]
  }, (err, result) => {
    Fs.writeFile(`${process.env.PWD}/dist/styles/default.css`, result.css);
  }
});
```

Similar to the the [gulp-sass](https://www.npmjs.com/package/gulp-sass) `includePaths` option.

```javascript
gulp.task('sass', () => {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass.({includePaths: [
      `${process.env.PWD}/node_modules`,
      `${process.env.PWD}/node_modules/@nycopportunity/standard/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/standard/dist`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-application-header/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-attribution/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-elements/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-menu/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-modal/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-navigation/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-typography/src`
    ]})).pipe(gulp.dest('./css'));
});
```

<a href="https://github.com/sass/node-sass" target="_blank" rel="noopener nofollow">LibSass</a> and <a href="https://github.com/sass/dart-sass" target="_blank" rel="noopener nofollow">Dart Sass</a> also support using the `SASS_PATH` environment variable. This variable is valid when configuring a React Application using <a href="https://create-react-app.dev/docs/adding-a-sass-stylesheet" target="_blank" rel="noopener nofollow">React Scripts (Create React App)</a>.

```
SASS_PATH=node_modules:node_modules/{{ this.package.name }}/src:...additional paths here...
```

You can configure **Webpack** with the <a href="https://webpack.js.org/configuration/resolve/#resolvemodules" target="_blank" rel="noopener nofollow">resolve modules option</a>.

```javascript
module.exports = {
  //...
  resolve: {
    modules: [
      `${process.env.PWD}/node_modules`,
      `${process.env.PWD}/node_modules/@nycopportunity/standard/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/standard/dist`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-application-header/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-attribution/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-elements/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-menu/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-modal/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-navigation/src`,
      `${process.env.PWD}/node_modules/@nycopportunity/pattern-typography/src`
    ]
  }
};
```

Below is an example for a <a href="https://nuxtjs.org/" target="_blank" rel="noopener nofollow">Nuxt.js</a> application configuration (which uses **Webpack** under the hood).

```javascript
const config = {
  css: ['@/assets/scss/main.scss'],
  styleResources: {
    scss: [
      '@/assets/scss/_variables.scss',
    ]
  },
  buildModules: [
    '@nuxtjs/style-resources',
  ],
  build: {
    extend(config) {
      config.resolve.modules.push(`${process.env.PWD}/node_modules`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/standard/src`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/standard/dist`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/pattern-application-header/src`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/pattern-attribution/src`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/pattern-elements/src`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/pattern-menu/src`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/pattern-modal/src`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/pattern-navigation/src`);
      config.resolve.modules.push(`${process.env.PWD}/node_modules/@nycopportunity/pattern-typography/src`);
    }
  }
}

export default config;
```

---

#### CDN

Compiled styles and scripts in the **/dist** folder of the GitHub repository can be imported on the page using a CDN such as <a href="https://www.jsdelivr.com" target="_blank" rel="noopener nofollow">JsDelivr</a>. The following global stylesheet link can be copied and pasted into the `<head>` of your HTML document. However, it is not recommended to use this file in production builds because of it's large file size. It includes all of the Tailwindcss utilties.

```html
<link href="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.styles }}" rel="stylesheet">
```

The following global script source can be copied and pasted before your HTML document's closing `</body>` tag.

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.toggle(); // The Toggle Utility must be instantiated first

  Standard.accordion();
  Standard.activeNavigation();
  Standard.attribution();
  Standard.codeHighlight();
  Standard.copy();
  Standard.dialog();
  Standard.direction();
  Standard.disclaimer();
  Standard.masks();
  Standard.menu();
  Standard.modal();
  Standard.nearbyStops();
  Standard.popover();
  Standard.search();
  Standard.shareForm();
  Standard.stepByStep();
  Standard.newsletter();
  Standard.newsletterForm();
  Standard.setHeightProperties();
  Standard.themes();
  Standard.webShare();
  Standard.validate();
</script>
```

You can add SVG icons with the following snippet when the global script source is linked.

```html
<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.icons('{{ this.package.cdn.url }}@v{{ this.package.version }}/dist/svg/svgs.svg');
  Standard.icons('{{ this.package.cdn.url }}@v{{ this.package.version }}/dist/svg/pattern-elements.svg');
  Standard.icons('{{ this.package.cdn.url }}@v{{ this.package.version }}/dist/svg/lucide.svg');
</script>
```

<!-- ---

#### Using the Patterns CLI

The {{ this.package.nice }} and documentation site are generated using the <a target="_blank" rel="noopener" href="https://github.com/CityOfNewYork/patterns-cli">Patterns CLI</a>, which can be used as a static generator to create the same assets for production environments.

```
- assets/
  - js/
  - styles/
  - svg/
- bin/
  - clean.js
  - rename.js
  - styles.js
- config/
  - default.js
  - postcss.js
  - rename.js
  - rollup.js
  - sass.js
  - svgs.js
- src/
    - js/
      - global.js
    - scss/
      - _imports.scss
      - _tokens.scss
      - site-default.scss
    - svgs/
- package.json
- .npmrc
``` -->