import { expect, it } from 'vitest'
import { ref } from 'vue'
import { useSearch } from '../../src'

it("test useSearch", async () => {

  const data = ref([{ name: "user1" }, { name: "user2" }, { name: "use another name" }, { name: "first" }])
  const searchValue = ref("")

  const result = useSearch(searchValue, data, item => item.name)

  searchValue.value = "u"
  expect(result.value).toEqual([ { name: "user1" }, { name: "user2" }, { name: "use another name" } ])

  searchValue.value = "user"
  expect(result.value).toEqual([ { name: "user1" }, { name: "user2" } ])

  searchValue.value = "name"
  expect(result.value).toEqual([ { name: "use another name" } ])

  searchValue.value = "st"
  expect(result.value).toEqual([])
})