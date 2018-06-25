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
      LABEL: Private(null),
      DATATYPE: Private('any'),
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
      private: Public(false),
      ignored: Public(false),
      enum: Public(null),
      flags: Public(new Set()),
      todo: Public(new Set())
    })

    this.on('deprecate.event', (sourceEvent, replacementEventName , emitter) => {
      let evt = this.events.get(sourceEvent)

      if (!evt) {
        evt = new DOC.Event(this.SOURCE)
        evt.label = sourceEvent
      }

      evt.deprecated = true
      evt.deprecationReplacement = replacementEventName

      let newevt = this.events.get(replacementEventName)

      if (!newevt) {
        newevt = new DOC.Event(this.SOURCE)
        newevt.label = replacementEventName
        newevt.description = 'Replacement for ' + sourceEvent
      }

      if (emitter === 'this' || emitter === this.label) {
        this.events.set(sourceEvent, evt)
        this.events.set(replacementEventName, newevt)
        this.emit('event.deprecated', evt, newevt)
      } else {
        BUS.emit('deprecate.event', evt, newevt)
      }
    })
  }

  get data () {
    let data = {
      type: this.type,
      label: this.label,
      description: this.description,
      code: this.code,
      tags: this.mapToObject(this.tags),
      exceptions: this.mapToObject(this.exceptions),
      events: this.mapToObject(this.events),
      start: this.start,
      end: this.end,
      flags: Array.from(this.flags.values())
    }

    if (this.todo.size > 0) {
      data.todo = Array.from(this.todo.values())
    }

    return data
  }

  get sourcefile () {
    return this.SOURCE.PRIVATE.filepath
  }

  get label () {
    return this.LABEL
  }

  set label (value) {
    // Clean up enumerable values
    this.LABEL = this.processLabel(value)
  }

  processLabel (value) {
    return value
    // if (value && value.indexOf('=') >= 0) {
    //   let values = value.split('=')
    //
    //   this.enum = values[1].split('|')
    //   return values[0]
    // } else {
    //   return value
    // }
  }

  get datatype () {
    return this.DATATYPE
  }

  set datatype (value) {
    if (typeof value === 'string') {
      this.DATATYPE = value.toLowerCase()
    } else {
      this.DATATYPE = value
    }
  }

  warn () {
    setTimeout(() => this.emit('warning', ...arguments), 0)
  }

  // Applies new values to an event
  applyEvent (evt) {
    let existingEvent = this.events.get(evt)

    if (!existingEvent) {
      this.events.set(evt.label, evt)
    } else {
      existingEvent.apply(evt)

      this.events.set(evt.label, existingEvent)
    }
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
        comment.processed = true
      }
    })
  }

  processRelativeComments (line = null) {
    this.forEachRelativeComment(line === null ? this.NODE.loc.start.line : line, comment => {
      if (!comment.processed) {
        this.description = comment.description || this.description

        if (comment.tags && comment.tags.length > 0) {
          comment.tags.forEach(tag => this.applyCommentTag(tag))
        }
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
    try {
      this.start = node.loc.start
      this.end = node.loc.end
      this.code = this.SOURCE.content.substr(this.NODE.start, this.NODE.end - this.NODE.start)
    } catch (e) {
      console.error(e)
    }
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

        case 'property':
        case 'methoddefinition':
          return node.key.name

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

  getDataType (node) {
    if (node.hasOwnProperty('regex')) {
      return 'regex'
    }

    if (!node.hasOwnProperty('type')) {
      return typeof node
    }

    switch (node.type.replace('Expression', '').toLowerCase()) {
      case 'new':
      case 'call':
        return node.callee.name

      case 'function':
      case 'arrowfunction':
        return 'function'

      case 'identifier':
        setTimeout(() => this.emit('warning', `Identifier ${node.name} at ${this.sourcefile}:${node.loc.start.line}:${node.loc.start.column} may not be a valid default value.`), 0)

      default:
        return 'object'
    }
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

                    evt.node = node

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
                  // Only retrieve static event names (strings)
                  if (node.arguments[0].type.toLowerCase() === 'literal' && node.arguments.length > 1) {
                    let parameters = new Map()

                    // Identify parameters first
                    if (node.arguments.length > 2) {
                      for (let i = 2; i < node.arguments.length; i++) {
                        let param = new DOC.Parameter(node.arguments[i], me.SOURCE)
                        param.label = param.label || `payload${i-1}`
                        parameters.set(param.label, param)
                      }
                    }

                    // Create an event for each trigger
                    let triggers = node.arguments[1].type.toLowerCase() === 'literal' ? [node.arguments[1]] : node.arguments[1].elements
                    triggers.forEach(trigger => {
                      let evt = new DOC.Event(me.SOURCE)

                      evt.label = trigger.value.toString()
                      evt.parameters = parameters
                      evt.node = node

                      if (emitter === 'NGN.BUS') {
                        BUS.emit('register.event', evt)
                      } else {
                        setTimeout(() => me.emit('register.event', evt, emitter), 0)
                      }
                    })
                  } else {
                    me.warn(`Skipped unrecognized/private event emitter at ${me.getLine(node)}`)
                  }

                  break

                case 'funnelonce':
                case 'funnel':
                  // Ignore if the second argument is not a literal (i.e. ignore functions)
                  if (node.arguments && node.arguments[1].type.toLowerCase() === 'literal') {
                    let parameters = new Map()

                    // Identify parameters first
                    if (node.arguments.length > 2) {
                      for (let i = 2; i < node.arguments.length; i++) {
                        let param = new DOC.Parameter(node.arguments[i], me.SOURCE)
                        param.label = param.label || `payload${i-1}`
                        parameters.set(param.label, param)
                      }
                    }

                    let evt = new DOC.Event(me.SOURCE)

                    evt.label = node.arguments[1].value.toString()
                    evt.parameters = parameters
                    evt.node = node

                    if (emitter === 'NGN.BUS') {
                      BUS.emit('register.event', evt)
                    } else {
                      setTimeout(() => me.emit('register.event', evt, emitter), 0)
                    }
                  }

                  break

                case 'thresholdonce':
                case 'threshold':
                  if (node.arguments.length >= 3 && node.arguments[2].type.toLowerCase() === 'literal') {
                    let parameters = new Map()

                    // Identify parameters first
                    if (node.arguments.length > 3) {
                      for (let i = 3; i < node.arguments.length; i++) {
                        let param = new DOC.Parameter(node.arguments[i], me.SOURCE)
                        param.label = param.label || `payload${i-1}`
                        parameters.set(param.label, param)
                      }
                    }

                    let evt = new DOC.Event(me.SOURCE)

                    evt.label = node.arguments[2].value.toString()
                    evt.description = `Triggered after \`${node.arguments[0].value.toString()}\` is fired ${node.arguments[1].value.toString()} time${parseInt(node.arguments[1].value, 10) === 1 ? '' : 's'}.`
                    evt.parameters = parameters
                    evt.node = node

                    if (emitter === 'NGN.BUS') {
                      BUS.emit('register.event', evt)
                    } else {
                      setTimeout(() => me.emit('register.event', evt, emitter), 0)
                    }
                  }

                  break

                case 'deprecate':
                  if (node.arguments.length === 2 && node.arguments[0].type.toLowerCase() === 'literal' && node.arguments[1].type.toLowerCase() === 'literal') {
                    setTimeout(() => me.emit('deprecate.event', node.arguments[0].value, node.arguments[1].value, emitter), 0)
                  }

                  break
              }

            }
          }
        }
      })
    } catch (E) {
      console.error(E)
    }
  }

  detectExceptions () {
    try {
      const me = this

      DOC.traverse(this.NODE.body).forEach(function (subnode) {
        if (this.key === 'type') {
          let node = this.parent.node

          if (this.node.toLowerCase() === 'callexpression' && node.callee.type.toLowerCase() === 'memberexpression' && node.callee.object && node.callee.object.name && node.callee.object.name.toLowerCase() === 'ngn' && node.arguments.length === 1 && node.arguments[0].type.toLowerCase() === 'objectexpression') {
            let CustomException = new DOC.Exception(node, me.SOURCE)

            BUS.emit('register.exception', CustomException)
          }
        }
      })
    } catch (E) {
      console.error(E)
    }
  }
}

module.exports = Snippet
