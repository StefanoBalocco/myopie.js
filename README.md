# Myopie
> French for Myopia
>
> Noun
> - the quality of being short-sighted
> - lack of foresight.

---

**Short-sightedness by design.** A lightweight, template-engine-agnostic alternative to Vue for building reactive components, with some code initially ripped from [ReefJS](https://github.com/cferdinandi/reef).

[![License](https://img.shields.io/github/license/stefanobalocco/myopie.js)](https://github.com/StefanoBalocco/myopie.js/blob/main/LICENSE.md)
![GZipped size](https://img.badgesize.io/stefanobalocco/myopie.js/main/myopie.min.js?compression=gzip)

---

## Features

- **Component-based rendering** — Build dynamic UIs with a minimal API.
- **Two-way data binding** — Sync form inputs to state automatically.
- **Efficient DOM diffing** — Updates only what changed.
- **Lifecycle hooks** — Run custom logic before and after init or render.
- **Template engine agnostic** — Works with any function that returns an HTML string.
- **Lightweight** — No dependencies. 2.4kb compressed.

---

## Installation

**Browser:**

```html
<script type="module">
import Myopie from 'https://cdn.jsdelivr.net/gh/StefanoBalocco/myopie.js/myopie.min.js';
</script>
```

**Node:**

```javascript
import Myopie from 'myopie.js';
```

---

## Quick Start

```html
<div id="app"></div>
<script type="module">
  import Myopie from 'https://cdn.jsdelivr.net/gh/StefanoBalocco/myopie.js/myopie.min.js';

  const myopie = new Myopie(
    '#app',
    (data) => `<div>
      <input type="text" value="${data.name}" />
      <p>Hello, ${data.name}!</p>
    </div>`,
    { name: 'World' },
    [['input', 'name']]
  );

  setTimeout(() => myopie.set('name', 'User'), 2000);
</script>
```

---

## API

### Constructor

```javascript
new Myopie(selector, template, initialData, inputToPath, timeout, renderOnInput)
```

- **`selector`** (string) — CSS selector for the root element.
- **`template`** (function) — Function `(data) => string` that returns the HTML to render.
- **`initialData`** (object, default `{}`) — Initial state.
- **`inputToPath`** (array, default `[]`) — Input bindings: `[selector, path]` pairs.
- **`timeout`** (number, default `100`) — Debounce delay in milliseconds.
- **`renderOnInput`** (boolean, default `true`) — Re-render when a bound input changes.

---

### Methods

#### `render()`

Renders the DOM immediately. Returns `false` if the target element is missing, `true` otherwise.

```javascript
myopie.render();
```

#### `renderDebounce()`

Schedules a render after the debounce delay. Calls `render()` directly if `timeout` is zero.

```javascript
myopie.renderDebounce();
```

#### `destroy()`

Removes all event listeners and clears pending timers. Call this when tearing down the component.

```javascript
myopie.destroy();
```

#### `get(path)`

Returns the value at `path` in the current state. Use slash-separated paths for nested properties.

```javascript
const name = myopie.get('name');
const age = myopie.get('user/age');
```

#### `set(path, value, render = true)`

Sets a value at `path` in the state. Triggers a debounced re-render by default.

- **`path`** (string) — Slash-separated path to the property.
- **`value`** (any) — New value.
- **`render`** (boolean, default `true`) — Trigger a re-render after setting.

```javascript
myopie.set('name', 'World');
myopie.set('user/age', 30);
```

#### `handlersPermanentAdd(selector, event, listener)`

Registers a persistent event listener for elements matching `selector`. The listener survives re-renders. Returns `false` if an identical listener is already registered.

```javascript
const handler = (e) => myopie.set('name', 'Foo');
myopie.handlersPermanentAdd('input[name="foo"]', 'click', handler);
```

#### `handlersPermanentDel(selector, event?, listener?)`

Removes persistent listeners for `selector`. Pass `event` to remove only matching events; pass `listener` to remove a specific function. Omit both to clear all listeners for that selector.

```javascript
myopie.handlersPermanentDel('input[name="foo"]', 'click', handler); // remove one listener
myopie.handlersPermanentDel('input[name="foo"]', 'click');          // remove by event
myopie.handlersPermanentDel('input[name="foo"]');                   // remove all
```

---

### Lifecycle Hooks

Hooks run at specific points during initialization and rendering.

- **`hooksInitAddPre(fn)`** — Before first render. Receives `(dataCurrent)`.
- **`hooksInitAddPost(fn)`** — After first render. Receives `(dataCurrent)`.
- **`hooksRenderAddPre(fn)`** — Before each subsequent render. Receives `(dataCurrent, dataPrevious)`.
- **`hooksRenderAddPost(fn)`** — After each subsequent render. Receives `(dataCurrent, dataPrevious)`.

```javascript
myopie.hooksInitAddPre((data) => {
  console.log('Before first render', data);
});

myopie.hooksRenderAddPost((current, previous) => {
  console.log('Rendered. Previous state:', previous);
});
```

---

### `data-myopie-*` Attributes

Add these attributes to elements in your template to guide the DOM diffing algorithm. Myopie strips `data-myopie-default-*` and `data-myopie-ignore-*` attributes from the live DOM after each render.

#### `data-myopie-id`

Assigns a stable identity to an element. During diffing, sibling elements with the same `data-myopie-id` value match each other regardless of their position among siblings.

```html
<li data-myopie-id="item-42">...</li>
```

#### `data-myopie-ignore-content`

Prevents the diffing algorithm from overwriting the element's inner content (and that of its descendants). Use this for elements managed by third-party libraries.

```html
<div data-myopie-ignore-content="true"><!-- managed externally --></div>
```

#### `data-myopie-ignore-style`

Prevents the diffing algorithm from overwriting the `style` attribute on the element and its descendants. Use this when inline styles are set dynamically, for example by an animation library.

```html
<div data-myopie-ignore-style="true" style="transform: translateX(100px)">...</div>
```

#### `data-myopie-default-*`

Sets an attribute only when that attribute is absent from the live element. The attribute name follows the prefix: `data-myopie-default-placeholder` sets `placeholder`.

```html
<input data-myopie-default-placeholder="Type here…" />
```

---

## Contributing

Open an issue or submit a pull request on GitHub.

---

## License

Released under the BSD-3-Clause License.
