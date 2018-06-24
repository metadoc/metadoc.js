const Snippet = require('./Snippet')

class Property extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'property'
    this.default = undefined
    this.datatype = 'any'
    this.readable = false
    this.writable = false
    this.configuration = false
    this.static = false

    if (node) {
      this.parse(node)
    }
  }

  get data () {
    let data = Object.assign(super.data, {
      default: this.default,
      datatype: this.datatype,
      readable: this.readable,
      writable: this.writable,
      configuration: this.configuration
    })

    delete data.tags
    delete data.exceptions
    delete data.events

    return data
  }

  parse (node) {
    super.parse(node)

    this.static = node.hasOwnProperty('static') ? node.static : false

    if (node.kind && node.kind === 'get') {
      this.readable = true
    }

    if (node.kind && node.kind === 'set') {
      this.writable = true
    }

    if (node.value && node.value.body) {
      let returnNode = node.value.body.body.filter(item => item.type.toLowerCase().indexOf('return') === 0)

      if (returnNode.length === 1) {
        this.datatype = typeof returnNode[0].argument.value
      }
    }

    this.label = this.getName(node)

    if (node.type.toLowerCase() === 'assignmentpattern' && node.right) {
      this.datatype = node.right.hasOwnProperty('regex') ? 'regex' : typeof node.right.value
      this.default = node.right.value

      if (this.datatype === 'undefined') {
        switch (node.right.type.replace('Expression', '').toLowerCase()) {
          case 'new':
          case 'call':
            this.datatype = node.right.callee.name
            break

          case 'function':
          case 'arrowfunction':
            this.datatype = 'function'
            break

          case 'identifier':
            setTimeout(() => this.emit('warning', `Identifier ${node.right.name} at ${this.sourcefile}:${node.right.loc.start.line}:${node.right.loc.start.column} may not be a valid default value.`), 0)

          default:
            this.datatype = 'object'
        }
      }

      if (this.default === undefined) {
        this.default = this.SOURCE.content.substr(node.right.start, node.right.end - node.right.start)
      }
    }

    if (!this.hasOwnProperty('default') || this.default === undefined) {
      this.requried = true
    }
  }
}

module.exports = Property
