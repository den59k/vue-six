import { handleMove } from "../utils/handleMove"

type DraggableOptions = {
  onStart?: (item: HTMLElement) => void,
  onMove?: (e: MouseEvent, item: HTMLElement) => void,
  onEnd?: (e: MouseEvent) => void,
  threshold?: number
}

/** Clone element and move it follow mouse */
export const useDraggableItem = () => {
  let clonedItem: HTMLElement | null

  const drag = (e: MouseEvent, options: DraggableOptions) => {
    if (clonedItem) {
      clonedItem.remove()
      clonedItem = null
    }
    
    const el = (e.currentTarget as HTMLButtonElement)
    const rect = el.getBoundingClientRect()
    const offset = { left: rect.left - e.clientX, top: rect.top - e.clientY }
    const width = el.clientWidth
    
    const onStart = () => {
      clonedItem = el.cloneNode(true) as HTMLElement
      clonedItem.setAttribute("style", "position: fixed; pointer-events: none;")
      document.body.append(clonedItem)
      options.onStart?.(clonedItem)
    }
    const threshold = options.threshold ?? 10

    handleMove(e, {
      onMove({ e, pos, startPos }) {
        if (!clonedItem) {
          if (Math.abs(pos.x - startPos.x) > threshold || Math.abs(pos.y - startPos.y) > threshold) {
            onStart()
          }
          return
        }
        clonedItem.setAttribute(
          "style", 
          `position: fixed; top: ${pos.y + offset.top}px; left: ${pos.x + offset.left}px; width: ${width}px; pointer-events: none;`
        )
        options.onMove?.(e as MouseEvent, clonedItem)
      },
      onEnd({ e }) {
        if (!clonedItem) return
        clonedItem.remove()
        clonedItem = null
        options.onEnd?.(e as MouseEvent)
      },
      type: "absolute",
      prevent: false
    })
  }

  return drag
}