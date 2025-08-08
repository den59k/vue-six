import { ref, watch } from "vue"

type Emit = (...args: any) => void

type Options<T> = {
  parseValue?: (str: string) => T,
  toStringValue?: (str: T) => string,
  defaultValue?: T
}

/** @deprecated Use defineModel Vue method */
export const useVModel = <P extends object, K extends keyof P>(props: P, key: K, emit: Emit, options: Options<P[K]> = {}) => {

  const value = ref<any>(options.defaultValue ?? "")
  let cachedValue: P[K] = options.defaultValue ?? (null as any)
  watch(() => props[key], (modelValue) => {
    if (modelValue === cachedValue) return
    if (modelValue === null || modelValue === undefined) {
      value.value = options.defaultValue ?? ""
      return
    }
    value.value = options.toStringValue? options.toStringValue(modelValue): modelValue.toString()
  }, { immediate: true })

  const parseValue = (str: string) => {
    if (options.parseValue) {
      return options.parseValue(str)
    }
    return str as P[K]
  }

  watch(value, (value: any) => {
    cachedValue = parseValue(value)
    emit("update:modelValue", cachedValue)
  })

  return value
}

export const numberParser = (str: string, integer: boolean = false) => {
  const parsed = integer? parseInt(str): parseFloat(str)
  if (isNaN(parsed)) return null
  return parsed
}