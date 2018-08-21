/**
 * Represents a generic event.
 */
class Event {
  constructor () {
    this.date = new Date()
    this.attendees = new Set()
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
