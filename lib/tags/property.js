// Recognizes method.function arguments (parameters)
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.label = (this.value||'').trim(0) !== '' ? this.value : this.snippet.label
    this.snippet.description = this.description || this.snippet.description
    this.snippet.datatype = this.type || this.snippet.datatype
    this.snippet.required = this.required
    this.snippet.default = this.default
    this.snippet.enum = this.options

    if (this.snippet.code === null) {
      BUS.emit('warning', `No source code found for "${this.snippet.label}" parameter in ${this.snippet.sourcefile}`)
    }
  }
}

module.exports = TagProcessor
