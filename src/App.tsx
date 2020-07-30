import React, {EffectCallback} from 'react';
import logo from './logo.svg';
import './App.css';

// TS2322: Type 'MutableRefObject<string | null>' is not assignable to type 'string | ((instance: HTMLCanvasElement | null) => void) | RefObject<HTMLCanvasElement> | null | undefined'.
//   Type 'MutableRefObject<string | null>' is not assignable to type 'RefObject<HTMLCanvasElement>'.
//     Types of property 'current' are incompatible.
//       Type 'string | null' is not assignable to type 'HTMLCanvasElement | null'.
//         Type 'string' is not assignable to type 'HTMLCanvasElement | null'.

class Vector {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
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

function direction(a: Vector, b: Vector, c: Vector) {
  const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (val === 0) {
    return 'collinear'
  } else if (val < 0) {
    return 'anti-clockwise'
  }
  return 'clockwise'
}

class Line {
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


  draw(ctx: CanvasRenderingContext2D, camera: Vector) {
    const correctedCamera = camera.multiply(-1).add(new Vector(500, 500))

    drawLine(
      ctx,
      this.p1.add(correctedCamera),
      this.p2.add(correctedCamera),
      'brown',
      2
    )
  }
}

function drawLine(ctx: CanvasRenderingContext2D, vec1: Vector, vec2: Vector, color: string = 'black', width: number = 1) {
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.moveTo(vec1.x, vec1.y)
  ctx.lineTo(vec2.x, vec2.y)
  ctx.stroke()
}

function sigmoid(value: number) {
  return 1 / (1 + Math.pow(Math.E, -value))
}

class NeuralNet {
  weights: number[][]
  layerValues: number[][]
  layerSizes: number[]

  constructor(layerSizes: number[]) {
    console.log('NeuralNet constructor')

    this.weights = []
    this.layerValues = []
    this.layerSizes = layerSizes

    for (let i = 0; i < layerSizes.length; i++) {
      this.layerValues.push(new Array(layerSizes[i]))
    }

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const newWeightLayer = new Array(layerSizes[i] * (layerSizes[i + 1] + 1))

      for (let j = 0; j < newWeightLayer.length; j++) {
        newWeightLayer[j] = Math.random() * 2 - 1 // -1 - 1
        // newWeightLayer[j] = Math.random() * 20 - 10 // -10 - 10
      }

      this.weights.push(newWeightLayer)
    }
    //
    // console.log('weihts', this.weights)
    // console.log('layerValues', this.layerValues)
  }

  setFirstLayer(values: number[]) {
    if (values.length !== this.layerValues[0].length) {
      throw new Error('Invalid input size')
    }
    for (let i = 0; i < values.length; i++) {
      this.layerValues[0][i] = values[i]
    }
  }

  forwardPropagate() {
    for (let toLayerIndex = 1; toLayerIndex < this.layerSizes.length; toLayerIndex++) {
      const fromLayerIndex = toLayerIndex - 1
      const weightArray = this.weights[fromLayerIndex]

      const fromSize = this.layerSizes[fromLayerIndex]
      const toSize = this.layerSizes[toLayerIndex]

      for (let toCellIndex = 0; toCellIndex < toSize; toCellIndex++) {
        this.layerValues[toLayerIndex][toCellIndex] = 0;

        for (let fromCellIndex = 0; fromCellIndex < fromSize; fromCellIndex++) {
          const fromInputValue = this.layerValues[fromLayerIndex][fromCellIndex]

          const weight = weightArray[(fromSize+ 1) * toCellIndex + fromCellIndex]
          this.layerValues[toLayerIndex][toCellIndex] += weight * fromInputValue
        }

        // Bias
        const weight = weightArray[(fromSize + 1) * toCellIndex + fromSize]
        this.layerValues[toLayerIndex][toCellIndex] += weight * 1

        this.layerValues[toLayerIndex][toCellIndex] = sigmoid(this.layerValues[toLayerIndex][toCellIndex]);
      }
    }
  }

  getLastLayer() {
    const lastLayerValues = this.layerValues[this.layerValues.length - 1]
    // console.log('returning values', lastLayerValues)
    return lastLayerValues
  }
}

class Car {
  position: Vector
  angle: number
  speed: number
  neuralNet: NeuralNet

