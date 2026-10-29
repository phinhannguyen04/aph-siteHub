'use client'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import type { ReactNode } from 'react'
import { localDate } from '@/components/common'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { Status } from './status'
export type SortKey =
  | 'provider'
  | 'login_name'
  | 'email'
  | 'external_account_id'
  | 'is_limit'
  | 'created_at'
const columns: { key: SortKey; label: string }[] = [
  { key: 'provider', label: c.provider },
  { key: 'login_name', label: c.loginName },
  { key: 'email', label: c.email },
  { key: 'external_account_id', label: c.externalId },
  { key: 'is_limit', label: c.status },
  { key: 'created_at', label: c.createdAt },
]
export function AccountTable({
  accounts,
  sort,
  asc,
  onSort,
  actions,
  onDetail,
}: {
  accounts: Account[]
  sort: SortKey
  asc: boolean
  onSort: (key: SortKey) => void
  actions: (a: Account) => ReactNode
  onDetail: (id: string) => void
}) {
  return (
    <TableContainer
      sx={{
        display: { xs: 'none', md: 'block' },
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                sortDirection={sort === col.key ? (asc ? 'asc' : 'desc') : false}
              >
                <TableSortLabel
                  active={sort === col.key}
                  direction={asc ? 'asc' : 'desc'}
                  onClick={() => onSort(col.key)}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell>{c.edit}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((a) => (
            <TableRow hover key={a.id}>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ maxWidth: 220, overflowWrap: 'anywhere' }}>
                  {col.key === 'is_limit' ? (
                    <Status account={a} />
                  ) : col.key === 'created_at' ? (
                    localDate(a.created_at)
                  ) : col.key === 'login_name' ? (
                    <Button
                      onClick={() => onDetail(a.id)}
                      sx={{ textAlign: 'left', overflowWrap: 'anywhere' }}
                    >
                      {a.login_name}
                    </Button>
                  ) : (
                    a[col.key]
                  )}
                </TableCell>
              ))}
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{actions(a)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
