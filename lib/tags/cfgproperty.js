// Recognizes method.function arguments (parameters)
const Tag = require('./cfg')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.readable = true
  }
}

module.exports = TagProcessor
