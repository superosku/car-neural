import {pretrainedLayerSizes, pretrainedWeights} from "./Constants";

function sigmoid(value: number) {
  return 1 / (1 + Math.pow(Math.E, -value))
}

export class NeuralNet {
  weights: number[][]
  weightChanges: number[][]
  layerValues: number[][]
  layerSizes: number[]

  constructor(layerSizes: number[]) {
    // console.log('NeuralNet constructor')

    this.weightChanges = []
    this.weights = []
    this.layerValues = []
    this.layerSizes = layerSizes

    // this.layerSizes = pretrainedLayerSizes

    for (let i = 0; i < layerSizes.length; i++) {
      this.layerValues.push(new Array(layerSizes[i]))
    }

    for (let i = 0; i < layerSizes.length - 1; i++) {
      const newWeightLayer = new Array((layerSizes[i] + 1) * (layerSizes[i + 1] + 0))
      const newWeightChangeLayer = new Array((layerSizes[i] + 1) * (layerSizes[i + 1] + 0))

      for (let j = 0; j < newWeightLayer.length; j++) {
        newWeightLayer[j] = Math.random() * 2 - 1 // -1 - 1
        newWeightChangeLayer[j] = 0
        // newWeightLayer[j] = Math.random() * 20 - 10 // -10 - 10
      }

      this.weights.push(newWeightLayer)
      this.weightChanges.push(newWeightChangeLayer)
    }

    // this.weights = pretrainedWeights
    //
    // console.log('weihts', this.weights)
    // console.log('layerValues', this.layerValues)
  }

  cloneMutated(directions: number[][]) {
    const newNeuralNet = new NeuralNet(this.layerSizes)

    // // Sometimes completely random
    // if (Math.random() < 0.1) {
    //   return newNeuralNet
    // }

    for (let weightLayerIndex = 0; weightLayerIndex < this.weights.length; weightLayerIndex++) {
      const thisWeightLayer = this.weights[weightLayerIndex]
      const newWeightLayer = newNeuralNet.weights[weightLayerIndex]
      const newChangeWeightLayer = newNeuralNet.weightChanges[weightLayerIndex]

      for (let weightCellIndex = 0; weightCellIndex < thisWeightLayer.length; weightCellIndex++) {
        let weightChange = 0;
        if (Math.random() < 0.25) {
          weightChange = (Math.random() - 0.5) * 0.1
        }
        let newWeight = (
          thisWeightLayer[weightCellIndex] +
          directions[weightLayerIndex][weightCellIndex] +
          weightChange
        )
        newWeightLayer[weightCellIndex] = newWeight
        newChangeWeightLayer[weightCellIndex] = weightChange
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
