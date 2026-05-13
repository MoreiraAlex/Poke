import {
  CameraHelper,
  CylinderGeometry,
  Euler,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from '../node_modules/three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export class Player {
  constructor(scene) {
    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    )
    this.controls = new PointerLockControls(this.camera, document.body)
    this.cameraHelper = new CameraHelper(this.camera)

    this.camera.position.set(8, 32, 8)
    scene.add(this.camera)
    scene.add(this.cameraHelper)

    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    this.maxSpeed = 10
    this.input = new Vector3()
    this.velocity = new Vector3()
    this._worldVelocity = new Vector3()
    this.radius = 0.5
    this.height = 1.75
    this.jumpSpeed = 10
    this.onGround = false

    this.boundsHelper = new Mesh(
      new CylinderGeometry(this.radius, this.radius, this.height, 16),
      new MeshBasicMaterial({ wireframe: true }),
    )
    scene.add(this.boundsHelper)
  }

  get worldVelocity() {
    this._worldVelocity.copy(this.velocity)
    this._worldVelocity.applyEuler(new Euler(0, this.camera.rotation.y, 0))
    return this._worldVelocity
  }

  get position() {
    return this.camera.position
  }

  applyInputs(delta) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x
      this.velocity.z = this.input.z

      this.controls.moveRight(this.velocity.x * delta)
      this.controls.moveForward(this.velocity.z * delta)
      this.position.y += this.velocity.y * delta

      document.getElementById('player-position').innerHTML = this.toString()
    }
  }

  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new Euler(0, -this.camera.rotation.y, 0))
    this.velocity.add(dv)
  }

  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.position)
    this.boundsHelper.position.y -= this.height / 2
  }

  onKeyDown(event) {
    if (!this.controls.isLocked) {
      this.controls.lock()
      console.log('controls locked')
    }

    switch (event.code) {
      case 'KeyW':
        this.input.z = this.maxSpeed
        break
      case 'KeyA':
        this.input.x = -this.maxSpeed
        break
      case 'KeyS':
        this.input.z = -this.maxSpeed
        break
      case 'KeyD':
        this.input.x = this.maxSpeed
        break
      case 'KeyR':
        this.position.set(32, 16, 32)
        this.velocity.set(0, 0, 0)
        break
      case 'Space':
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed
        }
        break
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.input.z = 0
        break
      case 'KeyA':
        this.input.x = 0
        break
      case 'KeyS':
        this.input.z = 0
        break
      case 'KeyD':
        this.input.x = 0
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
