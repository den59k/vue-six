export const query = (query: { [ key: string ]: string | number | boolean | null | undefined | string[] | number[] }, encodeURI = true) => {
  const keys = Object.keys(query)

  const params: string[] = []
  for (const key of keys) {
    const value = query[key]
    if (!value) continue
    if (Array.isArray(value)) {
      for (const val of value) {
        params.push(key + '[]=' + (encodeURI ? encodeURIComponent(val!.toString()) : val!.toString()))
      }
    } else {
      params.push(key + '=' + (encodeURI ? encodeURIComponent(value!.toString()) : value!.toString()))
    }
  }

  if (params.length === 0) return ''

  return '?' + params.join('&')
}

export const parseQuery = (url: string) => {
  const start = Math.max(url.indexOf('?') + 1, 0)

  if (start === url.length) return {}
  return Object.fromEntries(
    url
      .slice(start)
      .split('&')
      .map(item => item.split('='))
      .map(([key, item]) => [key, item ? decodeURIComponent(item) : true])
  )
}
