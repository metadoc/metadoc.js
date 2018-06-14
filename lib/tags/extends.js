// Recognizes class extensions
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)
    this.snippet.extends = this.value.trim()
  }
}

module.exports = TagProcessor
