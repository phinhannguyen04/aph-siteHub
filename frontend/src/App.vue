<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Outlet, useLocation } from '@tanstack/vue-router'
import { PhGlobe, PhList } from '@phosphor-icons/vue'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import AppSidebar from '@/components/AppSidebar.vue'
import SidebarNav from '@/components/SidebarNav.vue'
import PasswordDialog from '@/components/PasswordDialog.vue'
import { api, setCsrfToken } from './api'

const authenticated = ref(false)
const checkingSession = ref(true)
const password = ref('')
const authError = ref('')
const authLoading = ref(false)
const banner = ref('')
const bannerError = ref(false)
const passwordDialogOpen = ref(false)
const passwordSaving = ref(false)
const passwordError = ref('')
const mobileOpen = ref(false)
const desktop = useMediaQuery('(min-width: 768px)')
watch(desktop, (value) => {
  if (value) mobileOpen.value = false
})
const location = useLocation()
const pageTitle = computed(() =>
  location.value.pathname === '/'
    ? 'Websites'
    : location.value.pathname === '/accounts'
      ? 'Accounts'
      : 'Page not found',
)
watch(
  () => location.value.pathname,
  () => {
    mobileOpen.value = false
    banner.value = ''
  },
)
function openMobilePassword() {
  mobileOpen.value = false
  passwordDialogOpen.value = true
}
function mobileLogout() {
  mobileOpen.value = false
  void logout()
}
async function checkSession() {
  const result = await api.session()
  checkingSession.value = false
  if (result.code !== 0) {
    if (result.error.status !== 401) authError.value = result.error.message
    return
  }
  setCsrfToken(result.data.csrfToken)
  authenticated.value = true
}
onMounted(checkSession)
async function login() {
  authLoading.value = true
  authError.value = ''
  const result = await api.login(password.value)
  if (result.code !== 0) {
    authError.value = result.error.message
    authLoading.value = false
    return
  }
  setCsrfToken(result.data.csrfToken)
  password.value = ''
  authenticated.value = true
  authLoading.value = false
}
async function logout() {
  const result = await api.logout()
  if (result.code !== 0) {
    bannerError.value = true
    banner.value = result.error.message
    return
  }
  setCsrfToken('')
  authenticated.value = false
  passwordDialogOpen.value = false
  mobileOpen.value = false
  banner.value = ''
}
async function changePassword(input: { currentPassword: string; newPassword: string }) {
  passwordSaving.value = true
  passwordError.value = ''
  const result = await api.changePassword(input)
  passwordSaving.value = false
  if (result.code !== 0) {
    passwordError.value = result.error.message
    return
  }
  setCsrfToken(result.data.csrfToken)
  passwordDialogOpen.value = false
  bannerError.value = false
  banner.value = 'Password changed. Other sessions have been signed out.'
}
</script>

<template>
  <div class="min-h-dvh">
    <header v-if="!authenticated" class="border-b bg-card">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 font-semibold sm:px-6">
        <PhGlobe class="size-5 text-primary" aria-hidden="true" /> APH SiteHub
      </div>
    </header>
    <main v-if="checkingSession" class="mx-auto max-w-md p-6" role="status" aria-live="polite">
      <p class="mb-4 text-sm text-muted-foreground">Checking your session...</p>
      <Skeleton class="h-28 w-full" aria-hidden="true" />
    </main>
    <main
      v-else-if="!authenticated"
      class="grid min-h-[calc(100vh-4rem)] place-items-center p-4 sm:p-6"
    >
      <Card class="login-card w-full max-w-sm shadow-sm" aria-labelledby="login-title">
        <CardHeader>
          <CardTitle id="login-title" class="text-2xl">Sign in</CardTitle>
          <CardDescription
            >Enter your administrator password to access your workspace.</CardDescription
          >
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="login">
            <Field>
              <FieldLabel for="password">Password</FieldLabel>
              <Input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
              />
            </Field>
            <Alert v-if="authError" variant="destructive"
              ><AlertDescription>{{ authError }}</AlertDescription></Alert
            >
            <Button type="submit" :disabled="authLoading" class="w-full">{{
              authLoading ? 'Signing in...' : 'Sign in'
            }}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
    <div v-else class="flex min-h-dvh">
      <a
        href="#page-content"
        class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-md focus:bg-card focus:p-3"
        >Skip to content</a
      >
      <AppSidebar @change-password="passwordDialogOpen = true" @logout="logout" />
      <div class="min-w-0 flex-1">
        <header
          class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card px-4 sm:px-6"
        >
          <Button
            variant="ghost"
            size="icon"
            class="md:hidden"
            aria-label="Open navigation"
            aria-controls="mobile-navigation"
            :aria-expanded="mobileOpen"
            @click="mobileOpen = true"
            ><PhList
          /></Button>
          <span class="text-sm text-muted-foreground">Workspace</span>
          <span class="text-muted-foreground" aria-hidden="true">/</span>
          <span class="text-sm font-medium">{{ pageTitle }}</span>
        </header>
        <main id="page-content" tabindex="-1" class="outline-none">
          <Alert
            v-if="banner"
            :variant="bannerError ? 'destructive' : 'default'"
            class="mx-4 mt-4 sm:mx-6"
            ><AlertDescription>{{ banner }}</AlertDescription></Alert
          >
          <Outlet />
        </main>
      </div>
      <Dialog :open="mobileOpen" @update:open="mobileOpen = $event">
        <DialogContent
          id="mobile-navigation"
          class="left-0 top-0 flex h-dvh flex-col gap-0 max-h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 bg-card p-0 sm:rounded-none"
        >
          <DialogHeader class="shrink-0 px-5 pb-4 pt-6"
            ><DialogTitle class="flex items-center gap-2"
              ><PhGlobe class="size-5 text-primary" /> APH SiteHub</DialogTitle
            ><DialogDescription>Workspace navigation</DialogDescription></DialogHeader
          >
          <SidebarNav
            class="flex-1"
            @navigate="mobileOpen = false"
            @change-password="openMobilePassword"
            @logout="mobileLogout"
          />
        </DialogContent>
      </Dialog>
    </div>
    <PasswordDialog
      :open="passwordDialogOpen"
      :saving="passwordSaving"
      :error="passwordError"
      @close="passwordDialogOpen = false"
      @save="changePassword"
    />
  </div>
</template>
