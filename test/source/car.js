/**
 * @class Vehicle.car
 * An automobile
 * @extends Vehicle.Base
 */
class Car extends VehicleBase {
  constructor () {
    super(...arguments)

    this.name = 'Car'
    this.wheels = 4
    this.doors = 2
  }
}
