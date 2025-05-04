# Myopie
> French for Myopia
> 
> Noun
> - the quality of being short-sighted
> - lack of foresight.

I thought would be a perfect name for a skinned, simplified, alternative to Vue (with some code ripped from [ReefJS](https://github.com/cferdinandi/reef)).

---

## Features

- **Component-based rendering**: Build dynamic UIs with a minimalistic approach.
- **Data binding**: Two-way binding for form inputs and data.
- **Efficient DOM diffing**: Only updates changed parts of the DOM.
- **Lifecycle hooks**: Customize initialization and rendering.
- **Lightweight**: Minimal overhead for small to medium-sized projects.
- **Template engine agnostic**: compatible with any generic template engine.

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

#### `new Myopie(document, target, renderFunction, initialState = {}, bindings = [], debounce = 1000)`

You can create a Myopie instance by calling its constructor:

```javascript
const myopie = new Myopie(
    document,
    '#app', // Target selector
    (data) => `<div>Hello, ${data.name}!</div>`, // Render function
    { name: 'World' }, // Initial state
    [['input', 'name']], // Input bindings
    500 // Debounce time in milliseconds
);
```

- **`document`** (object): The document object.
- **`target`** (string): Selector for the root element.
- **`renderFunction`** (function): Function returning the HTML string to render.
- **`initialState`** (object): Initial state data.
- **`bindings`** (array): List of input bindings in the format `[selector, path]`.
- **`debounce`** (number): Debounce time in milliseconds for updates.

### Methods

#### `render()`

Manually triggers the rendering of the DOM.
Return false if the target selector is missing, true otherwise.

```javascript
myopie.render();
```

#### `destroy()`

Removes all event listeners (input bindings and permanent handlers) and clears timers.

```javascript
myopie.destroy();
```

#### `get(path)`

Gets the value of a property from the state.
- **`path`** (string): Slash-separated path to the property.

```javascript
const name = myopie.get('name');
```

#### `set(path, value, render = true)`

Sets a property in the state and optionally triggers a re-render.
- **`path`** (string): Slash-separated path to the property.
- **`value`**: New value to set.
- **`render`** (boolean): Whether to trigger a render after setting.


```javascript
myopie.set('name', 'World');
```

#### `handlersPermanentAdd(selector, event, listener)`

Register a permanent event listener for elements matching selector. Returns false if an identical listener was already added.

```javascript
const handler = (e) => { myopie.set( 'name', 'Foo' ) };
myopie.handlersPermanentAdd('input[name="foo"]', 'click', handler );
```

#### `handlersPermanentDel(selector, event?, listener?)`

Remove permanent handlers. If event and optionally also the listener provided, removes matching ones; otherwise clears all for that selector.

```javascript
myopie.handlersPermanentDel('input[name="foo"]', 'click', handler );
myopie.handlersPermanentDel('input[name="foo"]', 'click' );
myopie.handlersPermanentDel('input[name="foo"]' );
```

### Lifecycle Hooks

Myopie provides several lifecycle hooks that allow you to inject custom behavior at specific points during the component's initialization and rendering process. These hooks are executed with specific parameters based on the type of hook.

#### `hooksInitAddPre( hookFunction )`

Executed before the component is rendered the first time. Receives the current state data as a parameter.

```javascript
myopie.HooksInitAddPre((dataCurrent) => {
console.log('This runs before initialization.', dataCurrent);
});
```

#### `hooksInitAddPost( hookFunction )`

Executed after the component is rendered the first time. Receives the current state data as a parameter.

```javascript
myopie.HooksInitAddPost((dataCurrent) => {
  console.log('This runs after initialization.', dataCurrent);
});
```

#### `hooksRenderAddPre( hookFunction )`

Executed before the component renders after the first time. Receives the current and previous state data arrays as parameters.

```javascript
myopie.HooksRenderAddPre((dataCurrent, dataPrevious) => {
  console.log('This runs before rendering.', dataCurrent, dataPrevious);
});
```

#### `hooksRenderAddPost( hookFunction )`

Executed after the component renders after the first time. Receives the current and previous state data arrays as parameters.

```javascript
myopie.HooksRenderAddPost((dataCurrent, dataPrevious) => {
  console.log('This runs after rendering.', dataCurrent, dataPrevious);
});
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

## Contributing

Contributions are welcome! Please submit issues or pull requests on the GitHub repository.

---

## License

Myopie is released under the BSD-3-Clause License.
