const Snippet = require('./Snippet')

class Exception extends Snippet {
  constructor (node, source, cfg = {}) {
    super(node, source)

    delete this.label

    this.type = 'exception'

    Object.defineProperties(this, {
      PRIVATE: {
        value: {
          name: cfg.name || 'NgnError',
          type: cfg.type || 'TypeError',
          severity: cfg.severity || 'minor',
          message: cfg.message || 'Unknown Error',
          category: cfg.category || 'operational'
        }
      }
    })

    this.parse(node)
  }

  get data () {
    let data = super.data

    delete data.events
    delete data.exceptions

    return Object.assign(data, this.PRIVATE)
  }

  get label () {
    return this.name
  }

  get name () {
    return this.PRIVATE.name
  }

  set name (value) {
    this.PRIVATE.name = value
  }

  get type () {
    return this.PRIVATE.type
  }

  set type (value) {
    this.PRIVATE.type = value
  }

  get severity () {
    return this.PRIVATE.severity
  }

  set severity (value) {
    this.PRIVATE.severity = value
  }

  get message () {
    return this.PRIVATE.message
  }

  set message (value) {
    this.PRIVATE.message = value
  }

  get category () {
    return this.PRIVATE.category
  }

  set category (value) {
    this.PRIVATE.category = value
  }

  get json () {
    return Object.assign(this.data, this.PRIVATE)
  }

  parse (node) {
    super.parse(node)

    node.arguments[0].properties.forEach(property => {
      if (this.PRIVATE.hasOwnProperty(property.key.name)) {
        this.PRIVATE[property.key.name] = property.value.value
      }

      if (property.key.name.toLowerCase() === 'custom' && property.value.type.toLowerCase() === 'objectexpression') {
        property.value.properties.forEach(prop => {
          this.tags.set(prop.key.name, {
            value: prop.key.name,
            description: prop.value.value,
            type: prop.key.name,
            line: prop.key.loc.start.line,
            raw: this.SOURCE.content.substr(prop.start, prop.end - prop.start)
          })
        })
      }
    })
  }
}

module.exports = Exception
