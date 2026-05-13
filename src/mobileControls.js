export class MobileControls {
  constructor() {
    this.input = {
      moveX: 0,
      moveY: 0,
      jump: false,
      roll: false,
      attack: false,
    }

    this.container = document.getElementById('mobile-controls')

    this.base = document.getElementById('joystick-base')
    this.stick = document.getElementById('joystick-stick')

    this.jumpBtn = document.getElementById('jump-btn')
    this.rollBtn = document.getElementById('roll-btn')
    this.attackBtn = document.getElementById('attack-btn')

    this.isDragging = false

    this.maxDistance = 50

    this.show()
    this.initJoystick()
    this.initButtons()
  }

  show() {
    if (!this.container) return

    this.container.style.visibility = 'visible'
    this.container.style.opacity = '1'
  }

  hide() {
    if (!this.container) return

    this.container.style.visibility = 'hidden'
    this.container.style.opacity = '0'
  }

  initJoystick() {
    this.base.addEventListener('pointerdown', (e) => {
      this.isDragging = true
      this.updateJoystick(e)
    })

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return
      this.updateJoystick(e)
    })

    window.addEventListener('pointerup', () => {
      this.isDragging = false

      this.input.moveX = 0
      this.input.moveY = 0

      this.resetStick()
    })
  }

  updateJoystick(e) {
    const rect = this.base.getBoundingClientRect()

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let deltaX = e.clientX - centerX
    let deltaY = e.clientY - centerY

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance > this.maxDistance) {
      const angle = Math.atan2(deltaY, deltaX)

      deltaX = Math.cos(angle) * this.maxDistance
      deltaY = Math.sin(angle) * this.maxDistance
    }

    this.stick.style.transform = `
      translate(
        calc(-50% + ${deltaX}px),
        calc(-50% + ${deltaY}px)
      )
    `

    this.input.moveX = deltaX / this.maxDistance
    this.input.moveY = deltaY / this.maxDistance
  }

  resetStick() {
    this.stick.style.transform = 'translate(-50%, -50%)'
  }

  initButtons() {
    this.setupButton(this.jumpBtn, 'jump')
    this.setupButton(this.rollBtn, 'roll')
    this.setupButton(this.attackBtn, 'attack')
  }

  setupButton(button, key) {
    button.addEventListener('pointerdown', () => {
      this.input[key] = true
    })

    button.addEventListener('pointerup', () => {
      this.input[key] = false
    })

    button.addEventListener('pointerleave', () => {
      this.input[key] = false
    })
  }
}
