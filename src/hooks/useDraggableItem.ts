import { handleMove } from "../utils/handleMove"

type DraggableOptions = {
  onStart?: (item: HTMLElement) => void,
  onMove?: (e: MouseEvent, item: HTMLElement) => void,
  onEnd?: (e: MouseEvent) => void
}

/** Clone element and move it follow mouse */
export const useDraggableItem = () => {
  let clonedItem: HTMLElement | null

  const drag = (e: MouseEvent, options: DraggableOptions) => {
    if (clonedItem) {
      clonedItem.remove()
    }
    const el = (e.currentTarget as HTMLButtonElement)
    const rect = el.getBoundingClientRect()
    const offset = { left: rect.left - e.clientX, top: rect.top - e.clientY }
    clonedItem = el.cloneNode(true) as HTMLElement
    const width = el.clientWidth
    clonedItem.setAttribute("style", "position: fixed; pointer-events: none;")
    document.body.append(clonedItem)

    options.onStart?.(clonedItem)

    handleMove(e, {
      onMove({ e, pos }) {
        if (!clonedItem) return
        clonedItem.setAttribute(
          "style", 
          `position: fixed; top: ${pos.y + offset.top}px; left: ${pos.x + offset.left}px; width: ${width}px; pointer-events: none;`
        )
        options.onMove?.(e as MouseEvent, clonedItem)
      },
      onEnd({ e }) {
        if (!clonedItem) return
        clonedItem.remove()
        options.onEnd?.(e as MouseEvent)
      },
      type: "absolute"
    })
  }

  return drag
}