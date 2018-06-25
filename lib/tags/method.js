// Recognizes classes
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)
    this.snippet.label = (this.value||this.snippet.label||'').trim()
    this.snippet.description = this.description.trim()
  }
}

module.exports = TagProcessor