  constructor(neuralNet: NeuralNet) {
    this.position = new Vector(500, 400)
    this.angle = 0
    this.speed = 0
    this.neuralNet = neuralNet
    // this.neuralNet = new NeuralNet([6, 3, 2])
  }

  afterStep() {
    const directionVector = new Vector(0, -1)
      .rotate(this.angle)
      .multiply(this.speed)

    let newCar = new Car(this.neuralNet)
    newCar.position = this.position.add(directionVector)
    newCar.angle = this.angle
    newCar.speed = this.speed

    return newCar
  }

  corners() {
    const topLeft = new Vector(-5, -10).rotate(this.angle).add(this.position)
    const topRight = new Vector(5, -10).rotate(this.angle).add(this.position)
    const bottomLeft = new Vector(-5, 10).rotate(this.angle).add(this.position)
    const bottomRight = new Vector(5, 10).rotate(this.angle).add(this.position)

    return [topLeft, topRight, bottomLeft, bottomRight]
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector) {
    const [topLeft, topRight, bottomLeft, bottomRight] = this.corners()

    const correctedCamera = camera.multiply(-1).add(new Vector(500, 500))

    drawLine(ctx, topLeft.add(correctedCamera), topRight.add(correctedCamera))
    drawLine(ctx, topRight.add(correctedCamera), bottomRight.add(correctedCamera))
    drawLine(ctx, bottomRight.add(correctedCamera), bottomLeft.add(correctedCamera))
    drawLine(ctx, bottomLeft.add(correctedCamera), topLeft.add(correctedCamera))
  }

  checkCollision(line: Line) {
    const [topLeft, topRight, bottomLeft, bottomRight] = this.corners()

    return [
      new Line(topLeft, topRight),
      new Line(topRight, bottomRight),
      new Line(bottomRight, bottomLeft),
      new Line(bottomLeft, topLeft),
    ].some((otherLine) => {
      return line.intersects(otherLine)
    })
  }

  see(ctx: CanvasRenderingContext2D, camera: Vector, borders: Line[], maxDistance: number, draw: boolean = true): number[] {
    const linesPerSide = 3

    let distances: number[] = new Array(linesPerSide * 2)

    for (let angleIndex = 0; angleIndex < linesPerSide * 2; angleIndex += 1) {
      distances[angleIndex] = maxDistance

      const angle = this.angle + 0.3 * (angleIndex + 0.5 - linesPerSide)

      const correctedCamera = camera.multiply(-1).add(new Vector(500, 500))

      const lineStartPoint = this.position
      const lineEndPoint = this.position.add(new Vector(0, -1).rotate(angle).multiply(maxDistance))
      const viewLine = new Line(lineStartPoint, lineEndPoint)

      if (draw) {
        drawLine(
          ctx,
          lineStartPoint.add(correctedCamera),
          lineEndPoint.add(correctedCamera),
          'lightgrey'
        )
      }

      for (let i = 0; i < borders.length; i++) {
        const intersects = borders[i].intersects(viewLine)
        if (intersects) {
          const intersectionPoint = borders[i].intersectionPoint(viewLine)
          if (intersectionPoint === undefined) {
            continue
          }

          const distance = intersectionPoint.add(this.position.multiply(-1)).abs()
          if (distances[angleIndex]! > distance) {
            distances[angleIndex] = distance
          }

          const drawPoint = intersectionPoint.add(correctedCamera)

          if (draw) {
            ctx.beginPath()
            ctx.strokeStyle = 'red'
            ctx.arc(drawPoint.x, drawPoint.y, 5, 0, 2 * Math.PI)
            ctx.stroke()
          }
        }
      }
    }

    return distances
  }
}

