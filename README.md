# Opportunity Standard

The design system for NYC Opportunity's digital products. Refer to the [Opportunity Standard Figma File](https://www.figma.com/file/CH7ZOCW55SgsDnsTj3UrTi/Opportunity-Standard?node-id=3312%3A7).

## Local Development

During the development phase of this library, the following dependencies need to be cloned locally and relatively located to this project in order to run the compilation commands. This makes it easier to make changes to these dependencies as needed.

* [@nycopportunity/pattern-application-header](https://github.com/nycopportunity/pattern-application-header)
* [@nycopportunity/pattern-attribution](https://github.com/nycopportunity/pattern-attribution)
* [@nycopportunity/pattern-elements](https://github.com/nycopportunity/pattern-elements)
* [@nycopportunity/pattern-menu](https://github.com/nycopportunity/pattern-menu)
* [@nycopportunity/pattern-modal](https://github.com/nycopportunity/pattern-modal)
* [@nycopportunity/pattern-navigation](https://github.com/nycopportunity/pattern-navigation)
* [@nycopportunity/pattern-typography](https://github.com/nycopportunity/pattern-typography)
* [@nycopportunity/pttrn-docs](https://github.com/cityofnewyork/patterns-docs)
* [@nycopportunity/pttrn-scripts](https://github.com/cityofnewyork/patterns-scripts)

The directory structure would look like the following.

```
- 📁 nycopportunity/
  ├ 📂 standard/ (this package)
  ├ 📂 pattern-application-header/
  ├ 📂 pattern-attribution/
  ├ 📂 pattern-elements/
  ├ 📂 pattern-menu/
  ├ 📂 pattern-modal/
  ├ 📂 pattern-navigation/
  └ 📂 pattern-typography/
- 📁 cityofnewyork/
  ├ 📂 patterns-docs/
  └ 📂 patterns-scripts/
```

After cloning this repo, run `npm install` (it may be necessary to install the dependencies above as npm distributions first so their dependencies are installed in the project `node_modules` directory). Once the local repositories are available, the public package block can be replaced.

```json
    "@nycopportunity/pattern-application-header": "*",
    "@nycopportunity/pattern-attribution": "*",
    "@nycopportunity/pattern-elements": "*",
    "@nycopportunity/pattern-menu": "*",
    "@nycopportunity/pattern-modal": "*",
    "@nycopportunity/pattern-navigation": "*",
    "@nycopportunity/pattern-typography": "*",
    "@nycopportunity/pttrn-docs": "*",
    "@nycopportunity/pttrn-scripts": "*",
```

... with...

```json
    "@nycopportunity/pattern-application-header": "file:../pattern-application-header",
    "@nycopportunity/pattern-attribution": "file:../pattern-attribution",
    "@nycopportunity/pattern-elements": "file:../pattern-elements",
    "@nycopportunity/pattern-menu": "file:../pattern-menu",
    "@nycopportunity/pattern-modal": "file:../pattern-modal",
    "@nycopportunity/pattern-navigation": "file:../pattern-navigation",
    "@nycopportunity/pattern-typography": "file:../pattern-typography",
    "@nycopportunity/pttrn-docs": "file:../../cityofnewyork/patterns-docs",
    "@nycopportunity/pttrn-scripts": "file:../../cityofnewyork/patterns-scripts",
```

... then reinstall.

## CLI

Once the dependencies are installed the [Patterns CLI binary](https://github.com/CityOfNewYork/patterns-cli#cli) is available to start development. Run [`npm start`](https://github.com/CityOfNewYork/patterns-cli#start-command) to start the development server.
