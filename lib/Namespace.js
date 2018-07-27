const path = require('path')
const Class = require('./Class')

class Namespace extends Class {
  constructor (node, source) {
    super(...arguments)

    this.type = 'namespace'

    // Parse the node
    this.parse(node)
  }

  get data () {
    // this.methods.forEach(method => {
    //   console.log(method)
    // })

    return Object.assign(super.data, {
      sourcefile: this.sourcefile,
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
