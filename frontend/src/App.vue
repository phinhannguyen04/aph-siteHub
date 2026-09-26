<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PhGlobe,
  PhPlus,
  PhArrowsClockwise,
  PhSignOut,
  PhMagnifyingGlass,
  PhKey,
  PhX,
} from '@phosphor-icons/vue'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import WebsiteCard from '@/components/WebsiteCard.vue'
import WebsiteForm from '@/components/WebsiteForm.vue'
import PasswordDialog from '@/components/PasswordDialog.vue'
import { api, setCsrfToken, type Website } from './api'
import { useWebsites } from './websites-state'

const authenticated = ref(false)
const checkingSession = ref(true)
const password = ref('')
const authError = ref('')
const authLoading = ref(false)
const banner = ref('')
const bannerError = ref(false)
const dialogOpen = ref(false)
const passwordDialogOpen = ref(false)
const editing = ref<Website | null>(null)
const saving = ref(false)
const passwordSaving = ref(false)
const formError = ref('')
const passwordError = ref('')
const search = ref('')
const { state, reload } = useWebsites()
function fold(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('\u0111', 'd')
}
const searchTerm = computed(() => fold(search.value.trim()))
const visibleWebsites = computed(() =>
  state.websites.filter((website) =>
    fold(`${website.name} ${website.url}`).includes(searchTerm.value),
  ),
)

