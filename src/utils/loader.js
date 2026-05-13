import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
const loader = new FBXLoader()

export function loadFBX(path) {
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject)
  })
}
