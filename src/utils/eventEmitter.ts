import { MultiMap } from "./multimap"

export const createEventEmitter = <Events extends Record<string, (...args: any) => void>>() => {
  const _events = new MultiMap<keyof Events, any>()
  const addEventListener = <T extends keyof Events>(channel: T, event: Events[T]) => {
    _events.add(channel, event)
  }
  const removeEventListener = <T extends keyof Events>(channel: T, event: Events[T]) => {
    _events.remove(channel, event)
  }
  const dispatchPromise = <T extends keyof Events>(channel: T, ...args: Parameters<Events[T]>) => {
    return Promise.all(_events.get(channel).map(item => item(...args as any) as ReturnType<Events[T]>))
  }

  const dispatch = <T extends keyof Events>(channel: T, ...args: Parameters<Events[T]>) => {
    for (let callback of _events.get(channel)) {
      callback(...args as any)
    }
  }

  const removeAllListeners = () => {
    _events.clear()
  }

  return {
    addEventListener,
    removeEventListener,
    dispatch,
    dispatchPromise,
    removeAllListeners
  }
}