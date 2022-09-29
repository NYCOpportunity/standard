<!-- Headers start with h5 ##### -->

##### Global Script

The Web Share requires JavaScript for calling the `navigator.share()` API in supported browsers and showing/hiding the fallback for unsupported browsers. It also uses the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> <a href="https://github.com/CityOfNewYork/patterns-scripts/tree/main/src/copy" target="_blank" rel="noopener nofollow">Copy Utility</a> for the copy-to-clipboard button and the <a href="https://github.com/CityOfNewYork/patterns-scripts/tree/main/src/toggle" target="_blank" rel="noopener nofollow">Toggle Utility</a> to show and hide the fallback component. To use the Web Share through the global script use the following code:

```html
<script src="{{ this.package.name }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.webShare();
  Standard.copy();
</script>
```

This will instantiate the Web Share and fallback element.

##### Module Import

The Web Share source exists in the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library. Install the `@nycopportunity/pttrn-scripts` module to import the module from the source. This method allows the specification of a callback method for a successful share and the fallback method. The `Toggle` and `Copy` modules are optional but required for the fallback in the demo.

```javascript
import WebShare from '@nycopportunity/pttrn-scripts/src/web-share/web-share';
import Toggle from '@nycopportunity/pttrn-scripts/src/utilities/toggle/toggle';
import Copy from '@nycopportunity/pttrn-scripts/src/utilities/copy/copy';

new WebShare({
  callback: () => {
    // Designate an optional callback function for a successful share here
  },
  fallback: () => {
    new Toggle({
      selector: WebShare.selector
    });
  }
});

new Copy();
```

##### Configuration

The `WebShare()` accepts an object with the following attributes:

Attribute    | Description
-------------|-
`selector`   | An alternate selector to the default `[data-js*="web-share"]`
`callback`   | A callback function executed on a successful share.
`fallback`   | A fallback function executed when the browser does not support `navigator.share()`.
