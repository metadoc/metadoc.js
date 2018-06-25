const Snippet = require('./Snippet')

class Property extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'property'
    this.default = undefined
    this.readable = false
    this.writable = false
    this.configuration = false
    this.private = false
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
      configuration: this.configuration,
      private: this.private
    })

    delete data.tags
    delete data.exceptions
    delete data.events

    if (this.configuration && !this.readable) {

    }

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
      this.default = node.right.value

      if (this.datatype === 'undefined') {
        this.datatype = this.getDataType(node.right)
      }

      if (this.default === undefined) {
        this.default = this.SOURCE.content.substr(node.right.start, node.right.end - node.right.start)
      }
    }

    if (!this.hasOwnProperty('default') || this.default === undefined) {
      this.required = true
    }
  }
}

module.exports = Property
