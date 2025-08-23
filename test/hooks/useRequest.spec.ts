import { expect, it, vi } from 'vitest'
import { mutateRequest, useRequest } from '../../src'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { mount } from '@vue/test-utils'
import { updateRequestData } from '../../src/hooks/useRequest'

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
      setReturnData((arg: string) => {
        if (arg === "test") return "newResponse"
      })
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

it("test error useRequest", async () => {
  const request = vi.fn()
  
  const testComponent = defineComponent({
    setup() {
      const { data, error } = useRequest(request, "test")
      return {
        data, error
      }
    },
    render({ data, error }) {
      return h("div", error? "error": data)
    }
  })
  
  request.mockRejectedValue("test")

  const testComponentRender = mount(testComponent)
  expect(testComponentRender.text()).toBe("")

  await new Promise(res => setTimeout(res, 0))

  expect(request).toBeCalledTimes(1)
  expect(testComponentRender.text()).toBe("error")

  request.mockReturnValue("test")

  mutateRequest(request)

  await new Promise(res => setTimeout(res, 0))
  expect(request).toBeCalledTimes(2)
  expect(testComponentRender.text()).toBe("test")
})


it("test update request", async () => {

  const request = vi.fn(async () => "test")

  const testComponent = defineComponent({
    setup() {
      const { data } = useRequest(request)
      return { data }
    },
    render({ data }) {
      return h("div", data)
    }
  })

  const testComponentRender = mount(testComponent)

  expect(request).toBeCalledTimes(1)
  await new Promise(res => setTimeout(res, 0))

  expect(testComponentRender.text()).toBe("test")
  
  updateRequestData(request, "test2")
  await new Promise(res => setTimeout(res, 0))
  expect(testComponentRender.text()).toBe("test2")

})