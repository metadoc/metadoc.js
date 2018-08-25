const Snippet = require('./Snippet')
const Parameter = require('./Parameter')

class Event extends Snippet {
  constructor (source) {
    super(null, ...arguments)

    this.type = 'event'
    this.parameters = new Map()
    this.deprecated = false
    this.deprecationReplacement = null
    // this.triggers = new Set()
    // this.handlers = new Set()
  }

  set node (node) {
    if (this.start.line === 0) {
      this.start = node.loc.start
    }

    if (this.end.line === 0) {
      this.end = node.loc.end
    }

    if (this.code === null) {
      this.code = this.SOURCE.content.substr(node.start, node.end - node.start)
    }
  }

  get data () {
    let data = super.data

    data.parameters = this.mapToObject(this.parameters)
    data.deprecated = this.deprecated
    data.deprecationReplacement = this.deprecationReplacement

    delete data.tags
    delete data.exceptions
    delete data.events

    return data
  }

  apply (data) {
    Object.assign(this, data instanceof DOC.Event ? data.data : data)
  }

  deprecate (replacement = null) {
    this.deprecated = true
    this.deprecationReplacement = null
  }

  addParameter (cfg = {}) {
    let parameter = new Parameter(null, this.SOURCE)

    Object.assign(parameter, cfg)

    parameter.on('warning', msg => this.emit('warning', msg))

    if (!parameter.ignore) {
      this.parameters.set(parameter.label, parameter)
    }
  }

  addTrigger (file, line, column) {
    BUS.emit('warning', `addTrigger for ${file}:${line}:${column} is not implemented yet.`)
  }
}

module.exports = Event
