const Snippet = require('./Snippet')

class TypeDefinition extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'datatype'
    this.default = undefined
    this.readable = true
    this.writable = false
    this.configuration = false
    this.private = false
    this.static = false
    this.properties = new Map()

    if (node) {
      this.parse(node)
    }
  }

  get data () {
    return {
      description: this.description,
      properties: this.mapToObject(this.properties),
      type: this.type
    }
  }

  parse (node) {
    super.parse(node)

    this.label = this.getName(node)
  }
}

module.exports = TypeDefinition
