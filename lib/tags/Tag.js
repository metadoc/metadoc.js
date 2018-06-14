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
  constructor (data, snippet, node, sourcefile) {
    Object.defineProperties(this, {
      value: Public(data.name),
      required: Public(!data.optional),
      type: Public(data.type),
      description: Public(data.description),
      line: Public(data.line),
      raw: Public(data.source),
      node: Private(node),
      sourcefile: Private(sourcefile),
      snippet: Private(snippet)
    })
  }

  get data () {
    return {
      value: this.value,
      required: this.required,
      type: this.type,
      description: this.description,
      line: this.line,
      raw: this.raw
    }
  }
}

module.exports = Tag
