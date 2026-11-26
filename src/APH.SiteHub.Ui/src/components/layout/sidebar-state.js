export const SIDEBAR_KEY = 'sitehub-sidebar'

/** Whether the desktop sidebar was left collapsed last time. */
export function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  } catch {
    return false
  }
}
