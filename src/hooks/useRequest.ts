import { type Ref, type  UnwrapRef, type WatchSource, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { MultiMap } from '../utils/multimap'
import { PairMap } from '../utils/pairMap'

type DataEntry = { data: any, lastUpdate: number, promise?: Promise<any> }
const dataMap = new PairMap<any, string, DataEntry>()
const events = new MultiMap<any, () => Promise<void>>() // eslint-disable-line func-call-spacing

const getArgKey = (args: any[]) => {
  return args.length === 0 ? '' : JSON.stringify(args)
}

const getEntryOrCreate = <A extends any[]>(request: (...args: A) => Promise<any>, argKey: string, defaultValue: DataEntry) => {
  
  const existsValue = dataMap.get(request, argKey)
  if (existsValue) return existsValue

  dataMap.set(request, argKey, defaultValue)
  return defaultValue
}

type RequestOptions = {
  deep?: boolean
}

// type UseRequest<A extends any[], R> = {
//   data: Ref<R | null>, 
//   error: ShallowRef<any>, 
//   pending: ShallowRef<boolean>, 
//   mutate: (...args: A) => Promise<void>, 
//   lazyMutate: (...args: A) => Promise<void>, 
//   setReturnData: (callback: (...args: A) => any) => void
// }

/**
 * Extended version of useRequest with additional options.
 * @template A - The arguments type for the request function.
 * @template R - The return type of the request function.
 * @param {RequestOptions} options - Configuration options for the request.
 * @param {(...args: A) => Promise<R>} request - The async request function.
 * @param {...A} args - Arguments to pass to the request function.
 * @property {Ref<R|null>} data - Reactive reference to the request result.
 * @property {ShallowRef<any>} error - Reactive reference to any request error.
 * @property {ShallowRef<boolean>} pending - Reactive reference to the pending state.
 * @property {function} mutate - Function to manually trigger the request.
 * @property {function} lazyMutate - Function to conditionally trigger the request.
 * @property {function} setReturnData - Function to set a callback for custom data return.
 */
export const useRequestExt = <A extends any[], R>(options: RequestOptions, request: (...args: A) => Promise<R>, ...args: A) => {

  const defaultValue = dataMap.get(request, getArgKey(args))
  const pending = shallowRef(defaultValue === null)

  const data = (options.deep? ref: shallowRef)<R | null>(defaultValue?.data ?? null) as Ref<R | null>
  const error = shallowRef<any>(null)

  let lastArgs = [] as any[] as A
  let currentArgKey: string | null = null
  const mutate = async (...args: A) => {
    const argKey = getArgKey(args)
    currentArgKey = argKey

    error.value = null
    const returnDataValue = returnDataCallback?.(...args)
    if (returnDataValue !== undefined) {
      pending.value = false
      data.value = returnDataValue
      return
    }
    const entry = getEntryOrCreate(request, argKey, { data: null, lastUpdate: -1 })
    data.value = entry.data
    pending.value = entry.data === null
    lastArgs = args

    try {
      const resp = await makeRequestWithoutCache(entry, request, ...args)
      if (currentArgKey === argKey) {
        data.value = resp
      }
    } catch (e) {
      error.value = e
      // throw e
    } finally {
      delete entry.promise
      pending.value = false
    }
  }

  const lazyMutate = async (...args: A) => {
    const argKey = getArgKey(args)
    currentArgKey = argKey
    const entry = dataMap.get(request, argKey)
    if (entry !== null && entry.lastUpdate > 0 && Date.now() < entry.lastUpdate + 1000*30) {
      data.value = entry.data
      error.value = null
      lastArgs = args
      return
    }
    mutate(...args)
  }

  let returnDataCallback: (...args: A) => any
  const setReturnData = (callback: (...args: A) => any) => {
    returnDataCallback = callback
  }

  const mutateWithLastArgs = () => mutate(...lastArgs)

  onMounted(() => {
    lazyMutate(...args)
  })

  onMounted(() => {
    events.add(request, mutateWithLastArgs)
  })
  onBeforeUnmount(() => {
    events.remove(request, mutateWithLastArgs)
  })

  return { data, error, pending, mutate, lazyMutate, setReturnData }
}

/**
 * Deep reactive version of useRequest.
 * @template A - The arguments type for the request function.
 * @template R - The return type of the request function.
 * @param {(...args: A) => Promise<R>} request - The async request function.
 * @param {...A} args - Arguments to pass to the request function.
 */
export const useRequestDeep = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: A) => 
  useRequestExt({ deep: true }, request, ...args)

