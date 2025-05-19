import { WatchSource, watch } from "vue";
import { MultiMap } from "../utils/multimap";

let listeners = new MultiMap<string, (e: KeyboardEvent) => void>()
let hasEvent = false

export const getKeyDownListeners = () => {
  return listeners
}
export const setKeyDownListeners = (_listeners: any) => {
  listeners = _listeners
}

export const handleKeyDownLayer = (e: KeyboardEvent) => {
  if (!listeners.has(e.code)) return
  const _listeners = listeners.get(e.code)
  e.preventDefault()
  const callback = _listeners[_listeners.length-1]
  callback(e)
}

/** Add layout for keydown event */
export const useKeyDownLayer = (key: string, watcher: WatchSource<boolean>, callback: () => void) => {

  watch(watcher, (value) => {
    if (value) {
      listeners.add(key, callback)
    } else {
      listeners.remove(key, callback)
    }
    if (listeners.size > 0 && !hasEvent) {
      document.addEventListener("keydown", handleKeyDownLayer)
      hasEvent = true
    }
    if (listeners.size === 0) {
      document.removeEventListener("keydown", handleKeyDownLayer)
      hasEvent = false
    }
  }, { immediate: true })
}
