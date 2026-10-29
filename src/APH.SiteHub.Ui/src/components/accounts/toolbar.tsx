'use client'
import { Add, Refresh, TableRowsOutlined, ViewModuleOutlined } from '@mui/icons-material'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { c } from '@/lib/copy'

type Props = {
  search: string
  setSearch: (v: string) => void
  provider: string
  setProvider: (v: string) => void
  status: string
  setStatus: (v: string) => void
  view: string
  setView: (v: string) => void
  providers: string[]
  count: number
  refreshing: boolean
  refresh: () => void
  onAdd: () => void
}
export function AccountToolbar({
  search,
  setSearch,
  provider,
  setProvider,
  status,
  setStatus,
  view,
  setView,
  providers,
  count,
  refreshing,
  refresh,
  onAdd,
}: Props) {
  return (
    <>
      {' '}
      <Stack direction={{ xs: 'column', lg: 'row' }} sx={{ gap: 2 }}>
        <TextField
          label={c.searchAccounts}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1.5 }}
        />
        <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
          <InputLabel id="provider-filter">{c.provider}</InputLabel>
          <Select
            labelId="provider-filter"
            label={c.provider}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <MenuItem value="">{c.all}</MenuItem>
            {providers.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
          <InputLabel id="status-filter">{c.status}</InputLabel>
          <Select
            labelId="status-filter"
            label={c.status}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="all">{c.all}</MenuItem>
            <MenuItem value="limited">{c.limited}</MenuItem>
            <MenuItem value="unlimited">{c.unlimited}</MenuItem>
          </Select>
        </FormControl>
        <Button startIcon={<Refresh />} onClick={refresh} disabled={refreshing}>
          {c.refresh}
        </Button>
        <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ flexShrink: 0 }}>
          {c.addAccount}
        </Button>
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {c.count(count)}
        </Typography>
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_, v) => {
            if (v) setView(v)
          }}
          sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          aria-label={c.accounts}
        >
          <ToggleButton value="list" aria-label={c.list}>
            <ViewModuleOutlined fontSize="small" />
          </ToggleButton>
          <ToggleButton value="table" aria-label={c.table}>
            <TableRowsOutlined fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </>
  )
}
