const path = require('path')
const Class = require('./Class')

class Namespace extends Class {
  constructor (node, source) {
console.log('YEAW')    
    super(...arguments)

    this.type = 'namespace'
    this.namespaces = new Map()

    // Parse the node
    this.parse(node)
  }

  get data () {
    return Object.assign(super.data, {
      sourcefile: this.sourcefile,
      extends: this.extends,
      configuration: this.mapToObject(this.configuration),
      properties: this.mapToObject(this.properties),
      methods: this.mapToObject(this.methods),
      events: this.mapToObject(this.events),
      namespaces: this.mapToObject(this.namespaces)
    })

    return
  }
}

module.exports = Class
