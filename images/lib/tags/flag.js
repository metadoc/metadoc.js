// Recognizes method.function arguments (parameters)
const Tag = require('./property')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.flags.add(this.value, this.description)
  }
}

module.exports = TagProcessor
