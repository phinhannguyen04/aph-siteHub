'use client'
import {
  AppsOutlined,
  KeyOutlined,
  LabelOutlined,
  Logout,
  Menu,
  PublicOutlined,
} from '@mui/icons-material'
import {
  AppBar,
  Badge,
  Box,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
  useColorScheme,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { ChangePassword } from '@/components/auth/change-password'
import { useSession } from '@/components/layout/providers'
import { TagsManager } from '@/components/tags/manager'
import { query } from '@/lib/api/client'
import { c } from '@/lib/copy'
export function Shell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false)
  const [tags, setTags] = useState(false)
  const [password, setPassword] = useState(false)
  const path = usePathname()
  const session = useSession()
  const { mode, setMode } = useColorScheme()
  const count = useQuery({
    queryKey: ['count'],
    queryFn: () => query<{ count: number }>('/api/websites/count'),
  })
  const nav = (
    <Stack sx={{ height: '100%' }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography sx={{ fontWeight: 750, fontSize: 20 }}>{c.app}</Typography>
      </Box>
      <Divider />
      <List sx={{ p: 1.5 }}>
        {[
          { href: '/', label: c.websites, icon: <PublicOutlined /> },
          { href: '/accounts', label: c.accounts, icon: <AppsOutlined /> },
        ].map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={path === item.href}
            onClick={() => setMobile(false)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
            {item.href === '/' && count.data && (
              <Badge
                badgeContent={count.data.count}
                showZero
                max={9999}
                color="primary"
                sx={{ mr: 1 }}
              />
            )}
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={() => {
            setMobile(false)
            setTags(true)
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LabelOutlined />
          </ListItemIcon>
          <ListItemText primary={c.tags} />
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            setMobile(false)
            setPassword(true)
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <KeyOutlined />
          </ListItemIcon>
          <ListItemText primary={c.changePassword} />
        </ListItemButton>
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel id="appearance-label">{c.theme}</InputLabel>
          <Select
            labelId="appearance-label"
            label={c.theme}
            value={mode ?? 'system'}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
          >
            <MenuItem value="light">{c.light}</MenuItem>
            <MenuItem value="dark">{c.dark}</MenuItem>
            <MenuItem value="system">{c.system}</MenuItem>
          </Select>
        </FormControl>
        <ListItemButton sx={{ mt: 2 }} onClick={() => void session.logout()}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary={c.signOut} />
        </ListItemButton>
      </Box>
    </Stack>
  )
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          width: { md: 'calc(100% - 248px)' },
          ml: { md: '248px' },
        }}
      >
        <Toolbar>
          <IconButton
            aria-label={c.menu}
            edge="start"
            onClick={() => setMobile(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" component="div">
            {path === '/accounts' ? c.accounts : c.websites}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" aria-label={c.menu} sx={{ width: { md: 248 }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobile}
          onClose={() => setMobile(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 248 } }}
        >
          {nav}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: 248, boxSizing: 'border-box' },
          }}
        >
          {nav}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, lg: 5 }, maxWidth: 1900, mx: 'auto' }}
      >
        <Toolbar />
        {children}
      </Box>
      {tags && <TagsManager onClose={() => setTags(false)} />}{' '}
      {password && <ChangePassword onClose={() => setPassword(false)} />}
    </Box>
  )
}
