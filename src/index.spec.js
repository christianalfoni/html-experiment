import jsdom from 'jsdom'
import { expect } from 'chai'
import { observable } from 'mobx'
import { html, render } from './'
const { JSDOM } = jsdom;

describe('HTML Thingy', () => {

  beforeEach(() => {
    const dom = new JSDOM(`<body>
    <div id="app"></div>
  </body>`);
  
    global.window = dom.window
    global.document = dom.window.document
  })

  it('should render to DOM', () => {
    const Test = html`<h1>hello</h1>`

    render(Test(), null, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1>hello</h1>')
  })
  it('should render simple string parts', () => {
    const Test = html`<h1>hello ${() => 'bob'}</h1>`

    render(Test(), null, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1>hello bob</h1>')
  })
  it('should render simple number parts', () => {
    const Test = html`<h1>hello ${() => 123}</h1>`

    render(Test(), null, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1>hello 123</h1>')
  })
  it('should render template props', () => {
    const Test = html`<h1>hello ${props => props.foo}</h1>`

    render(Test({
      foo: 'bar'
    }), null, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1>hello bar</h1>')
  })
  it('should render template state', () => {
    const state = observable({
      foo: 'bar'
    })
    const Test = html`<h1>hello ${(_, state) => state.foo}</h1>`

    render(Test(), state, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1>hello bar</h1>')
  })
  it('should re-render on state change', () => {
    const state = observable({
      foo: 'bar'
    })
    const Test = html`<h1>hello ${(_, state) => state.foo}</h1>`

    render(Test(), state, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1>hello bar</h1>')
    state.foo = 'bar2'
    expect(document.querySelector('#app').innerHTML).eql('<h1>hello bar2</h1>')
  })
  it('should render attributes', () => {
    const Test = html`<h1 class="${() => 'foo'}">hello</h1>`

    render(Test(), null, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1 class="foo">hello</h1>')
  })
  it('should re-render attributes', () => {
    const state = observable({
      foo: 'bar'
    })
    const Test = html`<h1 class="${(_, state) => state.foo}">hello</h1>`

    render(Test(), state, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1 class="bar">hello</h1>')
    state.foo = 'bar2'
    expect(document.querySelector('#app').innerHTML).eql('<h1 class="bar2">hello</h1>')
  })
  it('should render events', () => {
    let clickEvent = null
    const Test = html`<h1 on-click="${() => function test (event) { clickEvent = event }}">hello</h1>`
    
    render(Test(), null, '#app')
    expect(document.querySelector('#app').innerHTML).eql('<h1 on-click="test">hello</h1>')
    
    const h1 = document.querySelector('h1')
    const evt = new window.Event("click", {bubbles: true});

    h1.dispatchEvent(evt)
    expect(clickEvent.target).eql(h1)
  })
})