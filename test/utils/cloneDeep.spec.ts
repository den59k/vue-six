import { expect, it } from 'vitest'
import { cloneDeep } from '../../src'

it("cloneDeep", () => {
  const obj = { a: "test", b: "test" }
  const _obj = cloneDeep(obj)
  expect(_obj === obj).toBeFalsy()
  expect(_obj).toEqual(obj)

  const arr = [ 1, 2, { obj: "test", obj2: "test2" } ]
  const _arr = cloneDeep(arr)
  expect(_arr === arr).toBeFalsy()
  expect(_arr).toEqual(arr)

  expect(_arr[2]).toEqual(arr[2])
  expect(_arr[2] === arr[2]).toBeFalsy()
  
})