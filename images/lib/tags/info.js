// Recognizes method.function arguments (parameters)
const Tag = require('./tag')

class TagProcessor extends Tag {
  constructor (data, snippet, node, sourcefile) {
    super(...arguments)

    let info = this.snippet.tags.get('info') || []

    info.push(this.raw.replace('@info', '').trim())

    this.snippet.tags.set('info', info)
  }
}

module.exports = TagProcessor
