/**
 * @class Meetup
 * Contains detail about a meetup.
 * @fires generated
 * This is a dummy event.
 */
class Meetup extends Event {
  constructor (cfg = {}) {
    super(cfg)

    this.description = 'A meetup.com event.'
    this.url = null

    /**
     * @cfg {String|Array} [organizer]
     * The organizer of a meetup.
     */
    this.organizer = cfg.organizer || []
  }

  set url (value) {
    if (value.startsWith('http')) {
      this.url = value
    } else {
      throw new Error('Invalid URL')
    }
  }

  /**
   * Open the
   * @param {string} URI
   * The URL of the meetup.
   */
  display (uri = null) {
    document.location = uri || this.url
  }
}
