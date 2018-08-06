const path = require('path')
const fs = require('fs')
const ProductionLine = require('productionline')
const Parser = require('cherow')
const JSCommentParser = require('comment-parser')
const traverse = require('traverse')
const EE = require('events').EventEmitter

global.BUS = new EE() // global event bus

// See the global doc variable before including classes.
// This separation allows classes to use the DOC variable
// within the code.
global.DOC = {
  traverse
}

// Assign classes in a globally accessible manner.
global.DOC = Object.assign(DOC, {
  Namespace: require('./lib/namespace'),
  Class: require('./lib/class'),
  Exception: require('./lib/NGNException'),
  Event: require('./lib/Event'),
  Method: require('./lib/Method'),
  Parameter: require('./lib/Parameter'),
  Property: require('./lib/Property'),
  RawSnippet: require('./lib/Snippet'),
  config: {
    warnOnNoCode: false,
    warnOnSkippedEvents: false,
    errorOnCommentFailure: true,
    warnOnSkippedTags: true
  },
  audit: new Set()
})

// Create a last known tag
global.LAST_ENTITY = null

const NgnClass = require('./lib/Class')

class Generator extends ProductionLine {
  constructor (cfg = {}) {
    // Remove assets (since there aren't any)
    cfg.assets = []

    // Override standard source
    cfg.source = path.resolve('./src')

    super(cfg)

    this.DATA = {
      globals: [],
      requires: new Set(),
      classes: new Map(),
      exceptions: new Map(),
      bus: new Map(), // NGN.BUS events
      namespaces: new Map()
    }

    this.STANDARD_OPTIONS = {
      loc: true,
      ranges: true,
      skipShebang: true,
      next: true,
      jsx: false,
      module: true,
      attachComment: true
      // tolerant: true
    }

    const DISPLAY_WARNING = msg => {
      if (msg.toLowerCase().indexOf('no source code found for') === 0) {
        if (DOC.config.warnOnNoCode) {
          this.verysubtle(msg)
        }
      } else if (msg.toLowerCase().indexOf('failed') >= 0) {
        if (DOC.config.errorOnCommentFailure) {
          DOC.audit.add(msg)
        }
      } else if (msg.toLowerCase().indexOf('unrecognized/private event emitter') >= 0) {
        if (DOC.config.warnOnSkippedEvents) {
          this.warn(msg)
        }
      } else if (msg.toLowerCase().indexOf('arguments cannot be assigned') >= 0) {
        if (DOC.config.warnOnSkippedTags) {
          this.warn(msg)
        }
      } else {
        this.warn(msg)
      }
    }

    this.on('global.variable', name => {
      if (this.DATA.globals.indexOf(name) < 0) {
        this.DATA.globals.push(name)
      }
    })

    this.on('register.class', snippet => {
      snippet.methods.forEach(method => {
        if (method.events.size > 0) {
          method.events.forEach(event => snippet.events.set(event.label, event))
        }
      })

      this.DATA.classes.set(snippet.label, snippet)
    })
    this.on('warning', msg => DISPLAY_WARNING(msg))

    BUS.on('warning', msg => DISPLAY_WARNING(msg))

    BUS.on('skipped.tag', (tag, reason, snippet) => {
      DISPLAY_WARNING(`Skipped "@${tag.tag}"" at ${snippet.sourcefile}:${snippet.start.line}:${snippet.start.column} - ${reason}`)
    })

    // Recognize global events on the NGN.BUS
    BUS.on('register.event', evt => this.DATA.bus.set(evt.label, evt))

    BUS.on('register.namespace', namespace => this.DATA.namespaces.set(namespace.label, namespace))

    // Handle event deprecation
    BUS.on('deprecate.event', (originalEvent, replacementEvent = null) => {
      let original = this.DATA.bus.get(originalEvent.label)

      if (original) {
        original.deprecated = true
        original.deprecationReplacement = originalEvent.deprecationReplacement

        if (original.description === null) {
          original.description = 'Deprecated'
        }

        this.DATA.bus.set(original.label, original)
      }

      if (replacementEvent && !this.DATA.bus.get(replacementEvent.label)) {
        this.DATA.bus.set(replacementEvent.label, replacementEvent)
      }
    })

    // Recognize global custom exceptions
    BUS.on('register.exception', e => {
      this.DATA.exceptions.set(e.label, e)
    })

    BUS.on('ignore', snippet => DISPLAY_WARNING(`Ignored ${snippet.label} ${snippet.type} at ${snippet.sourcefile}:${snippet.start.line}:${snippet.start.column}`))

    class LocalFile extends this.File {
      constructor () {
        super(...arguments)

        this.root = arguments[arguments.length - 1]

        // Parse comments
        this.comments = require('./comment-extractor')(this.content)

        let me = this
        this.comments = this.comments.map((comment, cIndex) => {
          let lines = this.getLineByIndex(comment.range[0], comment.range[1])
          let parsedComment = JSCommentParser(comment.comment)

          parsedComment = parsedComment.map(pComment => {
            pComment.tags = pComment.tags.map(tag => {
              if (tag.name.indexOf('\n') === 0) {
                tag.description = `${tag.name} ${tag.description}`.trim()
                tag.name = null
              }

              let match = /\s?\((.*)\).*/.exec(tag.description.trim())
              if (match !== null) {
                tag.description = tag.description.replace(`(${match[1]})`, '').trim()
                tag.options = match[1].split(/,|\|/)
              } else {
                tag.options = null
              }

              return tag
            })

            return pComment
          })

          comment = Object.assign(parsedComment.length > 0 ? parsedComment[0] : {}, {
            index: cIndex,
            type: comment.comment.indexOf('\n') > 0 ? 'block' : 'single',
            raw: comment.comment,
            description: comment.comment.replace(/^^\/+\s?|\s?\*+\/|\/\*+|\s?\*\s?|@.+/g, '').trim(),
            range: comment.range,
            start: {
              line: lines[comment.range[0]]
            },
            end: {
              line: lines[comment.range[1]]
            },
            relativeLine: lines[comment.range[1]],
            inline: comment.comment.indexOf('\n') < 0 ? this.isCommentInline(lines[comment.range[0]], comment.range) : false,
            get prior () {
              return cIndex === 0 ? null : me.comments[cIndex - 1]
            }
          })

          // Find related line
          for (let i = comment.end.line + (comment.inline ? 0 : 1); i < this.lineCount; i++) {
            // Skip blank lines
            if (this.lines[i].trim().length > 0) {
              // Skip comments
              for (let c = cIndex; c < this.comments.length; c++) {
                let cmt = this.getLineByIndex(this.comments[c].range[0], this.comments[c].range[1])

                if (this.isCommentInline(i, this.comments[c].range)) {
                  break
                }

                if (cmt[this.comments[c].range[0]] === i) {
                  i = cmt[this.comments[c].range[1]] + 1

                  while (i < this.lineCount && this.lines[i].trim().length === 0) {
                    i++
                  }

                  break
                }
              }

              if (i < this.lineCount) {
                comment.relativeLine = i
                break
              }
            }
          }

          comment.relativeLine = {
            line: comment.relativeLine,
            content: this.lines[comment.relativeLine]
          }

          return comment
        })
      }

      isCommentInline (line, commentRange) {
        let lineIndex = this.getLineIndexRange(line)[line]

        return commentRange[0] > lineIndex[0] && commentRange[1] <= lineIndex[1]
      }

      get relativePath () {
        return this.PRIVATE.filepath.replace(this.root, './').replace(/\/+/gi, '/')
      }
    }

    this.LocalFile = LocalFile
  }

