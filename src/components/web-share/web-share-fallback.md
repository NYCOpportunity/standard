The web share fallback is a dialog that displays the URL to be shared with the **copy-to-clipboard button** and button links to share on Facebook or Twitter. It will only be visible to users using a browser that does not support the Web Share API. The example below uses the `static` class to show the fallback. To hide the fallback, use the `hidden` class in the code example above.

---

The fallback uses the <a href="https://github.com/CityOfNewYork/patterns-scripts/" target="_blank" rel="noopener nofollow">Patterns Scripts</a> <a href="https://github.com/CityOfNewYork/patterns-scripts/tree/main/src/toggle" target="_blank" rel="noopener nofollow">Toggle Utility</a> to show and hide the dialog. Potentially focusable elements must have their `tabindex` set to `-1` to hide them from screen readers before the dialog opens.

---

The fallback is positioned absolutely by default without an initial z-index. It may need its z-index set using a CSS utility to ensure it displays over other elements. For example, `z-30`.