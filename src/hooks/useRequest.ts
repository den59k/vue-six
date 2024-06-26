import { UnwrapRef, WatchSource, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { MultiMap } from '../utils/multimap'

type DataEntry = { data: any, lastUpdate: number, promise?: Promise<any> }
const dataMap = new Map<any, Map<string, DataEntry>>()
const events = new MultiMap<any, () => Promise<void>>() // eslint-disable-line func-call-spacing

const getArgKey = (args: any[]) => {
  return args.length === 0 ? '_default' : JSON.stringify(args)
}

const getEntryOrCreate = <A extends any[]>(request: (...args: A) => Promise<any>, args: A, defaultValue: DataEntry) => {
  const argKey = getArgKey(args)
  let map = dataMap.get(request)
  if (!map) {
    map = new Map()
    dataMap.set(request, map)
  }
  const existsValue = map.get(argKey)
  if (existsValue) return existsValue

  map.set(argKey, defaultValue)
  return defaultValue
}

/** Fetching and catching result tool */
export const useRequest = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: A) => {
  const argKey = getArgKey(args)
  const defaultValue = dataMap.get(request)?.get(argKey) ?? null
  const pending = shallowRef(defaultValue === null)

  const data = shallowRef<R | null>(defaultValue?.data ?? null)
  const error = shallowRef(false)

  const getCachedValue = (args: A) => {
    const argKey = getArgKey(args)
    return dataMap.get(request)?.get(argKey) ?? null
  }

  let lastArgs = [] as any[] as A
  const mutate = async (...args: A) => {
    const entry = getEntryOrCreate(request, args, { data: null, lastUpdate: -1 })
    data.value = entry.data
    pending.value = entry === null
    lastArgs = args

    try {
      data.value = await makeRequestWithoutCache(entry, request, ...args)
    } catch (e) {
      error.value = true
      throw e
    } finally {
      delete entry.promise
      pending.value = false
    }
  }

  const mutateWithLastArgs = () => mutate(...lastArgs)

  onMounted(() => {
    const entry = getCachedValue(args)
    if (entry !== null && entry.lastUpdate > 0) {
      data.value = entry.data
      lastArgs = args
      return
    }
    mutate(...args)
  })

  onMounted(() => {
    events.add(request, mutateWithLastArgs)
  })
  onBeforeUnmount(() => {
    events.remove(request, mutateWithLastArgs)
  })

  return { data, error, pending, mutate }
}

type MapWatch <Type>= {
  [Key in keyof Type]: WatchSource<Type[Key]>;
};

/** useRequest with reactive arguments */
export const useRequestWatch = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: MapWatch<A>) => {
  const resp = useRequest(request, ...args.map(item => typeof item === "function"? item(): item.value) as A)

  watch(args, (args) => {
    resp.mutate(...args as A)
  })

  return resp
}

/** Revalidate request with any arguments */
export const mutateRequestFull = async <A extends any[]>(request: (...args: A) => Promise<any>) => {
  if (events.get(request).length === 0) {
    dataMap.delete(request)
  } else {
    await Promise.all((events.get(request) ?? []).map(callback => callback()))
  }
}

// TODO: exec promise only for specific arguments
/** Revalidate request with specific arguments */
export const mutateRequest = async <A extends any[]>(request: (...args: A) => Promise<any>, ...args: A) => {
  if (events.get(request).length === 0) {
    dataMap.get(request)?.delete(getArgKey(args))
  } else {
    await Promise.all((events.get(request) ?? []).map(callback => callback()))
  }
}

/** Reset all cache data */
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

/** Make cached request */
export const makeRequest = async <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: A) => {
  const entry = getEntryOrCreate(request, args, { data: null, lastUpdate: -1 })
  if (entry !== null && entry.lastUpdate > 0) {
    return entry.data
  }
  return await makeRequestWithoutCache(entry, request, ...args)
}