// Recognizes method.function arguments (parameters)
const Tag = require('./property')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.label = 'constructor'
    this.snippet.description = this.description

    LAST_ENTITY = this.snippet // eslint-disable-line no-global-assign
  }
}

module.exports = TagProcessor
