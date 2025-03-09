export const findMin = <T>(array: Iterable<T>, cond: (item: T) => number) => {
  let min = Infinity
  let minItem: T | null= null

  for (let item of array) {
    const d = cond(item)
    if (d < min) {
      min = d
      minItem = item
    }
  }

  return minItem
}

export const findMinIndex = <T>(array: Iterable<T>, cond: (item: T) => number) => {
  let min = Infinity
  let minIndex: number = -1
  
  let index = 0
  for (let item of array) {
    const d = cond(item)
    if (d < min) {
      min = d
      minIndex = index
    }
    index++
  }

  return minIndex
}