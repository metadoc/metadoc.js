const Snippet = require('./Snippet')

class Class extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'class'
    this.extends = null
    this.configuration = new Map()
    this.properties = new Map()
    this.methods = new Map()

    // Parse the node
    if (node !== null) {
      this.parse(node)
    }
  }

  parse (node) {
    super.parse(node)

    // Get name
    if (!node) {
      this.label = 'UNKNOWN'
    } else {
      if (node.id) {
        this.label = this.getName(node.id)
      }

      // Identify which class this extends
      if (node.superClass) {
        this.extends = this.getName(node.superClass)
      }

      if (!node.body) {
        this.emit('warning', `No class body for ${this.name}`)
      } else {
        node.body.body.forEach(snippet => {
          switch (snippet.type.toLowerCase()) {
            case 'methoddefinition':
              switch (snippet.kind) {
                case 'get':
                case 'set':
                  let property = new DOC.Property(snippet, this.SOURCE, this)

                  if (!property.ignore) {
                    this.properties.set(property.label, property)
                  }

                  break

                default:
                  let method = this.addMethod(this.getName(snippet.key), snippet)
                  //   new Method(snippet, this.SOURCE)
                  //
                  // if (method.ignore) {
                  //   break
                  // }
                  //
                  // method.on('warning', msg => this.emit('warning', msg))
                  // method.on('register.event', (evt, emitter) => this.registerEvent(evt, emitter))
                  // method.on('event.deprecated', (originalEvent, replacementEvent) => {
                  //   this.applyEvent(originalEvent)
                  //   this.applyEvent(replacementEvent)
                  // })
                  //
                  // this.methods.set(method.label, method)

                  // Identify properties within constructor
                  if (method.label === 'constructor') {
                    snippet.value.body.body.forEach(element => {
                      if (element.expression && element.expression.left && element.expression.left.property && element.expression.left.property.name) {
                        let property = new DOC.Property(element.expression.left.property, this.SOURCE, this)

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
                      } else if (element.expression && element.expression.callee && element.expression.callee.property && element.expression.arguments && element.expression.arguments.length > 0 && element.expression.arguments[0].type && element.expression.arguments[0].type.toLowerCase() === 'thisexpression') {
                        if (['defineproperties', 'defineproperty'].indexOf(element.expression.callee.property.name.toLowerCase()) >= 0 && element.expression.arguments.length === 2) {
                          element.expression.arguments[1].properties.forEach(prop => this.processNgnProperty(prop))
                        }
                      }
                    })
                  }
              }

              break
          }
        })
      }

      // Override/annotate with comments
      this.processRelativeComments(node.body ? node.body.loc.start.line : node.loc.start.line)
    }
  }

  // Handles standard property definitions and NGN-specific definitions
  processNgnProperty (prop) {
    let property

    if (this.isNgnProperty(prop)) {
      property = this.createNgnProperty(prop)
      let originalPropertyName = property.label

      property.processRelativeComments()

      if (originalPropertyName !== property.label) {
        this.properties.delete(originalPropertyName)

        if (property.configuration) {
          this.configuration.delete(originalPropertyName)
        }
      }
    } else if (prop.value && prop.value.type.toLowerCase() === 'objectexpression' && prop.value.properties) {
      property = this.createStandardProperty(prop)
    }

    if (property.configuration) {
      this.configuration.set(property.label, property)

      if (property.readable) {
        this.properties.set(property.label, property)
      }
    } else {
      this.properties.set(property.label, property)
    }
  }

  addMethod (name, node = null) {
    let method = this.methods.get(name)

    if (!method) {
      method = new DOC.Method(node, this.SOURCE, this)
      method.label = name
    }

    if (method.ignore) {
      return method
    }

    method.on('warning', msg => this.emit('warning', msg))
    method.on('register.event', (evt, emitter) => this.registerEvent(evt, emitter))
    method.on('event.deprecated', (originalEvent, replacementEvent) => {
      this.applyEvent(originalEvent)
      this.applyEvent(replacementEvent)
    })

    this.methods.set(method.label, method)

    return method
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
  }
}

module.exports = Class
