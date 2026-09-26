import { reactive } from 'vue'
import { api, type Website } from './api'

export function useWebsites() {
  const state = reactive({ websites: [] as Website[], count: 0, loading: false, error: '' })
  async function reload() {
    state.loading = true
    state.error = ''
    try {
      const [list, total] = await Promise.all([api.list(), api.count()])
      state.websites = list.websites
      state.count = total.count
    } catch (cause) {
      state.websites = []
      state.count = 0
      state.error = cause instanceof Error ? cause.message : 'Unable to load data'
      throw cause
    } finally {
      state.loading = false
    }
  }
  return { state, reload }
}
