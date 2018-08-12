const Tag = require('./property')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.hidden = true
  }
}

module.exports = TagProcessor
