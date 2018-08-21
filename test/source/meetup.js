/**
 * @class Meetup
 * Contains detail about a meetup.
 */
class Meetup extends Event {
  constructor () {
    this.description = 'A meetup.com event.'
    this.url = null
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
