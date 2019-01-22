// Recognizes class extensions
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    BUS.emit('register.type', {
      name: this.value.trim(),
      description: this.description,
      type: this.type.split('|').map(el => el.trim()),
      enum: this.options.map(item => {
        if (typeof item === 'string') {
          return item.trim()
        }

        return item
      })
    })
  }
}

module.exports = TagProcessor
