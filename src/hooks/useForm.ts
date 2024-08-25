import { WatchSource, computed, reactive, ref, watch } from "vue"
import { cloneDeep, isEqual } from "../utils/object"

type Options<T> = {
  required?: Array<keyof T>
}


let globalErrorHandler = (_error: any, _errors: any) => {}

export const setUseFormErrorHandler = (handler: (error: any, errors: Record<string, string>) => void) => {
  globalErrorHandler = handler
}

export const useForm = <T extends Record<string, any>>(defaultValues: T, options: Options<T> = {}) => {

  const pending = ref(false)
  const values = reactive(cloneDeep(defaultValues)) as T
  const errors = reactive<Partial<Record<keyof T & "_global", { code?: string, message?: string }>>>({})

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

  const checkRequired = (keys?: Array<keyof T>) => {
    for (let key of (keys ?? options.required ?? [])) {
      const val = values[key]
      if (val === null || (typeof val === "string" && !val.trim() || (Array.isArray(val) && val.length === 0))) {
        setError(key, { code: "required" })
        return false
      }
    }
    return true
  }

  const requiredFilled = computed(() => {
    for (let key of options.required ?? []) {
      const val = values[key]
      if (val === null || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
        return false
      }
    }
    return true
  })

  const handleError = (e: any) => {
    globalErrorHandler(e, errors)
    for (let key in errors) {
      if (!(key in values) && key !== "_global") {
        delete (errors as any)[key]
      }
    }
  }

  const handleSubmit = (submit: (values: T) => void | Promise<void>) => async (e: Event) => {
    e.preventDefault()
    if (!checkRequired()) return

    delete (errors as any)["_global"]
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
    errors,
    checkRequired,
    updateDefaultValues,
    updateDefaultValuesWatch,
    pending,
    values,
    hasChange,
    setChange,
    requiredFilled
  }
}