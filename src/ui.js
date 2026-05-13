import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

export function setupUI(scene, world, player) {
  const gui = new GUI()

  // const sceneFolder = gui.addFolder('Scene')
  // // sceneFolder.add(scene.fog, 'near', 1, 200, 1).name('Fog Near')
  // // sceneFolder.add(scene.fog, 'far', 1, 200, 1).name('Fog Far')

  // const grassFolder = gui.addFolder('Grass')
  // grassFolder.add(world.params.grass, 'density', 0, 1).name('Density')
  // grassFolder.add(world.params.grass, 'spread', 0, 1).name('Spread')
  // grassFolder.add(world.params.grass, 'minHeight', 0, 1).name('Min Height')
  // grassFolder.add(world.params.grass, 'maxHeight', 0, 1).name('Max Height')
  // grassFolder
  //   .add(world.params.grass, 'patchCount', 10, 100, 1)
  //   .name('Patch Count')
  // grassFolder
  //   .add(world.params.grass, 'minPatchSize', 0, 10, 1)
  //   .name('Min Patch Size')
  // grassFolder
  //   .add(world.params.grass, 'maxPatchSize', 0, 10, 1)
  //   .name('Max Patch Size')

  // const playerFolder = gui.addFolder('Player')
  // playerFolder.add(player, 'maxSpeed', 1, 20, 0.1).name('Max Speed')
  // playerFolder.add(player, 'jumpSpeed', 1, 10, 0.1).name('Jump Speed')
  // playerFolder.add(player.boundsHelper, 'visible').name('Show Player Bounds')
  // playerFolder.add(player.cameraHelper, 'visible').name('Show Camera Helper')

  // const treesFolder = gui.addFolder('Trees').close()
  // treesFolder.add(world.params.trees, 'frequency', 0, 0.1).name('Frequency')
  // treesFolder
  //   .add(world.params.trees.trunk, 'minHeight', 0, 10, 1)
  //   .name('Min Trunk Height')
  // treesFolder
  //   .add(world.params.trees.trunk, 'maxHeight', 0, 10, 1)
  //   .name('Max Trunk Height')
  // treesFolder
  //   .add(world.params.trees.canopy, 'minRadius', 0, 10, 1)
  //   .name('Min Canopy Size')
  // treesFolder
  //   .add(world.params.trees.canopy, 'maxRadius', 0, 10, 1)
  //   .name('Max Canopy Size')
  // treesFolder
  //   .add(world.params.trees.canopy, 'density', 0, 1)
  //   .name('Canopy Density')

  const worldFolder = gui.addFolder('World')
  worldFolder.add(world, 'asyncLoading', 0, 5, 1).name('AsyncLoading')
  worldFolder.add(world, 'drawDistance', 0, 5, 1).name('DrawDistance')

  // const terrainFolder = worldFolder.addFolder('Terrain').close()
  // terrainFolder.add(world.params, 'seed', 0, 1000).name('Seed')
  // terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale')
  // terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitude')
  // terrainFolder.add(world.params.terrain, 'offset', 0, 1).name('Offset')

  // const resourcesFolder = worldFolder.addFolder('Resources').close()
  // for (const resource of resources) {
  //   const resourceFolder = resourcesFolder.addFolder(resource.name)
  //   resourceFolder.add(resource, 'scarcity', 0, 1).name('Scarcity')
  //   resourceFolder.add(resource.scale, 'x', 10, 100).name('Scale X')
  //   resourceFolder.add(resource.scale, 'y', 10, 100).name('Scale Y')
  //   resourceFolder.add(resource.scale, 'z', 10, 100).name('Scale Z')
  // }

  gui.onChange(() => {
    world.generate()
  })
}
