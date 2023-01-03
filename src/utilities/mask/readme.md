The open source library <a target="_blank" rel="noopener nofollow" href="https://nosir.github.io/cleave.js/">Cleave.js</a> is included as a dependency of the {{ this.package.nice }} to provide input masking support.

##### Global Script

To initialize supported masking utilities for dollars and phone numbers from the global script use the following code:

```html
<!-- Global Script -->
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.masks();
</script>
```

##### Module Import

For module imports, import the mask utilities from the source and instantiate masks for dollars and phone numbers

```javascript
import MaskDollars from '{{ this.package.name }}/{{ this.global.src }}/utilities/mask/mask-dollars.js';
import MaskPhone from '{{ this.package.name }}/{{ this.global.src }}/utilities/mask/mask-phone.js';

new MaskDollars
new MaskPhone
```

##### Additional masking

To achieve additional masking support, import **Cleave.js** from the source and pass inputs to instances of `Cleave` and customize options.

```javascript
import Cleave from 'cleave.js';

let inputs = document.querySelectorAll('[data-js="{{ MY_INPUT }}"]');

for (let i = 0; i < inputs.length; i++) {
  new Cleave(inputs[i], {
    // Custom Options
  });
}
```

More information can be found in the <a target="_blank" rel="noopener nofollow" href="https://nosir.github.io/cleave.js/">Cleave.js documentation</a>.
