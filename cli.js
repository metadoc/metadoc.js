#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const Generator = require('./generator')

process.on('uncaughtException', e => console.log(e))

const Builder = new Generator({
  warnOnNoCode: process.argv.indexOf('--warnnocode') >= 0,
  warnOnSkippedEvents: process.argv.indexOf('--warnskippedevents') >= 0,
  commands: {
    default () {
      process.argv.forEach((arg, index) => {
        if (arg.trim().toLowerCase() === '--ignore') {
          let filepath = process.argv[index + 1]
          let filepathExists = true

          try {
            fs.accessSync(filepath, fs.R_OK)
            let stat = fs.statSync(process.argv[index + 1])

            if (stat.isDirectory) {
              Builder.ignorePath(filepath)
            } else if (stat.isFile) {
              Builder.ignoreFile(filepath)
            }
          } catch (e) {}
        }
      })

      Builder.source = process.argv[process.argv.indexOf('--source') + 1]

      if (process.argv.indexOf('--output')) {
        Builder.output = process.argv[process.argv.indexOf('--output') + 1]
      } else {
        Builder.output = path.join(process.cwd(), './docs')
      }

      Builder.clean()
      Builder.createJson()
      Builder.structureJson()

      Builder.on('complete', () => {
        fs.writeFileSync(path.join(Builder.output, 'api.json'), JSON.stringify(Builder.data, null, 2))
        Builder.audit.forEach(log => Builder.failure(log))
        Builder.highlight(`  Processed ${Builder.filecount} file${Builder.filecount === 1 ? '' : 's'}.\n`)
      })
    }
  }
})

Builder.run()
