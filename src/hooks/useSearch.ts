import { WatchSource, computed, ref } from "vue"

export const getSearchFeed = (str: string, dotToSpace: boolean = true): string[] => {
  const reg = dotToSpace ? /[_\-,()]/g : /[_\-.,()]/g;
  const arr = str
    .toLowerCase()
    .replace(reg, " ")
    .split(" ")
    .filter(a => a.length > 0);
  return arr;
};

export const compareSearchFeed = (source: string[], target: string[]): boolean => {
  for (const str2 of target) {
    let find = false;
    for (const str of source) {
      if (str.startsWith(str2)) {
        find = true;
      }
    }
    if (!find) return false;
  }
  return true;
};

export const findByKeys = <T>(source: T[], keys: string[][], target: string[]) => {
  return source.filter((_, index) => compareSearchFeed(keys[index], target))
}

const getValue = <T>(item: WatchSource<T>): T => {
  return (typeof item === 'function'? item(): item.value)
}

/** Complex reactivity search based on key */
export const useSearch = <T>(data: WatchSource<T[]>, keyExtractor: (item: T) => string) => {
  
  const searchValue = ref("")
  const searchKeys = computed(() => {
    return getValue(data)?.map(item => getSearchFeed(keyExtractor(item))) ?? []
  })

  const dataSearched = computed(() => {
    const searchFeed = getSearchFeed(searchValue.value)
    const currentData = getValue(data)
    if (searchFeed.length === 0 || !currentData) return currentData

    return findByKeys(currentData, searchKeys.value, searchFeed)
  })

  return [ searchValue, dataSearched ] as const
}