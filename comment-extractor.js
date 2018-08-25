const RE = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g // eslint-disable-line

module.exports = code => {
  let match
  let comments = []

  while ((match = RE.exec(code)) !== null) {
    for (let i = 1; i <= 5; i++) {
      if (match[i] !== undefined) {
        let data = {
          comment: match[i],
          range: [match.index, match.index + match[i].length - (match[i].indexOf('\n') >= 0 && match.input.substr(match.input.length - 1, 1) !== '\n' ? 0 : 1)]
        }

        comments.push(data)

        break
      }
    }
  }

  return comments
}
