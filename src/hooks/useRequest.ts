import { UnwrapRef, WatchSource, onBeforeUnmount, onMounted, onUnmounted, shallowRef, watch } from 'vue'
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

/** Fetching and catching result tool */
export const useRequest = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: A) => {

  const defaultValue = dataMap.get(request, getArgKey(args))
  const pending = shallowRef(defaultValue === null)

  const data = shallowRef<R | null>(defaultValue?.data ?? null)
  const error = shallowRef<any>(null)

  let lastArgs = [] as any[] as A
  let currentArgKey: string | null = null
  const mutate = async (...args: A) => {
    error.value = null
    const returnDataValue = returnDataCallback?.(...args)
    if (returnDataValue !== undefined) {
      pending.value = false
      data.value = returnDataValue
      return
    }
    const argKey = getArgKey(args)
    currentArgKey = argKey
    const entry = getEntryOrCreate(request, argKey, { data: null, lastUpdate: -1 })
    data.value = entry.data
    pending.value = entry === null
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
    const entry = dataMap.get(request, getArgKey(args))
    if (entry !== null && entry.lastUpdate > 0 && Date.now() < entry.lastUpdate + 1000*30) {
      data.value = entry.data
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

type MapWatch <Type>= {
  [Key in keyof Type]: WatchSource<Type[Key]>;
};

/** useRequest with reactive arguments */
export const useRequestWatch = <A extends any[], R>(request: (...args: A) => Promise<R>, ...args: MapWatch<A>) => {
  const resp = useRequest(request, ...args.map(item => typeof item === "function"? item(): item.value) as A)

  watch(args, (args) => {
    resp.lazyMutate(...args as A)
  })

  return resp
}

const dataReturn = new Map<any, () => any>()
export const useRequestReturn = <A extends any[]>(request: (...args: A) => Promise<any>, callback: (...args: A) => any) => {
  onMounted(() => {
    dataReturn.set(request, callback)
  })
  onUnmounted(() => {
    dataReturn.delete(request)
  })
}

/** Revalidate request with any arguments */
export const mutateRequestFull = async <A extends any[]>(request: (...args: A) => Promise<any>) => {
  if (events.get(request).length > 0) {
    await Promise.all((events.get(request) ?? []).map(callback => callback()))
  } else {
    dataMap.deletePair(request)
  }
}

// TODO: exec promise only for specific arguments
/** Revalidate request with specific arguments */
export const mutateRequest = async <A extends any[]>(request: (...args: A) => Promise<any>, ...args: A) => {
  if (events.get(request).length > 0) {
    await Promise.all((events.get(request) ?? []).map(callback => callback()))
  } else {
    dataMap.delete(request, getArgKey(args))
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
  const argKey = getArgKey(args)
  const entry = getEntryOrCreate(request, argKey, { data: null, lastUpdate: -1 })
  if (entry !== null && entry.lastUpdate > 0) {
    return entry.data
  }
  return await makeRequestWithoutCache(entry, request, ...args)
}