const test = require('tap').test
const path = require('path')
const outputFile = path.join(__dirname, 'output', 'api.json')
const data = require(outputFile)

test('Basic Class Structure', t => {
  let BaseClass = data.classes.Event

  t.ok(BaseClass.type === 'class', 'Identifies class type.')
  t.ok(BaseClass.label === 'Event', 'Identifies class name.')
  t.ok(BaseClass.description === 'Represents a generic event.', 'Identifies comment description.')
  t.ok(path.basename(BaseClass.sourcefile) === 'event.js', 'Identifies source file.')
  t.ok(BaseClass.code !== '', 'Source code identified.')
  t.ok(Object.keys(BaseClass.properties).length === 3, 'Identified correct number of properties.')
  t.ok(BaseClass.methods.hasOwnProperty('constructor'), 'Constructor method exists.')

  t.ok(
    BaseClass.properties.hasOwnProperty('date') &&
    BaseClass.properties.hasOwnProperty('attendees') &&
    BaseClass.properties.hasOwnProperty('attendeeCount'),
    'Identified basic properties.'
  )

  t.ok(Object.keys(BaseClass.methods.length === 3), 'Identified methods')

  t.ok(
    BaseClass.methods.hasOwnProperty('addAttendee') &&
    BaseClass.methods.hasOwnProperty('removeAttendee'),
    'Identified basic methods.'
  )

  t.end()
})

test('Extended Class Structure', t => {
  let BaseClass = data.classes.Meetup

  t.ok(BaseClass.extends === 'Event', 'Identifies base class (super).')
  t.ok(path.basename(BaseClass.sourcefile) === 'meetup.js', 'Identifies source file.')
  t.ok(
    BaseClass.methods.hasOwnProperty('addAttendee') &&
    BaseClass.methods.hasOwnProperty('removeAttendee'),
    'Identified super (inherited) methods.'
  )
  t.ok(BaseClass.methods.hasOwnProperty('display'), 'Identified standard methods.')

  t.ok(
    BaseClass.properties.hasOwnProperty('date') &&
    BaseClass.properties.hasOwnProperty('attendees') &&
    BaseClass.properties.hasOwnProperty('attendeeCount'),
    'Identified super (inherited) properties.'
  )

  t.ok(
    BaseClass.properties.hasOwnProperty('description') &&
    BaseClass.properties.hasOwnProperty('url'),
    'Identified standard properties.'
  )

  t.end()
})
