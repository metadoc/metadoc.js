const path = require('path')
const Snippet = require('./Snippet')
const Method = require('./Method')

class Class extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'class'
    this.singleton = false
    this.extends = null
    this.configuration = new Map()
    this.properties = new Map()
    this.methods = new Map()

    // Parse the node
    this.parse(node)
// console.log(JSON.stringify(this.data, null, 2))
  }

  parse (node) {
    super.parse(node)

    // Get name
    if (node.id) {
      this.label = this.getName(node.id)
    }

    // Identify which class this extends
    if (node.superClass) {
      this.extends = this.getName(node.superClass)
    }

    if (!node.body) {
      console.error('No class body for ' + this.name)
    } else {
      node.body.body.forEach(snippet => {
        switch (snippet.type.toLowerCase()) {
          case 'methoddefinition':
            let method = new Method(snippet, this.SOURCE)

            method.on('warning', msg => this.emit('warning', msg))
            method.on('register.event', (evt, emitter) => this.registerEvent(evt, emitter))

            this.methods.set(method.label, method)

            break
        }
      })
    }

    // Override/annotate with comments
    this.processRelativeComments(node.body.loc.start.line)
  }

  registerEvent (evt, emitter = 'this') {
    if (emitter === 'this' || emitter === this.label) {
      this.events.set(evt.label, evt)
    }
  }

  get data () {
    return Object.assign(super.data, {
      sourcefile: this.sourcefile,
      singleton: this.singleton,
      extends: this.extends,
      configuration: this.mapToObject(this.configuration),
      properties: this.mapToObject(this.properties),
      methods: this.mapToObject(this.methods),
      events: this.mapToObject(this.events)
    })

    return
  }
}

module.exports = Class
