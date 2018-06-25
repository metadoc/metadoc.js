// Recognizes method.function arguments (parameters)
const Tag = require('./property')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.configuration = true
    this.snippet.writable = false
  }
}

module.exports = TagProcessor
