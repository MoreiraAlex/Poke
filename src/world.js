// import { Group } from 'three'
import { Group } from '../node_modules/three/build/three.module.js'
import { WorldChunk } from './worldChunk'

export class World extends Group {
  constructor(seed = 0, rapier, physicsWorld) {
    super()
    this.rapier = rapier
    this.physicsWorld = physicsWorld

    this.asyncLoading = true
    this.drawDistance = 2
    this.seed = seed
    this.chunkSize = { width: 24, height: 64 }
    this.params = {
      seed: 0,
      terrain: {
        scale: 100,
        magnitude: 4,
        waterOffset: 24,
      },
      biomes: {
        scale: 2000,
        variation: {
          amplitude: 0.1,
          scale: 100,
        },
        transitions: {
          oceanToJungle: 0.26,
          jungleToForest: 0.32,
          forestToDesert: 0.68,
          desertToMountain: 0.74,
          mountainToSnow: 0.8,
          snowToOcean: 1,
        },
        biomeSettings: {
          Ocean: {
            offset: 12,
            rocks: {
              frequency: 0.005,
              maxCount: 4000,
              minSize: 0.4,
              maxSize: 1.2,
            },
          },
          Forest: {
            offset: 26,
            trees: {
              trunk: {
                minHeight: 5,
                maxHeight: 8,
              },
              canopy: {
                minRadius: 3,
                maxRadius: 3,
                density: 0.7, // Vary between 0.0 and 1.0
              },
              frequency: 0.005,
            },
            grass: {
              density: 1,
              minHeight: 0.7,
              maxHeight: 1.2,
              patchCount: 80,
              minPatchSize: 3,
              maxPatchSize: 7,
              minPatchDistance: 4,
            },
            rocks: {
              frequency: 0.01,
              maxCount: 2000,
              minSize: 0.5,
              maxSize: 1.5,
            },
          },
          Jungle: {
            offset: 26,
            trees: {
              trunk: {
                minHeight: 8,
                maxHeight: 15,
              },
              canopy: {
                minRadius: 3,
                maxRadius: 3,
                density: 0.7, // Vary between 0.0 and 1.0
              },
              frequency: 0.01,
            },
            grass: {
              density: 1,
              minHeight: 2,
              maxHeight: 2.8,
              patchCount: 80,
              minPatchSize: 3,
              maxPatchSize: 7,
              minPatchDistance: 4,
            },
            rocks: {
              frequency: 0.005,
              maxCount: 2000,
              minSize: 0.4,
              maxSize: 1.2,
            },
          },
          Desert: {
            offset: 28,
            trees: {
              trunk: {
                minHeight: 2,
                maxHeight: 4,
              },
              frequency: 0.001,
            },
            rocks: {
              frequency: 0.002,
              maxCount: 2000,
              minSize: 1,
              maxSize: 2,
            },
          },
          Mountain: {
            offset: 32,
            rocks: {
              frequency: 0.005,
              maxCount: 2000,
              minSize: 0.4,
              maxSize: 1.2,
            },
          },
          Snow: {
            offset: 34,
            rocks: {
              frequency: 0.005,
              maxCount: 2000,
              minSize: 0.4,
              maxSize: 1.2,
            },
          },
        },
      },
      trees: {
        trunk: {
          minHeight: 5,
          maxHeight: 8,
        },
        canopy: {
          minRadius: 3,
          maxRadius: 3,
          density: 0.7, // Vary between 0.0 and 1.0
        },
        frequency: 0.005,
      },
      grass: {
        density: 1,

        minHeight: 0.7,
        maxHeight: 1.2,

        patchCount: 80,

        minPatchSize: 3,
        maxPatchSize: 7,

        minPatchDistance: 4,
      },
      clouds: {
        scale: 20,
        density: 0.3,
      },
    }
  }

  update(player) {
    this.isUnderwater =
      player.camera.position.y < this.params.terrain.waterOffset

    const visibleChunks = this.getVisibleChunks(player)
    const chunksToAdd = this.getChunksToAdd(visibleChunks)
    this.removeUnusedChunks(visibleChunks)

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z)
    }
  }

  getVisibleChunks(player) {
    const visibleChunks = []

    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z,
    )

    const chunkX = coords.chunk.x
    const chunkZ = coords.chunk.z

    for (
      let x = chunkX - this.drawDistance;
      x <= chunkX + this.drawDistance;
      x++
    ) {
      for (
        let z = chunkZ - this.drawDistance;
        z <= chunkZ + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z })
      }
    }

    return visibleChunks
  }

  getChunksToAdd(visibleChunks) {
    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => chunk.x === x && chunk.z === z)

      return !chunkExists
    })
  }

  removeUnusedChunks(visibleChunks) {
    const chunkToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData
      const chunkExists = visibleChunks.find(
        (visibleChunk) => visibleChunk.x === x && visibleChunk.z === z,
      )

      return !chunkExists
    })

    for (const chunk of chunkToRemove) {
      chunk.disposeInstances()
      this.remove(chunk)
    }
  }

  animateWater(delta) {
    if (this.water) this.chunk.animateWater(delta)
  }

  generateChunk(x, z) {
    const chunk = new WorldChunk(
      this.chunkSize,
      this.params,
      this.rapier,
      this.physicsWorld,
    )
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width)
    chunk.userData = { x, z }

    if (this.asyncLoading) {
      // eslint-disable-next-line no-undef
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 })
    } else {
      chunk.generate()
    }
    // chunk.generate()
    // this.chunk = chunk
    // this.water = chunk.water
    this.add(chunk)
  }

  generate() {
    this.disposeChunks()

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        const chunk = new WorldChunk(
          this.chunkSize,
          this.params,
          this.rapier,
          this.physicsWorld,
        )
        chunk.position.set(
          x * this.chunkSize.width,
          0,
          z * this.chunkSize.width,
        )
        chunk.generate()
        chunk.userData = { x, z }
        this.add(chunk)
      }
    }
  }

  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    }

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z,
    }

    return { chunk: chunkCoords, block: blockCoords }
  }

  getChunk(chunkX, chunkZ) {
    return this.children.find(
      (chunk) => chunk.userData.x === chunkX && chunk.userData.z === chunkZ,
    )
  }

  getBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z)
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z)

    if (chunk && chunk.loaded) {
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z)
    }

    return null
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) chunk.disposeInstances()
    })

    this.clear()
  }
}
