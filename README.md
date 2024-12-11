


# Myopie

> French for Myopia
> 
> Noun
> - the quality of being short-sighted
> - lack of foresight.

**Myopie** is a lightweight, skinned, and simplified alternative to Vue.js, inspired by (and with some code ripped from) [ReefJS](https://github.com/cferdinandi/reef)).

---

## Features

- **Component-based rendering**: Build dynamic UIs with a minimalistic approach.
- **Data binding**: Two-way binding for form inputs and data.
- **Efficient DOM diffing**: Only updates changed parts of the DOM.
- **Lifecycle hooks**: Customize initialization and rendering.
- **Lightweight**: Minimal overhead for small to medium-sized projects.

---

## Usage

In browser:

```html
<script type="module">
import Myopie from 'https://www.unpkg.com/myopie.js/myopie.min.js';
...
</script>
```

In node:

```javascript
import Myopie from 'myopie.js';
...
```

---

## Quick Start

### Creating a Myopie Instance

You can create a Myopie instance by calling its constructor:

```javascript
const myopie = new Myopie(
  '#app', // Target selector
  (data) => `<div>Hello, ${data.name}!</div>`, // Render function
  { name: 'World' }, // Initial state
  [['input', 'name']], // Input bindings
  500 // Debounce time in milliseconds
);
```

### Methods

#### `render()`

Manually triggers the rendering of the DOM.

```javascript
myopie.render();
```

#### `get(path)`

Retrieves a value from the state using a slash-separated path.

```javascript
const name = myopie.get('name');
```

#### `set(path, value, render = true)`

Updates the state at the given path and optionally triggers a re-render.

```javascript
myopie.set('name', 'Myopie');
```

### Example

```html
<div id="app"></div>
<script type="module">
  import Myopie from 'https://www.unpkg.com/myopie.js/myopie.min.js';

  const myopie = new Myopie(
    '#app',
    (data) => `<div>
                 <input type="text" value="${data.name}" />
                 <p>Hello, ${data.name}!</p>
               </div>`,
    { name: 'World' },
    [['input', 'name']]
  );

  // Update the name dynamically
  setTimeout(() => myopie.set('name', 'User'), 2000);
</script>
```

---

## API Reference

### `new Myopie(target, renderFunction, initialState = {}, bindings = [], debounce = 1000)`

Creates a new Myopie instance.

- **`target`** (string): Selector for the root element.
- **`renderFunction`** (function): Function returning the HTML string to render.
- **`initialState`** (object): Initial state data.
- **`bindings`** (array): List of input bindings in the format `[selector, path]`.
- **`debounce`** (number): Debounce time in milliseconds for updates.

### `get(path)`

Gets the value of a property from the state.

- **`path`** (string): Slash-separated path to the property.

### `set(path, value, render = true)`

Sets a property in the state and optionally triggers a re-render.

- **`path`** (string): Slash-separated path to the property.
- **`value`**: New value to set.
- **`render`** (boolean): Whether to trigger a render after setting.

### `render()`

Manually triggers a re-render of the DOM.

### Lifecycle Hooks

Hooks allow you to inject custom behavior before and after initialization and rendering.

#### Adding Hooks

```javascript
myopie.HooksInitAddPre((state) => console.log('Before initialization', state));
myopie.HooksRenderAddPost((state) => console.log('After rendering', state));
```

---

## Contributing

Contributions are welcome! Please submit issues or pull requests on the GitHub repository.

---

## License

Myopie is released under the BSD-3-Clause License.
