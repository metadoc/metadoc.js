// Base class for tag identification.
const Public = (value = null) => {
  return {
    enumerable: true,
    writable: true,
    configurable: false,
    value
  }
}

const Private = (value = null) => {
  return {
    enumerable: false,
    writable: true,
    configurable: false,
    value
  }
}

class Tag {
  constructor (data, snippet, node, sourcefile, originalComment) {
    Object.defineProperties(this, {
      originalComment: Private(originalComment),
      value: Public(data.name),
      required: Public(!data.optional),
      type: Public(data.type),
      description: Public(data.description),
      line: Public(data.line),
      raw: Public(data.source),
      node: Private(node),
      sourcefile: Private(sourcefile),
      snippet: Private(snippet),
      options: Public(data.options),
      default: Public(data.default),
      tag: Private(data.tag)
    })
  }

  get parent () {
    return this.PARENT
  }

  get data () {
    return {
      value: this.value,
      required: this.required,
      type: this.type,
      description: this.description,
      line: this.line,
      raw: this.raw,
      options: this.options,
      default: this.default
    }
  }
}

module.exports = Tag
