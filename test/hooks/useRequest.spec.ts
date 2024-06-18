import { expect, it, vi } from 'vitest'
import { useRequest } from '../../src'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { mount } from '@vue/test-utils'

it("test useRequest", async () => {

  const request = vi.fn()

  const testComponent = defineComponent({
    setup() {
      const req = useRequest(request, "test")
      const req2 = useRequest(request, "test")
    },
    render() {
      return h("div")
    }
  })

  mount(testComponent)

  expect(request).toBeCalledTimes(1)
  expect(request).toBeCalledWith("test")
})

it("test useRequest with different args", async () => {

  const request = vi.fn()

  const testComponent = defineComponent({
    setup() {
      const req = useRequest(request, "test")
      const req2 = useRequest(request, "test2")
    },
    render() {
      return h("div")
    }
  })

  mount(testComponent)

  expect(request).toBeCalledTimes(2)
  expect(request).toBeCalledWith("test")
  expect(request).toBeCalledWith("test2")
})

it("test useRequest with condition", async () => {
  const request = vi.fn()

  const testComponent = defineComponent({
    setup() {
      const { data, setReturnData } = useRequest(request, "test")
      setReturnData("newResponse", "test")
      return {
        data
      }
    },
    render({ data }) {
      return h("div", data)
    }
  })

  const testComponentRender = mount(testComponent)
  expect(testComponentRender.text()).toBe("")

  await nextTick()
  
  expect(testComponentRender.text()).toBe("newResponse")

  expect(request).toBeCalledTimes(0)
})