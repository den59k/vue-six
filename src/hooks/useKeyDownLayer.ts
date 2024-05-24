import { WatchSource, watch } from "vue";
import { MultiMap } from "../utils/multimap";

const listeners = new MultiMap<string, (e: KeyboardEvent) => void>()
let hasEvent = false

/** Add layout for keydown event */
export const useKeyDownLayer = (key: string, watcher: WatchSource<boolean>, callback: () => void) => {

  const onKeyDown = (e: KeyboardEvent) => {
    if (!listeners.has(e.code)) return
    const _listeners = listeners.get(e.code)
    e.preventDefault()
    const callback = _listeners[_listeners.length-1]
    callback(e)
  }

  watch(watcher, (value) => {
    if (value) {
      listeners.add(key, callback)
    } else {
      listeners.remove(key, callback)
    }
    if (listeners.size > 0 && !hasEvent) {
      document.addEventListener("keydown", onKeyDown)
      hasEvent = true
    }
    if (listeners.size === 0) {
      document.removeEventListener("keydown", onKeyDown)
      hasEvent = false
    }
  }, { immediate: true })
}