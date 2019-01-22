// Recognizes method.function arguments (parameters)
const Tag = require('./property')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.ignore = true

    BUS.emit('ignore', this.snippet)
  }
}

module.exports = TagProcessor
