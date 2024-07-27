export const pick = <T extends object, K extends (keyof T)[]>(obj: T, ...keys: K): Pick<T, K[number]> => {
  return Object.fromEntries(
    Object.entries(obj).filter(k => keys.includes(k[0] as keyof T))
  ) as any
}