// Recognizes classes
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    BUS.emit('register.namespace', this.value.trim())
  }
}

module.exports = TagProcessor
