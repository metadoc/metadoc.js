/**
 * Represents a generic event.
 */
class Event {
  constructor (cfg = {}) {
    this.date = new Date()
    this.attendees = new Set()

    /**
     * @cfg {string} [location]
     * The location of the event.
     */
    this.location = cfg.location || null

    // This wouldn't actually work unless this class extended NGN.EventEmitter or some other event emitter.
    this.emit('created')
  }

  /**
   * @property {number} attendeeCount
   * The number of attendees present.
   */
  get attendeeCount () {
    return this.attendees.length
  }

  /**
   * @param {Number} digit
   * This is a test
   */
  addAttendee (name) {
    this.attendees.add(name)
  }

  removeAttendee (name) {
    this.attendees.delete(name)
  }
}
