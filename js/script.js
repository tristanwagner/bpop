/** @type {HTMLCanvas Element} */
const canvas = document.getElementById('canvas')

const ctx = canvas.getContext('2d')

canvas.width = 800
canvas.height = 500

let gameOver = false
let score = 0
let gameFrame = 0
ctx.font = '60px Georgia'

let canvasPosition = canvas.getBoundingClientRect()

window.addEventListener('resize', function () {
  canvasPosition = canvas.getBoundingClientRect()
})

const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  click: false
}

canvas.addEventListener('mousedown', function (event) {
  mouse.click = true
  mouse.x = event.x - canvasPosition.left
  mouse.y = event.y - canvasPosition.top
})

canvas.addEventListener('mouseup', function (event) {
  mouse.click = false
})

const bubblePopSound1 = new Audio('sounds/bubblePopSound1.ogg')
const bubblePopSound2 = new Audio('sounds/bubblePopSound2.wav')

const background = new Image('images/background.png')

const enemyImage = new Image('images/enemy.png')
const playerImage = new Image('images/player.png')

class Player {
  constructor() {
    this.x = canvas.width / 2
    this.y = canvas.height / 2
    this.radius = 50
    this.angle = 0
    this.frameX = 0
    this.frameY = 0
    this.spriteColumns = 4
    this.spriteRows = 3
    this.numberOfSprites = this.spriteRows * this.spriteColumns
    this.spriteWidth = enemyImage.width / this.spriteColumns
    this.spriteHeight = enemyImage.height / this.spriteRows
    this.velocity = 30
  }

  update() {
    const dx = this.x - mouse.x
    const dy = this.y - mouse.y

    if (this.x != mouse.x) {
      this.x -= dx / this.velocity
    }

    if (this.y != mouse.y) {
      this.y -= dy / this.velocity
    }
  }

  draw() {
    if (mouse.click) {
      // draw a line between player and mouse
      ctx.lineWidth = 0.2
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(mouse.x, mouse.y)
      ctx.stroke()
    }
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()
  }
}

class Bubble {
  constructor() {
    this.x = Math.random() * canvas.width
    this.y = canvas.height + canvas.height / 2
    this.radius = 50
    this.speed = Math.random() * 5 + 1
    this.distance
    this.sound = Math.random() <= 0.5
  }

  update() {
    this.y -= this.speed
    const dx = this.x - player.x
    const dy = this.y - player.y
    this.distance = Math.sqrt(dx * dx + dy * dy)
  }

  draw() {
    ctx.fillStyle = 'blue'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()
  }
}

class Enemy {

  constructor() {
    this.x = canvas.width
    this.y = Math.random() * (canvas.height - 150) + 90
    this.radius = 50
    this.speed = Math.random() * 2 + 2
    this.frameX = 0
    this.frameY = 0
    this.spriteColumns = 4
    this.spriteRows = 3
    this.numberOfSprites = this.spriteRows * this.spriteColumns
    this.spriteWidth = enemyImage.width / this.spriteColumns
    this.spriteHeight = enemyImage.height / this.spriteRows
    this.distance
  }

  update() {
    this.x -= this.speed

    if (this.x < 0 - this.radius * 2) {
      this.x = canvas.width + 200
      this.y = Math.random() * (canvas.height - 150) + 90
      this.speed = Math.random() * 2 + 2
    }

    // update frame animation every 5 frames
    if (!(gameFrame % 5)) {
      this.frameX += 1
      this.frameY += this.frameX === this.spriteColumns ? 1 : 0
      this.frameX %= this.spriteColumns
      this.frameY %= this.spriteRows
    }

    const dx = this.x - player.x
    const dy = this.y - player.y
    this.distance = Math.sqrt(dx * dx + dy * dy)
  }

  draw() {
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()
  }
}
const player = new Player()

const bubbles = []

const enemies = []

async function make() {
  gameFrame += 1

  console.log(gameFrame)
  // draw enemy on 250th frame
  if (gameFrame === 250) {

    console.log(true)
    enemies.push(new Enemy())
  }

  // draw bubble every 50 frames
  if (!(gameFrame % 50)) {
    bubbles.push(new Bubble())
  }

  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillText('Score: ' + score, 10, 50)

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i]
    bubble.update()
    bubble.draw()
    // clear bubble
    if (bubble.y < 0 - bubble.radius * 2) {
      bubbles.splice(i, 1)
    }

    if (bubble.distance < bubble.radius + player.radius) {
      score += 1
      if (bubble.sound) {
        // TODO:
        // for now only using 2 because 1
        // gets bugged when called multiple times
        // bubblePopSound1.play()
        bubblePopSound2.play()
      } else {
        bubblePopSound2.play()
      }
      bubbles.splice(i, 1)
    }
  }

  // update and draw player
  player.update()
  player.draw()

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]
    // update and draw enemy
    enemy.update()
    enemy.draw()

    if (enemy.distance < enemy.radius + player.radius) {
      gameOver = true
    }
  }

  if (!gameOver) {
    // recursive loop
    requestAnimationFrame(make)
  } else {
    ctx.fillStyle = 'black'
    ctx.fillText('You died', 130, 150)
  }
}

make()
