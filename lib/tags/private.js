// Identifies singleton classes.
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)
    this.snippet.private = true
  }
}

module.exports = TagProcessor
