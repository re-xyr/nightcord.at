import * as _3 from 'three'
import { bernoulli, unif } from './util'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { animate } from 'animejs'

export interface FragmentInit {
  // Size of the bounding box of the Fragment.
  size: _3.Vector2
  // Where the tip of the Fragment is relative to the left end of the base.
  tip: number
  // The hue of the Fragment, in degrees.
  hue: number
  // The orbital phase of the Fragment, in radians.
  orbit: number
  // The orbital speed of the Fragment, in rad/ms.
  orbitSpeed: number
  // The initial self-rotation of the Fragment, as a Euler angle.
  spin: _3.Euler
  // The axis of the self-rotation.
  spinAxis: _3.Vector3
  // The intrinsic spin speed of the Fragment, in rad/ms.
  spinSpeed: number
  // The offset of the Fragment, in the xz-plane.
  offset: _3.Vector2
  // Whether the Fragment has a fixed-width white outline.
  hasOutline: boolean

  // Aspect ratio of the viewport, used to determine the shape of the orbit.
  aspectRatio: { current: number }
}

export class Fragment {
  size: _3.Vector2
  tip: number
  hue: number
  initialOrbit: number
  orbit: number
  orbitSpeed: number
  initialSpin: _3.Euler
  spinAxis: _3.Vector3
  intrinsicSpinSpeed: number
  spinSpeed: number
  offsetH: number
  offsetV: number
  hasOutline: boolean
  aspectRatio: { current: number }

  lastUpdate: DOMHighResTimeStamp = 0
  object: _3.Object3D
  mesh: _3.Mesh
  outline: Line2 | null = null

  private constructor(opts: FragmentInit) {
    this.size = opts.size
    this.tip = opts.tip
    this.hue = opts.hue

    this.orbit = this.initialOrbit = opts.orbit
    this.orbitSpeed = opts.orbitSpeed
    this.initialSpin = opts.spin
    this.spinAxis = opts.spinAxis
    this.spinSpeed = this.intrinsicSpinSpeed = opts.spinSpeed
    this.offsetH = opts.offset.x
    this.offsetV = opts.offset.y
    this.hasOutline = opts.hasOutline
    this.aspectRatio = opts.aspectRatio

    this.object = new _3.Object3D()
    const shape = this.getTriangleShape()
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
      emissive: new _3.Color(0xffffff),
      emissiveIntensity: 0.0,
    })
    this.mesh = new _3.Mesh(geometry, material)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.object.add(this.mesh)

    if (this.hasOutline) {
      const geometry = this.getLineGeometry()
      const outlineMaterial = new LineMaterial({
        linewidth: 2, // CSS pixels
        color: 0xffffff,
      })
      this.outline = new Line2(geometry, outlineMaterial)
      this.object.add(this.outline)
      this.outline.rotateZ(0.1)
    }

    this.object.position.copy(this.getPosition())
    this.object.rotation.copy(this.initialSpin)
  }

  static make(aspectRatio: { current: number }): Fragment {
    let base: number = 0
    let height: number = 0
    while (base * height < 0.16) {
      base = unif(0, 3.2)
      height = unif(0, 3.2)
    }
    return new Fragment({
      size: new _3.Vector2(base, height),
      tip: unif(0, base),
      hue: unif(265, 360), // blue to purple
      orbit: unif(0, 2 * Math.PI),
      orbitSpeed: unif(0, 0.000003),
      spin: new _3.Euler(unif(0, 2 * Math.PI), unif(0, 2 * Math.PI), unif(0, 2 * Math.PI)),
      spinAxis: new _3.Vector3(unif(-1, 1), unif(-1, 1), unif(-1, 1)).normalize(),
      spinSpeed: unif(0, 0.0001),
      offset: new _3.Vector2(unif(-5, 5), unif(-5, 5)),
      hasOutline: bernoulli(0.25),

      aspectRatio,
    })
  }

  private getTriangleShape(): _3.Shape {
    const { x: base, y: height } = this.size
    const { tip } = this

    const shape = new _3.Shape()
    shape.moveTo(-base / 2, -height / 2)
    shape.lineTo(base / 2, -height / 2)
    shape.lineTo(-base / 2 + tip, height / 2)
    shape.lineTo(-base / 2, -height / 2)

    return shape
  }

  private getLineGeometry(): LineGeometry {
    const { x: base, y: height } = this.size
    const { tip } = this
    return new LineGeometry().setPositions([
      -base / 2,
      -height / 2,
      0,
      base / 2,
      -height / 2,
      0,
      -base / 2 + tip,
      height / 2,
      0,
      -base / 2,
      -height / 2,
      0,
    ])
  }

  private getPosition(): _3.Vector3 {
    const c = [0, this.offsetV, 0]
    const angle = this.aspectRatio.current >= 0.75 ? 0.3 : Math.atan(1 / this.aspectRatio.current)

    const r = 50 + this.offsetH
    const u = [r * Math.cos(angle), -r * Math.sin(angle), 0]
    const v = [0, 0, r]

    return new _3.Vector3(
      c[0] + u[0] * Math.cos(this.orbit) + v[0] * Math.sin(this.orbit),
      c[1] + u[1] * Math.cos(this.orbit) + v[1] * Math.sin(this.orbit),
      c[2] + u[2] * Math.cos(this.orbit) + v[2] * Math.sin(this.orbit),
    )
  }

  advance(now: DOMHighResTimeStamp): void {
    this.orbit = this.initialOrbit + now * this.orbitSpeed * (2 * Math.PI)
    this.update(now)
  }

  update(now: DOMHighResTimeStamp): void {
    this.object.position.copy(this.getPosition())
    this.object.rotateOnAxis(this.spinAxis, this.intrinsicSpinSpeed * (now - this.lastUpdate))

    this.lastUpdate = now
  }

  poke(): void {
    this.spinSpeed = this.intrinsicSpinSpeed * 10
    animate(this, {
      offsetH: this.offsetH - 5,
      spinSpeed: this.intrinsicSpinSpeed,
      duration: 10000,
      easing: 'inOutQuad',
    })
  }

  hover(): void {
    animate(this.mesh.material as _3.MeshPhysicalMaterial, {
      emissiveIntensity: 1.0,
      duration: 250,
      easing: 'inQuad',
    })
  }

  unhover(): void {
    animate(this.mesh.material as _3.MeshPhysicalMaterial, {
      emissiveIntensity: 0.0,
      duration: 250,
      easing: 'outQuad',
    })
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as _3.MeshPhysicalMaterial).dispose()
    if (this.outline) {
      this.outline.geometry.dispose()
      this.outline.material.dispose()
    }
  }
}
