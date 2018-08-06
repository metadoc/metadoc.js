// Recognizes events that are fired.
const Tag = require('./Tag')

class TagProcessor extends Tag {
  constructor () {
    super(...arguments)

    let evt = new DOC.Event()

    evt.label = this.value
    evt.description = this.description
    evt.code = this.raw
    evt.start = evt.start || this.snippet.start
    evt.end = evt.end || this.snippet.end

    this.type.split(',').map((param, i) => {
      let args = param.split(':')

      evt.addParameter({
        label: args.length > 1 ? args[0] : `payload${i === 0 ? '' : i + 1}`,
        datatype: args.length > 1 ? args[1] : args[0]
      })
    })

    this.snippet.registerEvent(evt, 'this')
  }
}

module.exports = TagProcessor
