import { useMemo, useState } from 'react'

/** Client-side search, provider/status filters and sorting for the account list. */
export function useAccountFilters(accounts) {
  const [search, setSearch] = useState('')
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('provider')
  const [asc, setAsc] = useState(true)

  const providers = [...new Set(accounts?.map((a) => a.provider) ?? [])].sort()
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return (accounts ?? [])
      .filter(
        (a) =>
          (!provider || a.provider === provider) &&
          (status === 'all' || a.is_limit === (status === 'limited')) &&
          [a.provider, a.login_name, a.email, a.external_account_id].some((v) =>
            v.toLowerCase().includes(term),
          ),
      )
      .sort(
        (a, b) =>
          (typeof a[sort] === 'boolean'
            ? Number(a[sort]) - Number(b[sort])
            : String(a[sort]).localeCompare(String(b[sort]))) * (asc ? 1 : -1),
      )
  }, [accounts, provider, status, search, sort, asc])

  const clear = () => {
    setSearch('')
    setProvider('')
    setStatus('all')
  }
  const onSort = (key) => {
    setAsc(sort === key ? !asc : true)
    setSort(key)
  }

  return {
    search,
    setSearch,
    provider,
    setProvider,
    status,
    setStatus,
    sort,
    asc,
    onSort,
    providers,
    filtered,
    clear,
  }
}
