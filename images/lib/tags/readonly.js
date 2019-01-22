// Identifies singleton classes.
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    if (this.snippet.hasOwnProperty('readable')) {
      this.snippet.readable = true
    }

    if (this.snippet.hasOwnProperty('writable')) {
      this.snippet.writable = false
    }
  }
}

module.exports = TagProcessor
