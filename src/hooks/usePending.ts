import { ref } from "vue"

/** Mark pending true on promise execution time */
export const usePending = () => {
  const pending = ref(false)

  const handlePending = <T extends (...args: any) => Promise<any>>(callback: T) => {
    const f = async (...args: Parameters<T>) => {
      pending.value = true
      try {
        return await callback(...args)
      } finally {
        pending.value = false
      }
    }

    return f as T
  }

  return [ pending, handlePending ] as const
}