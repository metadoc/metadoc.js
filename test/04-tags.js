const test = require('tap').test
const path = require('path')
const outputFile = path.join(__dirname, 'output', 'api.json')
const data = require(outputFile)

test('Global Types', t => {
  t.ok(data.hasOwnProperty('types'), 'Contains custom type definition attribute.')
  t.ok(Object.keys(data.types).length > 0, 'Contains at least one type definition.')
  t.end()
})

test('@type/@typedef', t => {
  const types = data.types

  t.ok(types.hasOwnProperty('ExampleType'), 'Recognizes custom type definition.')
  t.ok(Array.isArray(types.ExampleType.type), 'Types is a valid array')
  t.ok(types.ExampleType.type[0] === 'Array', 'Recognizes appropriate data type.')
  t.ok(types.ExampleType.description === 'This is an example type.', 'Recognizes custom type description.')
  t.ok(types.ExampleType.hasOwnProperty('enum'), 'Recognizes enumerability.')
  t.ok(types.ExampleType.enum.indexOf('a') === 0 && types.ExampleType.enum.indexOf('b') === 1 && types.ExampleType.enum.indexOf('c') === 2 && types.ExampleType.enum.indexOf('1') === 3, 'Recognizes enumerable value set.')
  t.end()
})
