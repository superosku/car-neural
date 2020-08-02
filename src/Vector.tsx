import {canvasHeight, canvasWidth} from "./Constants";

export class Vector {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  clone() {
    return new Vector(this.x, this.y)
  }

  add(other: Vector) {
    return new Vector(this.x + other.x, this.y + other.y)
  }

  det(other: Vector) {
    return this.x * other.y - this.y * other.x
  }

  abs() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  rotate(angle: number) {
    return new Vector(
      this.x * Math.cos(angle) - this.y * Math.sin(angle),
      this.x * Math.sin(angle) + this.y * Math.cos(angle)
    )
  }

  multiply(value: number) {
    return new Vector(
      this.x * value,
      this.y * value,
    )
  }
}

export class Camera extends Vector {
  cameraCorrect(position: Vector) {
    const correctionVector = this.multiply(-1).add(new Vector(canvasWidth / 2, canvasHeight / 2))
    return position.add(correctionVector)
  }
}
