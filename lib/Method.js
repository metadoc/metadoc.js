const Snippet = require('./Snippet')
const Parameter = require('./Parameter')
const Event = require('./Event')

class Method extends Snippet {
  constructor (node, source) {
    super(...arguments)

    this.type = 'method'
    this.parameters = new Map()
    this.returnType = null
    this.returnDescription = null
    this.kind = null
    this.generator = false
    this.static = false
    this.computed = false
    this.async = false

    // Internal elements
    this.commentedParamCount = 0
    this.parameterIndex = new Map()

    // Parse the method node
    this.parse(node)
  }

  get data () {
    return Object.assign(super.data, {
      parameters: this.mapToObject(this.parameters),
      returnType: this.returnType === null ? 'void' : this.returnType,
      returnDescription: this.returnDescription === null ? 'void' : this.returnDescription,
      kind: this.kind,
      generator: this.generator,
      static: this.static,
      computed: this.computed,
      async: this.async
    })
  }

  parse (node) {
    super.parse(node)

    // Identify method type
    this.kind = node.kind

    // Identify method name
    this.label = this.getName(node.key)

    // Identify static method
    this.static = node.static

    // Identify computed method
    this.computed = node.computed

    // Identify async method
    this.async = node.value.async

    // Identify async method
    this.generator = node.value.generator

    if (node.value.type.toLowerCase() !== 'functionexpression') {
      console.error(`Invalid method "${this.label}" at line ${this.sourcefile}:${node.value.loc.start.line}:${node.value.loc.start.column}`)
      return
    }

    // Identify method parameters
    node.value.params.forEach(node => this.createParameter(node))

    // Identify return element
    node.value.body.body.forEach(item => {
      if (item.type.toLowerCase() === 'returnstatement') {
        item.argument = item.argument === null ? {type: 'void'} : item.argument

        switch (item.argument.type.toLowerCase()) {
          case 'void':
            this.returnType = null
            this.returnDescription = null
            break

          case 'literal':
            this.returnType = typeof item.argument.value
            this.returnDescription = ''
            break
        }
      }
    })

    // Identify static events (known)
    this.detectEvents(node)

    this.processRelativeComments(node.loc.start.line)
  }

  createParameter (node, label) {
    let parameter = new Parameter(node, this.SOURCE)

    parameter.on('warning', msg => this.emit('warning', msg))

    label = label || parameter.label

    this.parameters.set(label, parameter)

    this.parameterIndex.set(this.parameters.size - 1, {
      get argument () { return parameter }
    })

    return this.parameterIndex.get(this.parameters.size - 1).argument
  }
}

module.exports = Method
