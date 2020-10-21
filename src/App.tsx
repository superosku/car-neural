import React, {EffectCallback} from 'react';
import './App.css';
import {Camera, Vector} from './code/Vector'
import {Line} from './code/Line'
import {NeuralNet} from "./code/NeuralNet";
import {
  canvasHeight,
  canvasWidth,
  carNNLayerSizes,
  carStartPos,
  maxSeeLength
} from "./code/Constants";
import {Car} from "./code/Car";

function generateRoute() {
  let parts: Line[] = []

  let centerPoint = new Vector(carStartPos.x, carStartPos.y).add(new Vector(0, 20))

  let zoomLevel = 1

  let width = 150 / zoomLevel
  let length = 100 / zoomLevel

  let angle = 0
  let angleChange = 0.035 * 3 * (Math.random() < 0.5 ? -1 : 1)
  let angleSwapProbability = 0.05

  let oldLeftTop = undefined;
  let oldRightTop = undefined;

  for (let i = 0; i < 100; i++) {
    angle = Math.max(Math.min(angle, 1.57 * 1.0), -1.57 * 1.0)

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

    if (Math.random() < angleSwapProbability || angle <= -1.57 || angle >= 1.57) {
      angleChange = -angleChange
    }

    angle += angleChange

    angleChange *= 1.04
    angleSwapProbability *= 0.99
    width *= 0.993

    oldLeftTop = leftTop
    oldRightTop = rightTop
  }

  return parts
}

