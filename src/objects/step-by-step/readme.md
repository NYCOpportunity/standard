<!-- Headers start with h5 ##### -->

##### Global Script

The **Step by Step** requires JavaScript for pagination, toggling steps, browser history storage, and accessibility. To initialize the **Step by Step** instance from the global script use the following code:

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.stepByStep();
</script>
```

This function will attach the main pagination event to the body of the document.

##### Module Import

For module imports, import the **Step by Step** module from the source. The Toggle Utility source exists in the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> utility library, which is a dependency of this library.

```javascript
import Disclaimer from '{{ this.package.name }}/{{ this.global.src }}/objects/step-by-step/step-by-step';

new StepByStep();
```
