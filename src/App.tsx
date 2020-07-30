import React, {EffectCallback} from 'react';
import './App.css';

const maxSeeLength = 750
const carSeeLinesPerSide = 5

class Vector {
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
    // console.log('NeuralNet constructor')

    this.weights = []
    this.layerValues = []
    this.layerSizes = layerSizes

    for (let i = 0; i < layerSizes.length; i++) {
      this.layerValues.push(new Array(layerSizes[i]))
    }

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const newWeightLayer = new Array((layerSizes[i] + 1) * (layerSizes[i + 1] + 0))

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

  cloneMutated() {
    const newNeuralNet = new NeuralNet(this.layerSizes)

    // // Sometimes completely random
    // if (Math.random() < 0.1) {
    //   return newNeuralNet
    // }

    for (let weightLayerIndex = 0; weightLayerIndex < this.weights.length; weightLayerIndex++) {
      const thisWeightLayer = this.weights[weightLayerIndex]
      const newWeightLayer = newNeuralNet.weights[weightLayerIndex]

      for (let weightCellIndex = 0; weightCellIndex < thisWeightLayer.length; weightCellIndex++) {
        let newWeight = thisWeightLayer[weightCellIndex]
        if (Math.random() < 0.25) {
          newWeight += (Math.random() - 0.5) * 0.25
        }
        newWeightLayer[weightCellIndex] = newWeight
      }
    }

    return newNeuralNet
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

      // console.log('step')
      // console.log(fromLayerIndex, toLayerIndex)

      const fromSize = this.layerSizes[fromLayerIndex]
      const toSize = this.layerSizes[toLayerIndex]

      // console.log(fromSize, toSize)

      for (let toCellIndex = 0; toCellIndex < toSize; toCellIndex++) {
        this.layerValues[toLayerIndex][toCellIndex] = 0;

        // console.log('1', this.layerValues[toLayerIndex])

        for (let fromCellIndex = 0; fromCellIndex < fromSize; fromCellIndex++) {
          const fromInputValue = this.layerValues[fromLayerIndex][fromCellIndex]

          const weight = weightArray[(fromSize + 1) * toCellIndex + fromCellIndex]
          this.layerValues[toLayerIndex][toCellIndex] += weight * fromInputValue
        }

        // console.log('2', this.layerValues[toLayerIndex])

        // Bias
        const weight = weightArray[(fromSize + 1) * toCellIndex + fromSize - 1]
        // console.log('weight', weight)
        if (weight === undefined) {
          debugger
        }
        this.layerValues[toLayerIndex][toCellIndex] += weight * 1

        // console.log('3', this.layerValues[toLayerIndex])

        this.layerValues[toLayerIndex][toCellIndex] = sigmoid(this.layerValues[toLayerIndex][toCellIndex]);
      }

      // console.log('4', this.layerValues[toLayerIndex])
    }
    // throw Error('JOU')
  }

  getLastLayer() {
    const lastLayerValues = this.layerValues[this.layerValues.length - 1]
    // console.log('returning values', lastLayerValues)
    return lastLayerValues
  }
}

const carStartPos = new Vector(500, 400)

class Car {
  position: Vector
  angle: number
  speed: number
  neuralNet: NeuralNet
  alive: boolean
  diedOnFrame: undefined | number

  constructor(neuralNet: NeuralNet) {
    this.position = carStartPos.clone()
    this.angle = 0
    this.speed = 0
    this.neuralNet = neuralNet
    this.alive = true
    this.diedOnFrame = undefined
  }

  doStep() {
    const directionVector = new Vector(0, -1)
      .rotate(this.angle)
      .multiply(this.speed)

    this.position = this.position.add(directionVector)
  }

