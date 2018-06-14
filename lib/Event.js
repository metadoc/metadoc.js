const Snippet = require('./Snippet')
const Parameter = require('./Parameter')

class Event extends Snippet {
  constructor (source) {
    super(null,...arguments)

    this.type = 'event'
    this.parameters = new Map()
    this.triggers = new Set()
    this.handlers = new Set()
  }

  get data () {
    let data = super.data

    data.parameters = this.mapToObject(this.parameters)

    delete data.tags
    delete data.exceptions
    delete data.events

    return data
  }

  addParameter (cfg = {}) {
    let parameter = new Parameter(null, this.SOURCE)

    Object.assign(parameter, cfg)

    parameter.on('warning', msg => this.emit('warning', msg))

    this.parameters.set(parameter.label, parameter)
  }

  addTrigger (file, line, column) {

  }
}

module.exports = Event
