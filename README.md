# NGN Metadoc

Metadoc generates documentation _metadata_ for Object Oriented (Class) JavaScript libraries. Running the utility will produce a JSON file describing the code. This can be used as a data source for creating custom HTML documentation (or any other output format), or for further processing.

Metadoc was designed as command line utility, but can also be used programmatically. It is a custom extension of the [productionline](https://github.com/coreybutler/productionline) build utility (from the same authors of this tool). It was originally designed to document the [NGN](https://github.com/ngnjs) and [Chassis](https://github.com/ngn-chassis) libraries.

## Workflow

Metadoc was designed to support a "code and comment" workflow. It will parse JavaScript code and extract as much metadata as possible from the code's [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree).

AST parsing creates a significant amount of information, but isn't always sufficient for creating detailed documentation, such as class inheritance chains.

To support greater detail, Metadoc reads inline comment blocks, written directly in the code. Comments can be used to supplement and/or override AST parsing. Comment parsing follows a style similar to JSDoc. Using a familiar `@tag` syntax, Metadoc provides powerful capabilities for creating fine detail in documentation.

### Example

**Input Files: Event.js & Meetup.js**

![Source Files](https://github.com/ngnjs/documentation-metadata-generator/raw/master/images/input.png)

**Output: api.json**

![Output File](https://github.com/ngnjs/documentation-metadata-generator/raw/master/images/output.png)

## Getting Started

```js
// Install metadoc
npm install -g @author.io/metadoc

// Run metadoc
metadoc --source "/path/to/source_directory" --output "/path/to/output_directory"
```

If you want to use metadoc programatically (i.e. `require('@author.io/metadoc')`), take a look at the [cli.js](https://github.com/author/metadoc/blob/master/cli.js#L4) file as an example (which includes the metadoc generator). The metadoc generator is an extension of [productionline](https://github.com/coreybutler/productionline).

### Ignoring Files

It is possible to ignore files and/or directories using [glob](https://www.npmjs.com/package/glob#glob-primer) syntax.

For example:

- `--ignore "./node_modules"` ignores the entire `node_modules` directory.
- `--ignore /path/to/**/.*` ignores all files in any directory whose name starts with an dot (ex: `.testfile.js`).

It is possible to use the `--ignore` flag multiple times.

### Warnings

Metadoc is capable of warning developers about some common code issues/concerns:

- `--warnOnNoCode` triggers a warning whenever a code comment triggers an action for which no related code can be found. This is most useful for identifying comments that shouldn't actually be in the code base.

- `--warnOnSkippedEvents` triggers a warning whenever an event is detected but not documented. This is most commonly used to identify events that are considered "internal" to a class.

- `--warnOnSkippedTags` triggers a warning whenever a tag is skipped. This is the default behavior, but this tag will allow this feature to be turned off (i.e. `--warnOnSkippedTags false`)

- `--errorOnCommentFailure` throws an error when a comment cannot be processed. This is the default behavior, but this tag will allow this feature to be turned off (i.e. `--errorOnCommentFailure false`)

---

# Documenting Code

The code will be automatically documented based on the JavaScript AST (Abstract Syntax Tree). However; this doesn't always reflect the true nature of how a library should be used. To accommodate customizations, the generator parses comments within the code, allowing developers to override the AST documentation with custom comment blocks.

## Comment Tags

Tags can be used to modify documentation snippets. Tags use the following format unless otherwise defined:

```js
/**
 * @tag {[type]} <name>
 * <description>
 */
```

The following tags are available:

### @author

Identifies a specific person/organization recognized as the author of a snippet of code.

### @cfg

Identifies a write-only configuration property.

Aliases: `config`, `configuration`

### @cfgproperty

Identifies a configuration property (write-only) that also has a corresponding readable/writable property.

### @class

Identifies a class.

### @constructor

Marks a method as the constructor of a class.

### @exception

Identifies a custom NGN Exception.

### @extends

Identifies which class is being extended.

### @fires

Identifies an event. See "Documenting Events" below for additional detail.

Aliases: `triggers`, `trigger`, `event`

### @hidden

Indicates the section should be included in the documentation but hidden from view. This differs from the @ignore tag, which prevents the documentation from being generated at all.

### @ignore

Indicates a section should be ignored from the documentation (i.e. prevents generation of a segment of code documentation).

### @info

Maintains a series of tags with additional information.

### @method

Identifies a method.

### @namespace

Identifies a namespace. Namespaces identify class structure/hierarchy and cannot be ignored or hidden using `@ignore` or `@hidden`.

### @param

Identifies an argument/paramenter. See "Documenting Parameters" for details.

Aliases: `arg`, `argument`, `parameter`

### @private

Indicates the snippet is private/not explicitly accessible as a developer interface (internal).

### @property

Identifies a property of a class.

Aliases: `prop`

### @readonly

Indicates a snippet is read-only. This applies to properties.

### @return

Identifies the data returned by a method.

Aliases: `returns`

### @todo

This is a special tag that annotates the documentation with a known task that requires completion (a developer to-do task).

Format: `@todo Describe the task here`

### @writeonly

Indicates a property is only writable.

## Flags

In addition to tags, there are a number of recognized flags that can be used to annotate a documentation snippet.

- `@protected` Identifies a protected method/attribute.
- `@deprecated` Indicates the feature will no longer be available in a future version.
- `@experimental` Indicates the feature is not considered "production ready".
- `@warning` Provides a warning message.
- `@hidden` Indicates the feature should be hidden but not removed from the documentation.
- `@singleton` Indicates a class is a singleton.
- `@interface` Indicates a class is an interface.
- `@static` Indicates a method is static.
- `@since`* Identifies the version and/or date when the feature is generally available. This is typically used to identify new features that have been added to the original platform.

It is also possible to create a custom flag using `@flag <flag_name>`.

---

## Documenting Parameters

While parameters (function arguments) in JavaScript can have default values, there are still several cases where it is necessary to provide greater detail about parameters. For example, some methods only accept a parameter value from a predetermined set (enumeration).

Parameters can be documented with additional detail using the following format:

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

The example above describes a string parameter named `myParameter`. Acceptable (enumerable) values are `example`, `a`, and `b`. The default value is `example`. The description is `This is an example parameter.`.

### Documenting Callback Parameters

Callback functions are a unique type of parameter. These parameters may have their own arguments/parameters. Metadoc supports them using a dot notation syntax:

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

Metadoc was built to document the [NGN](https://github.com/ngnjs) and [Chassis](https://github.com/ngn-chassis) libraries. NGN ships with an event emitter class (works with Node.js `events.EventEmitter`). This class is commonly extended, meaning many classes within the library fire events. As a result, metadoc supports documenting the most common event emitter styles, plus those found in NGN.

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

# Post Processors

- [metadoc-md](https://github.com/author/metadoc-md): Convert markdown, mermaid, and mathjax descriptions to HTML.
- [metadoc-api](https://github.com/author/metadoc-api): Generate a static JSON API (splits metadoc up into individual JSON files for serving over HTTP).
