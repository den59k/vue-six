export class PairMap<T, P, K> {
  _map = new Map<T, Map<P, K>>()

  set(keyA: T, keyB: P, value: K) {
    const map = this._map.get(keyA)
    if (map) {
      map.set(keyB, value)
      return
    }
    this._map.set(keyA, new Map([[ keyB, value ]]))
  }

  get(keyA: T, keyB: P) {
    const map = this._map.get(keyA)
    if (!map) return null
    return map.get(keyB) ?? null
  }

  deletePair(keyA: T) {
    this._map.delete(keyA)
  }
  
  delete(keyA: T, keyB: P) {
    const map = this._map.get(keyA)
    if (!map) return
    map.delete(keyB)
    if (map.size === 0) {
      this.deletePair(keyA)
    }
  }

  clear() {
    this._map.clear()
  }

}