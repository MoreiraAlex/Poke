import {
  AmbientLight,
  CameraHelper,
  DirectionalLight,
  Fog,
  FogExp2,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
  // } from 'three'
} from '../node_modules/three/build/three.module.js'
import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from '../node_modules/three/addons/controls/OrbitControls.js'
import { setupUI } from './ui'
import { Player } from './player'
import { World } from './world'
import RAPIER from '@dimforge/rapier3d-compat'
import { blocks } from './blocks'

await RAPIER.init()
const gravity = { x: 0, y: -50, z: 0 }
const physicsWorld = new RAPIER.World(gravity)

// UI Setup
const stats = new Stats()
document.body.appendChild(stats.dom)

// Renderer setup
const renderer = new WebGLRenderer()
// const renderer = new WebGPURenderer()
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x80a0e0)
// renderer.setClearColor(0x0b1020)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFShadowMap
renderer.setAnimationLoop(update)
document.body.appendChild(renderer.domElement)

// Scene setup
const scene = new Scene()

// scene.fog = new Fog(0x80a0e0, 12, 24)

const timer = new Timer()
const world = new World(0, RAPIER, physicsWorld)

world.generate()
scene.add(world)

const player = new Player(scene, RAPIER, physicsWorld)
// const physics = new Physics(scene)

// Camera setup
const orbitCamera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
)
orbitCamera.position.set(24, 24, 24)

const controls = new OrbitControls(orbitCamera, renderer.domElement)
controls.target.set(8, 0, 8)
controls.update()

let sun
function setupLights() {
  sun = new DirectionalLight()
  sun.intensity = 1.5
  sun.position.set(50, 50, 50)
  sun.castShadow = true

  // Set the size of the sun's shadow box
  sun.shadow.camera.left = -40
  sun.shadow.camera.right = 40
  sun.shadow.camera.top = 40
  sun.shadow.camera.bottom = -40
  sun.shadow.camera.near = 0.1
  sun.shadow.camera.far = 200
  sun.shadow.bias = -0.0001
  sun.shadow.mapSize = new Vector2(2048, 2048)
  scene.add(sun)
  scene.add(sun.target)

  // const shadowHelper = new CameraHelper(sun.shadow.camera)
  // scene.add(shadowHelper)

  const ambient = new AmbientLight()
  ambient.intensity = 0.2
  scene.add(ambient)
}

// Render loop
function update(time) {
  let fog = null
  timer.update(time)
  const delta = timer.getDelta()

  if (player.controls.isLocked) {
    physicsWorld.step()

    player.update()
    world.update(player)

    if (world.isUnderwater) {
      fog = new FogExp2(0x2d6cdf, 0.05)
    } else {
      const viewDistance = (world.chunkSize.width - 1) * world.drawDistance
      fog = new Fog(0x80a0e0, viewDistance * 0.6, viewDistance * 0.95)
    }

    scene.fog = fog
    // if (world.chunk) world.animateWater(delta)
    // const water = world.getWater()
    // if (water) {
    //   console.log(water)
    //   water.material.uniforms.time.value += delta
    // }

    sun.position.copy(player.position)
    sun.position.sub(new Vector3(-50, -50, -50))
    sun.target.position.copy(player.position)
  }

  const shader = blocks.bush.material.userData.shader
  if (shader) {
    // shader.uniforms.uTime.value = performance.now() * 0.001
    shader.uniforms.uTime.value = performance.now() * 0.002
  }

  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera)
  stats.update()
}

window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  orbitCamera.aspect = window.innerWidth / window.innerHeight
  orbitCamera.updateProjectionMatrix()
  player.camera.aspect = window.innerWidth / window.innerHeight
  player.camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
})

setupLights()
// setupUI(scene, world, player)
// update()
