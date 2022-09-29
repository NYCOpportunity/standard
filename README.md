# Opportunity Standard (WIP)

The Standard Library for NYC Opportunity's digital products. Currently a work–in-progress. Refer to [architecture diagram for roadmap and planning](https://www.figma.com/file/VHF4lLHLI1vvXiqfn5RTWk/Patterns-Architecture?node-id=0%3A1) and the [Opportunity Standard Figma File](https://www.figma.com/file/CH7ZOCW55SgsDnsTj3UrTi/Opportunity-Standard?node-id=3312%3A7).

## Local Development

During the development phase of this library, the following dependencies need to be cloned locally and relatively located to this project in order to run the compilation commands. This makes it easier to make changes to these dependencies as needed.

* [Pattern Elements](https://github.com/nycopportunity/pattern-elements)
* [Pattern Typography](https://github.com/nycopportunity/pattern-typography)
* [Patterns Docs](https://github.com/cityofnewyork/patterns-scripts)
* [Patterns Scripts](https://github.com/cityofnewyork/patterns-scripts)

The directory structure would look like the following.

```
- 📁 nycopportunity/
  ├ 📂 standard/ (this package)
  ├ 📂 pattern-elements/
  └ 📂 pattern-typography/
- 📁 cityofnewyork/
  └ 📂 pattern-scripts/
```

After cloning this repo, run `npm install` (it may be necessary to install the dependencies above as npm distributions first so their dependencies are installed in the project `node_modules` directory). Once the local repositories are available, the public package block can be replaced.

```json
    "@nycopportunity/pattern-elements": "^0.0.0-2",
    "@nycopportunity/pattern-typography": "^0.0.0-1",
    "@nycopportunity/pttrn-docs": "^1.0.7"
    "@nycopportunity/pttrn-scripts": "^1.0.14",
```

... with...

```json
    "@nycopportunity/pattern-elements": "file:../pattern-elements",
    "@nycopportunity/pattern-typography": "file:../pattern-typography",
    "@nycopportunity/pttrn-docs": "file:../../cityofnewyork/patterns-docs",
    "@nycopportunity/pttrn-scripts": "file:../../cityofnewyork/patterns-scripts",
```

... then reinstall.

## CLI

Once the dependencies are installed the [Patterns CLI binary](https://github.com/CityOfNewYork/patterns-cli#cli) is available to start development. Run [`npm start`](https://github.com/CityOfNewYork/patterns-cli#start-command) to start the development server.
