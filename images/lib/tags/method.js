// Recognizes classes
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    if (this.snippet.type === 'property') {
      let property = this.snippet.createProperty(this.snippet.NODE)

      if (this.snippet.parent.type === 'class') {
        this.snippet = this.snippet.parent.addMethod(property.label, this.snippet.NODE)
      } else {
        this.snippet = new DOC.Method(this.snippet.NODE, this.snippet.SOURCE, this.snippet.parent)
      }

      this.snippet.on('warning', function () {
        BUS.emit('warning', ...arguments)
      })

      this.snippet.readable = property.readable
      this.snippet.writable = property.writable
      this.snippet.private = property.private
    }

    this.snippet.label = (this.value || this.snippet.label || '').trim()
    this.snippet.description = this.description.trim()

    LAST_ENTITY = this.snippet // eslint-disable-line no-global-assign
  }
}

module.exports = TagProcessor
