// Recognizes exceptions
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)
    this.snippet.name = this.value.trim()
    this.snippet.description = this.description.trim()
  }
}

module.exports = TagProcessor
