import {
  CapsuleGeometry,
  Euler,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three'

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export class Player {
  constructor(scene, rapier, physicsWorld) {
    this.rapier = rapier
    this.world = physicsWorld

    this.isMobile = 'ontouchstart' in window

    // câmera
    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    )

    this.controls = new PointerLockControls(this.camera, document.body)

    scene.add(this.camera)

    // input
    this.input = new Vector3()

    this.maxSpeed = 10

    // dimensões
    this.radius = 0.5
    this.height = 1.75

    // ===== MOBILE =====
    this.touch = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    }

    this.cameraRotation = {
      yaw: 0,
      pitch: 0,
    }

    this.touchLook = {
      active: false,
      lastX: 0,
      lastY: 0,
    }

    // ===== RIGID BODY =====
    const bodyDesc = this.rapier.RigidBodyDesc.dynamic().setTranslation(
      8,
      32,
      8,
    )

    this.body = this.world.createRigidBody(bodyDesc)

    // ===== COLLIDER =====
    const colliderDesc = this.rapier.ColliderDesc.capsule(
      this.height / 2 - this.radius,
      this.radius,
    )

    this.world.createCollider(colliderDesc, this.body)

    this.body.lockRotations(true)

    // ===== MESH =====
    this.mesh = new Mesh(
      new CapsuleGeometry(this.radius, this.height - this.radius * 2, 4, 8),
      new MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      }),
    )

    scene.add(this.mesh)

    // eventos teclado
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    // mobile
    this.setupMobileControls()
    this.setupMobileLook()
  }

  setupMobileControls() {
    if (!this.isMobile) return

    const createButton = (text, x, y) => {
      const btn = document.createElement('button')

      btn.innerText = text

      btn.style.position = 'fixed'
      btn.style.left = x
      btn.style.bottom = y
      btn.style.width = '70px'
      btn.style.height = '70px'
      btn.style.zIndex = '999'
      btn.style.opacity = '0.5'
      btn.style.borderRadius = '50%'
      btn.style.fontSize = '24px'
      btn.style.border = 'none'

      document.body.appendChild(btn)

      return btn
    }

    const up = createButton('↑', '90px', '140px')
    const down = createButton('↓', '90px', '20px')
    const left = createButton('←', '10px', '80px')
    const right = createButton('→', '170px', '80px')

    const bind = (button, key) => {
      button.addEventListener('touchstart', (e) => {
        e.preventDefault()
        this.touch[key] = true
      })

      button.addEventListener('touchend', (e) => {
        e.preventDefault()
        this.touch[key] = false
      })
    }

    bind(up, 'forward')
    bind(down, 'backward')
    bind(left, 'left')
    bind(right, 'right')
  }

  setupMobileLook() {
    if (!this.isMobile) return

    document.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) return

        const touch = e.touches[0]

        this.touchLook.active = true
        this.touchLook.lastX = touch.clientX
        this.touchLook.lastY = touch.clientY
      },
      { passive: false },
    )

    document.addEventListener(
      'touchmove',
      (e) => {
        if (!this.touchLook.active) return
        if (e.touches.length !== 1) return

        const touch = e.touches[0]

        const deltaX = touch.clientX - this.touchLook.lastX
        const deltaY = touch.clientY - this.touchLook.lastY

        this.touchLook.lastX = touch.clientX
        this.touchLook.lastY = touch.clientY

        this.cameraRotation.yaw -= deltaX * 0.003
        this.cameraRotation.pitch -= deltaY * 0.003

        const limit = Math.PI / 2 - 0.1

        this.cameraRotation.pitch = Math.max(
          -limit,
          Math.min(limit, this.cameraRotation.pitch),
        )

        const euler = new Euler(
          this.cameraRotation.pitch,
          this.cameraRotation.yaw,
          0,
          'YXZ',
        )

        this.camera.quaternion.setFromEuler(euler)
      },
      { passive: false },
    )

    document.addEventListener('touchend', () => {
      this.touchLook.active = false
    })
  }

  get position() {
    return this.mesh.position
  }

  update() {
    if (!this.isMobile && !this.controls.isLocked) return

    // direção câmera
    const forward = new Vector3(0, 0, -1).applyQuaternion(
      this.camera.quaternion,
    )

    const right = new Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion)

    forward.y = 0
    right.y = 0

    forward.normalize()
    right.normalize()

    let forwardInput = this.input.z
    let rightInput = this.input.x

    // mobile
    if (this.touch.forward) forwardInput += this.maxSpeed
    if (this.touch.backward) forwardInput -= this.maxSpeed

    if (this.touch.right) rightInput += this.maxSpeed
    if (this.touch.left) rightInput -= this.maxSpeed

    const move = new Vector3()

    move.addScaledVector(forward, forwardInput)
    move.addScaledVector(right, rightInput)

    const vel = this.body.linvel()

    // movimento
    this.body.setLinvel(
      {
        x: move.x,
        y: vel.y,
        z: move.z,
      },
      true,
    )

    // sync
    const pos = this.body.translation()

    this.mesh.position.set(pos.x, pos.y, pos.z)

    // câmera terceira pessoa
    // const offset = new Vector3(0, this.height / 2, 5)
    const offset = new Vector3(0, this.height, 6)

    offset.applyQuaternion(this.camera.quaternion)

    this.camera.position.copy(this.mesh.position).add(offset)

    // this.camera.lookAt(
    //   this.mesh.position.x,
    //   this.mesh.position.y + this.height / 2,
    //   this.mesh.position.z,
    // )

    document.getElementById('player-position').innerHTML = this.toString()
  }

  isOnGround() {
    const origin = this.body.translation()

    const ray = new this.rapier.Ray(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: 0, y: -1, z: 0 },
    )

    const hit = this.world.castRay(ray, this.height / 2 + 0.1, true)

    return hit !== null
  }

  jump() {
    if (!this.isOnGround()) return

    this.body.applyImpulse(
      {
        x: 0,
        y: 10,
        z: 0,
      },
      true,
    )
  }

  onKeyDown(event) {
    if (!this.isMobile && !this.controls.isLocked) {
      this.controls.lock()
    }

    switch (event.code) {
      case 'KeyW':
        this.input.z = this.maxSpeed
        break

      case 'KeyS':
        this.input.z = -this.maxSpeed
        break

      case 'KeyA':
        this.input.x = -this.maxSpeed
        break

      case 'KeyD':
        this.input.x = this.maxSpeed
        break

      case 'KeyE':
        this.jump()
        break

      case 'ShiftLeft':
        this.maxSpeed = 50

        if (this.input.z > 0) this.input.z = this.maxSpeed
        if (this.input.z < 0) this.input.z = -this.maxSpeed

        if (this.input.x > 0) this.input.x = this.maxSpeed
        if (this.input.x < 0) this.input.x = -this.maxSpeed

        break
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'KeyS':
        this.input.z = 0
        break

      case 'KeyA':
      case 'KeyD':
        this.input.x = 0
        break

      case 'ShiftLeft':
        this.maxSpeed = 10

        if (this.input.z > 0) this.input.z = this.maxSpeed
        if (this.input.z < 0) this.input.z = -this.maxSpeed

        if (this.input.x > 0) this.input.x = this.maxSpeed
        if (this.input.x < 0) this.input.x = -this.maxSpeed

        break
    }
  }

  toString() {
    let str = ''

    str += `X: ${this.position.x.toFixed(3)} `
    str += `Y: ${this.position.y.toFixed(3)} `
    str += `Z: ${this.position.z.toFixed(3)} `

    return str
  }
}
