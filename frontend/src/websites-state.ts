import { reactive } from 'vue'
import { api, type Website, type ListOptions } from './api'
export function useWebsites() {
  const state = reactive({
    websites: [] as Website[],
    count: 0,
    total: 0,
    loading: false,
    error: '',
  })
  let sequence = 0
  async function reload(options: ListOptions = { page: 1, pageSize: 12, search: '', tagIds: [] }) {
    const current = ++sequence
    state.loading = true
    state.error = ''
    try {
      const [list, all] = await Promise.all([api.list(options), api.count()])
      if (current !== sequence) return
      state.websites = list.websites
      state.total = list.total
      state.count = all.count
    } catch (cause) {
      if (current !== sequence) return
      state.websites = []
      state.total = 0
      state.count = 0
      state.error = cause instanceof Error ? cause.message : 'Unable to load data'
      throw cause
    } finally {
      if (current === sequence) state.loading = false
    }
  }
  function clear() {
    ++sequence
    state.websites = []
    state.total = 0
    state.count = 0
    state.loading = false
  }
  return { state, reload, clear }
}
