const RE = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g

module.exports = code => {
  let comments = []

  while ((match = RE.exec(code)) !== null) {
    for (let i = 1; i <= 5; i++) {
      if (match[i] !== undefined) {
        let data = {
          comment: match[i],
          range: [match.index, match.index + match[i].length - (match[i].indexOf('\n') >= 0 ? 0 : 1)]
        }

        comments.push(data)

        break
      }
    }
  }

  return comments
}
