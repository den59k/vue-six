import { Ref, WatchSource, watch } from "vue"

export const findParent = (el: HTMLElement, callback: (el: HTMLElement) => boolean): HTMLElement | null => {
  if (callback(el)) return el
  if (!el.parentElement) return null
  return findParent(el.parentElement, callback)
}

/** Listen click outside element if condition true */
export const useClickOutside = (condition: WatchSource, onClick: () => void, ignoreEl?: Ref<HTMLElement | undefined>) => {

  const clickOutside = (e: MouseEvent) => {
    const parent = ignoreEl && ignoreEl.value && findParent(e.target as HTMLElement, el => el === ignoreEl.value)
    if (parent) return

    document.addEventListener("click", (e) => {
      const parent = ignoreEl && ignoreEl.value && findParent(e.target as HTMLElement, el => el === ignoreEl.value)
      if (parent) return
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