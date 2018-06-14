// Recognizes events that are fired.
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    let evt = new DOC.Event()

    evt.label = this.value
    evt.description = this.description
    evt.code = this.raw

    this.type.split(',').map((param, i) => {
      let args = param.split(':')

      evt.addParameter({
        label: args.length > 1 ? args[0] : `payload${i + 1}`,
        datatype: args.length > 1 ? args[1] : args[0]
      })
    })

    setTimeout(() => this.snippet.emit('register.event', evt, 'this'), 0)
  }
}

module.exports = TagProcessor
