import {
  CapsuleGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export class Player {
  constructor(scene, rapier, physicsWorld) {
    this.rapier = rapier
    this.world = physicsWorld

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
    // this.maxSpeed = 50
    this.maxSpeed = 10

    // dimensões
    this.radius = 0.5
    this.height = 1.75

    // ===== RIGID BODY =====
    const bodyDesc = this.rapier.RigidBodyDesc.dynamic().setTranslation(
      8,
      32,
      8,
    )
    // .setLinearDamping(4) // freio leve

    this.body = this.world.createRigidBody(bodyDesc)

    // ===== COLLIDER =====
    const colliderDesc = this.rapier.ColliderDesc.capsule(
      this.height / 2 - this.radius,
      this.radius,
    )

    // colliderDesc.setMass(75)

    this.world.createCollider(colliderDesc, this.body)
    this.body.lockRotations(true)

    // ===== MESH VISUAL =====
    this.mesh = new Mesh(
      // new CylinderGeometry(this.radius, this.radius, this.height, 16),
      new CapsuleGeometry(this.radius, this.height - this.radius * 2, 4, 8),
      new MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
    )
    scene.add(this.mesh)

    // eventos
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  get position() {
    return this.mesh.position
  }

  update() {
    if (!this.controls.isLocked) return

    // direção baseada na câmera
    const forward = new Vector3(0, 0, -1).applyQuaternion(
      this.camera.quaternion,
    )
    const right = new Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion)

    forward.y = 0
    right.y = 0
    forward.normalize()
    right.normalize()

    const move = new Vector3()
    move.addScaledVector(forward, this.input.z)
    move.addScaledVector(right, this.input.x)

    const vel = this.body.linvel()

    // aplica movimento (mantém gravidade)
    this.body.setLinvel(
      {
        x: move.x,
        y: vel.y,
        z: move.z,
      },
      true,
    )

    // ===== SYNC FÍSICA → VISUAL =====
    const pos = this.body.translation()
    this.mesh.position.set(pos.x, pos.y, pos.z)

    // câmera segue
    // this.camera.position.copy(this.mesh.position)
    // this.camera.position.y += this.height / 2

    const offset = new Vector3(0, this.height / 2, 5)
    offset.applyQuaternion(this.camera.quaternion)

    this.camera.position.copy(this.mesh.position).add(offset)
    document.getElementById('player-position').innerHTML = this.toString()
  }

  // ===== CHÃO (RAYCAST) =====
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

    this.body.applyImpulse({ x: 0, y: 10, z: 0 }, true)
  }

  onKeyDown(event) {
    if (!this.controls.isLocked) {
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
      // case 'Space':
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
