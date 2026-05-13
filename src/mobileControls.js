export class MobileControls {
  constructor() {
    this.input = {
      moveX: 0,
      moveY: 0,

      cameraX: 0,
      cameraY: 0,

      jump: false,
      roll: false,
      attack: false,
    }

    this.container = document.getElementById('mobile-controls')

    this.movementZone = document.getElementById('movement-zone')

    this.cameraZone = document.getElementById('camera-zone')

    this.base = document.getElementById('joystick-base')

    this.stick = document.getElementById('joystick-stick')

    this.jumpBtn = document.getElementById('jump-btn')

    this.rollBtn = document.getElementById('roll-btn')

    this.attackBtn = document.getElementById('attack-btn')

    this.maxDistance = 50

    this.joystickPointerId = null

    this.cameraPointerId = null

    this.startX = 0
    this.startY = 0

    this.lastCameraX = 0
    this.lastCameraY = 0

    this.initJoystick()
    this.initCamera()
    this.initButtons()

    this.show()
  }

  show() {
    this.container.style.visibility = 'visible'
    this.container.style.opacity = '1'
  }

  /*
   * JOYSTICK
   */

  initJoystick() {
    this.movementZone.addEventListener('pointerdown', (e) => {
      // impede multitouch duplicado
      if (this.joystickPointerId !== null) return

      this.joystickPointerId = e.pointerId

      this.startX = e.clientX
      this.startY = e.clientY

      this.base.style.display = 'block'

      this.base.style.left = `${this.startX - 70}px`

      this.base.style.top = `${this.startY - 70}px`

      this.updateJoystick(e)
    })

    window.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joystickPointerId) {
        return
      }

      this.updateJoystick(e)
    })

    window.addEventListener('pointerup', (e) => {
      if (e.pointerId !== this.joystickPointerId) {
        return
      }

      this.joystickPointerId = null

      this.input.moveX = 0
      this.input.moveY = 0

      this.resetStick()

      this.base.style.display = 'none'
    })
  }

  updateJoystick(e) {
    let deltaX = e.clientX - this.startX
    let deltaY = e.clientY - this.startY

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

  /*
   * CAMERA
   */

  initCamera() {
    this.cameraZone.addEventListener('pointerdown', (e) => {
      if (this.cameraPointerId !== null) return

      // ignora clique nos botões
      if (e.target.classList.contains('action-btn')) {
        return
      }

      this.cameraPointerId = e.pointerId

      this.lastCameraX = e.clientX
      this.lastCameraY = e.clientY
    })

    window.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.cameraPointerId) {
        return
      }

      const deltaX = e.clientX - this.lastCameraX

      const deltaY = e.clientY - this.lastCameraY

      this.input.cameraX = deltaX
      this.input.cameraY = deltaY

      this.lastCameraX = e.clientX
      this.lastCameraY = e.clientY
    })

    window.addEventListener('pointerup', (e) => {
      if (e.pointerId !== this.cameraPointerId) {
        return
      }

      this.cameraPointerId = null

      this.input.cameraX = 0
      this.input.cameraY = 0
    })
  }

  /*
   * BUTTONS
   */

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

    button.addEventListener('pointercancel', () => {
      this.input[key] = false
    })

    button.addEventListener('pointerleave', () => {
      this.input[key] = false
    })
  }
}
