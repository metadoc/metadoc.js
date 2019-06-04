const Class = require('./Class')

class Namespace extends Class {
  constructor (node, source) {
    super(...arguments)

    this.type = 'namespace'
    this.namespaces = new Map()
    this.classes = new Set()

    // Parse the node
    if (node !== null) {
      this.parse(node)
    }

    this._description = null
  }

  addClass (name) {
    this.classes.add(name)
  }

  set description (v) {
    console.log('Setting desc of',this.label,' to', v, (new Error).stack)
    this._description = v
  }

  get description () {
    return this._description
  }

  get data () {
    let data = Object.assign(super.data, {
      sourcefile: this.sourcefile,
      properties: this.mapToObject(this.properties),
      methods: this.mapToObject(this.methods),
      events: this.mapToObject(this.events),
      namespaces: this.mapToObject(this.namespaces),
      classes: Array.from(this.classes).sort()
    })

    delete data.extends
    delete data.configuration

    return data
  }
}

module.exports = Namespace
