// Recognizes return statements within a method/function.
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.returnDescription = `${this.value} ${this.description}`.trim()

    if ((this.type || '').trim().length > 0) {
      this.snippet.returnType = this.type
    }
  }
}

module.exports = TagProcessor
