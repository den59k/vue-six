type DebounceOptions = {
  debounce?: number
}

/** Debounce function based on function arguments */
export const debounceWithArgs = <T extends (...args: any) => void>(callback: T, options: DebounceOptions = {}) => {

  const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

  return (...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    const timeout = timeouts.get(key)
    if (timeout) clearTimeout(timeout)

    const newTimeout = setTimeout(() => {
      callback(...args)
    }, options.debounce ?? 1000)
    timeouts.set(key, newTimeout)
  }
}