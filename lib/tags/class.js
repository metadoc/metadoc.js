// Recognizes classes
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)
    this.snippet.label = this.value.trim()
    this.snippet.description = this.description.trim()
  }
}

module.exports = TagProcessor
