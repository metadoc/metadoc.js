const Snippet = require('./Snippet')

class Parameter extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'argument'
    this.default = undefined
    this.required = false
    this.callback = null

    if (node) {
      this.parse(node)
    }
  }

  get data () {
    // Support properties that have arguments
    if (this.callback !== null) {
      let data = this.callback.data

      delete data.tags
      delete data.exceptions
      delete data.events

      return data
    }

    let data = Object.assign(super.data, {
      label: this.label,
      default: this.default,
      datatype: this.datatype,
      required: this.required,
      enum: this.enum
    })

    delete data.tags
    delete data.exceptions
    delete data.events

    return data
  }

  get isCallbackFunction () {
    return this.callback !== null
  }

  get datatype () {
    if (this.callback !== null) {
      return 'function'
    }

    return super.datatype
  }

  set datatype (value) {
    super.datatype = value
  }

  parse (node) {
    super.parse(node)

    this.LABEL = this.processLabel(this.getName(node))

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
      this.required = true
    }
  }
}

module.exports = Parameter
