<!-- Headers start with h5 ##### -->

##### Global Script

The Active Navigation requires JavaScript for functionality and screen reader accessibility. To initialize the Active Navigation instance from the global script use the following code:

```html
<script src="{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.activeNavigation();
</script>
```

##### Module Import

For module imports, import the Active Navigation module from the source.

```javascript
import ActiveNavigation from 'src/components/active-navigation/active-navigation';

new ActiveNavigation();
```
