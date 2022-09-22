<!-- Headers start with h5 ##### -->

##### Usage

The Dropdown Component uses JavaScript for toggling and accessibility.

###### Global Script

```html
<script src="{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.dropdown();
</script>
```

###### Module Import

For module imports, import the Dropdown module from the source.

```javascript
import Dropdown from 'src/components/dropdown/dropdown';

new Dropdown();
```
