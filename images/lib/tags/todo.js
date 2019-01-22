// Recognizes method.function arguments (parameters)
const Tag = require('./tag')

class TagProcessor extends Tag {
  constructor (data, snippet, node, sourcefile) {
    super(...arguments)
    this.snippet.todo.add(this.raw.replace('@todo', '').trim())
  }
}

module.exports = TagProcessor
