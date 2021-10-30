(async () => {

  /** @type {HTMLCanvas Element} */
  const canvas = document.getElementById('canvas')

  const ctx = canvas.getContext('2d')

  canvas.width = 800
  canvas.height = 500

  const debug = false
  let difficulty = 1
  let gameOver = false
  let score = 0
  let gameFrame = 0
  let level = 1
  let maxLevel = 3 * difficulty
  let maxEnemies = 2 * difficulty
  let levelScore = 8 * difficulty
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

  // const background = new Image('images/background.png')

  const loadImage = async (src) => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = (e) => resolve(image)
      image.onerror = reject
      image.src = src
    })
  }

  const enemySc = await loadImage('images/enemy.png')
  const playerSc = await loadImage('images/player.png')
  const bubbleSc = await loadImage('images/bubble.png')

  class Player {
    constructor() {
      this.x = canvas.width / 2
      this.y = canvas.height / 2
      this.radius = 40
      this.angle = 0
      this.frameX = 0
      this.frameY = 0
      this.spriteColumns = 4
      this.spriteRows = 3
      this.numberOfSprites = this.spriteRows * this.spriteColumns
      this.spriteWidth = playerSc.naturalWidth / this.spriteColumns
      this.spriteHeight = playerSc.naturalHeight / this.spriteRows
      this.scale  = 3.5
      this.velocity = 30
    }

    update() {
      const dx = this.x - mouse.x
      const dy = this.y - mouse.y

      this.angle = Math.atan2(dy, dx)

      if (this.x != mouse.x) {
        this.x -= dx / this.velocity
      }

      if (this.y != mouse.y) {
        this.y -= dy / this.velocity
      }
      //
      // update frame animation every 5 frames
      if (!(gameFrame % 7)) {
        this.frameX += 1
        this.frameY += this.frameX === this.spriteColumns ? 1 : 0
        this.frameX %= this.spriteColumns
        this.frameY %= this.spriteRows
      }

      this.draw()
    }

    draw() {
      if (debug) {
        if (mouse.click) {
          // draw a line between player and mouse
          ctx.lineWidth = 0.2
          ctx.beginPath()
          ctx.moveTo(this.x, this.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
        ctx.fillStyle = 'green'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
      }
      // save ctx
      ctx.save()

      // start to rotate spritesheet according
      // to theta between pos and mouse
      ctx.translate(this.x, this.y)
      ctx.rotate(this.angle)

      // invert vertically if mouse is on right
      ctx.scale(1, this.x >= mouse.x ? 1 : -1)

      // draw spritesheet
      ctx.drawImage(
        playerSc,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        0 - this.spriteWidth / (2 * this.scale),
        0 - this.spriteHeight / (2 * this.scale),
        this.spriteWidth / this.scale,
        this.spriteHeight / this.scale
      )
      ctx.restore()
    }
  }

  class Bubble {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = canvas.height + canvas.height / 2
      this.radius = 50
      this.frameX = 0
      this.frameY = 0
      this.spriteColumns = 3
      this.spriteRows = 2
      this.numberOfSprites = this.spriteRows * this.spriteColumns
      this.spriteWidth = bubbleSc.width / this.spriteColumns
      this.spriteHeight = bubbleSc.height / this.spriteRows
      this.speed = Math.random() * 5 + 1
      this.distance
      this.sound = Math.random() <= 0.5
      this.scale = 4
      this.popped = false
      this.toClean = false
    }

    update() {
      this.y -= this.speed
      const dx = this.x - player.x
      const dy = this.y - player.y
      this.distance = Math.sqrt(dx * dx + dy * dy)

      // update frame animation every 5 frames
      if (!(gameFrame % 5) && this.popped) {
        this.frameX += 1
        this.frameY += this.frameX === this.spriteColumns ? 1 : 0

        if (this.frameX === this.spriteColumns - 1 && this.frameY === this.spriteRows - 1) {
          this.toClean = true
        }

        this.frameX %= this.spriteColumns
        this.frameY %= this.spriteRows

      }

      this.draw()
    }

    draw() {
      if (debug) {
        ctx.fillStyle = 'blue'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
      }

      // draw spritesheet
      ctx.drawImage(
        bubbleSc,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.x - this.spriteWidth / (2 * this.scale),
        this.y - this.spriteHeight / (2 * this.scale),
        this.spriteWidth / this.scale,
        this.spriteHeight / this.scale
      )

      // TODO: animate when bubble is poping
    }
  }

  class Enemy {
    constructor() {
      this.x = canvas.width
      this.y = Math.random() * (canvas.height - 150) + 90
      this.radius = 40
      this.speed = Math.random() * 2 + 2
      this.frameX = 0
      this.frameY = 0
      this.spriteColumns = 4
      this.spriteRows = 3
      this.numberOfSprites = this.spriteRows * this.spriteColumns
      this.spriteWidth = enemySc.width / this.spriteColumns
      this.spriteHeight = enemySc.height / this.spriteRows
      this.distance
      this.scale = 3.5
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

      this.draw()
    }

    draw() {
      if (debug) {
        ctx.fillStyle = 'red'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
      }

      ctx.drawImage(
        enemySc,
        this.frameX * this.spriteWidth,
        this.frameY * this.spriteHeight,
        this.spriteWidth,
        this.spriteHeight,
        this.x - this.spriteWidth / (2 * this.scale),
        this.y - this.spriteHeight / (2 * this.scale),
        this.spriteWidth / this.scale,
        this.spriteHeight / this.scale
      )
    }
  }
  const player = new Player()

  const bubbles = []

  const enemies = []

  async function make() {
    gameFrame += 1

    // draw enemy on 250th frame
    if (!(gameFrame % 250) && enemies.length < maxEnemies) {
      enemies.push(new Enemy())
    }

    // draw bubble every 50 frames
    if (!(gameFrame % 50)) {
      bubbles.push(new Bubble())
    }

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)


    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i]
      bubble.update()
      // clear bubble
      if ((bubble.y < 0 - bubble.radius * 2) || bubble.toClean) {
        bubbles.splice(i, 1)
      }

      if (bubble.distance < bubble.radius + player.radius && !bubble.popped) {
        score += 1

        if (level !== maxLevel && score >= level * levelScore) {
          level += 1
          maxEnemies += maxEnemies
        }

        if (bubble.sound) {
          // TODO:
          // for now only using 2 because 1
          // gets bugged when called multiple times
          // bubblePopSound1.play()
          bubblePopSound2.play()
        } else {
          bubblePopSound2.play()
        }
        bubble.popped = true
      }
    }

    // update and draw player
    player.update()

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      // update and draw enemy
      enemy.update()

      if (enemy.distance < enemy.radius + player.radius) {
        gameOver = true
      }
    }

    ctx.fillText('Level :' + level + ' Score: ' + score, 10, 50)

    if (!gameOver) {
      // win !
      if (level >= maxLevel && score >= maxLevel * levelScore) {
        ctx.fillStyle = 'whitz'
        ctx.textAlign = 'center'
        ctx.fillText('GG 🌟', canvas.width / 2, canvas.height / 2)
        return
      }
      // recursive loop
      requestAnimationFrame(make)
    } else {
      // loose !
      ctx.fillStyle = 'black'
      ctx.textAlign = 'center'
      ctx.fillText('RIP ✝', canvas.width / 2, canvas.height / 2)
      return
    }
  }

  make()
})()
