import { reactive } from 'vue'
import { failure, success } from '../../shared/result'
import { api, type Website, type ListOptions, type ApiFailure } from './api'
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
    const [list, all] = await Promise.all([api.list(options), api.count()])
    if (current !== sequence) return success(undefined)

    state.loading = false
    function fail(error: ApiFailure) {
      state.websites = []
      state.total = 0
      state.count = 0
      state.error = error.message
      return failure(error)
    }

    if (list.code !== 0) return fail(list.error)
    if (all.code !== 0) return fail(all.error)

    state.websites = list.data.websites
    state.total = list.data.total
    state.count = all.data.count
    return success(undefined)
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
