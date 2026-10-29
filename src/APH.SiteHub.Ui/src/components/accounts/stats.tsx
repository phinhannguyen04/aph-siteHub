'use client'
import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material'
import type { UseQueryResult } from '@tanstack/react-query'
import { ErrorBox } from '@/components/common'
import type { AccountStats } from '@/lib/api/types'
import { c } from '@/lib/copy'
export function AccountStatsPanel({ stats }: { stats: UseQueryResult<{ stats: AccountStats }> }) {
  return (
    <>
      {' '}
      <ErrorBox error={stats.error} retry={() => void stats.refetch()} />
      {stats.isPending ? (
        <LinearProgress aria-label={c.loading} />
      ) : (
        stats.data && (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                gap: { xs: 1, sm: 2 },
              }}
            >
              {[
                { label: c.total, value: stats.data.stats.total },
                { label: c.limited, value: stats.data.stats.limited },
                { label: c.unlimited, value: stats.data.stats.unlimited },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                    <Typography color="text.secondary" variant="body2">
                      {item.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      component="p"
                      sx={{ fontVariantNumeric: 'tabular-nums', mt: 1 }}
                    >
                      {item.value}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
            {stats.data.stats.providers.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {c.providers}
                </Typography>
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
                  {stats.data.stats.providers.map((p) => (
                    <Box key={p.provider}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                        <Typography variant="body2">{p.provider}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {c.count(p.total)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={p.total ? (p.limited / p.total) * 100 : 0}
                        color="warning"
                        aria-label={`${p.provider}: ${p.limited} ${c.limited}, ${p.unlimited} ${c.unlimited}`}
                        sx={{ my: 1, borderRadius: 1, height: 6 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {p.limited} {c.limited} · {p.unlimited} {c.unlimited}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )
      )}
    </>
  )
}
