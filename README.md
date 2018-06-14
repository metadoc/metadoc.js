# Documentation

This generator produces documentation _metadata_. Instead of producing HTML, it produces JSON that can be used as a data source for generating HTML documentation (or any other output format).

... Fill me in with detail about running generator ...


# Documenting Code

The code will be automatically documented based on the JavaScript AST (Abstract Syntax Tree). However; this doesn't always reflect the true nature of how a library should be used. To accommodate customizations, the generator parses comments within the code, allowing developers to override the AST documentation with custom comment blocks.

### Documenting Events

NGN ships with an EventEmitter class (works with Node.js `events.EventEmitter`).

The following syntax provides a powerful way to generate event documentation overrides:

```js
/**
 * @fires {<arg1_name>:<arg1_type>} <event_name>
 * <description>
 */
```

- **@fires** is the tag. This is required.
- `<arg_name>` is the _optional_ descriptive name of a callback argument passed to an event handler.
- `<arg_type>` is the data type of the argument passed to an event handler.
- `<event_name>` is the name of the the event that gets fired.
- `<description>`

*Example:*

1. Basic Event

```js
/**
 * @fires {Object} myEvent
 * myEvent is fired from time to time.
 */

this.on('myEvent', function (obj) {
  console.log(obj) // Outputs { data: 'abc' }
})

this.emit('myEvent', { data: 'abc' })
```

This event is called "myEvent", and it sends an object to event handlers.

2. Basic Event: Named Arguments

```js
/**
 * @fires {myName:Object} myEvent
 * myEvent is fired from time to time.
 */

this.on('myEvent', function (obj) {
  console.log(obj) // Outputs { data: 'abc' }
})

this.emit('myEvent', { data: 'abc' })
```

This is the exact same event as the basic event in #1, but the `@fires {myName:Object}` will produce a label called "myName", which represents `{ data: 'abc' }` (payload), a known `Object`.

3. Complex Event: Multiple Callback Arguments



```js
/**
 * @fires {Object,String} myEvent
 * myEvent is fired from time to time.
 */

this.on('myEvent', function (obj, label) {
  console.log(obj) // Outputs { data: 'abc' }
  console.log(label) // Outputs 'event fired'
})

this.emit('myEvent', { data: 'abc' }, 'event fired')
```

The major difference is the comma separated data types (`{Object,String}`), which tells the documentation generator that the event will send _two_ arguments to event handlers. The first is an `Object` and the second is `String`.

**It is possible to document multiple _name:type_ callback arguments by separating with a comma.**

`@fires {a:Object,b:String}` would generate a label called `a` for the `Object` argument and a label called `b` for the `String` object.

It is also possible for an argument to have more than one valid data type by separating types with the pipe `|` character. For example, `@fires {a:Object|Boolean,b:String}` states that the first argument (labeled `a`) can be an `Object` or `Boolean` value.
