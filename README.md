# html-experiment
Experimenting with mobx and tagged template literals for html

## Render an app

```js
import { html, render } from 'html-experiment'

const App = html`
  <div class="container">
    <h1>Hello</h1>
  </div>
`

render(App(), null, '#app')
```

## Use props

```js
import { html, render } from 'html-experiment'

const App = html`
  <div class="container">
    <h1>Hello ${props => props.title}</h1>
  </div>
`

render(App({
  title: 'Awesome'
}), null, '#app')
```

## Use mobx state

```js
import { html, render } from 'html-experiment'
import { observable } from 'mobx'

const App = html`
  <div class="container">
    <h1>Hello ${(_, state) => state.title}</h1>
  </div>
`

const state = observable({
  title: 'Awesome'
})

render(App(), state, '#app')

setTimeout(() => {
  state.title = 'New title'
}, 1000) // Updates title after 1 seconds
```

## Use on attributes

```js
import { html, render } from 'html-experiment'
import { observable } from 'mobx'

const App = html`
  <div class="${(_, state) => state.isLoading ? 'container-loading' : 'container'}">
    <h1>Hello awesome</h1>
  </div>
`

const state = observable({
  isLoading: true
})

render(App(), state, '#app')
```

## With events

```js
import { html, render } from 'html-experiment'
import { observable } from 'mobx'

const App = html`
  <div on-click="${(props, state) => (event) => console.log('clicked')}">
    <h1>Hello awesome</h1>
  </div>
`

render(App(), null, '#app')
```