  mutateNew() {
    const newNeuralNet = this.neuralNet.cloneMutated()
    const newCar = new Car(newNeuralNet)
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

    const color = this.alive ? 'black' : 'red'

    drawLine(ctx, topLeft.add(correctedCamera), topRight.add(correctedCamera), color)
    drawLine(ctx, topRight.add(correctedCamera), bottomRight.add(correctedCamera), color)
    drawLine(ctx, bottomRight.add(correctedCamera), bottomLeft.add(correctedCamera), color)
    drawLine(ctx, bottomLeft.add(correctedCamera), topLeft.add(correctedCamera), color)
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
    let distances: number[] = new Array(carSeeLinesPerSide * 2)

    for (let angleIndex = 0; angleIndex < carSeeLinesPerSide * 2; angleIndex += 1) {
      distances[angleIndex] = maxDistance

      const angle = this.angle + Math.PI * (angleIndex + 0.5 - carSeeLinesPerSide) / carSeeLinesPerSide / 3

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

  let centerPoint = carStartPos.clone().add(new Vector(0, 11))

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

    if (i === 0) {
      parts = [
        ...parts,
        new Line(leftBottom, rightBottom)
      ]
    }

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

interface IGameProps {
  setIteration: React.Dispatch<React.SetStateAction<number>>
  setFps: React.Dispatch<React.SetStateAction<number>>
  extraFast: boolean
}

const Game = ({setIteration, extraFast, setFps}: IGameProps) => {

  const canvasRef = React.useRef<null | HTMLCanvasElement>(null)

  const [camera, setCamera] = React.useState<Vector>(new Vector(0, 0))
  const [intervalFunc, setIntervalFunc] = React.useState<() => void>(() => {
    return () => {}
  })

  React.useEffect(() => {
    if (canvasRef === null || canvasRef.current === null) {
      return
    }

    const canvas: HTMLCanvasElement = canvasRef.current!
    const ctx = canvas.getContext("2d")!;

    const carCount = 30

    let cars = [...Array(carCount * 10)].map(() => {
      return new Car(new NeuralNet([carSeeLinesPerSide * 2 + 1, 10, 5, 2]))
    })
    let borders = generateRoute()
    let loopIndex = 0;
    let iterationIndex = 1;

    // let lastTime = Date.now()
    const maxFpsTimeListLen = 5
    let latestTimes = [Date.now()]

    setIteration(iterationIndex)

    const intervalCallback = () => {
      loopIndex += 1;

      if (loopIndex % 10 === 0) {
        setFps(Math.round(1 / (Date.now() - latestTimes[latestTimes.length - 1]) * 1000 * maxFpsTimeListLen))
      }
      latestTimes = [Date.now(), ...latestTimes].slice(0, maxFpsTimeListLen)

      setCamera((currentCamera) => {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < borders.length; i++) {
          borders[i].draw(ctx, currentCamera)
        }

        let allDead = true
        for (let carIndex = 0; carIndex < cars.length; carIndex++) {
          let car = cars[carIndex]

          car.draw(ctx, currentCamera)

          if (borders.some(border => {
            return car.checkCollision(border)
          })) {
            car.alive = false
            continue
          }
          allDead = false

          const seeDistances = car.see(ctx, currentCamera, borders, maxSeeLength, false)
          console.log('speed is', car.speed)
          car.neuralNet.setFirstLayer([...seeDistances.map(distance => distance / maxSeeLength), car.speed])
          car.neuralNet.forwardPropagate()
          const nnOutputs = car.neuralNet.getLastLayer()

          // car.speed += (nnOutputs[0] - 0.5) * 0.2
          car.speed += (nnOutputs[0]) * 0.1
          car.angle += (nnOutputs[1] - 0.5) * 0.2

          car.speed *= 0.96

          car.doStep()
        }

        const sortedCars = cars.sort((a, b) => {
          return (
            a.position.add(carStartPos.multiply(-1)).abs() >
            b.position.add(carStartPos.multiply(-1)).abs()
              ? -1 : 1
          )
          // return (
          //   a.position.add(carStartPos.multiply(-1)).abs() / Math.sqrt(10 + (a.diedOnFrame || loopIndex)) >
          //   b.position.add(carStartPos.multiply(-1)).abs() / Math.sqrt(10 + (b.diedOnFrame || loopIndex))
          //     ? -1 : 1
          // )
        })

        if ((loopIndex > 60 * 10 && iterationIndex < 10) || allDead || (loopIndex > 60 * 30)) {
          loopIndex = 0
          iterationIndex += 1;
          setIteration(iterationIndex)

          cars = sortedCars.slice(0, carCount / 2).map(car => {
            car.position = carStartPos.clone()
            car.angle = 0
            car.alive = true
            car.diedOnFrame = undefined
            return car
          })
          const mutatedCars = cars.map(oldCar => oldCar.mutateNew())

          cars = cars.concat(mutatedCars)

          borders = generateRoute()
        }

        const sortedAliveCars = sortedCars.filter(car => car.alive)
        if (sortedAliveCars) {
          sortedAliveCars[0].see(ctx, currentCamera, borders, maxSeeLength, true)
          return sortedAliveCars[0].position
        }

        return cars[0].position
      })
    }
    // console.log('setIntervalFunc', intervalCallback)
    setIntervalFunc(() => {return intervalCallback})
    // return intervalCallback
  }, [canvasRef])

  React.useEffect(() => {
    if (!extraFast) {
      const interval = setInterval(intervalFunc, 1000 / 60)
      return () => {
        clearInterval(interval)
      }
    } else {
      let timeout: undefined | number = undefined
      const func = () => {
        intervalFunc()
        timeout = window.setTimeout(func, 0)
        return timeout
      }
      func()
      return () => {
        if (timeout !== undefined) {
          clearTimeout(timeout)
        }
      }
    }
  }, [extraFast, intervalFunc])

  return (
    <canvas
      tabIndex={-1}
      ref={canvasRef}
      width={1000}
      height={1000}>
    </canvas>
  );
}

const App = () => {
  const [iteration, setIteration] = React.useState(0)
  const [fps, setFps] = React.useState(0)
  const [extraFast, setExtraFast] = React.useState(false)
  return <div className={'game-container'}>
    <h1>Iteration {iteration} (FPS:{fps})</h1>
    <Game
      setIteration={setIteration}
      extraFast={extraFast}
      setFps={setFps}
    />
    <div>
      <button onClick={() => {
        setExtraFast(!extraFast)
      }}>Extra fast ({extraFast ? 'true' : 'false'})
      </button>
    </div>
  </div>
}

export default App;
