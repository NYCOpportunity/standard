Layouts with multiple columns can be achieved using [Tailwindcss Utilities](tailwindcss). It supports column systems using CSS **Grid** or **Flexbox**.

##### Grid

* `grid` sets the display property to grid.

* `grid-col-{{ number }}` determines the number of columns in the grid. Currently, the range is 1 - 8.

* `gap-{{ multiplier }}` determines the gap between columns. The number multiplies the grid base value `{{ this.tokens.grid }}`. Currently, the range is 1 - 8.

Read more about **Grid** utilities on the <a target="_blank" rel="noopener nofollow" href="https://tailwindcss.com/docs/display#grid"> Tailwindcss documentation</a>.

##### Flexbox

`flex` sets the display property to grid. Elements in the container will fill up the required space. Read more about **Flexbox** utilities on the <a target="_blank" rel="noopener nofollow" href="https://tailwindcss.com/docs/display#flex"> Tailwindcss documentation</a>.

---

Both properties supported responsive variants for different column settings in each major breakpoint; `small:`, `mobile:`, `tablet:`, and `desktop:`. For example `tablet:grid` sets a container element to `display: grid` for tablet viewports.