function generateRoute() {
  let parts: Line[] = []

  let centerPoint = new Vector(500, 500)

  let zoomLevel = 1

  let width = 200 / zoomLevel
  let length = 100 / zoomLevel

  let angle = 0
  let angleVelocity = 0
  let angleMultiplier = 0

  let oldLeftTop = undefined;
  let oldRightTop = undefined;

  for (let i = 0; i < 150; i++) {

    let nextCenter = centerPoint.add(new Vector(0, -1).rotate(angle).multiply(length))

    const leftBottom = oldLeftTop || centerPoint.add(new Vector(-1, 0).rotate(angle).multiply(width / 2))
    const rightBottom = oldRightTop || centerPoint.add(new Vector(1, 0).rotate(angle).multiply(width / 2))

    const leftTop = nextCenter.add(new Vector(-1, 0).rotate(angle).multiply(width / 2))
    const rightTop = nextCenter.add(new Vector(1, 0).rotate(angle).multiply(width / 2))

    centerPoint = nextCenter

    parts = [
      ...parts,
      new Line(leftBottom, leftTop),
      new Line(rightBottom, rightTop),
    ]

    angleVelocity += (Math.random() - 0.5) * 0.1 * angleMultiplier
    angleVelocity = Math.max(Math.min(angleVelocity, 0.3), -0.3)
    angle += angleVelocity
    angle = Math.max(Math.min(angle, 1.57), -1.57)

    width *= 0.985

    angleMultiplier += 0.4

    oldLeftTop = leftTop
    oldRightTop = rightTop
  }

  return parts
}

const initialNeuralNet = new NeuralNet([6, 3, 2])
// initialNeuralNet.setFirstLayer([1, 1, 1, 1, 1, 1])
// initialNeuralNet.forwardPropagate()
// initialNeuralNet.getLastLayer()

// interface IGameProps {
//
// }
//
// const Game = ((): IGameProps) => {
// }

const App = () => {
  const canvasRef = React.useRef<null | HTMLCanvasElement>(null)
  const [directions, setDirections] = React.useState({
    forward: false,
    backwards: false,
    left: false,
    right: false,
  })
  const [camera, setCamera] = React.useState<Vector>(new Vector(0, 0))
  const [car, setCar] = React.useState(new Car(initialNeuralNet))
  const [borders, setBorders] = React.useState(generateRoute())

  React.useEffect(() => {
    if (canvasRef === null) {
      return
    }

    const interval = setInterval(() => {
      setDirections((currentDirections) => {
        setCar((currentCar) => {
          const newCar = currentCar.afterStep()

          setCamera((currentCamera) => {
            const canvas: HTMLCanvasElement = canvasRef.current!
            const ctx = canvas.getContext("2d")!;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // if (currentDirections.left) {
            //   currentCar.angle -= 0.01
            // }
            // if (currentDirections.right) {
            //   currentCar.angle += 0.01
            // }
            // if (currentDirections.forward) {
            //   currentCar.speed += 0.05
            // }
            // if (currentDirections.backwards) {
            //   currentCar.speed -= 0.05
            // }

            const maxSeeLength = 500
            const seeDistances = newCar.see(ctx, currentCamera, borders, maxSeeLength)
            newCar.neuralNet.setFirstLayer(seeDistances.map(distance => distance / maxSeeLength))
            newCar.neuralNet.forwardPropagate()
            const nnOutputs = newCar.neuralNet.getLastLayer()

            currentCar.speed = nnOutputs[0]
            currentCar.angle += (nnOutputs[1] - 0.5)

            currentCar.speed *= 0.98

            newCar.draw(ctx, currentCamera)
            setCar(newCar)

            for (var i = 0; i < borders.length; i++) {
              borders[i].draw(ctx, currentCamera)
            }

            if (borders.some(border => {
              return currentCar.checkCollision(border)
            })) {
              // console.log('collision')
            }

            return newCar.position
          })
          return newCar
        })
        return currentDirections
      })
    }, 1000 / 60)

    return () => {
      clearInterval(interval)
    }
  }, [canvasRef])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      setDirections({...directions, forward: true})
    }
    if (event.key === 'ArrowDown') {
      setDirections({...directions, backwards: true})
    }
    if (event.key === 'ArrowLeft') {
      setDirections({...directions, left: true})
    }
    if (event.key === 'ArrowRight') {
      setDirections({...directions, right: true})
    }
  }

  const onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      setDirections({...directions, forward: false})
    }
    if (event.key === 'ArrowDown') {
      setDirections({...directions, backwards: false})
    }
    if (event.key === 'ArrowLeft') {
      setDirections({...directions, left: false})
    }
    if (event.key === 'ArrowRight') {
      setDirections({...directions, right: false})
    }
  }

  return (
    <div
      tabIndex={-1}
      className="App"
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      <div className={'main-container'}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
        ></canvas>
      </div>
    </div>
  );
}

export default App;
