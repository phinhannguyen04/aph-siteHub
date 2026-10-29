'use client'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { AccountDetail } from '@/components/accounts/detail'
import { AccountForm } from '@/components/accounts/form'
import { Busy, Empty, ErrorBox } from '@/components/common'
import { query } from '@/lib/api/client'
import type { Account, AccountStats } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { AccountActions } from './actions'
import { DeleteAccountDialog } from './delete-dialog'
import { AccountList } from './list'
import { AccountStatsPanel } from './stats'
import { AccountTable, type SortKey } from './table'
import { AccountToolbar } from './toolbar'
export function Accounts() {
  const accounts = useQuery({
    queryKey: ['accounts'],
    queryFn: () => query<{ accounts: Account[] }>('/api/accounts'),
  })
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: () => query<{ stats: AccountStats }>('/api/accounts/stats'),
  })
  const [search, setSearch] = useState('')
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('all')
  const [view, setView] = useState('list')
  const [sort, setSort] = useState<SortKey>('provider')
  const [asc, setAsc] = useState(true)
  const [form, setForm] = useState<Account | 'new' | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)
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
  const refresh = () => {
    void accounts.refetch()
    void stats.refetch()
  }
  const actions = (a: Account) => (
    <AccountActions account={a} onEdit={setForm} onDelete={setDeleting} />
  )
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          {c.accounts}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {c.accountIntro}
        </Typography>
      </Box>
      <AccountStatsPanel stats={stats} />
      <AccountToolbar
        search={search}
        setSearch={setSearch}
        provider={provider}
        setProvider={setProvider}
        status={status}
        setStatus={setStatus}
        view={view}
        setView={setView}
        providers={providers}
        count={filtered.length}
        refreshing={accounts.isFetching || stats.isFetching}
        refresh={refresh}
        onAdd={() => setForm('new')}
      />
      <ErrorBox error={accounts.error} retry={() => void accounts.refetch()} />
      {accounts.isPending ? (
        <Busy />
      ) : !accounts.error && filtered.length === 0 ? (
        <Empty
          title={accounts.data?.accounts.length ? c.noResults : c.noAccounts}
          body={accounts.data?.accounts.length ? c.noResultsBody : c.noAccountsBody}
          action={
            <Button
              onClick={() => {
                if (accounts.data?.accounts.length) {
                  setSearch('')
                  setProvider('')
                  setStatus('all')
                } else setForm('new')
              }}
            >
              {accounts.data?.accounts.length ? c.clear : c.addAccount}
            </Button>
          }
        />
      ) : (
        <>
          <Box sx={{ display: view === 'table' ? { xs: 'block', md: 'none' } : 'block' }}>
            <AccountList accounts={filtered} actions={actions} onDetail={setDetail} />
          </Box>
          {view === 'table' && (
            <AccountTable
              accounts={filtered}
              sort={sort}
              asc={asc}
              onSort={(key) => {
                setAsc(sort === key ? !asc : true)
                setSort(key)
              }}
              actions={actions}
              onDetail={setDetail}
            />
          )}
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
      )}{' '}
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
    </Stack>
  )
}
