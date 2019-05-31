// Recognizes method.function arguments (parameters)
const Tag = require('./tag')
const parser = /@info\s(.*)\n/i

class TagProcessor extends Tag {
  constructor (data, snippet, node, sourcefile) {
    super(...arguments)

    let parsed = parser.exec(this.raw)
    let title = parsed !== null ? parsed[0].replace('@info', '').trim() : 'Unknown'
    let content = parsed !== null ? this.raw.replace(parsed[0], '') : this.raw.replace('@info', '')
    let info = this.snippet.tags.get('info') || []

    info.push({
      title,
      description: content.trim()
    })

    this.snippet.tags.set('info', info)
  }
}

module.exports = TagProcessor
