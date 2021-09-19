const clearButton = document.getElementById('clear')
const canvas = document.getElementById('drawCanvas')
const ctx = canvas.getContext('2d')

ctx.lineWidth = '3'

class MyModel extends Croquet.Model {
  init () {
    this.plots = []
    this.subscribe('canvas', 'draw', this.updateCanvas)
    this.subscribe('canvas', 'clearBtn', this.clearCanvas)
  }

  updateCanvas (data) {
    this.plots.push(data)
    this.publish('canvas', 'update', this.plots)
  }

  clearCanvas () {
    this.plots = []
    this.publish('canvas', 'clearCanvas')
  }
}
MyModel.register('MyModel')

function throttle(fn, maxInvocationsPerSec) {
  // Returns a new function which is a throttled version of the given function. 
  // Throttled to a maximum of maxInvocationsPerSec.
  let wait = false

  function throttled(args) {
    // don't call the function if we are still waiting
    if (wait) {
      return
    } else {
      fn(args)
      wait = true;
      // after the given period of time, allow function to be called again
      setTimeout(function () {
        wait = false;
      }, 1000 / maxInvocationsPerSec)
    }
  }

  return throttled
}

class MyView extends Croquet.View {
  constructor (model) {
    super(model)

    // draw the current state of the whiteboard
    this.drawWhiteboard(model)

    // create a flag
    this.isActive = false
    // array to collect coordinates
    this.plots = []

    const timesPerSecond = 20
    canvas.addEventListener('mousemove', throttle(this.draw.bind(this), timesPerSecond), false)
    canvas.addEventListener('mousedown', this.startDraw.bind(this), false)
    canvas.addEventListener('mouseup', this.endDraw.bind(this), false)

    canvas.addEventListener('touchstart', this.startDraw.bind(this), false)
    canvas.addEventListener('touchmove', this.draw.bind(this), false)
    canvas.addEventListener('touchend', this.endDraw.bind(this), false)

    clearButton.onclick = evt => this.publish('canvas', 'clearBtn')

    this.subscribe('canvas', 'update', this.handleUpdate)
    this.subscribe('canvas', 'clearCanvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height))
  }

  startDraw () {
    this.isActive = true
  }

  draw (e) {
    if (!this.isActive) return

    // cross-browser canvas coordinates
    const x = e.offsetX || e.layerX - canvas.offsetLeft
    const y = e.offsetY || e.layerY - canvas.offsetTop

    this.plots.push({ x: x, y: y })

    this.publish('canvas', 'draw', this.plots)
  }

  endDraw () {
    this.isActive = false
    this.plots = []
  }

  handleUpdate (data) {
    const mostRecent = data[data.length - 1]

    this.drawPlot(mostRecent)
  }

  drawWhiteboard(model) {
    model.plots.forEach(plot => {
      this.drawPlot(plot)
    })
  }

  drawPlot(plot) {
    ctx.beginPath()
    ctx.moveTo(plot[0].x, plot[0].y)

    for (let i = 1; i < plot.length; i++) {
      ctx.lineTo(plot[i].x, plot[i].y)
    }
    ctx.stroke()
  }
}

Croquet.Session.join({
  appId: 'com.evanhackett.whiteboard',
  apiKey: '1ybAFmqJ8ay4Aakg4As5MJxne3sf5HzCgFaeM9Nne',
  name: Croquet.App.autoSession(),
  password: Croquet.App.autoPassword(),
  model: MyModel,
  view: MyView
})

// Prevent scrolling when touching the canvas
document.body.addEventListener('touchstart', function (e) {
  if (e.target == canvas) {
    e.preventDefault()
  }
}, false)
document.body.addEventListener('touchend', function (e) {
  if (e.target == canvas) {
    e.preventDefault()
  }
}, false)
document.body.addEventListener('touchmove', function (e) {
  if (e.target == canvas) {
    e.preventDefault()
  }
}, { passive: false })
