const path = require('path')
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
  Namespace: require('./lib/Namespace'),
  Class: require('./lib/Class'),
  Exception: require('./lib/NGNException'),
  Event: require('./lib/Event'),
  Method: require('./lib/Method'),
  Parameter: require('./lib/Parameter'),
  Property: require('./lib/Property'),
  RawSnippet: require('./lib/Snippet'),
  TypeDefinition: require('./lib/TypeDefinition')
})

// Create a last known tag
global.LAST_ENTITY = null

class Generator extends ProductionLine {
  constructor (cfg = {}) {
    // Remove assets (since there aren't any)
    cfg.assets = []

    // Override standard source
    cfg.source = path.resolve('./src')

    super(cfg)

    this.filecount = 0

    this.DATA = {
      globals: [],
      requires: new Set(),
      classes: new Map(),
      exceptions: new Map(),
      bus: new Map(), // NGN.BUS events
      namespaces: new Map(),
      types: new Map() // Type Definitions
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

    Object.defineProperties(this, {
      warnOnNoCode: {
        enumerable: false,
        value: cfg.hasOwnProperty('warnOnNoCode') ? cfg.warnOnNoCode : false
      },
      warnOnSkippedEvents: {
        enumerable: false,
        value: cfg.hasOwnProperty('warnOnSkippedEvents') ? cfg.warnOnSkippedEvents : false
      },
      errorOnCommentFailure: {
        enumerable: false,
        value: cfg.hasOwnProperty('errorOnCommentFailure') ? cfg.errorOnCommentFailure : true
      },
      warnOnSkippedTags: {
        enumerable: false,
        value: cfg.hasOwnProperty('warnOnSkippedTags') ? cfg.warnOnSkippedTags : true
      },
      audit: {
        enumerable: false,
        value: new Set()
      }
    })

    const DISPLAY_WARNING = msg => {
      if (msg.toLowerCase().indexOf('no source code found for') === 0) {
        if (this.warnOnNoCode) {
          this.verysubtle(`     ${msg}`)
        }
      } else if (msg.toLowerCase().indexOf('failed') >= 0) {
        if (this.errorOnCommentFailure) {
          this.audit.add(`     ${msg}`)
        }
      } else if (msg.toLowerCase().indexOf('unrecognized/private event emitter') >= 0) {
        if (this.warnOnSkippedEvents) {
          this.warn(`     ${msg}`)
        }
      } else if (msg.toLowerCase().indexOf('arguments cannot be assigned') >= 0) {
        if (this.warnOnSkippedTags) {
          this.warn(`     ${msg}`)
        }
      } else {
        this.warn(`     ${msg}`)
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

    BUS.on('register.namespace', namespace => this.addNamespace(namespace, this.DATA, namespace.NODE, namespace.SOURCE))

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

    // Recognize custom types
    BUS.on('register.type', definition => {
      if (definition instanceof DOC.TypeDefinition) {
        this.DATA.types.set(definition.label.toLowerCase(), definition.data)
        return
      }

      const name = definition.name
      delete definition.name
      definition.label = name

      this.DATA.types.set(name.toLowerCase(), definition)
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
            },
            get sourcefile () {
              return me.relativePath
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

  addNamespace (namespace, parent = null, node = null, source = null) {
    parent = parent || this.DATA

    // Process a namespace class
    if (namespace instanceof DOC.Namespace) {
      let scope = namespace.label.split('.')

      // Non-nested namespace
      if (scope.length === 1) {
        parent.namespaces.set(namespace.label, namespace)
        return namespace
      }

      // Nested namespace
      let name = scope.pop()
      parent = this.addNamespace(scope.join('.'), parent, node, source)
      parent.label = name

      return parent
    }

    // Process a text-only namespace identification
    if (typeof namespace !== 'string') {
      throw new Error(`Cannot create a namespace for a ${typeof namespace} variable. Use a string or Namespace object to identify a namespace.`)
    }

    let existing = this.getNamespace(namespace)

    if (existing) {
      return existing
    }

    let chain = []

    namespace.split('.').forEach(ns => {
      chain.push(ns)

      let current = this.getNamespace(chain.join('.'))

      if (current) {
        parent = current
      } else {
        let nestedNamespace = new DOC.Namespace(node, source)

        nestedNamespace.label = ns

        parent.namespaces.set(nestedNamespace.label, nestedNamespace)

        parent = nestedNamespace
      }
    })

    return parent
  }

  getNamespace (nspath) {
    let ns = this.DATA
    let scope = nspath.split('.')

    while (scope.length > 0) {
      let name = scope.shift()

      if (ns.namespaces.has(name)) {
        ns = ns.namespaces.get(name)
      } else {
        return null
      }
    }

    return ns instanceof DOC.Namespace ? ns : null
  }

  namespaceClass (Class) {
    let scope = Class.label.split('.')

    if (scope.length === 1) {
      scope.unshift('global')
    }

    scope.pop()

    let ns = this.getNamespace(scope.join('.'))

    if (!ns) {
      this.addNamespace(scope.join('.'))
      ns = this.getNamespace(scope.join('.'))
    }

    ns.addClass(Class.label)
  }

  addTypeDefinition (name, node = null, source = null) {
    let existing = this.getTypeDefinition(name)

    if (existing) {
      return existing
    }

    let def = new DOC.TypeDefinition(node, source)
    def.label = name

    BUS.emit('register.type', def)

    return def
  }

  getTypeDefinition (name) {
    return this.DATA.types.get(name)
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
    this.filecount++

    LAST_ENTITY = null // eslint-disable-line no-global-assign

    let sourcefile = new this.LocalFile(file, this.source)
    let ast = Parser.parse(sourcefile.content, this.STANDARD_OPTIONS)

    // Recognize custom exceptions/errors
    let fullFile = new DOC.RawSnippet(ast, sourcefile)

    fullFile.on('register.exception', () => console.log('Exception recognized.'))
    fullFile.detectExceptions()

    const me = this
    const snippets = []

    // Traverse the AST and identify elements.
    // Looking for classes and NGN-specific methods.
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

              // case 'identifier':
              //   if (this.parent.node.name === 'NGN') {
              //     // console.log(this.parent.parent.node)
              //   }
              //
              //   break
              //
              // case 'objectexpression':
              //   console.log(this.parent.node.properties)
              //   break
              //
              // default:
                // console.log(this.node.toLowerCase())
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    })

    // Process global comment tags
    try {
      let tagmap = require('./lib/tags/map.json')
      sourcefile.comments.forEach(comment => {
        if (!comment.processed && comment.tags && comment.relativeLine) {
          let def = comment.tags.filter(tag => tag.tag.toLowerCase() === 'typedef' || tagmap[tag.tag.toLowerCase()] === 'typedef').length > 0

          if (def) {
            comment.tags.filter(tag => {
              if (tag.tag.toLowerCase() === 'typedef' || tagmap[tag.tag.toLowerCase()] === 'typedef') {
                def = this.addTypeDefinition(tag.value || tag.name, null, sourcefile)

                def.description = tag.description || null

                return false
              }

              return true
            }).forEach(tag => def.processOrphanComment(comment))

            comment.tags = []
          } else {
            comment.tags = comment.tags.filter((tag, i) => {
              switch (tag.tag.toLowerCase()) {
                case 'namespace':
                  let ns = this.addNamespace(tag.value || tag.name, null, null, sourcefile)

                  ns.description = tag.description || null

                  LAST_ENTITY = ns

                  return false

                default:
                  if (LAST_ENTITY !== null) {
                    LAST_ENTITY.processOrphanComment(comment)
                  }

                  return false
              }
            })
          }
        }
      })
    } catch (e) {
      console.error(e)
    }

    // Process any orphan comments within classes
    if (this.DATA.classes) {
      sourcefile.comments.forEach(comment => {
        if (!comment.processed && comment.tags && comment.tags.length > 0 && comment.relativeLine) {
          let section
          let entries = this.DATA.classes.values()

          while (!comment.processed && !(section = entries.next()).done) {
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
                      LAST_ENTITY = func // eslint-disable-line no-global-assign
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
            } else if (section.value.sourcefile === comment.sourcefile) {
              this.emit('warning', `Failed to process comment at ${sourcefile.relativePath}:${comment.start.line}${comment.start.line !== comment.end.line ? '-' + comment.end.line : ''}:\n(Could not find relevant snippet)\n${comment.raw}\n\n`)
            }
          }
        }
      })
    }

    // Notify when a tag cannot be proceesed.
    let mapping = require('./lib/tags/map.json')

    sourcefile.comments.forEach(comment => {
      // Test comments for tags representing independent entities (like type definitions)
      if (comment.tags && comment.tags.length > 0) {
        comment.tags.forEach(tag => {
          let name = tag.tag.toLowerCase()

          name = mapping[name] || name

          try {
            let TagProcessor = require(require('path').join(__dirname, `./lib/tags/${name}.js`))
            let Representation = new TagProcessor(tag, null, null, sourcefile) // eslint-disable-line no-unused-vars
            comment.processed = true
          } catch (e) {}
        })
      }

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
        // if (i < 1) {
          this.subtle('     Processed', file.replace(this.source, ''))
          try {
            this.parseFile(file)
          } catch (e) {
            console.error(e)
          }
        // }
      })

      next()
    })
  }

  inherit (className, element) {
    let Class = this.DATA.classes.get(className)
    let items = new Map()

    if (!Class) {
      return items
    }

    items = this.inherit(Class.extends, element)

    Class[element].forEach(item => {
      if (!item.hasOwnProperty('kind') || item.kind !== 'constructor') {
        if (items.get(item.label)) {
          let override = Class[element].get(item.label)

          if (override) {
            override.override = true
          }

          (override || item).super = `${Class.extends}#${item.label}`

          items.set(item.label, (override || item))
        } else {
          item.super = `${Class.label}#${item.label}`
          items.set(item.label, item)
        }
      }
    })

    return items
  }

  structureJson () {
    this.addTask('Expand Classes', next => {
      setTimeout(() => {
        this.DATA.classes.forEach(Class => {
          if (Class.extends !== null) {
            // Inherit/override methods
            this.inherit(Class.extends, 'methods').forEach(method => {
              Class.methods.set(method.label, method)
            })

            // Inherit/override properties
            this.inherit(Class.extends, 'properties').forEach(property => {
              Class.properties.set(property.label, property)
            })

            // Inherit events
            this.inherit(Class.extends, 'events').forEach(event => {
              Class.events.set(event.label, event)
            })

            // Inherit configuration
            this.inherit(Class.extends, 'configuration').forEach(cfg => {
              Class.configuration.set(cfg.label, cfg)
            })
          }
        })

        next()
      }, 0)
    })

    this.addTask('Identify Namespaces', next => {
      this.DATA.classes.forEach(Class => {
        let ns = Class.label.split('.')
        ns.pop()

        if (ns.length > 0) {
          this.addNamespace(ns.join('.'), this.DATA)
        } else {
          this.addNamespace('global', this.DATA)
        }
      })

      next()
    })

    this.addTask('Associate Classes with Namespaces', next => {
      this.DATA.classes.forEach(Class => this.namespaceClass(Class))
      next()
    })
  }

  get data () {
    let data = {
      // globals: this.DATA.globals,
      classes: this.expand(this.DATA.classes),
      exceptions: DOC.Class.prototype.mapToObject(this.DATA.exceptions),
      // requires: Array.from(this.DATA.requires),
      bus: DOC.Class.prototype.mapToObject(this.DATA.bus),
      namespaces: this.expand(this.DATA.namespaces),
      types: this.expand(this.DATA.types)
    }

    return data
  }
}

module.exports = Generator
