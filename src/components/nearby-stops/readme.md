<!-- Headers start with h5 ##### -->

##### Global Script

**Nearby Stops** requires JavaScript for fetching data and rendering subway stop templates. To initialize the Nearby Stops instance from the global script use the following code:

```html
<script src="{{ this.package.cdn.url }}@v{{ this.package.version }}/{{ this.global.dist }}/{{ this.global.entry.scripts }}"></script>

<script>
  var Standard = new {{ this.global.entry.name }}();

  Standard.nearbyStops();
</script>
```

##### Module

For module imports, import the Nearby Stops module from the source.

```javascript
import NearbyStops from '{{ this.package.name }}/{{ this.global.src }}/components/nearby-stops/nearby-stops';

new NearbyStops();
```

The class will select any DOM element with the `data-js="nearby-stops"` attribute and look up the closest stops to the location embedded in the `data-nearby-stops-location` attribute. The location attribute accepts an array of latitude and longitude.

Use the `data-nearby-stops-endpoint` attribute to set the endpoint for the Subway stops data. The amount of stops defaults to `3` but can be overwritten using the `data-nearby-stops-amount` attribute, which accepts a number of stops to display.
