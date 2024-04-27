import { WatchSource, computed, reactive, ref, watch } from "vue"

type Options<T> = {
  required?: Array<keyof T>
}

const cloneDeep = <T>(obj: T): T => {
  if (typeof obj !== "object" || obj === null) return obj
  if (Array.isArray(obj)) {
    return [ ...obj ] as T
  }
  return Object.fromEntries(Object.entries(obj).map(([ key, value ]) => [ key, cloneDeep(value) ])) as T
}

/** Simple deep comparsion. If b has'n keys from a its equals */
const isEqual = (a: any, b: any) => {
  if (a === b) return true
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
    return true
  }

  for (let key in a) {
    if (!isEqual(a[key], b[key])) return false
  }
  return true
}

let globalErrorHandler = (_error: any, errors: any) => {}

export const setUseFormErrorHandler = (handler: (error: any, errors: Record<string, string>) => void) => {
  globalErrorHandler = handler
}

export const useForm = <T extends Record<string, any>>(defaultValues: T, options: Options<T> = {}) => {

  const pending = ref(false)
  const values = reactive(cloneDeep(defaultValues)) as T
  const errors = reactive<Partial<Record<keyof T, { code?: string, message?: string }>>>({})

  const oldValues: { [key: string]: string } = {}
  watch(values, () => {
    for (let [ key, value ] of Object.entries(values)) {
      if (key in errors && value !== oldValues[key]) {
        delete (errors as any)[key as keyof T]
      }
    }
    Object.assign(oldValues, values)
  })

  const requiredSet = computed(() => {
    return new Set(options.required)
  })

  const setError = (key: keyof T, error: { code?: string, message?: string }) => {
    (errors as any)[key] = error
  }

  const register = <K extends keyof T>(key: K) => {
    return {
      modelValue: values[key],
      "onUpdate:modelValue": (value: T[K]) => values[key] = value as any,
      error: (errors as any)[key],
      name: key,
      required: requiredSet.value.has(key)
    }
  }

  const checkRequired = (keys?: Array<keyof T>, setErrors = true) => {
    for (let key of (keys ?? options.required ?? [])) {
      const val = values[key]
      if (val === null || (typeof val === "string" && !val.trim() || (Array.isArray(val) && val.length === 0))) {
        if (setErrors) {
          setError(key, { code: "required" })
        }
        return false
      }
    }
    return true
  }

  const handleError = (e: any) => {
    globalErrorHandler(e, errors)
    for (let key in errors) {
      if (!(key in values)) {
        delete errors[key]
      }
    }
  }

  const handleSubmit = (submit: (values: T) => void | Promise<void>) => async (e: Event) => {
    e.preventDefault()
    if (!checkRequired()) return

    pending.value = true
    try {
      await submit(values)
    } catch(e) {
      handleError(e)
      throw e
    } finally {
      pending.value = false
    }
  }

  const updateDefaultValues = (newValues: Partial<T>) => {
    for (let [ key, value ] of Object.entries(newValues)) {
      if (key in values) {
        (values as any)[key] = cloneDeep(value);
        (defaultValues as any)[key] = value
      }
    }
    changeFlag.value = true
    changeFlag.value = false
  }

  /** Watch value and update form default values if its change */
  const updateDefaultValuesWatch = <D>(data: WatchSource<D>, map?: (obj: D) => T) => {
    watch(data, (data) => {
      if (!data) return
      updateDefaultValues(map? map(data): data)
    }, { immediate: true })
  }

  const changeFlag = ref(false)
  const setChange = () => {
    changeFlag.value = true
  }

  const hasChange = computed(() => {
    if (changeFlag.value) return true
    return !isEqual(values, defaultValues)
  })

  return {
    handleSubmit,
    register,
    setError,
    checkRequired,
    updateDefaultValues,
    updateDefaultValuesWatch,
    pending,
    values,
    hasChange,
    setChange
  }
}