/**
 * Basic version of useRequest with shallow reactivity.
 * @template A - The arguments type for the request function.
 * @template R - The return type of the request function.
 * @param {(...args: A) => Promise<R>} request - The async request function.
 * @param {...A} args - Arguments to pass to the request function.
 */
export const useRequest = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: A) => 
  useRequestExt({ deep: false }, request, ...args)

type MapWatch <Type>= {
  [Key in keyof Type]: WatchSource<Type[Key]>;
};

/**
 * useRequest with reactive arguments that automatically re-fetches when args change.
 * @template A - The arguments type for the request function.
 * @template R - The return type of the request function.
 * @param {(...args: A) => Promise<R>} request - The async request function.
 * @param {...MapWatch<A>} args - Reactive arguments to watch.
 */
export const useRequestWatch = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: MapWatch<A>) => {
  const resp = useRequestExt({ deep: false }, request, ...args.map(item => typeof item === "function"? item(): item.value) as A)

  watch(args, (args) => {
    resp.lazyMutate(...args as A)
  })

  return resp
}

/**
 * Deep reactive version of useRequest with reactive arguments.
 * @template A - The arguments type for the request function.
 * @template R - The return type of the request function.
 * @param {(...args: A) => Promise<R>} request - The async request function.
 * @param {...MapWatch<A>} args - Reactive arguments to watch.
 */
export const useRequestDeepWatch = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: MapWatch<A>) => {
  const resp = useRequestExt({ deep: true }, request, ...args.map(item => typeof item === "function"? item(): item.value) as A)

  watch(args, (args) => {
    resp.lazyMutate(...args as A)
  })

  return resp
}

/**
 * Revalidates all cached data for a request function and optionally triggers updates.
 * @template A - The arguments type for the request function.
 * @param {(...args: A) => Promise<any>} request - The request function to revalidate.
 * @param {boolean} [triggerRequests=true] - Whether to trigger pending requests.
 * @returns {Promise<void>} A promise that resolves when revalidation is complete.
 */
export const mutateRequestFull = async <A extends any[]>(request: (...args: A) => Promise<any>, triggerRequests = true) => {
  dataMap.deletePair(request)
  if (triggerRequests && events.get(request).length > 0) {
    await Promise.all((events.get(request) ?? []).map(callback => callback()))
  }
}

// TODO: exec promise only for specific arguments
/**
 * Revalidates cached data for specific arguments of a request function.
 * @template A - The arguments type for the request function.
 * @param {(...args: A) => Promise<any>} request - The request function to revalidate.
 * @param {...A} args - Specific arguments to revalidate.
 * @returns {Promise<void>} A promise that resolves when revalidation is complete.
 */
export const mutateRequest = async <A extends any[]>(request: (...args: A) => Promise<any>, ...args: A) => {
  dataMap.delete(request, getArgKey(args))
  if (events.get(request).length > 0) {
    await Promise.all((events.get(request) ?? []).map(callback => callback()))
  }
}

/**
 * Clears all cached request data and event listeners.
 */
export const resetRequestCache = () => {
  events._map.clear()
  dataMap.clear()
}

const makeRequestWithoutCache = async <A extends any[], R>(entry: DataEntry, request: (...args: A) => Promise<R>, ...args: A) => {
  if (!entry.promise) {
    const promise = (async () => {
      const resp = await request(...args) as UnwrapRef<R>
      entry.data = resp
      entry.lastUpdate = Date.now()
      delete entry.promise
    })()
    entry.promise = promise
  }
  await entry.promise!
  return entry.data
}

/**
 * Makes a request with caching support.
 * @template A - The arguments type for the request function.
 * @template R - The return type of the request function.
 * @param {(...args: A) => Promise<R>} request - The async request function.
 * @param {...A} args - Arguments to pass to the request function.
 * @returns {Promise<R>} A promise that resolves with the request result.
 */
export const makeRequest = async <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: A) => {
  const argKey = getArgKey(args)
  const entry = getEntryOrCreate(request, argKey, { data: null, lastUpdate: -1 })
  if (entry !== null && entry.lastUpdate > 0) {
    return entry.data
  }
  return await makeRequestWithoutCache(entry, request, ...args)
}