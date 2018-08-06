# Documentation

This generator produces documentation _metadata_. Instead of producing HTML, it produces JSON that can be used as a data source for generating HTML documentation (or any other output format).

... Fill me in with detail about running generator ...


# Documenting Code

The code will be automatically documented based on the JavaScript AST (Abstract Syntax Tree). However; this doesn't always reflect the true nature of how a library should be used. To accommodate customizations, the generator parses comments within the code, allowing developers to override the AST documentation with custom comment blocks.

---

## Available Tags

Tags can be used to modify documentation snippets. Tags use the following format unless otherwise defined:

```js
/**
 * @tag {[type]} <name>
 * <description>
 */
```

The following tags are available:

### author

Identifies a specific person/organization recognized as the author of a snippet of code.

### cfg

Identifies a write-only configuration property.

Aliases: `config`, `configuration`

### cfgproperty

Identifies a configuration property (write-only) that also has a corresponding readable/writable property.

### class

Identifies a class.

### constructor

Marks a method as the constructor of a class.

### exception

Identifies a custom NGN Exception.

### extends

Identifies which class is being extended.

### fires

Identifies an event. See "Documenting Events" below for additional detail.

Aliases: `triggers`, `trigger`, `event`

### ignore

Indicates a section should be ignored from the documentation (i.e. prevents generation of a segment of code documentation).

### info

Maintains a series of tags with additional information.

### method

Identifies a method.

### param

Identifies an argument/paramenter. See "Documenting Parameters" for details.

Aliases: `arg`, `argument`, `parameter`

### private

Indicates the snippet is private/not explicitly accessible as a developer interface (internal).

### property

Identifies a property of a class.

Aliases: `prop`

### readonly

Indicates a snippet is read-only. This applies to properties.

### return

Identifies the data returned by a method.

Aliases: `returns`

### todo

This is a special tag that annotates the documentation with a known task that requires completion (a developer to-do task).

Format: `@todo Describe the task here`

### writeonly

Indicates a property is only writable.

---

## Flags

In addition to tags, there are a number of recognized flags that can be used to annotate a documentation snippet.

- `protected` Identifies a protected method/attribute.
- * `deprecated` Indicates the feature will no longer be available in a future version.
- * `experimental` Indicates the feature is not considered "production ready".
- `warning` Provides a warning message.
- `hidden` Indicates the feature should be hidden but not removed from the documentation.
- `singleton` Indicates a class is a singleton.
- `interface` Indicates a class is an interface.
- `static` Indicates a method is static.
- `since`* Identifies the version and/or date when the feature is generally available. This is typically used to identify new features that have been added to the original platform.

---

## Documenting Parameters

While parameters (arguments) in JavaScript functions can have default values, there are still several cases where it is necessary to override the default parameter documentation. Most specifically, enumeration. Some methods only accept a value from a predetermined set.

Parameters can be documented with additonal detail using the following format:

```js
/**
 * @param {type} [<parameter_name>=<default>] (<enumerable_list)
 * <description>
 */
```

The `type` indicates the data type, while the `[` and `]` indicate the parameter is optional. A default value may be supplied, as well as a description.

For example:

```js
/**
 * @param {String} [myParameter=example] (example,a,b)
 * This is an example parameter.
 */
```

The example above describes a string parameter named `myParameter`. Acceptable values are `example`, `a`, and `b`. The default value is `example`. The description is `This is an example parameter.`.

### Documenting Callback Parameters

Callback functions are a unique type of parameter. These parameters may have their own arguments/parameters. This generator supports them using a dot notation syntax:

```js
/**
  * @param {function} callback
  * This is an example callback.
  * @param {boolean} callback.a
  * The first element is a.
  * @param {string} callback.b (possible,values)
  * The next element is b.
 */
```

The comment above indicates a parameter is a callback method that receives two arguments: `a` and `b`. The first argument (`a`) is a `boolean` value. The second (`b`) is a `string` whose value will be either `possible` or `values`.

## Documenting Events

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
