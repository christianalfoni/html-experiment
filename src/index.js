import { autorun } from 'mobx'

const eventDelegator = {
  register(event, element, callback) {
    if (eventDelegator.registeredEvents.indexOf(event) === -1) {
      eventDelegator.root.addEventListener(event, (event) => {
        const eventNode = event.target
        const index = eventDelegator.nodes.indexOf(eventNode)
        if (index >= 0) {
          eventDelegator.callbacks[index](event)
        }
      })
    }

    eventDelegator.nodes.push(element)
    eventDelegator.callbacks.push(callback)
  },
  root: null,
  registeredEvents: [],
  nodes: [],
  callbacks: []
}

class AttributePart {
  constructor (node, attribute, part, template) {
    this.part = part
    this.element = node
    this.attribute = attribute
    this.template = template
    this.currentCallback = null

    this._renderPart()  
  }
  _renderPart() {
    let partContent
    autorun(() => {
      const partContent = this.part(this.template.props, this.template.state)
      
      this.element.setAttribute(this.attribute, partContent)
    })
  }
}

class EventPart {
  constructor (node, event, part, template) {
    this.part = part
    this.element = node
    this.event = event
    this.template = template

    this._renderPart()  
  }
  _renderPart() {
    let partContent
    autorun(() => {
      if (this.currentCallback) {
        const index = eventDelegator.callbacks.indexOf(this.currentCallback)
        eventDelegator.nodes.splice(index, 1)
        eventDelegator.callbacks.splice(index, 1)
      }

      this.currentCallback = this.part(this.template.props, this.template.state)

      this.element.setAttribute(`on-${this.event}`, this.currentCallback.name)

      eventDelegator.register(this.event, this.element, this.currentCallback)
    })
  } 
}

class NodePart {
  constructor (node, part, template) {
    this.part = part
    this.element = null
    this.type = null
    this.template = template

    this._renderPart(node)
  }
  _renderPart(node) {
    let partContent
    autorun(() => {
      if (this.element) {
        this._updatePart()
      } else {
        partContent = this.part(this.template.props, this.template.state)

        if (partContent instanceof Template) {
          this.type = 'template'
          this.element = partContent.get(this.template.state).childNodes[0]
        } else {
          this.type = 'text'
          this.element = document.createTextNode(partContent)
        }
        node.parentNode.replaceChild(this.element, node)
      }
    })
  }
  _updatePart() {
    const partContent = this.part(this.template.props, this.template.state)

    if (!(partContent instanceof Template) && this.type === 'text') {
      this.element.textContent = partContent
    } else if (partContent instanceof Template) {
      this.element.parentNode.replaceChild(partContent.get(this.template.state), this.element)
    } else {
      const prevElement = this.element
      this.element = document.createTextNode(partContent)
      prevElement.parentNode.replaceChild(this.element, prevElement)
    }
  }
}

class Template {
  constructor (props, strings, parts) {
    this.props = props
    this.strings = strings
    this.parts = parts
    this.nextMarkerId = 0
    this.partsIndexById = {}
    this.partsById = {}
    this.el = document.createElement('template')
    this.state = null
  }

  get (state) {
    this.state = state
    this.el.innerHTML = this._getHtml()
    const content = this.el.content.cloneNode(true)
    const walker = document.createTreeWalker(
      content,
      133,
      null,
      false);

    while (walker.nextNode()) {
      const node = walker.currentNode

      if (node.nodeType === 8 && this._hasMarkerId(node.textContent)) {
        const id = this._getMarkerId(node.textContent)
        const part = this.parts[this.partsIndexById[id]]
        this.partsById[id] = new NodePart(node, part, this)
      } else if (node.nodeType === 1 && node.hasAttributes()) {
        const attributes = node.attributes

        for (let x = 0; x < attributes.length; x++) {
          const attribute = attributes[x]
          if (this._hasMarkerId(attribute.textContent)) {
            const id = this._getMarkerId(attribute.textContent)
            const part = this.parts[this.partsIndexById[id]]
            this.partsById[id] = attribute.name.substr(0, 3) === 'on-' ? new EventPart(node, attribute.name.substr(3), part, this) : new AttributePart(node, attribute.name, part, this)
          }
        }
      }
    }

    return content
  }
  _hasMarkerId (content) {
    return content.match(/\{\{(.?)\}\}/)
  }
  _getMarkerId (content) {
    return content.match(/\{\{(.?)\}\}/)[1]
  }
  _createTemplate () {

  }
  _getHtml () {
    return this.strings.reduce((currentHtml, string, index) => {
      if (this.parts[index]) {
        this.partsIndexById[this.nextMarkerId] = index

        return currentHtml + string + `<!--${this._getNextMarker()}-->`
      }

      return currentHtml + string
    }, '')
  }
  _getNextMarker () {
    return `{{${this.nextMarkerId++}}}`
  }
}

export function html (strings, ...parts) {
  return (props) => new Template(props, strings, parts)
}

export function render (template, state, selector) {
  const root = document.querySelector(selector)
  eventDelegator.root = root
  root.innerHTML = ''
  root.appendChild(template.get(state))
}