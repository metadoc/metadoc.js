const test = require('tap').test
const path = require('path')
const fs = require('fs')
const exec = require('child_process').execSync
const source = path.join(__dirname, 'source')
const output = path.join(__dirname, 'output')
const outputFile = path.join(output, 'api.json')

test('Generate Docs', t => {
  let result = exec(`node "${path.join(__dirname, '../cli.js')}" --source "${source}" --output "${output}"`).toString()

  console.log(`------------\n   OUTPUT\n------------\n${result}\n------------\n\n\n`)

  try {
    fs.accessSync(outputFile)
    t.pass('JSON generated.')
  } catch (e) {
    t.fail('JSON not generated or could not be found.')
  }

  let data = {}

  try {
    data = require(outputFile)
  } catch (e) {
    t.fail('Invalid output format (not JSON).')
  }

  if (Object.keys(data).length === 0) {
    t.fail('No file content generated.')
  } else {

  }

  t.end()
})

test('Output Integrity', t => {
  const data = require(outputFile)

  let classCount = require('fs').readdirSync(path.join(__dirname, 'source')).length - 2 // accounts for namespace & comments file.

  t.ok(data.classes, 'Class documentation exists.')
  t.ok(Object.keys(data.classes).length === classCount, 'Correct number of classes documented.')

  t.end()
})
