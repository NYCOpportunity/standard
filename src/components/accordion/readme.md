<!-- Headers start with h5 ##### -->

##### Global Script

The Accordion requires JavaScript for functionality and screen reader accessibility. To initialize the Accordion instance from the global script use the following code:

```html
<script src="{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.accordion();
</script>
```

This function will attach the accordion toggling event to the body of the document.

##### Module Import

For module imports, import the Accordion module from the source.

```javascript
import Accordion from 'src/components/accordion/accordion';

new Accordion();
```
