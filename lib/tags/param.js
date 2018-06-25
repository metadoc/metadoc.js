// Recognizes method.function arguments (parameters)
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    // let arg = this.snippet.parameters.get(this.value)
    let param = this.snippet.parameterIndex.get(this.snippet.commentedParamCount + 1)
    let parameter = !param ? this.snippet.createParameter(null, this.value) : param.argument

    parameter.description = this.description
    parameter.label = this.value || parameter.label
    parameter.datatype = this.type || parameter.datatype
    parameter.required = this.required
    parameter.default = this.default
    parameter.enum = this.options

    if (parameter.code === null) {
      BUS.emit('warning', `No source code found for "${parameter.label}" parameter in ${this.snippet.sourcefile}`)
    }

    this.snippet.commentedParamCount++
  }
}

module.exports = TagProcessor
