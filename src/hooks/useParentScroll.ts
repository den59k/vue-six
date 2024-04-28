import { onBeforeUnmount, watch, ShallowRef, Ref, WatchSource } from 'vue'
import { findParent } from "../utils/findParent"

type ElementRef = ShallowRef<HTMLElement | undefined> | Ref<HTMLElement | undefined>

/** Attach scroll listener to nearest scroll element */
export const useParentScroll = (active: WatchSource<boolean>, anchorEl: ElementRef, onScroll: () => void) => {
  let parentItem: HTMLElement | Window | null = null

  watch(active, (opened) => {
    if (!opened || !anchorEl.value) {
      if (parentItem) {
        parentItem.removeEventListener('scroll', onScroll)
        parentItem = null
      }
      return
    }
    parentItem = findParent(anchorEl.value, el => el.classList.contains('scroll')) ?? window
    parentItem.addEventListener('scroll', onScroll)
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    if (parentItem) parentItem.removeEventListener('scroll', onScroll)
  })
}
