##### Global Script

The **Popover** requires JavaScript for showing and hiding. To initialize the **Popover** and Disclaimer instances from the global script use the following code:

```html
<!-- Global Script -->
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.popover();
</script>
```

This will attach event listeners for toggling the **Popover**.

##### Module Import

For module imports, import the **Popover** from the source. You must pass a DOM selection of each **Popover** to a new instance of the class. A selector reference is stored in the class.

```javascript
import Popover from '{{ this.package.name }}/{{ this.global.src }}/components/popover/popover';

let elements = document.querySelectorAll(Popover.selector);

elements.forEach(element => {
  new Popover(element);
});
```
