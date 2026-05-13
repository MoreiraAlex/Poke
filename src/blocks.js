import {
  MeshLambertMaterial,
  NearestFilter,
  SRGBColorSpace,
  TextureLoader,
  RepeatWrapping,
  MeshBasicMaterial,
  DoubleSide,
  // } from 'three'
} from '../node_modules/three/build/three.module.js'

const textureLoader = new TextureLoader()

function loadTexture(path) {
  const texture = textureLoader.load(path)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

const textures = {
  dirt: loadTexture('textures/dirt.png'),
  grass: loadTexture('textures/pack/grass/grass-1-flower.png'),
  ground: loadTexture('textures/ground.png'),
  grassSide: loadTexture('textures/grass_side.png'),
  coalOre: loadTexture('textures/coal_ore.png'),
  ironOre: loadTexture('textures/iron_ore.png'),
  stone: loadTexture('textures/pack/rock-1/rock-2-4.png'),
  tree: loadTexture('textures/tree.png'),
  leaves: loadTexture('textures/leaves.png'),
  sand: loadTexture('textures/pack/sand/sand-2.png'),
  bush: loadTexture('textures/bush.png'),
  jungleTreeSide: loadTexture('textures/jungle_tree_side.png'),
  jungleTreeTop: loadTexture('textures/jungle_tree_top.png'),
  jungleLeaves: loadTexture('textures/jungle_leaves.png'),
  cactusSide: loadTexture('textures/cactus_side.png'),
  cactusTop: loadTexture('textures/cactus_top.png'),
  snow: loadTexture('textures/pack/snow/snow.png'),
  snowSide: loadTexture('textures/snow_side.png'),
  water: loadTexture('textures/waternormals.jpg'),
}

export const blocks = {
  empty: {
    id: 0,
    name: 'empty',
  },
  ground: {
    id: 2,
    name: 'ground',
    color: 0x807020,
    material: new MeshLambertMaterial({
      map: textures.ground,
      // side: DoubleSide,
    }),
  },
  grass: {
    id: 1,
    name: 'grass',
    color: 0x559020,
    material: [
      new MeshLambertMaterial({ map: textures.grassSide }), // right
      new MeshLambertMaterial({ map: textures.grassSide }), // left
      new MeshLambertMaterial({ map: textures.grass }), // top
      new MeshLambertMaterial({ map: textures.dirt }), // bottom
      new MeshLambertMaterial({ map: textures.grassSide }), // front
      new MeshLambertMaterial({ map: textures.grassSide }), // back
    ],
  },
  dirt: {
    id: 2,
    name: 'dirt',
    color: 0x807020,
    material: new MeshLambertMaterial({ map: textures.dirt }),
  },
  stone: {
    id: 3,
    name: 'stone',
    color: 0x808080,
    material: new MeshLambertMaterial({
      map: textures.stone,
    }),
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
  },
  coalOre: {
    id: 4,
    name: 'coalOre',
    color: 0x202020,
    material: new MeshLambertMaterial({
      map: textures.coalOre,
    }),
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
  },
  ironOre: {
    id: 5,
    name: 'ironOre',
    color: 0x806060,
    material: new MeshLambertMaterial({
      map: textures.ironOre,
    }),
    scale: { x: 60, y: 60, z: 60 },
    scarcity: 0.9,
  },
  tree: {
    id: 6,
    name: 'tree',
    color: 0x806060,
    material: new MeshLambertMaterial({
      map: textures.tree,
    }),
  },
  leaves: {
    id: 7,
    name: 'leaves',
    color: 0x806060,
    material: new MeshLambertMaterial({
      map: textures.leaves,
    }),
  },
  sand: {
    id: 8,
    name: 'sand',
    color: 0x806060,
    material: new MeshLambertMaterial({
      map: textures.sand,
    }),
  },
  cloud: {
    id: 9,
    name: 'cloud',
    visible: true,
    material: new MeshBasicMaterial({ color: 0xf0f0f0 }),
  },
  snow: {
    id: 10,
    name: 'snow',
    material: [
      new MeshLambertMaterial({ map: textures.snowSide }), // right
      new MeshLambertMaterial({ map: textures.snowSide }), // left
      new MeshLambertMaterial({ map: textures.snow }), // top
      new MeshLambertMaterial({ map: textures.dirt }), // bottom
      new MeshLambertMaterial({ map: textures.snowSide }), // front
      new MeshLambertMaterial({ map: textures.snowSide }), // back
    ],
  },
  jungleTree: {
    id: 11,
    name: 'jungleTree',
    material: [
      new MeshLambertMaterial({ map: textures.jungleTreeSide }), // right
      new MeshLambertMaterial({ map: textures.jungleTreeSide }), // left
      new MeshLambertMaterial({ map: textures.jungleTreeTop }), // top
      new MeshLambertMaterial({ map: textures.jungleTreeTop }), // bottom
      new MeshLambertMaterial({ map: textures.jungleTreeSide }), // front
      new MeshLambertMaterial({ map: textures.jungleTreeSide }), // back
    ],
  },
  jungleLeaves: {
    id: 12,
    name: 'jungleLeaves',
    material: new MeshLambertMaterial({ map: textures.jungleLeaves }),
  },
  cactus: {
    id: 13,
    name: 'cactus',
    material: [
      new MeshLambertMaterial({ map: textures.cactusSide }), // right
      new MeshLambertMaterial({ map: textures.cactusSide }), // left
      new MeshLambertMaterial({ map: textures.cactusTop }), // top
      new MeshLambertMaterial({ map: textures.cactusTop }), // bottom
      new MeshLambertMaterial({ map: textures.cactusSide }), // front
      new MeshLambertMaterial({ map: textures.cactusSide }), // back
    ],
  },
  jungleGrass: {
    id: 14,
    name: 'jungleGrass',
    material: [
      new MeshLambertMaterial({
        color: 0x80c080,
        map: textures.grassSide,
      }), // right
      new MeshLambertMaterial({
        color: 0x80c080,
        map: textures.grassSide,
      }), // left
      new MeshLambertMaterial({ color: 0x80c080, map: textures.grass }), // top
      new MeshLambertMaterial({ color: 0x80c080, map: textures.dirt }), // bottom
      new MeshLambertMaterial({
        color: 0x80c080,
        map: textures.grassSide,
      }), // front
      new MeshLambertMaterial({
        color: 0x80c080,
        map: textures.grassSide,
      }), // back
    ],
  },
  bush: {
    id: 15,
    name: 'bush',
    color: 0x806060,
    material: new MeshLambertMaterial({
      map: textures.bush,
      side: DoubleSide,
      transparent: true,
      alphaTest: 0.3,
    }),
  },
  water: {
    id: 16,
    name: 'water',
    texture: textures.water,
  },
}

export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre]
