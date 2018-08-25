/**
 * @namespace TEST.NS
 * This is a constructed namespace.
 */
Object.defineProperty({TEST: {}}, 'NS', {
  enumerable: true,
  writable: true,
  configurable: false,
  value: Object.defineProperties({}, {
    fn: {
      enumerable: true,
      value: function () {}
    },
    attr: {
      enumerable: true,
      get () {
        return 'attribute'
      }
    }
  })
})

/**
 * @namespace DERIVED
 * This is a fabricated namespace.
 */
