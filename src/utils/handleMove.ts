export const isTouchEvent = (e: MouseEvent | TouchEvent | Touch): e is TouchEvent => {
  return "touches" in e
}

export function getPos(_e: MouseEvent | TouchEvent | Touch, relativeRect?: DOMRect, type?: MoveType, touchIndex = -1) {
  const e = isTouchEvent(_e)? _e.touches[touchIndex < 0? _e.touches.length-1: touchIndex]: _e
  if (!e) return { x: 0, y: 0 }

  if (relativeRect && type !== "absolute") {
    if (type === "threejs") {
      const _x = (e.clientX-relativeRect.left)/relativeRect.width * 2 - 1
      const _y = -(e.clientY-relativeRect.top)/relativeRect.height * 2 + 1
      return { x: _x, y: _y }
    } else {
      return { x: e.clientX - relativeRect.x, y: e.clientY - relativeRect.y }
    }
  } else {
    return { x: e.clientX, y: e.clientY }
  }
}

const getTouch = (e: MouseEvent | TouchEvent, touchId: number | null) => {
  if (isTouchEvent(e) && touchId !== null) {
    for (let touch of e.touches) {
      if (touch.identifier === touchId) return touch
    }
  }
  return e
}

export const clamp = (val: number, min: number, max: number) => {
  if (val > max) return max
  if (val < min) return min
  return val
}

type HandleCallbackProps = {
  e: MouseEvent | TouchEvent
  pos: { x: number, y: number },
  deltaPos: { x: number, y: number },
  startPos: { x: number, y: number }
}

type MoveType = "relative" | "absolute" | "threejs"

type HandleEventOpts = {
  onStart?: (props: HandleCallbackProps) => void
  onMove?: (props: HandleCallbackProps) => void,
  onEnd?: (props: HandleCallbackProps) => void,
  type?: MoveType,
  prevent?: boolean,
  threshold?: number,
  relativeRect?: DOMRect
}

/** Add document listener to track mouse move */
export function handleMove(e: TouchEvent | MouseEvent, { onStart, onMove, onEnd, relativeRect, type, prevent, threshold }: HandleEventOpts = {}) {

  const box = relativeRect ?? (e.currentTarget as HTMLElement).getBoundingClientRect()
  const touchId = isTouchEvent(e)? ((e.changedTouches[0] ?? e.touches[e.touches.length-1]).identifier): null

  const startPos = getPos(getTouch(e, touchId), box, type ?? "absolute")
  let lastPos = startPos

  let moving = false
  const move = (e: MouseEvent | TouchEvent) => {
    const pos = getPos(getTouch(e, touchId), box, type ?? "absolute")
    if (moving === false && threshold && Math.abs(pos.x - startPos.x) < threshold) {
      return
    }
    if (moving === false && threshold) {
      startPos.x = pos.x
      startPos.y = pos.y
      moving = true
    }
    if (!e.defaultPrevented && prevent !== false) {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    if (onMove){
      const deltaPos = { x: pos.x - lastPos.x, y: pos.y - lastPos.y}
      onMove({ e, pos, deltaPos, startPos })
    }
    lastPos = pos
  }

  const end = (e: MouseEvent | TouchEvent) => {
    if (isTouchEvent(e) && e.touches.length > 0 && e.changedTouches[0].identifier !== touchId) return
    if (!e.defaultPrevented && prevent !== false) {
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    dispose(e)
  }


  const dispose = (e: MouseEvent | TouchEvent) => {

    document.removeEventListener("touchmove", move)
    document.removeEventListener("mousemove", move)
    document.removeEventListener("touchend", end)
    document.removeEventListener("touchcancel", end)
    document.removeEventListener("mouseup", end)

    if (onEnd){
      const pos = getPos(getTouch(e, touchId), box, type ?? "absolute")
      if (pos.x === 0 && pos.y === 0) {
        onEnd({ e, pos: lastPos, startPos, deltaPos: { x: 0, y: 0 }})
        return
      }
      const deltaPos = { x: pos.x - lastPos.x, y: pos.y - lastPos.y}
      onEnd({ e, pos, startPos, deltaPos })
    }
  }

  if (onStart){
    onStart({ e, pos: startPos, deltaPos: { x: 0, y: 0 }, startPos })
  }
  move(e)
    
  if (isTouchEvent(e)) {
    document.addEventListener("touchmove", move, { passive: prevent !== true })
    document.addEventListener("touchend", end, { passive: prevent !== true })
    document.addEventListener("touchcancel", end, { passive: prevent !== true })
  } else {
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", end)
  }
}

type HandleRotateCallbackProps = {
  angle: number
  deltaAngle: number,
  e: MouseEvent
}

type HandleRotateEventOpts = {
  onStart?: (props: HandleRotateCallbackProps) => void
  onMove?: (props: HandleRotateCallbackProps) => void,
  onEnd?: (props: HandleRotateCallbackProps) => void
}

export function handleAngleMove(e: any, center: { x: number, y: number }, { onStart, onMove, onEnd }: HandleRotateEventOpts = {}) {

  const startPos = getPos(e)
  let startAngle = Math.atan2(startPos.y - center.y, startPos.x - center.x) 

  let lastAngle = 0
  const move = (e: any) => {
    const pos = getPos(e)
    const angle = (Math.atan2(pos.y - center.y, pos.x - center.x) - startAngle) / Math.PI * 180
    if (onMove)
      onMove({ angle, deltaAngle: angle-lastAngle, e })
    lastAngle = angle
  }

  const end = (e: any) => {
    const pos = getPos(e)
    const angle = (Math.atan2(pos.y - center.y, pos.x - center.x) - startAngle) / Math.PI * 180
    document.removeEventListener("touchmove", move)
    document.removeEventListener("mousemove", move)
    if (onEnd)
      onEnd({ angle, deltaAngle: angle-lastAngle, e })
  }

  move(e)
  if (onStart)
    onStart({ angle: 0, deltaAngle: 0, e })

  if (e.touches) {
    document.addEventListener("touchmove", move)
    document.addEventListener("touchend", end, { once: true })
  } else {
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", end, { once: true })
  }
}


type HandleScaleCallbackProps = {
  scale: number
  deltaScale: number
}

type HandleScaleEventOpts = {
  onStart?: (props: HandleScaleCallbackProps) => void
  onMove?: (props: HandleScaleCallbackProps) => void,
  onEnd?: (props: HandleScaleCallbackProps) => void
}

export function handleScaleMove(e: any, center: { x: number, y: number }, { onStart, onMove, onEnd }: HandleScaleEventOpts = {}) {

  const startPos = getPos(e)
  let startScale = Math.hypot(startPos.y - center.y, startPos.x - center.x)

  let lastScale = 1
  const move = (e: any) => {
    const pos = getPos(e)
    const scale = Math.hypot(pos.y - center.y, pos.x - center.x) / startScale
    if (onMove)
      onMove({ scale, deltaScale: scale/lastScale })
    lastScale = scale
  }

  const end = (e: any) => {
    const pos = getPos(e)
    const scale = Math.hypot(pos.y - center.y, pos.x - center.x) / startScale
    document.removeEventListener("touchmove", move)
    document.removeEventListener("mousemove", move)
    if (onEnd)
      onEnd({ scale, deltaScale: scale/lastScale })
  }

  move(e)
  if (onStart)
    onStart({ scale: 1, deltaScale: 1 })

  if (e.touches) {
    document.addEventListener("touchmove", move)
    document.addEventListener("touchend", end, { once: true })
  } else {
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", end, { once: true })
  }
}