const path = require('path')
const Snippet = require('./Snippet')
const Method = require('./Method')

class Class extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'class'
    this.extends = null
    this.configuration = new Map()
    this.properties = new Map()
    this.methods = new Map()

    // Parse the node
    this.parse(node)
  }

  parse (node) {
    super.parse(node)

    // Get name
    if (node.id) {
      this.label = this.getName(node.id)
    }

    // Identify which class this extends
    if (node.superClass) {
      this.extends = this.getName(node.superClass)
    }

    if (!node.body) {
      console.error('No class body for ' + this.name)
    } else {
      node.body.body.forEach(snippet => {
        switch (snippet.type.toLowerCase()) {
          case 'methoddefinition':
            switch (snippet.kind) {
              case 'get':
              case 'set':
                let property = new DOC.Property(snippet, this.SOURCE)

                this.properties.set(property.label, property)

                break

              default:
                let method = new Method(snippet, this.SOURCE)

                method.on('warning', msg => this.emit('warning', msg))
                method.on('register.event', (evt, emitter) => this.registerEvent(evt, emitter))
                method.on('event.deprecated', (originalEvent, replacementEvent) => {
                  this.applyEvent(originalEvent)
                  this.applyEvent(replacementEvent)
                })

                this.methods.set(method.label, method)

                // Identify properties within constructor
                if (method.label === 'constructor') {
                  snippet.value.body.body.forEach(element => {
                    if (element.expression && element.expression.left && element.expression.left.property && element.expression.left.property.name) {
                      let property = new DOC.Property(element.expression.left.property, this.SOURCE)

                      property.code = this.SOURCE.content.substr(element.start, element.end - element.start)
                      property.readable = true
                      property.writable = true

                      property.processRelativeComments()

                      if (property.configuration) {
                        this.configuration.set(property.label, property)

                        if (property.readable) {
                          this.properties.set(property.label, property)
                        }
                      } else {
                        this.properties.set(property.label, property)
                      }
                    } else if (element.expression && element.expression.callee && element.expression.callee.property && element.expression.arguments[0].type.toLowerCase() === 'thisexpression') {
                      if (['defineproperties', 'defineproperty'].indexOf(element.expression.callee.property.name.toLowerCase()) >= 0 && element.expression.arguments.length === 2) {
                        element.expression.arguments[1].properties.forEach(prop => this.processNgnProperty(prop))
                      }
                    } else {
                      console.log('-->', element)
                    }
                  })
                }
            }

            break
        }
      })
    }

    // Override/annotate with comments
    this.processRelativeComments(node.body.loc.start.line)
  }

  // Handles standard property definitions and NGN-specific definitions
  processNgnProperty (prop) {
    if (prop.value.type.toLowerCase() === 'callexpression' && prop.value.callee.type.toLowerCase() === 'memberexpression' && prop.value.callee.object && prop.value.callee.object.name.toLowerCase() === 'ngn' && ['public', 'private', 'const', 'privateconst', 'get', 'set', 'getset', 'define'].indexOf(prop.value.callee.property.name.toLowerCase()) >= 0) {
      let property = new DOC.Property(prop, this.SOURCE)

      property.label = this.getName(prop)

      switch (prop.value.callee.property.name.toLowerCase()) {
        case 'public':
          property.readable = true
          property.writable = true
          break

        case 'private':
          property.readable = true
          property.writable = true
          property.private = true
          break

        case 'const':
          property.readable = true
          break

        case 'privateconst':
          property.readable = true
          property.private = true
          break

        case 'get':
          property.readable = true
          break

        case 'set':
          property.writable = true
          break

        case 'getset':
          property.readable = true
          property.writable = true
          break

        case 'define':
          property.private = prop.value.arguments[0].value
          property.readable = true
          property.writable = prop.value.arguments[1].value
          property.default = prop.value.arguments[3].value
          property.datatype = this.getDataType(property.default)
          break
      }

      let originalPropertyName = property.label
      property.processRelativeComments()

      if (originalPropertyName !== property.label) {
        this.properties.delete(originalPropertyName)

        if (property.configuration) {
          this.configuration.delete(originalPropertyName)
        }
      }

      if (property.configuration) {
        this.configuration.set(property.label, property)

        if (property.readable) {
          this.properties.set(property.label, property)
        }
      } else {
        this.properties.set(property.label, property)
      }
    } else if (prop.value && prop.value.type.toLowerCase() === 'objectexpression' && prop.value.properties) {
      let property = new DOC.Property(prop, this.SOURCE)

      property.label = this.getName(prop)

      prop.value.properties.forEach(arg => {
        switch (arg.key.name.toLowerCase()) {
          case 'enumerable':
            property.private = !arg.value.value
            break

          case 'writable':
            property.writable = arg.value.value
            break

          case 'value':
            property.default = arg.value.value
            property.datatype = this.getDataType(property.default)
            break
        }
      })

      if (property.configuration) {
        this.configuration.set(property.label, property)

        if (property.readable) {
          this.properties.set(property.label, property)
        }
      } else {
        this.properties.set(property.label, property)
      }
    }
  }

  registerEvent (evt, emitter = 'this') {
    if (emitter === 'this' || emitter === this.label) {
      this.events.set(evt.label, evt)
    }
  }

  get data () {
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