  get data () {
    let data = {
      // globals: this.DATA.globals,
      classes: this.expand(this.DATA.classes),
      exceptions: DOC.Class.prototype.mapToObject(this.DATA.exceptions),
      // requires: Array.from(this.DATA.requires),
      bus: DOC.Class.prototype.mapToObject(this.DATA.bus),
      namespaces: this.expand(this.DATA.namespaces)
    }

    return data
  }

  expand (map) {
    let data = {}

    map.forEach((value, key) => {
      data[key] = value instanceof DOC.RawSnippet ? value.data : value
    })

    return data
  }

  before () {
    this.ignoreFile(path.join(this.source, '../..', '.buildignore'))
    this.ignoreFile(path.join(this.source, '../..', '.gitignore'))
  }

  parseFile (file, processorFn) {
    LAST_ENTITY = null

    let sourcefile = new this.LocalFile(file, this.source)
    let ast = Parser.parse(sourcefile.content, this.STANDARD_OPTIONS)

    // Recognize custom exceptions/errors
    let fullFile = new DOC.RawSnippet(ast, sourcefile)

    fullFile.on('register.exception', () => console.log('Exception recognized.'))
    fullFile.detectExceptions()

    const me = this
    const snippets = []

    // Traverse the AST and identify elements.
    traverse(ast).forEach(function () {
      try {
        if (this.isLeaf) {
          if (this.key === 'type') {
            switch (this.node.toLowerCase()) {
              case 'classdeclaration':
                let Class = new DOC.Class(this.parent.node, sourcefile)

                if (!me.DATA.classes.has(Class.label)) {
                  Class.on('warning', msg => me.emit('warning', msg))

                  snippets.push(Class)

                  if (!Class.ignore) {
                    me.emit('register.class', Class)
                  }
                } else {
                  me.emit('warning', `Duplicate class detected: ${Class.label} cannot be redefined at ${Class.sourcefile}:${Class.start.line}:${Class.start.column}`)
                }

                break

              case 'callexpression':
                if (this.parent.node.callee && this.parent.node.callee.name && this.parent.node.callee.name.toLowerCase() === 'require') {
                  if (this.parent.node.arguments.length === 1) {
                    me.DATA.requires.add(this.parent.node.arguments[0].value)
                  } else {
                    me.warn(`Invalid require statement found at ${file}:${this.parent.node.loc.start.line}:${this.parent.node.loc.start.column}`)
                  }
                }

                break
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    })

    // Process global comment tags
    try {
      sourcefile.comments.forEach(comment => {
        if (!comment.processed && comment.tags && comment.relativeLine) {
          comment.tags = comment.tags.filter(tag => {
            switch (tag.tag.toLowerCase()) {
              case 'namespace':
                let ns = new DOC.Namespace(null, sourcefile)

                ns.label = tag.value || tag.name
                ns.description = tag.description || null

                LAST_ENTITY = ns

                if (!ns.ignore) {
                  BUS.emit('register.namespace', ns)
                }

                return false

              default:
                if (LAST_ENTITY !== null) {
                  LAST_ENTITY.processOrphanComment(comment)
                }

                return true
            }
          })
        }
      })
    } catch (e) {
      console.error(e)
    }

    // Process any orphan comments within classes
    if (this.DATA.classes) {
      sourcefile.comments.forEach(comment => {
        // console.log(comment)
        if (!comment.processed && comment.tags && comment.tags.length > 0 && comment.relativeLine) {
          let commentProcessed = false
          let section
          let entries = this.DATA.classes.values()

          while (!commentProcessed && !(section = entries.next()).done) {
            let subsection = section.value.getRelevantSubsnippet(comment.start.line)

            if (subsection !== null) {
              if (subsection.type === 'class') {
                comment.tags.forEach(tag => {
                  let mapping = require('./lib/tags/map.json')
                  let name = tag.tag.toLowerCase()

                  name = mapping[name] || name

                  tag.value = tag.name

                  switch (name) {
                    case 'method':
                      let func = new DOC.Method(null, subsection.SOURCE)
                      func.applyCommentTag(tag, comment)
                      subsection.methods.set(func.label, func)
                      comment.processed = true
                      LAST_ENTITY = func
                      break

                    case 'property':
                      let prop = new DOC.Property(null, subsection.SOURCE)
                      prop.applyCommentTag(tag, comment)
                      subsection.properties.set(prop.label, prop)
                      comment.processed = true
                      break
                  }

                  if (comment.processed) {
                    this.DATA.classes.set(subsection.label, subsection)
                  }
                })
              }
            } else {
              this.emit('warning', `Failed to process comment: \n${comment.raw}\nat ${sourcefile.relativePath}:${comment.start.line}${comment.start.line !== comment.end.line ? '-' + comment.end.line : ''}\n\n`)
            }
          }
        }
      })
    }

    // Notify when a tag cannot be proceesed.
    sourcefile.comments.forEach(comment => {
      // console.log(comment)
      if (!comment.processed && comment.tags && comment.tags.length > 0 && comment.relativeLine) {
        this.warn(`Generator could not recognize associated code or does not understand how to process comment at ${sourcefile.relativePath}:${comment.start.line}${comment.start.line !== comment.end.line ? '-' + comment.end.line : ''}`)
        this.subtle(`  ${comment.raw.replace(/\n\s+\*/g, '\n   *')}`)
      }
    })
  }

  createJson () {
    this.addTask('Generate JSON', next => {
      this.walk(this.source).forEach((file, i) => {
        if (i < 27) {
          console.log('YO', file)
          try {
            this.parseFile(file)
          } catch (e) {
            console.error(e)
          }
        }
      })

      next()
    })
  }
}

const Builder = new Generator({
  commands: {
    '--generate': () => {
      if (process.argv.indexOf('--warnnocode') >= 0) {
        DOC.config.warnOnNoCode = true
      }

      if (process.argv.indexOf('--warnskippedevents') >= 0) {
        DOC.config.warnOnSkippedEvents = true
      }

      process.argv.forEach((arg, index) => {
        if (arg.trim().toLowerCase() === '--ignore') {
          let filepath = process.argv[index + 1]
          let stat = fs.statSync(process.argv[index + 1])

          if (stat.isDirectory) {
            Builder.ignorePath(filepath)
          } else if (stat.isFile) {
            Builder.ignoreFile(filepath)
          }
        }
      })

      Builder.source = process.argv[process.argv.indexOf('--source') + 1]
      Builder.output = path.join(process.cwd(), './docs')
      Builder.createJson()
      Builder.on('complete', () => {
        require('fs').writeFileSync(path.resolve('./test.json'), JSON.stringify(Builder.data, null, 2))

        DOC.audit.forEach(log => Builder.failure(log))
      })
    }
  }
})

process.on('uncaughtException', e => console.log(e))

Builder.run()
