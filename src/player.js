import {
  AnimationMixer,
  CapsuleGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three'

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { MobileControls } from './mobileControls'
import { loadFBX } from './utils/loader'

export class Player {
  constructor(scene, rapier, physicsWorld) {
    this.rapier = rapier
    this.world = physicsWorld

    this.isMobile = 'ontouchstart' in window

    // mobile controls
    this.mobile = this.isMobile ? new MobileControls() : null

    this.mobileStates = {
      jumpPressed: false,
      rollPressed: false,
    }
    // câmera
    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    )

    this.controls = new PointerLockControls(this.camera, document.body)

    scene.add(this.camera)

    // input desktop
    this.input = new Vector3()

    this.walkSpeed = 2
    this.runSpeed = 5
    this.currentSpeed = this.walkSpeed

    // dimensões
    this.radius = 0.3
    this.height = 1.3

    // ===== CAMERA SYSTEM =====

    this.mouse = {
      x: 0,
      y: 0,
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

    // this.world.createCollider(colliderDesc, this.body)
    this.collider = this.world.createCollider(colliderDesc, this.body)

    this.body.lockRotations(true)

    // ===== DEBUG MESH =====

    this.mesh = new Mesh(
      new CapsuleGeometry(this.radius, this.height - this.radius * 2, 4, 8),
      new MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      }),
    )

    // scene.add(this.mesh)

    this.model = null
    this.actions = {}
    this.activeAction = null
    this.mixer = null
    this.animationFadeDuration = 0.15

    // eventos teclado
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    // mouse
    this.setupMouseLook()

    // mobile
    this.setupMobileLook()
    this.loadModel(scene)
  }

  async loadModel(scene) {
    const idle = await loadFBX('/Poke/models/Male/Idle.fbx')

    this.model = idle
    this.model.scale.setScalar(0.01)

    this.model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })

    scene.add(this.model)

    /*
     * MIXER
     */
    this.mixer = new AnimationMixer(this.model)

    /*
     * ANIMATIONS
     */
    this.actions.idle = this.mixer.clipAction(idle.animations[0])

    const walk = await loadFBX('/Poke/models/Male/Walking.fbx')
    this.actions.walk = this.mixer.clipAction(walk.animations[0])

    const run = await loadFBX('/Poke/models/Male/Run.fbx')
    this.actions.run = this.mixer.clipAction(run.animations[0])

    const jump = await loadFBX('/Poke/models/Male/Jumping.fbx')
    this.actions.jump = this.mixer.clipAction(jump.animations[0])

    const falling = await loadFBX('/Poke/models/Male/Falling.fbx')
    this.actions.falling = this.mixer.clipAction(falling.animations[0])

    const roll = await loadFBX('/Poke/models/Male/Roll3.fbx')
    this.actions.roll = this.mixer.clipAction(roll.animations[0])

    /*
     * DEFAULT
     */
    this.playAnimation('idle')
  }

  playAnimation(name) {
    const action = this.actions[name]

    if (!action) return

    if (this.activeAction === action) return

    if (this.activeAction) {
      this.activeAction.fadeOut(this.animationFadeDuration)
    }

    action.reset().fadeIn(this.animationFadeDuration).play()
    this.activeAction = action
  }

  setupMouseLook() {
    if (this.isMobile) return

    document.body.addEventListener('click', () => {
      this.controls.lock()
    })

    document.addEventListener('mousemove', (e) => {
      if (!this.controls.isLocked) return

      this.mouse.x -= e.movementX * 0.002
      this.mouse.y -= e.movementY * 0.002

      this.mouse.y = Math.max(-0.5, Math.min(0.2, this.mouse.y))
    })
  }

  setupMobileLook() {
    if (!this.isMobile) return

    this.touchLook = {
      active: false,
      id: null,
      lastX: 0,
      lastY: 0,
    }

    document.addEventListener(
      'touchstart',
      (e) => {
        for (const touch of e.changedTouches) {
          // apenas lado direito da tela
          if (touch.clientX < window.innerWidth * 0.4) continue

          // já existe câmera ativa
          if (this.touchLook.active) continue

          this.touchLook.active = true
          this.touchLook.id = touch.identifier

          this.touchLook.lastX = touch.clientX
          this.touchLook.lastY = touch.clientY
        }
      },
      { passive: false },
    )

    document.addEventListener(
      'touchmove',
      (e) => {
        if (!this.touchLook.active) return

        let activeTouch = null

        for (const touch of e.changedTouches) {
          if (touch.identifier === this.touchLook.id) {
            activeTouch = touch
            break
          }
        }

        if (!activeTouch) return

        const deltaX = activeTouch.clientX - this.touchLook.lastX

        const deltaY = activeTouch.clientY - this.touchLook.lastY

        this.touchLook.lastX = activeTouch.clientX
        this.touchLook.lastY = activeTouch.clientY

        this.mouse.x -= deltaX * 0.005
        this.mouse.y -= deltaY * 0.005

        this.mouse.y = Math.max(-0.5, Math.min(0.5, this.mouse.y))
      },
      { passive: false },
    )

    document.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.touchLook.id) {
          this.touchLook.active = false
          this.touchLook.id = null
        }
      }
    })
  }

  get position() {
    if (this.model) return this.model.position

    return this.mesh.position
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta)
    }

    if (!this.isMobile && !this.controls.isLocked) return

    // ===== DIREÇÃO DA CÂMERA =====
    const yaw = this.mouse.x
    const pitch = this.mouse.y

    // ===== INPUT =====
    let moveX = this.input.x
    let moveZ = this.input.z

    // mobile joystick
    if (this.mobile) {
      moveX += -this.mobile.input.moveX
      moveZ += -this.mobile.input.moveY

      // JUMP
      if (this.mobile.input.jump && !this.mobileStates.jumpPressed) {
        this.mobileStates.jumpPressed = true
        this.jump()
      }

      if (!this.mobile.input.jump) {
        this.mobileStates.jumpPressed = false
      }

      // ROLL
      if (this.mobile.input.roll && !this.mobileStates.rollPressed) {
        this.mobileStates.rollPressed = true
        this.dash()
      }

      if (!this.mobile.input.roll) {
        this.mobileStates.rollPressed = false
      }
    }

    // ===== MOVIMENTO RELATIVO À CÂMERA =====
    const inputVector = new Vector3(moveX, 0, moveZ)

    // intensidade original
    let strength = inputVector.length()
    // limita diagonal
    strength = Math.min(strength, 1)

    // normaliza apenas direção
    if (inputVector.length() > 0) {
      inputVector.normalize()
    }

    // ===== DIREÇÃO RELATIVA À CÂMERA =====

    const direction = new Vector3(
      Math.sin(yaw) * inputVector.z + Math.cos(yaw) * inputVector.x,
      0,
      Math.cos(yaw) * inputVector.z - Math.sin(yaw) * inputVector.x,
    )

    // ===== VELOCIDADE ANALÓGICA =====

    const speed = this.mobile ? this.runSpeed * strength : this.currentSpeed
    const move = direction.multiplyScalar(speed)

    const vel = this.body.linvel()
    this.body.setLinvel(
      {
        x: move.x,
        y: vel.y,
        z: move.z,
      },
      true,
    )

    if (direction.lengthSq() > 0.0001 && this.model) {
      const targetRotation = Math.atan2(direction.x, direction.z)

      this.model.rotation.y = targetRotation
    }

    // ===== SYNC =====
    const pos = this.body.translation()
    // this.mesh.position.set(pos.x, pos.y, pos.z)
    if (this.model) {
      this.model.position.set(pos.x, pos.y - this.height / 2, pos.z)
    }

    // ===== CAMERA SYSTEM =====
    const distance = 2.2
    const height = 1.55
    const shoulderOffset = 0

    const target = new Vector3(
      this.position.x,
      this.position.y + height,
      this.position.z,
    )

    const dir = new Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    )

    // posição atrás do player
    const cameraPos = target.clone().sub(dir.clone().multiplyScalar(distance))

    // offset ombro
    const up = new Vector3(0, 1, 0)
    const right = new Vector3().crossVectors(dir, up).normalize()
    cameraPos.add(right.multiplyScalar(shoulderOffset))

    // suavização
    this.camera.position.lerp(cameraPos, 0.5)

    // look target
    const lookTarget = target.clone().add(dir.clone().multiplyScalar(10))
    this.camera.lookAt(lookTarget)

    // ===== DEBUG =====
    document.getElementById('player-position').innerHTML = this.toString()

    const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    // console.log(`SPEED: ${horizontalSpeed.toFixed(2)}`)

    const grounded = this.isOnGround()

    if (!grounded) {
      this.playAnimation('falling')
      // if (vel.y > 0) {
      //   this.playAnimation('jump')
      // } else {
      // }
    } else {
      if (horizontalSpeed < 0.1) {
        this.playAnimation('idle')
      } else if (horizontalSpeed < this.runSpeed * 0.6) {
        this.playAnimation('walk')
      } else {
        this.playAnimation('run')
      }
    }
  }

  isOnGround() {
    const origin = this.body.translation()

    const rayOrigin = {
      x: origin.x,
      y: origin.y - (this.height / 2 - this.radius),
      z: origin.z,
    }

    const ray = new this.rapier.Ray(rayOrigin, { x: 0, y: -2, z: 0 })

    const hit = this.world.castRay(
      ray,
      0.2,
      true,
      undefined,
      undefined,
      this.collider,
    )

    console.log(hit)

    return hit !== null
  }

  jump() {
    if (!this.isOnGround()) return

    this.playAnimation('jump')

    const vel = this.body.linvel()
    this.body.setLinvel(
      {
        x: vel.x,
        y: 10,
        z: vel.z,
      },
      true,
    )
  }

  dash() {
    const yaw = this.mouse.x
    const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize()

    this.body.applyImpulse(
      {
        x: forward.x * 8,
        y: 0,
        z: forward.z * 8,
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
        this.input.z = 1
        break

      case 'KeyS':
        this.input.z = -1
        break

      case 'KeyA':
        this.input.x = 1
        break

      case 'KeyD':
        this.input.x = -1
        break

      case 'KeyE':
      case 'Space':
        this.jump()
        break

      case 'ShiftLeft':
        this.currentSpeed = this.runSpeed
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
        this.currentSpeed = this.walkSpeed
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
