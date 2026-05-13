import {
  BufferGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'

import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'

import { RNG } from './rng'
import { blocks } from './blocks'
import { Water } from 'three/examples/jsm/Addons.js'

export class WorldChunk extends Group {
  constructor(size, params, rapier, physicsWorld) {
    super()

    this.rapier = rapier
    this.physicsWorld = physicsWorld

    this.size = size
    this.params = params

    this.terrainMap = []
    this.loaded = false
  }

  generate() {
    const rng = new RNG(this.params.seed)
    this.setupGrassAnimation()

    this.initializeTerrain()
    this.generateTerrain(rng)

    this.generateSurfaceMesh(rng)
    this.generateCloudsMeshes(rng)

    this.loaded = true
  }

  /*
   * =========================================================
   * TERRAIN
   * =========================================================
   */

  initializeTerrain() {
    for (let x = 0; x < this.size.width; x++) {
      this.terrainMap[x] = []

      for (let z = 0; z < this.size.width; z++) {
        this.terrainMap[x][z] = {
          height: 0,
          biome: null,
          obj: null,
        }
      }
    }
  }

  generateTerrain(rng) {
    const simplex = new SimplexNoise(rng)

    const biomeSettings = this.params.biomes.biomeSettings
    const transitions = this.params.biomes.transitions

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const biomeInfo = this.getBiome(simplex, x, z)
        const biomeNoise = biomeInfo.noise

        const oceanData = biomeSettings.Ocean
        const jungleData = biomeSettings.Jungle
        const forestData = biomeSettings.Forest
        const desertData = biomeSettings.Desert
        const mountainData = biomeSettings.Mountain
        const snowData = biomeSettings.Snow

        let biomeA = oceanData
        let biomeB = jungleData

        let biomeNameA = 'Ocean'
        let biomeNameB = 'Jungle'

        let start = 0.14
        let end = 0.28

        if (biomeNoise < transitions.oceanToJungle) {
          biomeA = oceanData
          biomeB = jungleData

          biomeNameA = 'Ocean'
          biomeNameB = 'Jungle'

          start = 0.0
          end = transitions.oceanToJungle
        } else if (biomeNoise < transitions.jungleToForest) {
          biomeA = jungleData
          biomeB = forestData

          biomeNameA = 'Jungle'
          biomeNameB = 'Forest'

          start = transitions.oceanToJungle
          end = transitions.jungleToForest
        } else if (biomeNoise < transitions.forestToDesert) {
          biomeA = forestData
          biomeB = desertData

          biomeNameA = 'Forest'
          biomeNameB = 'Desert'

          start = transitions.jungleToForest
          end = transitions.forestToDesert
        } else if (biomeNoise < transitions.desertToMountain) {
          biomeA = desertData
          biomeB = mountainData

          biomeNameA = 'Desert'
          biomeNameB = 'Mountain'

          start = transitions.forestToDesert
          end = transitions.desertToMountain
        } else if (biomeNoise < transitions.mountainToSnow) {
          biomeA = mountainData
          biomeB = snowData

          biomeNameA = 'Mountain'
          biomeNameB = 'Snow'

          start = transitions.desertToMountain
          end = transitions.mountainToSnow
        } else {
          biomeA = snowData
          biomeB = oceanData

          biomeNameA = 'Snow'
          biomeNameB = 'Ocean'

          start = transitions.mountainToSnow
          end = 1
        }

        let blend = (biomeNoise - start) / (end - start)
        blend = Math.max(0, Math.min(1, blend))
        blend = blend * blend * (3 - 2 * blend)

        blend = Math.pow(blend, 5)

        const offset = biomeA.offset * (1 - blend) + biomeB.offset * blend
        const magnitude = this.params.terrain.magnitude

        const noise = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale,
        )

        const height = offset + magnitude * noise
        const biome = blend < 0.5 ? biomeNameA : biomeNameB

        this.terrainMap[x][z].height = Math.max(
          0,
          Math.min(height, this.size.height - 1),
        )
        this.terrainMap[x][z].biome = biome
      }
    }
  }

  getBiome(simplex, x, z) {
    let noise =
      simplex.noise(
        (this.position.x + x) / this.params.biomes.scale,

        (this.position.z + z) / this.params.biomes.scale,
      ) *
        0.5 +
      0.5

    noise +=
      this.params.biomes.variation.amplitude *
      simplex.noise(
        (this.position.x + x) / this.params.biomes.variation.scale,

        (this.position.z + z) / this.params.biomes.variation.scale,
      )
    noise = Math.max(0, Math.min(1, noise))

    if (noise < this.params.biomes.oceanToJungle) {
      return {
        type: 'Ocean',
        noise,
      }
    } else if (noise < this.params.biomes.jungleToForest) {
      return {
        type: 'Jungle',
        noise,
      }
    } else if (noise < this.params.biomes.forestToDesert) {
      return {
        type: 'Forest',
        noise,
      }
    } else if (noise < this.params.biomes.desertToMountain) {
      return {
        type: 'Desert',
        noise,
      }
    } else if (noise < this.params.biomes.mountainToSnow) {
      return {
        type: 'Mountain',
        noise,
      }
    } else if (noise < this.params.biomes.snowToOcean) {
      return {
        type: 'Snow',
        noise,
      }
    }

    return {
      type: 'Ocean',
      noise,
    }
  }

  /*
   * =========================================================
   * SURFACE
   * =========================================================
   */

  generateSurfaceMesh(rng) {
    this.clear()

    // this.generateWater()
    let hasWater = false

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        if (this.getTerrainHeight(x, z) <= this.params.terrain.waterOffset) {
          hasWater = true
          break
        }
      }

      if (hasWater) {
        break
      }
    }

    if (hasWater) {
      this.generateWater()
    }

    const width = this.size.width
    const depth = this.size.width

    const biomeGeometries = {}

    const biomeMaterials = {
      Forest: blocks.grass.material[2],
      Jungle: blocks.grass.material[2],
      Desert: blocks.sand.material,
      Snow: blocks.snow.material[2],
      Ocean: blocks.sand.material,
      Mountain: blocks.ground.material,
      Special: blocks.ground.material,
    }

    for (const biome in this.params.biomes.biomeSettings) {
      biomeGeometries[biome] = {
        vertices: [],
        indices: [],
        uvs: [],
        indexOffset: 0,
      }
    }

    const uvScale = 4

    /*
     * GEOMETRY
     */

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const biome = this.getTerrainBiome(x, z)
        const data = biomeGeometries[biome]

        const h00 = this.getTerrainHeight(x, z)
        const h10 = this.getTerrainHeight(x + 1, z)
        const h11 = this.getTerrainHeight(x + 1, z + 1)
        const h01 = this.getTerrainHeight(x, z + 1)

        const worldX = this.position.x + x
        const worldZ = this.position.z + z

        data.vertices.push(
          x,
          h00,
          z,

          x + 1,
          h10,
          z,

          x + 1,
          h11,
          z + 1,

          x,
          h01,
          z + 1,
        )

        data.uvs.push(
          worldX / uvScale,
          worldZ / uvScale,

          (worldX + 1) / uvScale,
          worldZ / uvScale,

          (worldX + 1) / uvScale,
          (worldZ + 1) / uvScale,

          worldX / uvScale,
          (worldZ + 1) / uvScale,
        )

        const i = data.indexOffset

        data.indices.push(
          i,
          i + 3,
          i + 1,

          i + 1,
          i + 3,
          i + 2,
        )

        data.indexOffset += 4
      }
    }

    /*
     * CREATE MESHES
     */

    for (const biome in biomeGeometries) {
      const data = biomeGeometries[biome]

      if (data.vertices.length === 0) {
        continue
      }

      const geometry = new BufferGeometry()
      geometry.setAttribute(
        'position',
        new Float32BufferAttribute(data.vertices, 3),
      )
      geometry.setAttribute('uv', new Float32BufferAttribute(data.uvs, 2))
      geometry.setIndex(data.indices)
      geometry.computeVertexNormals()

      const mesh = new Mesh(geometry, biomeMaterials[biome])

      mesh.castShadow = true
      mesh.receiveShadow = true

      this.add(mesh)

      /*
       * PHYSICS
       */

      const colliderDesc = this.rapier.ColliderDesc.trimesh(
        geometry.attributes.position.array,
        geometry.index.array,
      )

      const body = this.physicsWorld.createRigidBody(
        this.rapier.RigidBodyDesc.fixed().setTranslation(
          this.position.x,
          this.position.y,
          this.position.z,
        ),
      )

      this.physicsWorld.createCollider(colliderDesc, body)

      /*
       * RESOURCES
       */

      this.generateResources(rng, biome)
    }
  }

  /*
   * =========================================================
   * RESOURCES
   * =========================================================
   */

  generateResources(rng, biome) {
    if (biome === 'Forest' || biome === 'Jungle') {
      this.generateGrassMeshes(rng, biome)
      this.generateTreeMeshes(rng, biome)
    }

    if (biome === 'Desert') {
      this.generateTreeMeshes(rng, biome)
    }

    this.generateRockMeshes(rng, biome)
    // this.generateMontainMeshes(rng, biome)
  }

  /*
   * =========================================================
   * GRASS
   * =========================================================
   */

  generateGrassMeshesOld(rng, biome) {
    const biomeData = this.getBiomeData(biome)

    const validPositions = this.getBiomePositions(biome)

    if (validPositions.length === 0) {
      return
    }

    const patchCount = biomeData.grass.patchCount || 40

    const minDistance = biomeData.grass.minPatchDistance || 6

    const createdPatches = []

    for (let i = 0; i < patchCount; i++) {
      let tries = 0
      let validPosition = false

      let centerX = 0
      let centerZ = 0

      while (!validPosition && tries < 100) {
        const randomPosition =
          validPositions[Math.floor(rng.random() * validPositions.length)]

        centerX = randomPosition.x
        centerZ = randomPosition.z

        validPosition = true

        for (const patch of createdPatches) {
          const dx = patch.x - centerX
          const dz = patch.z - centerZ

          const dist = Math.sqrt(dx * dx + dz * dz)

          if (dist < minDistance) {
            validPosition = false
            break
          }
        }

        tries++
      }

      if (!validPosition) {
        continue
      }

      createdPatches.push({
        x: centerX,
        z: centerZ,
      })

      const radius =
        biomeData.grass.minPatchSize +
        Math.floor(
          rng.random() *
            (biomeData.grass.maxPatchSize - biomeData.grass.minPatchSize),
        )

      if (i < 5) {
        this.generateGrassPatch(rng, centerX, centerZ, radius, biome)
      }

      // this.generateGrassPatch(rng, centerX, centerZ, radius, biome)
    }
  }

  generateGrassMeshes(rng, biome) {
    const biomeData = this.getBiomeData(biome)
    const validPositions = this.getBiomePositions(biome)

    if (validPositions.length === 0) {
      return
    }

    const geometry = new PlaneGeometry(1, 1)
    geometry.translate(0, 0.5, 0)

    const maxBlades = 50000

    const grassMesh = new InstancedMesh(
      geometry,
      blocks.bush.material,
      maxBlades,
    )
    grassMesh.castShadow = true
    grassMesh.receiveShadow = true

    const matrix = new Matrix4()
    let bladeIndex = 0

    const patchCount = biomeData.grass.patchCount || 40
    const minDistance = biomeData.grass.minPatchDistance || 6

    const createdPatches = []

    for (let i = 0; i < patchCount; i++) {
      let tries = 0
      let validPosition = false

      let centerX = 0
      let centerZ = 0

      while (!validPosition && tries < 100) {
        const randomPosition =
          validPositions[Math.floor(rng.random() * validPositions.length)]

        centerX = randomPosition.x
        centerZ = randomPosition.z

        validPosition = true

        for (const patch of createdPatches) {
          const dx = patch.x - centerX
          const dz = patch.z - centerZ

          const dist = Math.sqrt(dx * dx + dz * dz)

          if (dist < minDistance) {
            validPosition = false
            break
          }
        }

        tries++
      }

      if (!validPosition) {
        continue
      }

      createdPatches.push({
        x: centerX,
        z: centerZ,
      })

      const radius =
        biomeData.grass.minPatchSize +
        Math.floor(
          rng.random() *
            (biomeData.grass.maxPatchSize - biomeData.grass.minPatchSize),
        )

      const bladeTotal = radius * radius * 15

      const baseHeight =
        biomeData.grass.minHeight +
        rng.random() * (biomeData.grass.maxHeight - biomeData.grass.minHeight)

      for (let j = 0; j < bladeTotal; j++) {
        if (bladeIndex >= maxBlades) {
          break
        }

        const angle = rng.random() * Math.PI * 2
        const distance = Math.sqrt(rng.random()) * radius

        const x = centerX + Math.cos(angle) * distance
        const z = centerZ + Math.sin(angle) * distance

        if (x < 0 || z < 0 || x >= this.size.width || z >= this.size.width) {
          continue
        }

        const groundHeight = this.getSurfaceHeight(x, z)

        if (groundHeight <= this.params.terrain.waterOffset + 1) {
          continue
        }

        const tiltX = (rng.random() - 0.5) * 0.15
        const tiltZ = (rng.random() - 0.5) * 0.15

        const height = baseHeight * (0.7 + rng.random() * 0.4)

        const width = 0.7 + rng.random() * 0.5

        const position = new Vector3(x, groundHeight - height / 4, z)

        const quaternion = new Quaternion().setFromEuler(
          new Euler(tiltX, 0, tiltZ),
        )

        const scale = new Vector3(width, height, 1)

        matrix.compose(position, quaternion, scale)

        grassMesh.setMatrixAt(bladeIndex, matrix)

        bladeIndex++
      }
    }

    grassMesh.count = bladeIndex
    grassMesh.instanceMatrix.needsUpdate = true

    this.add(grassMesh)
  }

  generateGrassPatch(rng, centerX, centerZ, radius, biome) {
    console.log('novo patch')
    const biomeData = this.getBiomeData(biome)

    // const geometry = new PlaneGeometry(1, 1, 1, 4)
    const geometry = new PlaneGeometry(1, 1)

    geometry.translate(0, 0.5, 0)

    const bladeTotal = radius * radius * 50

    const mesh = new InstancedMesh(geometry, blocks.bush.material, bladeTotal)

    mesh.castShadow = true
    mesh.receiveShadow = true

    const matrix = new Matrix4()

    let count = 0

    const baseHeight =
      biomeData.grass.minHeight +
      rng.random() * (biomeData.grass.maxHeight - biomeData.grass.minHeight)

    for (let i = 0; i < bladeTotal; i++) {
      const angle = rng.random() * Math.PI * 2
      const distance = Math.sqrt(rng.random()) * radius

      const x = centerX + Math.cos(angle) * distance
      const z = centerZ + Math.sin(angle) * distance

      if (x < 0 || z < 0 || x >= this.size.width || z >= this.size.width) {
        continue
      }

      const groundHeight = this.getSurfaceHeight(x, z)

      if (groundHeight <= this.params.terrain.waterOffset + 1) {
        continue
      }

      const tiltX = (rng.random() - 0.5) * 0.15
      const tiltZ = (rng.random() - 0.5) * 0.15

      const height = baseHeight * (0.7 + rng.random() * 0.4)
      const width = 0.7 + rng.random() * 0.5

      const position = new Vector3(x, groundHeight - height / 4, z)

      const quaternion = new Quaternion().setFromEuler(
        new Euler(tiltX, 0, tiltZ),
      )

      const scale = new Vector3(width, height, 1)

      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(count, matrix)

      count++
    }

    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true

    this.add(mesh)
  }

  /*
   * =========================================================
   * TREES
   * =========================================================
   */

  generateTreeMeshes(rng, biome) {
    const biomeData = this.getBiomeData(biome)
    const validPositions = this.getBiomePositions(biome, true)

    if (validPositions.length === 0) {
      return
    }

    const trunkGeometry = new CylinderGeometry(0.3, 0.5, 4, 6)
    const leavesGeometry = new IcosahedronGeometry(0.7, 0)

    const trunksMesh = new InstancedMesh(
      trunkGeometry,
      biome === 'Jungle'
        ? blocks.jungleTree.material
        : biome === 'Forest'
          ? blocks.tree.material
          : blocks.cactus.material[0],
      1000,
    )

    const leavesMesh = new InstancedMesh(
      leavesGeometry,
      biome === 'Jungle'
        ? blocks.jungleLeaves.material
        : blocks.leaves.material,
      20000,
    )

    trunksMesh.castShadow = true
    trunksMesh.receiveShadow = true

    leavesMesh.castShadow = true
    leavesMesh.receiveShadow = true

    const matrix = new Matrix4()

    let trunkCount = 0
    let leavesCount = 0

    const treeCount = Math.min(
      Math.floor(validPositions.length * biomeData.trees.frequency),
      1000,
    )

    for (let i = 0; i < treeCount; i++) {
      const randomPosition =
        validPositions[Math.floor(rng.random() * validPositions.length)]

      const { x, z, groundHeight } = randomPosition

      const minH = biomeData.trees.trunk.minHeight
      const maxH = biomeData.trees.trunk.maxHeight

      const trunkHeight = Math.round(minH + (maxH - minH) * rng.random())

      matrix.identity()
      matrix.makeScale(1, trunkHeight / 4, 1)
      matrix.setPosition(x, groundHeight - 1 + trunkHeight / 2, z)

      trunksMesh.setMatrixAt(trunkCount, matrix)

      trunkCount++
      this.setObj(x, z, 'tree')

      if (biome !== 'Desert') {
        leavesCount = this.generateTreeCanopy(
          matrix,
          leavesMesh,
          leavesCount,
          x,
          groundHeight + trunkHeight,
          z,
          rng,
          20000,
        )
      }

      const collider = this.rapier.ColliderDesc.cylinder(trunkHeight / 2, 0.4)
      const body = this.physicsWorld.createRigidBody(
        this.rapier.RigidBodyDesc.fixed().setTranslation(
          x + this.position.x,
          groundHeight + trunkHeight / 2 + this.position.y,
          z + this.position.z,
        ),
      )

      this.physicsWorld.createCollider(collider, body)
    }

    trunksMesh.count = trunkCount
    trunksMesh.instanceMatrix.needsUpdate = true

    leavesMesh.count = leavesCount
    leavesMesh.instanceMatrix.needsUpdate = true

    this.add(trunksMesh)

    if (biome !== 'Desert') {
      this.add(leavesMesh)
    }
  }

  generateTreeCanopy(
    matrix,
    leavesMesh,
    leavesCount,
    centerX,
    centerY,
    centerZ,
    rng,
    maxLeaves,
  ) {
    const minR = this.params.trees.canopy.minRadius

    const maxR = this.params.trees.canopy.maxRadius

    const radius = Math.round(minR + (maxR - minR) * rng.random())

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          if (x * x + y * y + z * z > radius * radius) {
            continue
          }

          if (
            rng.random() < this.params.trees.canopy.density &&
            leavesCount < maxLeaves
          ) {
            matrix.identity()

            matrix.setPosition(centerX + x, centerY + y, centerZ + z)

            leavesMesh.setMatrixAt(leavesCount, matrix)

            leavesCount++
          }
        }
      }
    }

    return leavesCount
  }

  /*
   * =========================================================
   * ROCKS
   * =========================================================
   */

  generateRockMeshes(rng, biome) {
    const biomeData = this.getBiomeData(biome)

    const validPositions = this.getBiomePositions(biome)

    if (validPositions.length === 0) {
      return
    }

    const geometry = new DodecahedronGeometry(1, 0)

    const mesh = new InstancedMesh(
      geometry,
      blocks.stone.material,
      biomeData.rocks.maxCount,
    )

    mesh.castShadow = true
    mesh.receiveShadow = true

    const matrix = new Matrix4()

    const quaternion = new Quaternion()
    const euler = new Euler()
    const scale = new Vector3()

    let count = 0

    const totalRocks = Math.min(
      Math.floor(validPositions.length * biomeData.rocks.frequency),
      biomeData.rocks.maxCount,
    )

    for (let i = 0; i < totalRocks; i++) {
      const randomPosition =
        validPositions[Math.floor(rng.random() * validPositions.length)]

      const { x, z, groundHeight } = randomPosition

      const size =
        biomeData.rocks.minSize +
        rng.random() * (biomeData.rocks.maxSize - biomeData.rocks.minSize)

      euler.set(
        rng.random() * Math.PI,
        rng.random() * Math.PI,
        rng.random() * Math.PI,
      )

      quaternion.setFromEuler(euler)

      scale.set(
        size * (0.8 + rng.random() * 0.4),
        size * (0.6 + rng.random() * 0.8),
        size * (0.8 + rng.random() * 0.4),
      )

      matrix.compose(new Vector3(x, groundHeight, z), quaternion, scale)

      mesh.setMatrixAt(count, matrix)

      count++
      this.setObj(x, z, 'rock')

      const collider = this.rapier.ColliderDesc.ball(size)

      const body = this.physicsWorld.createRigidBody(
        this.rapier.RigidBodyDesc.fixed().setTranslation(
          x + this.position.x,
          groundHeight + this.position.y,
          z + this.position.z,
        ),
      )

      this.physicsWorld.createCollider(collider, body)
    }

    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true

    this.add(mesh)
  }

  generateMontainMeshes(rng, biome) {
    const biomeData = this.getBiomeData(biome)

    const validPositions = this.getBiomePositions(biome)

    if (validPositions.length === 0) {
      return
    }

    const geometry = new DodecahedronGeometry(1, 0)

    const mesh = new InstancedMesh(
      geometry,
      blocks.stone.material,
      biomeData.rocks.maxCount,
    )

    mesh.castShadow = true
    mesh.receiveShadow = true

    const matrix = new Matrix4()

    const quaternion = new Quaternion()
    const euler = new Euler()
    const scale = new Vector3()

    let count = 0

    const totalRocks = 1
    // const totalRocks = Math.min(
    //   Math.floor(validPositions.length * biomeData.rocks.frequency),
    //   biomeData.rocks.maxCount,
    // )

    for (let i = 0; i < totalRocks; i++) {
      const randomPosition =
        validPositions[Math.floor(rng.random() * validPositions.length)]

      const { x, z, groundHeight } = randomPosition

      const size = 10
      // const size =
      // biomeData.rocks.minSize +
      // rng.random() * (biomeData.rocks.maxSize - biomeData.rocks.minSize)

      euler.set(
        rng.random() * Math.PI,
        rng.random() * Math.PI,
        rng.random() * Math.PI,
      )

      quaternion.setFromEuler(euler)

      scale.set(
        size * (0.8 + rng.random() * 0.4),
        size * (0.6 + rng.random() * 0.8),
        size * (0.8 + rng.random() * 0.4),
      )

      matrix.compose(new Vector3(x, groundHeight, z), quaternion, scale)

      mesh.setMatrixAt(count, matrix)

      count++
      this.setObj(x, z, 'montain')

      const collider = this.rapier.ColliderDesc.ball(size)

      const body = this.physicsWorld.createRigidBody(
        this.rapier.RigidBodyDesc.fixed().setTranslation(
          x + this.position.x,
          groundHeight + this.position.y,
          z + this.position.z,
        ),
      )

      this.physicsWorld.createCollider(collider, body)
    }

    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true

    this.add(mesh)
  }

  /*
   * =========================================================
   * CLOUDS
   * =========================================================
   */

  generateCloudsMeshes(rng) {
    const simplex = new SimplexNoise(rng)

    const geometry = new IcosahedronGeometry(0.7, 0)

    const mesh = new InstancedMesh(
      geometry,
      blocks.cloud.material,
      this.size.width * this.size.width,
    )

    const matrix = new Matrix4()

    let count = 0

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value =
          (simplex.noise(
            (this.position.x + x) / this.params.clouds.scale,
            (this.position.z + z) / this.params.clouds.scale,
          ) +
            1) *
          0.5

        if (value < this.params.clouds.density) {
          matrix.makeRotationX(-Math.PI / 2)

          matrix.setPosition(x, this.size.height - 1, z)

          mesh.setMatrixAt(count, matrix)

          count++
        }
      }
    }

    mesh.count = count

    this.add(mesh)
  }

  /*
   * =========================================================
   * WATER
   * =========================================================
   */

  generateWaterOld() {
    const material = new MeshLambertMaterial({
      color: 0x9090e0,
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
    })

    const mesh = new Mesh(new PlaneGeometry(), material)

    mesh.rotateX(-Math.PI / 2)

    mesh.position.set(
      this.size.width / 2,
      this.params.terrain.waterOffset - 0.05,
      this.size.width / 2,
    )

    mesh.scale.set(this.size.width, this.size.width, 1)

    this.add(mesh)
  }

  animateWater(delta) {
    this.water.material.uniforms.time.value += delta
  }

  generateWater() {
    this.generateWaterOld()
    const waterGeometry = new PlaneGeometry(this.size.width, this.size.width)

    const waterNormals = blocks.water.texture

    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x2d6cdf,
      distortionScale: 1.5,
      fog: false,
    })

    // water.material.uniforms.sunDirection.value = new Vector3(0, 1, 0)
    // water.material.side = DoubleSide
    // water.material.transparent = true
    // water.material.depthWrite = false

    water.rotation.x = -Math.PI / 2

    water.position.set(
      this.size.width / 2,
      this.params.terrain.waterOffset + 0.05,
      this.size.width / 2,
    )

    this.water = water
    this.add(water)
  }

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  setupGrassAnimation() {
    const material = blocks.bush.material

    if (material.userData.hasWind) {
      return
    }

    material.userData.hasWind = true

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }

      material.userData.shader = shader

      shader.vertexShader =
        `
    uniform float uTime;
  ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
    vec3 transformed = position;

    /*
     * WIND
     */

    float waveX =
      sin((instanceMatrix[3].x * 0.35) + uTime * 1.5);

    float waveZ =
      cos((instanceMatrix[3].z * 0.35) + uTime * 1.2);

    float wind = (waveX + waveZ) * 0.08;

    transformed.x += wind * uv.y;
    transformed.z += wind * 0.5 * uv.y;

    /*
     * BILLBOARD
     */

    vec3 instancePosition = vec3(
      instanceMatrix[3].x,
      instanceMatrix[3].y,
      instanceMatrix[3].z
    );

    vec3 cameraRight = vec3(
      modelViewMatrix[0][0],
      modelViewMatrix[1][0],
      modelViewMatrix[2][0]
    );

    vec3 cameraUp = vec3(0.0, 1.0, 0.0);

    transformed =
      cameraRight * transformed.x +
      cameraUp * transformed.y;
    `,
      )
    }
  }

  setupGrassAnimationA() {
    const material = blocks.bush.material

    if (material.userData.hasWind) {
      return
    }

    material.userData.hasWind = true

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }

      shader.vertexShader =
        `
        uniform float uTime;
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        float waveX =
          sin((instanceMatrix[3].x * 0.35) + uTime * 1.5);

        float waveZ =
          cos((instanceMatrix[3].z * 0.35) + uTime * 1.2);

        float wind = (waveX + waveZ) * 0.08;

        transformed.x += wind * uv.y;
        transformed.z += wind * 0.5 * uv.y;
      `,
      )

      material.userData.shader = shader
    }
  }

  getBiomePositions(biome, ignoreWater = false) {
    const positions = []

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const terrainBiome = this.getTerrainBiome(x, z)

        if (terrainBiome !== biome) {
          continue
        }

        const groundHeight = this.getSurfaceHeight(x, z)
        const obj = this.getObj(x, z)

        if (
          (ignoreWater && groundHeight <= this.params.terrain.waterOffset) ||
          obj
        ) {
          continue
        }

        positions.push({
          x,
          z,
          groundHeight,
        })
      }
    }

    return positions
  }

  getSurfaceHeight(x, z) {
    const x0 = Math.floor(x)
    const z0 = Math.floor(z)

    const x1 = Math.min(x0 + 1, this.size.width - 1)
    const z1 = Math.min(z0 + 1, this.size.width - 1)

    const h00 = this.getTerrainHeight(x0, z0)
    const h10 = this.getTerrainHeight(x1, z0)
    const h01 = this.getTerrainHeight(x0, z1)
    const h11 = this.getTerrainHeight(x1, z1)

    const tx = x - x0
    const tz = z - z0

    const h0 = h00 * (1 - tx) + h10 * tx
    const h1 = h01 * (1 - tx) + h11 * tx

    return h0 * (1 - tz) + h1 * tz
  }

  getTerrainHeight(x, z) {
    x = Math.max(0, Math.min(this.size.width - 1, x))
    z = Math.max(0, Math.min(this.size.width - 1, z))

    return this.terrainMap[x][z].height ?? 0
  }

  getTerrainBiome(x, z) {
    x = Math.max(0, Math.min(this.size.width - 1, x))
    z = Math.max(0, Math.min(this.size.width - 1, z))

    return this.terrainMap[x][z].biome ?? null
  }

  setObj(x, z, obj) {
    x = Math.max(0, Math.min(this.size.width - 1, x))
    z = Math.max(0, Math.min(this.size.width - 1, z))

    this.terrainMap[x][z].obj = obj
  }

  getObj(x, z) {
    x = Math.max(0, Math.min(this.size.width - 1, x))
    z = Math.max(0, Math.min(this.size.width - 1, z))

    return this.terrainMap[x][z].obj ?? null
  }

  getBiomeData(biome) {
    return this.params.biomes.biomeSettings[biome] ?? null
  }

  disposeInstances() {
    this.traverse((obj) => {
      if (obj.dispose) {
        obj.dispose()
      }
    })

    this.clear()
  }
}
