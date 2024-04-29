
export const cloneDeep = <T>(obj: T): T => {
  if (typeof obj !== "object" || obj === null) return obj
  if (Array.isArray(obj)) {
    return [ ...obj ] as T
  }
  return Object.fromEntries(Object.entries(obj).map(([ key, value ]) => [ key, cloneDeep(value) ])) as T
}

/** Simple deep comparsion. If b has'n keys from a its equals */
export const isEqual = (a: any, b: any) => {
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