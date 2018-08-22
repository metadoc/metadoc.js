// Recognizes method.function arguments (parameters)
const Tag = require('./property')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    this.snippet.configuration = true
    this.snippet.writable = false
    this.snippet.readable = false

    this.snippet.parent.configuration.set(this.snippet.label, this.snippet)
    this.snippet.parent.properties.delete(this.snippet.label)
  }
}

module.exports = TagProcessor
