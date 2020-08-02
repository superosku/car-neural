import {Camera, Vector} from "./Vector";
import {drawLine} from "./Misc";

function direction(a: Vector, b: Vector, c: Vector) {
  const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (val === 0) {
    return 'collinear'
  } else if (val < 0) {
    return 'anti-clockwise'
  }
  return 'clockwise'
}

export class Line {
  p1: Vector
  p2: Vector

  constructor(point1: Vector, point2: Vector) {
    this.p1 = point1
    this.p2 = point2
  }

  intersects(other: Line) {
    const dir1 = direction(this.p1, this.p2, other.p1);
    const dir2 = direction(this.p1, this.p2, other.p2);
    const dir3 = direction(other.p1, other.p2, this.p1);
    const dir4 = direction(other.p1, other.p2, this.p2);

    if (dir1 != dir2 && dir3 != dir4) {
      return true
    }
    return false
  }

  intersectionPoint(other: Line) {
    const xdiff = new Vector(this.p1.x - this.p2.x, other.p1.x - other.p2.x)
    const ydiff = new Vector(this.p1.y - this.p2.y, other.p1.y - other.p2.y)

    const div = xdiff.det(ydiff)

    if (div == 0) {
      return undefined
    }

    const d = new Vector(this.p1.det(this.p2), other.p1.det(other.p2))

    const x = d.det(xdiff) / div
    const y = d.det(ydiff) / div

    return new Vector(x, y)
  }


  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
    drawLine(
      ctx,
      camera.cameraCorrect(this.p1),
      camera.cameraCorrect(this.p2),
      'brown',
      2
    )
  }
}
