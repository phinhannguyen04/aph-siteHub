import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHead } from '@/components/layout/page-head'
import { Busy, Button, Empty, ErrorBox } from '@/components/ui'
import {
  AccountCards,
  AccountDetail,
  AccountForm,
  AccountStats,
  AccountTable,
  AccountToolbar,
  DeleteAccountDialog,
  useAccountFilters,
} from '@/features/accounts'
import { query } from '@/lib/api'
import { c } from '@/lib/copy'

export function Accounts() {
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: () => query('/api/accounts') })
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => query('/api/accounts/stats') })
  const f = useAccountFilters(accounts.data?.accounts)
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { filtered } = f
  const hasAccounts = !!accounts.data?.accounts.length

  return (
    <>
      <PageHead title={c.accounts} intro={c.accountIntro}>
        <Button variant="primary" onClick={() => setForm('new')}>
          <Plus size={16} aria-hidden />
          {c.addAccount}
        </Button>
      </PageHead>
      <AccountStats stats={stats} />
      <AccountToolbar
        f={f}
        count={filtered.length}
        refreshing={accounts.isFetching || stats.isFetching}
        onRefresh={() => {
          void accounts.refetch()
          void stats.refetch()
        }}
      />
      <ErrorBox error={accounts.error} retry={() => void accounts.refetch()} />
      {accounts.isPending ? (
        <Busy />
      ) : !accounts.error && filtered.length === 0 ? (
        <Empty
          title={hasAccounts ? c.noResults : c.noAccounts}
          body={hasAccounts ? c.noResultsBody : c.noAccountsBody}
          action={
            <Button variant="primary" onClick={hasAccounts ? f.clear : () => setForm('new')}>
              {hasAccounts ? c.clear : c.addAccount}
            </Button>
          }
        />
      ) : (
        <>
          <AccountTable
            accounts={filtered}
            sort={f.sort}
            asc={f.asc}
            onSort={f.onSort}
            onOpen={setDetail}
            onEdit={setForm}
            onDelete={setDeleting}
          />
          <AccountCards
            accounts={filtered}
            onOpen={setDetail}
            onEdit={setForm}
            onDelete={setDeleting}
          />
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
