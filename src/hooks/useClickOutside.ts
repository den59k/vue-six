import { type Ref, type ShallowRef, type WatchSource, watch } from "vue"
import { findParent } from "../utils/findParent"

type Item = Ref<HTMLElement | undefined> | ShallowRef<HTMLElement | undefined>

const clickOnIgnore = (target: HTMLElement, ignoreEl?: Item | Item[]) => {
  if (!ignoreEl) return false
  return !!findParent(target, (el) => {
    if (!Array.isArray(ignoreEl)) return el === ignoreEl.value
    for (const item of ignoreEl) {
      if (item.value === el) return true
    }
    return false
  })
}

/** Listen click outside element if condition true */
export const useClickOutside = (condition: WatchSource, onClick: () => void, ignoreEl?: Item | Item[]) => {

  const clickOutside = (e: MouseEvent) => {
    if (clickOnIgnore(e.target as HTMLElement, ignoreEl)) return

    document.addEventListener("mouseup", (e) => {
      if (clickOnIgnore(e.target as HTMLElement, ignoreEl)) return 
      onClick()
    }, { once: true })
  }
  
  watch(condition, value => {
    setTimeout(() => {
      if (value) {
        document.addEventListener("mousedown", clickOutside)
      } else {
        document.removeEventListener("mousedown", clickOutside)
      }
    }, 50)
  }, { flush: "post" })
}

export const useMouseDownOutside = (condition: WatchSource, onMouseDown: () => void, ignoreEl?: Item | Item[]) => {

  const clickOutside = (e: MouseEvent) => {
    if (e.defaultPrevented) return
    if (clickOnIgnore(e.target as HTMLElement, ignoreEl)) return
    onMouseDown()
  }

  watch(condition, value => {
    setTimeout(() => {
      if (value) {
        document.addEventListener("mousedown", clickOutside)
      } else {
        document.removeEventListener("mousedown", clickOutside)
      }
    }, 50)
  }, { flush: "post" })

}