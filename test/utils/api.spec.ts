import { expect, it } from 'vitest'
import { parseQuery, query } from '../../src'

it("test build query", () => {

  expect(query({ name: "user", age: 1 })).toBe("?name=user&age=1")

  expect(query({ name: undefined })).toBe("")

  expect(query({ name: [ "user", "user1" ], count: 2 })).toBe("?name[]=user&name[]=user1&count=2")

  expect(query({ name: "Пользователь" })).toBe(`?name=${encodeURIComponent("Пользователь")}`)

})

it("test parse query", () => {

  expect(parseQuery("name=tester")).toEqual({ name: "tester" })
  expect(parseQuery("")).toEqual({  })
  expect(parseQuery("name")).toEqual({ name: true })

})