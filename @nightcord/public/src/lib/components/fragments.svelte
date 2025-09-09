<script lang="ts">
import { onDestroy, onMount } from 'svelte'
import * as _3 from 'three'

import { innerWidth, innerHeight } from 'svelte/reactivity/window'

import background from '$lib/assets/empty-sekai.png'
import { browser } from '$app/environment'

interface Props {
  count: number
}

const { count }: Props = $props()

let mouseover: _3.Mesh | null = null

const raycaster = new _3.Raycaster()
const pointer = new _3.Vector2()

let renderTarget: HTMLElement

let scene: _3.Scene
let camera: _3.PerspectiveCamera
let renderer: _3.WebGLRenderer
let group: _3.Object3D

let hemisphereLight: _3.HemisphereLight
let directionalLight: _3.DirectionalLight
let pointLight: _3.PointLight

function getTriangleShape(params: Fragment): _3.Shape {
  const { base, height, tip } = params

  const shape = new _3.Shape()
  shape.moveTo(0, height)
  shape.lineTo(tip, 0)
  shape.lineTo(base, height)
  shape.lineTo(0, height)

  return shape
}

function getBufferGeometry(params: Fragment): _3.BufferGeometry {
  const { base, height, tip } = params

  return new _3.BufferGeometry().setFromPoints([
    new _3.Vector3(0, height, 0),
    new _3.Vector3(tip, 0, 0),
    new _3.Vector3(base, height, 0),
  ])
}

interface Fragment {
  base: number
  height: number
  tip: number
  hue: number
  initialPhase: number
  initialRotation: _3.Euler
  rotationSpeed: _3.Vector3
  translationSpeed: number
  noiseH: number
  noiseV: number
  hasOutline: boolean
  object: _3.Object3D | null
}

function unif(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function bernoulli(p: number): boolean {
  return Math.random() < p
}

function randomFragment(): Fragment {
  let base: number = 0
  let height: number = 0
  while (base * height < 0.16) {
    base = unif(0, 3.2)
    height = unif(0, 3.2)
  }
  return {
    base,
    height,
    tip: unif(0, base),
    hue: unif(265, 360),
    initialPhase: unif(0, 2 * Math.PI),
    initialRotation: new _3.Euler(unif(0, 2 * Math.PI), unif(0, 2 * Math.PI), unif(0, 2 * Math.PI)),
    rotationSpeed: new _3.Vector3(unif(1, 5), unif(1, 5), unif(1, 5)),
    translationSpeed: unif(1, 3),
    noiseH: unif(-5, 5),
    noiseV: unif(-5, 5),
    hasOutline: bernoulli(0.25),
    object: null,
  }
}

let fragments: Fragment[] = []

const CAMERA_X = 0
const CAMERA_Y = 1.5
const CAMERA_Z = -55

let aspectRatio = 1.0

onMount(() => {
  addEventListener('pointermove', event => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  })
})

onMount(() => {
  scene = new _3.Scene()
  scene.fog = new _3.Fog(0xf9f9fb, 1, 100)

  hemisphereLight = new _3.HemisphereLight(0xf9f9fb, 0x6e7482, 2.0)
  scene.add(hemisphereLight)

  directionalLight = new _3.DirectionalLight(0xffffff, 4.0)
  directionalLight.castShadow = true
  directionalLight.position.set(2, 1, 1)
  directionalLight.target.position.set(0, 0, 0)
  scene.add(directionalLight)
  scene.add(directionalLight.target)

  pointLight = new _3.PointLight(0xffffff, 50.0)
  pointLight.castShadow = true
  pointLight.position.set(CAMERA_X, CAMERA_Y, CAMERA_Z)
  scene.add(pointLight)

  group = new _3.Object3D()
  scene.add(group)

  camera = new _3.PerspectiveCamera(/*fov=*/ 105, /*aspect=*/ 1.0, /*near=*/ 0.01, /*far=*/ 200)
  renderer = new _3.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = _3.VSMShadowMap

  camera.position.set(CAMERA_X, CAMERA_Y, CAMERA_Z)
  camera.lookAt(0, 0, 0)

  renderTarget.appendChild(renderer.domElement)
  renderer.domElement.style.background = `url("${background}") center center / cover no-repeat`

  renderer.setAnimationLoop(animate)
})

function clearScene() {
  group.clear()

  for (const frag of fragments) {
    if (!frag.object) continue
    frag.object.traverse(child => {
      if (child instanceof _3.Mesh || child instanceof _3.Line) {
        child.geometry.dispose()
        child.material.dispose()
      }
    })
  }
  fragments = []
}

