import { computed, reactive, shallowReactive } from "vue"

// const getters = new WeakMap<object, any>()

type Options = {
  shallow?: boolean
}

/** Make object props reactive. Replace getters to computed */
export const makeReactive = <T extends object>(obj: T, options: Options = {}) => {

  const result = options.shallow? shallowReactive(obj): reactive(obj)

  for (let [ key, value ] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(obj)))) {
    if (value.get) {
      const getter = computed(() => value.get!.apply(result))
      Object.defineProperty(result, key, {
        get: () => getter.value
      })
    }
  }

  return result as T
}