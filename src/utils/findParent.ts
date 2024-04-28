export const findParent = (el: HTMLElement, callback: (el: HTMLElement) => boolean): HTMLElement | null => {
  if (callback(el)) return el
  if (!el.parentElement) return null
  return findParent(el.parentElement, callback)
}