const Snippet = require('./Snippet')

class Exception extends Snippet {
  constructor (cfg = {}) {
    super(...arguments)

    delete this.label

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
    return Object.assign(this.basedata, this.PRIVATE)
  }

  parse (parent) {
    this.start = parent.parent.node.loc.start
    this.end = parent.parent.node.loc.end

    parent.parent.node.arguments[0].properties.forEach(property => {
      if (this.PRIVATE.hasOwnProperty(property.key.name)) {
        this.PRIVATE[property.key.name] = property.value.value
      }
    })
  }
}

module.exports = Exception
