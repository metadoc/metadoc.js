const Snippet = require('./Snippet')

class Method extends Snippet {
  constructor (node, source, skipParsing = false) {
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

    // Parse the method node (unless ignored)
    // Method parsing should be ignored only when there is no
    // AST node to describe the method. The primary use case
    // for this is handling methods that are only defined in
    // comment blocks.
    if (typeof skipParsing !== 'boolean' || !skipParsing) {
      this.parse(node)
    }
  }

  get data () {
    let data = Object.assign(super.data, {
      arguments: this.mapToObject(this.parameters),
      returnType: this.returnType === null ? 'void' : this.returnType,
      returnDescription: this.returnDescription === null ? 'void' : this.returnDescription,
      kind: this.kind,
      generator: this.generator,
      static: this.static,
      computed: this.computed,
      async: this.async
    })

    delete data.events

    return data
  }

  parse (node) {
    if (!node) {
      return
    }

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

    let valueType = node.value.type.toLowerCase()

    // Support callexpression
    if (valueType === 'callexpression') {
      if (this.isNgnProperty(node)) {
        let prop = this.createNgnProperty(node)

        this.readable = prop.data.readable
        this.writable = prop.data.writable
        this.private = prop.data.private

        if (node.value.arguments.length < 1) {
          BUS.emit('warning', `Invalid method "${this.label}" (${node.value.type.toLowerCase()}) at line ${this.sourcefile}:${node.value.loc.start.line}:${node.value.loc.start.column}`)
          return
        }

        this.processFunction(node.value.arguments[0])

        return
      }
    }

    this.processFunction(node)
  }

  processFunction (node) {
    node.value = node.value || node

    let valueType = node.value.type.toLowerCase()

    if (valueType !== 'functionexpression' && valueType !== 'arrowfunctionexpression') {
      BUS.emit('warning', `Invalid method "${this.label}" (${node.value.type.toLowerCase()}) at line ${this.sourcefile}:${node.value.loc.start.line}:${node.value.loc.start.column}`)
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

    this.parameters.forEach((value, key) => {
      if (key.toLowerCase() === 'callback' && value.datatype !== 'function') {
        BUS.emit('warning', `"${key}" attribute appears to be a callback function, but is defined as a${value.datatype === 'any' ? 'n unspecified/arbitrary' : ' ' + value.datatype} data type at ${value.sourcefile}:${value.start.line}:${value.start.column}.`)
      }
    })
  }

  createParameter (node, label) {
    let parameter = new DOC.Parameter(node, this.SOURCE, this)

    parameter.on('warning', msg => this.emit('warning', msg))

    if (parameter.ignore) {
      return parameter
    }

    parameter.label = label || parameter.label

    this.parameters.set(parameter.label, parameter)

    this.parameterIndex.set(this.parameters.size - 1, {
      get argument () { return parameter }
    })

    return this.parameterIndex.get(this.parameters.size - 1).argument
  }
}

module.exports = Method