onDestroy(() => {
  if (!browser) return
  console.log('Disposing Three.js resources')
  clearScene()
  hemisphereLight.dispose()
  directionalLight.dispose()
  pointLight.dispose()
  renderer.dispose()
})

function animate(now: DOMHighResTimeStamp) {
  const baseOrbitPeriod = 1200000 // ms
  const baseRotationPeriod = 1200000 // ms

  for (let ix = 0; ix < fragments.length; ix++) {
    const fragment = fragments[ix]
    if (!fragment.object) continue

    const orbitAngle =
      fragment.initialPhase + (now / (baseOrbitPeriod / fragment.translationSpeed)) * (2 * Math.PI)
    fragment.object.position.copy(getPosition(fragment, orbitAngle))

    const rotationAngleX =
      (now / (baseRotationPeriod / fragment.rotationSpeed.x)) * (2 * Math.PI) +
      fragment.initialRotation.x
    const rotationAngleY =
      (now / (baseRotationPeriod / fragment.rotationSpeed.y)) * (2 * Math.PI) +
      fragment.initialRotation.y
    const rotationAngleZ =
      (now / (baseRotationPeriod / fragment.rotationSpeed.z)) * (2 * Math.PI) +
      fragment.initialRotation.z
    fragment.object.rotation.set(rotationAngleX, rotationAngleY, rotationAngleZ)
  }

  camera.position.set(
    CAMERA_X - pointer.x * 0.05 * aspectRatio,
    CAMERA_Y + pointer.y * 0.05,
    CAMERA_Z,
  )
  pointLight.position.set(
    CAMERA_X - pointer.x * 2.5 * aspectRatio,
    CAMERA_Y + pointer.y * 2.5,
    CAMERA_Z,
  )

  // raycaster.setFromCamera(pointer, camera)
  // const intersects = raycaster.intersectObjects(group.children, true)

  // if (mouseover) {
  //   ;(mouseover.material as _3.MeshPhysicalMaterial).emissive.set(0x000000)
  //   mouseover = null
  // }
  // if (intersects.length > 0) {
  //   const newIntersect = intersects[0].object
  //   if (newIntersect instanceof _3.Mesh) {
  //     const material = newIntersect.material as _3.MeshPhysicalMaterial

  //     mouseover = newIntersect
  //     material.emissive.set(0xffffff)
  //     material.emissiveIntensity = 0.25
  //   }
  // }

  renderer.render(scene, camera)
}

// Depends: innerWidth, innerHeight
$effect(() => {
  if (!innerWidth.current || !innerHeight.current) return
  const w = innerWidth.current,
    h = innerHeight.current

  aspectRatio = w / h
  camera.aspect = aspectRatio
  camera.updateProjectionMatrix()

  renderer.setSize(w, h)
  renderer.render(scene, camera)
})

// Depends: count
$effect(() => {
  clearScene()
  for (let ix = 0; ix < count; ix++) {
    fragments.push(randomFragment())
  }

  for (const frag of fragments) {
    const object = new _3.Object3D()

    const shape = getTriangleShape(frag)
    const geometry = new _3.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelThickness: 0.02,
      bevelSize: 0.02,
    })
    const material = new _3.MeshPhysicalMaterial({
      color: new _3.Color().setHSL(Math.random() * 0.25 + 0.5, 0.5, 0.7),
      side: _3.DoubleSide,
      transparent: true,
      opacity: 0.5,
      roughness: 0.0,
      metalness: 0.0,
    })
    const mesh = new _3.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    object.add(mesh)

    if (frag.hasOutline) {
      const geometry = getBufferGeometry(frag)
      const outlineMaterial = new _3.LineBasicMaterial({
        color: 0xffffff,
      })
      const outline = new _3.LineLoop(geometry, outlineMaterial)
      object.add(outline)
      outline.rotateZ(0.1)
    }

    object.position.copy(getPosition(frag, frag.initialPhase))
    object.rotation.copy(frag.initialRotation)
    group.add(object)

    frag.object = object
  }
})

function getPosition(fragment: Fragment, progress: number): _3.Vector3 {
  const c = [fragment.noiseH, fragment.noiseV, fragment.noiseH]
  const angle = aspectRatio >= 0.75 ? 0.3 : Math.atan(1 / aspectRatio)

  const u = [50 * Math.cos(angle), -50 * Math.sin(angle), 0]
  const v = [0, 0, 50]

  return new _3.Vector3(
    c[0] + u[0] * Math.cos(progress) + v[0] * Math.sin(progress),
    c[1] + u[1] * Math.cos(progress) + v[1] * Math.sin(progress),
    c[2] + u[2] * Math.cos(progress) + v[2] * Math.sin(progress),
  )
}
</script>

<div bind:this={renderTarget}></div>
