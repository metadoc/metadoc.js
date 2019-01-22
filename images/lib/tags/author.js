// Recognizes method.function arguments (parameters)
const Tag = require('./tag')

class TagProcessor extends Tag {
  constructor (data, snippet, node, sourcefile) {
    super(...arguments)
    this.snippet.author.add(this.raw.replace('@author', '').trim())
  }
}

module.exports = TagProcessor
