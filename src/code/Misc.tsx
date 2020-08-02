import {Vector} from "./Vector";

export function drawLine(ctx: CanvasRenderingContext2D, vec1: Vector, vec2: Vector, color: string = 'black', width: number = 1) {
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.moveTo(vec1.x, vec1.y)
  ctx.lineTo(vec2.x, vec2.y)
  ctx.stroke()
}
