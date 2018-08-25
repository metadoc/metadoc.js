/**
 * @class Vehicle.Base
 */
class VehicleBase {
  constructor () {
    this.name = 'Unknown'
    this.color = 'uncolored'
    this.wheels = 0
    this.doors = 0

    Object.defineProperty(this, 'SPEED', {
      enumerable: false,
      writable: true,
      configurable: false,
      value: 0
    })
  }

  get currentSpeed () {
    return this.SPEED
  }

  accelerate () {
    this.SPEED = this.SPEED * 1.1
  }

  brake () {
    this.SPEED = this.SPEED * 0.9

    if (this.SPEED < 1) {
      this.SPEED = 0
    }
  }
}