function drawDistances(ctx: CanvasRenderingContext2D, distances: number[]) {
  ctx.beginPath();
  ctx.strokeStyle = 'black'
  ctx.fillStyle = 'white'

  const rectWidth = 170
  const rectHeight = 120
  const rectPosX = 10
  const rectPosY = 25

  ctx.rect(rectPosX, rectPosY, rectWidth, rectHeight)
  ctx.stroke()
  ctx.fill()


  const maxDist = Math.max(...distances)
  const minDist = Math.min(...distances)
  const distDiff = maxDist - minDist

  ctx.strokeStyle = 'gray'
  ctx.lineWidth = 1

  // Black line
  ctx.beginPath()
  // ctx.moveTo(rectPosX, rectPosY + rectHeight - distances[0] / maxDist * rectHeight)
  for (let i = 0; i < distances.length; i++) {
    const x = rectPosX + rectWidth * i / (distances.length - 1)
    const y = rectPosY + rectHeight - (distances[i] - minDist) / distDiff * rectHeight
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()

  // Avg line
  ctx.beginPath()
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 2
  const avgOver = 50
  // ctx.moveTo(rectPosX, rectPosY + rectHeight - distances[0] / maxDist * rectHeight)
  for (let i = 0; i < (distances.length - avgOver); i++) {
    const avgDistances = distances.slice(i, i + avgOver).reduce((a, b) => a + b, 0) / avgOver
    const x = rectPosX + rectWidth * i / (distances.length - 1)
    const y = rectPosY + rectHeight - (avgDistances - minDist) / distDiff * rectHeight
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()

  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.font = "14px Arial";
  ctx.fillStyle = 'black';
  ctx.fillText("Avg distance vs iteration", rectPosX, rectPosY - 5);
  ctx.fill()
}

function drawNN(ctx: CanvasRenderingContext2D, neuralNet: NeuralNet) {
  const posX = 10
  const posY = 170

  const circleSize = 10
  const circlePaddingX = 20
  const circlePaddingY = 5

  for (let i = 0; i < neuralNet.layerValues.length; i++) {
    for (let j = 0; j < neuralNet.layerValues[i].length; j++) {
      ctx.beginPath()
      ctx.strokeStyle = 'gray'
      if (i > 0) {
        for (let j2 = 0; j2 < neuralNet.layerValues[i - 1].length; j2++) {
          ctx.moveTo(
            posX + i * (2 * circleSize + circlePaddingX) + circleSize,
            posY + j * (2 * circleSize + circlePaddingY) + circleSize,
          )
          ctx.lineTo(
            posX + (i - 1) * (2 * circleSize + circlePaddingX) + circleSize,
            posY + j2 * (2 * circleSize + circlePaddingY) + circleSize,
          )
        }
      }
      ctx.stroke()
    }
  }

  for (let i = 0; i < neuralNet.layerValues.length; i++) {
    for (let j = 0; j < neuralNet.layerValues[i].length; j++) {
      ctx.beginPath()
      ctx.strokeStyle = 'gray'
      const fillStrength = Math.max(0, Math.min(255, neuralNet.layerValues[i][j] * 255))
      ctx.fillStyle = `rgb(${fillStrength}, ${fillStrength}, ${fillStrength})`
      ctx.arc(
        posX + i * (2 * circleSize + circlePaddingX) + circleSize,
        posY + j * (2 * circleSize + circlePaddingY) + circleSize,
        circleSize,
        0,
        2 * Math.PI
      )
      ctx.stroke()
      ctx.fill()
    }
  }

  ctx.beginPath()
  ctx.font = "14px Arial";
  ctx.fillStyle = 'black';
  ctx.fillText("Neuron activations", posX, posY - 5);
  ctx.fill()
}

interface IGameProps {
  setIteration: React.Dispatch<React.SetStateAction<number>>
  setFps: React.Dispatch<React.SetStateAction<number>>
  extraFast: boolean
  setDraw: React.Dispatch<React.SetStateAction<boolean>>
  setLogBestWeights: React.Dispatch<React.SetStateAction<boolean>>
}

const Game = ({setIteration, extraFast, setFps, setDraw, setLogBestWeights}: IGameProps) => {
  const canvasRef = React.useRef<null | HTMLCanvasElement>(null)

  // const [camera, setCamera] = React.useState<Camera>(new Camera(0, 0))
  const [intervalFunc, setIntervalFunc] = React.useState<() => void>(() => {
    return () => {
    }
  })

  React.useEffect(() => {
    if (canvasRef === null || canvasRef.current === null) {
      return
    }

    const canvas: HTMLCanvasElement = canvasRef.current!
    const ctx = canvas.getContext("2d")!;

    let loopIndex = 0;
    let iterationIndex = 1;

    let historicalAvgDistances: number[] = []

    const carCount = 50

    let cars = [...Array(carCount * 2)].map(() => {
      return new Car(new NeuralNet(
        carNNLayerSizes
      ), iterationIndex)
    })
    let borders = generateRoute()

    // let lastTime = Date.now()
    const maxFpsTimeListLen = 60
    let latestTimes = [Date.now()]

    setIteration(iterationIndex)

    let draw = true;
    let logBestWeights = false;
    let camera = new Camera(0, 0)

    setInterval(() => {
      setLogBestWeights((newLogBestWeights) => {
        setDraw((newDraw) => {
          draw = newDraw
          logBestWeights = newLogBestWeights
          setFps(Math.round(1 / (Date.now() - latestTimes[latestTimes.length - 1]) * 1000 * maxFpsTimeListLen))
          return newDraw
        })
        return newLogBestWeights
      })
    }, 250)

    const intervalCallback = () => {
      loopIndex += 1;
      latestTimes = [Date.now(), ...latestTimes].slice(0, maxFpsTimeListLen)

      if (draw) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < borders.length; i++) {
          borders[i].draw(ctx, camera)
        }
      }

      let allDead = true
      for (let carIndex = 0; carIndex < cars.length; carIndex++) {
        let car = cars[carIndex]

        if (draw) {
          car.draw(ctx, camera, iterationIndex)
        }

        for (
          let i = Math.max(0, car.closestBorderIndex - 2);
          i < Math.min(borders.length, car.closestBorderIndex + 2);
          i++
        ) {
          const border = borders[i]
          if (car.checkCollision(border)) {
            car.alive = false
          }
        }
        if (car.alive) {
          allDead = false
        } else {
          continue
        }

        const seeDistances = car.see(ctx, camera, borders, maxSeeLength, false)
        car.neuralNet.setFirstLayer(seeDistances.map(distance => distance / maxSeeLength))
        car.neuralNet.forwardPropagate()
        const nnOutputs = car.neuralNet.getLastLayer()

        car.speed = (nnOutputs[0]) * 3
        car.angle += (nnOutputs[1] - 0.5) * 0.2 / 8

        car.doStep()
      }

      const sortedCars = cars.sort((a, b) => {
        // return a.score > b.score ? -1 : 1
        return a.getDistance() > b.getDistance() ? -1 : 1
      })

      if ((loopIndex > 60 * 1 && iterationIndex < 5) || allDead || (loopIndex > 60 * 30)) {
        loopIndex = 0
        iterationIndex += 1;
        setIteration(iterationIndex)

        const carDistances = cars.map(car => car.getDistance())
        const avgDistance = carDistances.reduce((p, c) => p + c, 0) / carDistances.length
        historicalAvgDistances = [...historicalAvgDistances, avgDistance]

        if (logBestWeights) {
          console.log('avgDistance', avgDistance)
          console.log('best car')
          console.log('weights', JSON.stringify(sortedCars[0].neuralNet.layerSizes))
          console.log('weights', JSON.stringify(sortedCars[0].neuralNet.weights))
        }

        const newStartAngle = 0

        let bestWeightChanges: number[][] = []
        for (let layerIndex = 0; layerIndex < sortedCars[0].neuralNet.weightChanges.length; layerIndex ++) {
          let layerInfo = []
          for (let index = 0; index < sortedCars[0].neuralNet.weightChanges[layerIndex].length; index ++) {
            let value = 0
            for (let carIndex = 0; carIndex < 15; carIndex ++) {
              value += sortedCars[carIndex].neuralNet.weightChanges[layerIndex][index]
            }
            value /= 15
            value *= 2
            layerInfo.push(value)
          }
          bestWeightChanges.push(layerInfo)
        }

        let bestCar = sortedCars[0]
        bestCar.position = new Vector(carStartPos.x, carStartPos.y)
        bestCar.angle = newStartAngle
        bestCar.alive = true
        bestCar.diedOnFrame = undefined

        cars = [bestCar]
        for (let i = 0; i < 29; i ++) {
          cars.push(bestCar.mutateNew(iterationIndex, newStartAngle, bestWeightChanges))
        }

        // cars = sortedCars.slice(0, carCount / 2).map(car => {
        //   car.position = new Vector(carStartPos.x, carStartPos.y)
        //   car.angle = newStartAngle
        //   car.alive = true
        //   car.diedOnFrame = undefined
        //   return car
        // })
        // const mutatedCars = cars.map(oldCar => oldCar.mutateNew(iterationIndex, newStartAngle))
        //
        // cars = cars.concat(mutatedCars)

        borders = generateRoute()
      }

      const sortedAliveCars = sortedCars.filter(car => car.alive)
      if (draw) {
        sortedAliveCars[0].see(ctx, camera, borders, maxSeeLength, true)
        drawNN(ctx, sortedAliveCars[0].neuralNet)
        drawDistances(ctx, historicalAvgDistances)
      }
      camera = new Camera(sortedCars[0].position.x, sortedCars[0].position.y)
    }
    setIntervalFunc(() => {
      return intervalCallback
    })
  }, [canvasRef])

  React.useEffect(() => {
    if (!extraFast) {
      const interval = setInterval(() => {
        intervalFunc()
      }, 1000 / 60)
      return () => {
        clearInterval(interval)
      }
    } else {
      const interval = setInterval(() => {
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
        intervalFunc()
      }, 0)
      return () => {
        clearInterval(interval)
      }
    }
  }, [extraFast, intervalFunc])

  return (
    <canvas
      tabIndex={-1}
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}>
    </canvas>
  );
}

const App = () => {
  const [iteration, setIteration] = React.useState(0)
  const [fps, setFps] = React.useState(0)

  const [extraFast, setExtraFast] = React.useState(false)
  const [draw, setDraw] = React.useState(true)
  const [logBestWeights, setLogBestWeights] = React.useState(false)
  return <div className={'game-container'}>
    <h1>Iteration {iteration} (FPS:{fps})</h1>
    <Game
      setIteration={setIteration}
      extraFast={extraFast}
      setFps={setFps}
      setDraw={setDraw}
      setLogBestWeights={setLogBestWeights}
    />
    <div>
      <button onClick={() => {
        setExtraFast(!extraFast)
      }}>Limit FPS ({extraFast ? 'F' : 'T'})
      </button>
      <button onClick={() => {
        setDraw(!draw)
      }}>Draw ({draw ? 'T' : 'F'})
      </button>
      <button onClick={() => {
        setLogBestWeights(!logBestWeights)
      }}>Log weights ({logBestWeights ? 'T' : 'F'})
      </button>
    </div>
  </div>
}

export default App;
