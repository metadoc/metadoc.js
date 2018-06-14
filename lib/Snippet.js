const TagMap = require('./tags/map.json')

DOC.TagMap = Object.assign({}, TagMap)

const EventEmitter = require('events').EventEmitter

const Public = (value) => {
  return {
    enumerable: true,
    writable: true,
    configurable: true,
    value: value
  }
}

const Private = (value) => {
  return {
    enumerable: false,
    writable: true,
    configurable: true,
    value: value
  }
}

class Snippet extends EventEmitter {
  constructor (node, source) {
    super()

    Object.defineProperties(this, {
      NODE: Private(node),
      SOURCE: Private(source),
      type: Private(null),
      label: Private(null),
      description: Public(null),
      code: Public(null),
      start: Public({
        line: 0,
        column: 0
      }),
      end: Public({
        line: 0,
        column: 0
      }),
      tags: Public(new Map()),
      exceptions: Public(new Map()),
      events: Public(new Map()),
      private: Public(false)
    })
  }

  get data () {
    return {
      type: this.type,
      label: this.label,
      description: this.description,
      code: this.code,
      tags: this.mapToObject(this.tags),
      exceptions: this.mapToObject(this.exceptions),
      events: this.mapToObject(this.events),
      start: this.start,
      end: this.end
    }
  }

  get sourcefile () {
    return this.SOURCE.PRIVATE.filepath
  }

  warn () {
    setTimeout(() => this.emit('warning', ...arguments), 0)
  }

  // fn gets the full comment and the comment type as arguments.
  // Supplying an optional array of types will automatically filter
  // comments to those included in the list.
  forEachComment (fn) {
    let comments = (this.SOURCE.comments || []).slice()

    comments.forEach(comment => fn.apply(this, [comment]))
  }

  forEachRelativeComment (line, fn) {
    this.forEachComment(comment => {
      if (comment.relativeLine.line === line && !comment.inline) {
        fn.apply(this, [comment])
      }
    })
  }

  processRelativeComments (line = null) {
    this.forEachRelativeComment(line || this.NODE.loc.start.line, comment => {
      this.description = comment.description || this.description

      if (comment.tags && comment.tags.length > 0) {
        comment.tags.forEach(tag => this.applyCommentTag(tag))
      }
    })
  }

  applyCommentTag (tag) {
    try {
      // Attempt to use special processors
      let TagProcessor = require(require('path').join(__dirname, `./tags/${tag.tag.trim().toLowerCase()}.js`))
      let Representation = new TagProcessor(tag, this, this.NODE, this.SOURCE)
    } catch (e) {
      if (e.message.toLowerCase().indexOf('cannot find module') >= 0) {
        if (DOC.TagMap.hasOwnProperty(tag.tag.trim())) {
          let adjustedTag = Object.assign(tag, { tag: DOC.TagMap[tag.tag.trim()] })
          return this.applyCommentTag(adjustedTag)
        }

        this.tags.set(tag.tag, tag)
        setTimeout(() => this.emit('warning', `Unrecognized tag: ${tag.tag.trim()}`), 0)
      } else {
        console.error(e)
      }
    }
  }

  parse (node) {
    this.start = node.loc.start
    this.end = node.loc.end
    this.code = this.SOURCE.content.substr(this.NODE.start, this.NODE.end - this.NODE.start)
  }

  mapToObject (map) {
    let obj = {}

    map.forEach((value, key, map) => {
      obj[key] = value.data || value
    })

    return obj
  }

  getName (node) {
    try {
      switch (node.type.toLowerCase()) {
        case 'identifier':
          return node.name

        case 'memberexpression':
          return `${this.getName(node.object)}.${this.getName(node.property)}`

        case 'assignmentpattern':
          return `${this.getName(node.left)}`

        default:
          return undefined
      }
    } catch (e) {
      console.error(e)
    }
  }

  getLine (node) {
    return `${this.sourcefile}:${node.loc.start.line}:${node.loc.start.column}`
  }

  detectEvents (node) {
    try {
    const me = this
    DOC.traverse(node.value.body).forEach(function (subnode) {
      if (this.key === 'type') {
        let node = this.parent.node

        if (this.node.toLowerCase() === 'callexpression') {
          // Only check for emitters that emit something
          if (node.callee && node.callee.property && node.arguments && node.arguments.length > 0 && node.callee && node.callee.object) {
            let emitter = node.callee.object.type.toLowerCase() === 'thisexpression' ? 'this' : me.getName(node.callee.object)
            let emitMethod = node.callee.property.name.toLowerCase()

            switch (emitMethod) {
              case 'emit':
              case 'delayemit':
                // Only retrieve static event names (strings)
                if (node.arguments[0].type.toLowerCase() === 'literal') {
                  let evt = new DOC.Event(me.SOURCE)

                  evt.label = node.arguments[0].value.toString()

                  if (emitMethod === 'delayemit') {
                    evt.description = `Event triggered after ${node.arguments[1].value} milliseconds.`
                  }

                  // Apply code parameters
                  for (let i = 1; i < node.arguments.length; i++) {
                    let param = new DOC.Parameter(node.arguments[i], me.SOURCE)

                    param.label = param.label || `payload${i}`

                    evt.parameters.set(param.label, param)
                  }

                  if (emitter === 'NGN.BUS') {
                    BUS.emit('register.event', evt)
                  } else {
                    setTimeout(() => me.emit('register.event', evt, emitter), 0)
                  }
                } else {
                  me.warn(`Skipped unrecognized/private event emitter at ${me.getLine(node)}`)
                }

                break

              case 'forward':
                // Only support local scope
                if (node.callee.object && node.callee.object.type.toLowerCase() === 'thisexpression') {

                }
                break
            }

          }
        }
      }
    })
  } catch (E) { console.error(E)}
  }
}

module.exports = Snippet