async function refresh() {
  banner.value = ''
  await reload().catch(() => {})
}
async function checkSession() {
  try {
    const session = await api.session()
    setCsrfToken(session.csrfToken)
    authenticated.value = true
  } catch (cause) {
    if (!(cause instanceof Error && 'status' in cause && cause.status === 401))
      authError.value = cause instanceof Error ? cause.message : 'Unable to check your session.'
  } finally {
    checkingSession.value = false
  }
  if (authenticated.value) await refresh()
}
onMounted(checkSession)
async function login() {
  authLoading.value = true
  authError.value = ''
  try {
    const session = await api.login(password.value)
    setCsrfToken(session.csrfToken)
    password.value = ''
    authenticated.value = true
    await refresh()
  } catch (cause) {
    authError.value = cause instanceof Error ? cause.message : 'Sign in failed.'
  } finally {
    authLoading.value = false
  }
}
async function logout() {
  try {
    await api.logout()
  } catch (cause) {
    bannerError.value = true
    banner.value = cause instanceof Error ? cause.message : 'Unable to sign out.'
    return
  }
  setCsrfToken('')
  authenticated.value = false
  state.websites = []
  state.count = 0
  banner.value = ''
  search.value = ''
}
function openForm(website: Website | null) {
  editing.value = website
  formError.value = ''
  dialogOpen.value = true
}
async function save(input: { name: string; url: string }) {
  saving.value = true
  formError.value = ''
  banner.value = ''
  try {
    const wasEditing = !!editing.value
    if (editing.value) await api.update(editing.value.id, input)
    else await api.create(input)
    dialogOpen.value = false
    bannerError.value = false
    banner.value = wasEditing ? 'Website updated.' : 'Website added.'
    await reload().catch(() => {})
  } catch (cause) {
    formError.value = cause instanceof Error ? cause.message : 'Unable to save the website.'
  } finally {
    saving.value = false
  }
}
async function changePassword(input: { currentPassword: string; newPassword: string }) {
  passwordSaving.value = true
  passwordError.value = ''
  try {
    const session = await api.changePassword(input)
    setCsrfToken(session.csrfToken)
    passwordDialogOpen.value = false
    bannerError.value = false
    banner.value = 'Password changed. Other sessions have been signed out.'
  } catch (cause) {
    passwordError.value = cause instanceof Error ? cause.message : 'Unable to change the password.'
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-border bg-card">
      <div class="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div class="flex items-center gap-2 text-base font-semibold tracking-tight">
          <PhGlobe class="size-5 text-primary" aria-hidden="true" />
          <span>APH SiteHub</span>
        </div>
        <div v-if="authenticated" class="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Change password"
            @click="passwordDialogOpen = true"
          >
            <PhKey /><span class="hidden sm:inline">Change password</span>
          </Button>
          <Button variant="ghost" size="sm" aria-label="Sign out" @click="logout">
            <PhSignOut /><span class="hidden sm:inline">Sign out</span>
          </Button>
        </div>
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
            >Enter your administrator password to access your websites.</CardDescription
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
    <main v-else class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">Websites</h1>
          <p v-if="!state.loading && !state.error" class="mt-2 text-sm text-muted-foreground">
            {{ state.count }} {{ state.count === 1 ? 'website' : 'websites' }} saved
          </p>
        </div>
        <Button @click="openForm(null)"><PhPlus /> Add website</Button>
      </div>
      <Alert
        v-if="banner"
        :variant="bannerError ? 'destructive' : 'default'"
        :role="bannerError ? 'alert' : 'status'"
        class="mb-4 pr-12"
      >
        <AlertDescription>{{ banner }}</AlertDescription>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          class="absolute right-2 top-2"
          aria-label="Dismiss message"
          @click="banner = ''"
          ><PhX
        /></Button>
      </Alert>
      <section class="border-t border-border pt-5" aria-labelledby="website-list-title">
        <div class="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-2">
            <h2 id="website-list-title" class="text-base font-semibold">Website list</h2>
            <Badge v-if="searchTerm && !state.loading && !state.error" variant="secondary"
              >{{ visibleWebsites.length }} results</Badge
            >
          </div>
          <div class="flex min-w-0 items-center gap-2">
            <InputGroup class="bg-card md:w-72">
              <InputGroupInput
                v-model="search"
                type="search"
                aria-label="Search websites"
                placeholder="Search by name or URL"
              />
              <InputGroupAddon><PhMagnifyingGlass aria-hidden="true" /></InputGroupAddon>
            </InputGroup>
            <Button
              variant="outline"
              :disabled="state.loading"
              aria-label="Refresh websites"
              @click="refresh"
            >
              <PhArrowsClockwise
                :class="{ 'animate-spin motion-reduce:animate-none': state.loading }"
              />
              <span class="hidden sm:inline">{{ state.loading ? 'Loading...' : 'Refresh' }}</span>
            </Button>
          </div>
        </div>
        <div v-if="state.loading" role="status" aria-live="polite" aria-busy="true">
          <span class="sr-only">Loading websites...</span>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            <Card v-for="n in 3" :key="n" class="p-5 shadow-sm"
              ><Skeleton class="mb-3 h-5 w-2/3" /><Skeleton class="h-4 w-full" /><Skeleton
                class="mt-5 h-8 w-16"
            /></Card>
          </div>
        </div>
        <Alert v-else-if="state.error" variant="destructive">
          <AlertTitle>Unable to load websites</AlertTitle>
          <AlertDescription>{{ state.error }}</AlertDescription>
          <Button variant="outline" class="mt-4" @click="refresh">Try again</Button>
        </Alert>
        <Empty v-else-if="state.websites.length === 0" class="border bg-card">
          <EmptyHeader
            ><EmptyTitle>No websites yet</EmptyTitle
            ><EmptyDescription
              >Add your first website to get started.</EmptyDescription
            ></EmptyHeader
          >
          <EmptyContent
            ><Button @click="openForm(null)"><PhPlus /> Add website</Button></EmptyContent
          >
        </Empty>
        <Empty v-else-if="visibleWebsites.length === 0" class="border bg-card">
          <EmptyHeader
            ><EmptyTitle>No websites found</EmptyTitle
            ><EmptyDescription
              >Try another search or clear the filter.</EmptyDescription
            ></EmptyHeader
          >
          <EmptyContent
            ><Button variant="outline" @click="search = ''">Clear search</Button></EmptyContent
          >
        </Empty>
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WebsiteCard
            v-for="website in visibleWebsites"
            :key="website.id"
            :website="website"
            @edit="openForm"
          />
        </div>
      </section>
    </main>
    <WebsiteForm
      :open="dialogOpen"
      :website="editing"
      :saving="saving"
      :error="formError"
      @close="dialogOpen = false"
      @save="save"
    />
    <PasswordDialog
      :open="passwordDialogOpen"
      :saving="passwordSaving"
      :error="passwordError"
      @close="passwordDialogOpen = false"
      @save="changePassword"
    />
  </div>
</template>
