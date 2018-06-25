// Identifies singleton classes.
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    if (this.snippet.hasOwnProperty('readable')) {
      this.snippet.readable = false
    }

    if (this.snippet.hasOwnProperty('writable')) {
      this.snippet.writable = true
    }
  }
}

module.exports = TagProcessor
