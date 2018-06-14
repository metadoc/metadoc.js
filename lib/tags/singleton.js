// Identifies singleton classes.
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)
    this.snippet.singleton = true
  }
}

module.exports = TagProcessor
