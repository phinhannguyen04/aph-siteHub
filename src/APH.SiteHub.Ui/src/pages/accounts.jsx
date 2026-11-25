import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHead } from '@/components/shell'
import { Busy, Button, Empty, ErrorBox, localDate, SearchBox, Select } from '@/components/ui'
import { AccountDetail } from '@/features/account-detail'
import { AccountForm } from '@/features/account-form'
import { Status } from '@/features/account-status'
import { DeleteAccountDialog } from '@/features/delete-dialogs'
import { query } from '@/lib/api'
import { c } from '@/lib/copy'

function Stats({ stats }) {
  if (stats.error) return <ErrorBox error={stats.error} retry={() => void stats.refetch()} />
  const s = stats.data?.stats
  const share = s && s.total > 0 ? (s.limited / s.total) * 100 : 0
  return (
    <div className="stats" aria-live="polite">
      <div className="card stat">
        <span>{c.total}</span>
        <b>{s?.total ?? '–'}</b>
        <div className="bar" aria-hidden>
          <i style={{ width: `${share}%` }} />
        </div>
      </div>
      <div className="card stat">
        <span>{c.unlimited}</span>
        <b>{s?.unlimited ?? '–'}</b>
      </div>
      <div className="card stat">
        <span>{c.limited}</span>
        <b>{s?.limited ?? '–'}</b>
      </div>
      {s?.providers.map((p) => (
        <div key={p.provider} className="card stat">
          <span>{p.provider}</span>
          <b>{p.total}</b>
          <span className="help">
            {' '}
            {p.limited} {c.limited.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  )
}

const columns = [
  ['provider', c.provider],
  ['login_name', c.loginName],
  ['email', c.email],
  ['external_account_id', c.externalId],
  ['is_limit', c.status],
  ['created_at', c.createdAt],
]

function Actions({ account, onEdit, onDelete }) {
  return (
    <div className="row-actions">
      <Button
        variant="ghost"
        size="sm"
        icon
        aria-label={`${c.edit}: ${account.login_name}`}
        onClick={() => onEdit(account)}
      >
        <Pencil size={15} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon
        aria-label={`${c.delete}: ${account.login_name}`}
        onClick={() => onDelete(account)}
      >
        <Trash2 size={15} />
      </Button>
    </div>
  )
}

export function Accounts() {
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: () => query('/api/accounts') })
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => query('/api/accounts/stats') })
  const [search, setSearch] = useState('')
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('provider')
  const [asc, setAsc] = useState(true)
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const providers = [...new Set(accounts.data?.accounts.map((a) => a.provider) ?? [])].sort()
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return (accounts.data?.accounts ?? [])
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
  }, [accounts.data, provider, status, search, sort, asc])
  const hasAccounts = !!accounts.data?.accounts.length
  const clear = () => {
    setSearch('')
    setProvider('')
    setStatus('all')
  }
  const onSort = (key) => {
    setAsc(sort === key ? !asc : true)
    setSort(key)
  }

  return (
    <>
      <PageHead title={c.accounts} intro={c.accountIntro}>
        <Button variant="primary" onClick={() => setForm('new')}>
          <Plus size={16} aria-hidden />
          {c.addAccount}
        </Button>
      </PageHead>
      <Stats stats={stats} />
      <div className="toolbar">
        <SearchBox label={c.searchAccounts} value={search} onChange={setSearch} />
        <Select label={c.provider} value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="">
            {c.provider}: {c.all}
          </option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select label={c.status} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">
            {c.status}: {c.all}
          </option>
          <option value="limited">{c.limited}</option>
          <option value="unlimited">{c.unlimited}</option>
        </Select>
        <span className="help">{c.count(filtered.length)}</span>
        <Button
          size="sm"
          icon
          aria-label={c.refresh}
          title={c.refresh}
          onClick={() => {
            void accounts.refetch()
            void stats.refetch()
          }}
        >
          <RefreshCw
            size={15}
            className={accounts.isFetching || stats.isFetching ? 'spinning' : undefined}
          />
        </Button>
      </div>
      <ErrorBox error={accounts.error} retry={() => void accounts.refetch()} />
      {accounts.isPending ? (
        <Busy />
      ) : !accounts.error && filtered.length === 0 ? (
        <Empty
          title={hasAccounts ? c.noResults : c.noAccounts}
          body={hasAccounts ? c.noResultsBody : c.noAccountsBody}
          action={
            <Button variant="primary" onClick={hasAccounts ? clear : () => setForm('new')}>
              {hasAccounts ? c.clear : c.addAccount}
            </Button>
          }
        />
      ) : (
        <>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map(([key, label]) => (
                    <th
                      key={key}
                      aria-sort={sort === key ? (asc ? 'ascending' : 'descending') : 'none'}
                    >
                      <button type="button" onClick={() => onSort(key)}>
                        {label}
                        {sort === key && (asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </button>
                    </th>
                  ))}
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.provider}</td>
                    <td>
                      <button type="button" className="cell-link" onClick={() => setDetail(a.id)}>
                        {a.login_name}
                      </button>
                    </td>
                    <td>{a.email}</td>
                    <td>{a.external_account_id}</td>
                    <td>
                      <Status account={a} />
                    </td>
                    <td>{localDate(a.created_at)}</td>
                    <td>
                      <Actions account={a} onEdit={setForm} onDelete={setDeleting} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="account-cards">
            {filtered.map((a) => (
              <article
                key={a.id}
                className="card account-card"
                style={{ flexDirection: 'column', padding: '1rem', gap: '0.5rem' }}
              >
                <div className="row between">
                  <button type="button" className="cell-link" onClick={() => setDetail(a.id)}>
                    {a.login_name}
                  </button>
                  <Status account={a} />
                </div>
                <span className="help">
                  {a.provider} · {a.email}
                </span>
                <Actions account={a} onEdit={setForm} onDelete={setDeleting} />
              </article>
            ))}
          </div>
        </>
      )}
      {detail && (
        <AccountDetail
          key={detail}
          id={detail}
          onClose={() => setDetail(null)}
          onEdit={(a) => {
            setDetail(null)
            setForm(a)
          }}
        />
      )}
      {form && (
        <AccountForm account={form === 'new' ? undefined : form} onClose={() => setForm(null)} />
      )}
      {deleting && (
        <DeleteAccountDialog
          account={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            if (detail === deleting.id) setDetail(null)
            setDeleting(null)
          }}
        />
      )}
    </>
  )
}
