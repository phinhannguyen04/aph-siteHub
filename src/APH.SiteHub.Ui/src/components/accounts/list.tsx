'use client'
import { Box, Button, Card, CardActions, CardContent, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { Status } from './status'
export function AccountList({
  accounts,
  actions,
  onDetail,
}: {
  accounts: Account[]
  actions: (account: Account) => ReactNode
  onDetail: (id: string) => void
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2,minmax(0,1fr))',
          xl: 'repeat(3,minmax(0,1fr))',
        },
        gap: 2,
      }}
    >
      {accounts.map((a) => (
        <Card key={a.id}>
          <CardContent>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {a.provider}
              </Typography>
              <Status account={a} />
            </Stack>
            <Button
              onClick={() => onDetail(a.id)}
              sx={{
                fontSize: 18,
                px: 0,
                my: 1,
                justifyContent: 'flex-start',
                textAlign: 'left',
                overflowWrap: 'anywhere',
              }}
            >
              {a.login_name}
            </Button>
            <Typography variant="body2" color="text.secondary">
              {a.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {a.external_account_id}
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
            <Button size="small" onClick={() => onDetail(a.id)}>
              {c.details}
            </Button>
            <Box>{actions(a)}</Box>
          </CardActions>
        </Card>
      ))}
    </Box>
  )
}
