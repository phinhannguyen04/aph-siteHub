<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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
import TagPicker from '@/components/TagPicker.vue'
import TagChips from '@/components/TagChips.vue'
import ManageTags from '@/components/ManageTags.vue'
import PasswordDialog from '@/components/PasswordDialog.vue'
import { api, setCsrfToken, type Website, type Tag } from './api'
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
const urlState = new URLSearchParams(window.location.search)
const search = ref(urlState.get('search') ?? '')
const selectedTagIds = ref((urlState.get('tagIds') ?? '').split(',').filter(Boolean))
const page = ref(Math.max(1, Number(urlState.get('page')) || 1))
const pageSize = ref(
  [12, 24, 48].includes(Number(urlState.get('pageSize'))) ? Number(urlState.get('pageSize')) : 12,
)
const tags = ref<Tag[]>([])
const tagsLoading = ref(false)
const tagsError = ref('')
const manageOpen = ref(false)
const manageCreate = ref(false)
const { state, reload } = useWebsites()
const activeTags = computed(() => tags.value.filter((tag) => selectedTagIds.value.includes(tag.id)))
const pageCount = computed(() => Math.max(1, Math.ceil(state.total / pageSize.value)))
const pages = computed(() => {
  const result: (number | string)[] = []
  for (let n = 1; n <= pageCount.value; n++) {
    if (n === 1 || n === pageCount.value || Math.abs(n - page.value) <= 1) result.push(n)
    else if (result[result.length - 1] !== '…') result.push('…')
  }
  return result
})
function syncUrl() {
  const params = new URLSearchParams()
  if (search.value) params.set('search', search.value)
  if (selectedTagIds.value.length) params.set('tagIds', selectedTagIds.value.join(','))
  if (page.value !== 1) params.set('page', String(page.value))
  if (pageSize.value !== 12) params.set('pageSize', String(pageSize.value))
  history.replaceState(null, '', location.pathname + (params.size ? '?' + params : ''))
}
let debounce: ReturnType<typeof setTimeout> | undefined
let restoringUrl = false
function schedule() {
  syncUrl()
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    if (authenticated.value) void refresh()
  }, 250)
}
watch(
  [search, selectedTagIds, pageSize],
  () => {
    if (restoringUrl) return
    page.value = 1
    schedule()
  },
  { deep: true },
)
watch(page, () => {
  if (!restoringUrl) schedule()
})
function restoreUrl() {
  restoringUrl = true
  const params = new URLSearchParams(window.location.search)
  search.value = params.get('search') ?? ''
  selectedTagIds.value = (params.get('tagIds') ?? '').split(',').filter(Boolean)
  page.value = Math.max(1, Number(params.get('page')) || 1)
  pageSize.value = [12, 24, 48].includes(Number(params.get('pageSize')))
    ? Number(params.get('pageSize'))
    : 12
  queueMicrotask(() => {
    restoringUrl = false
    schedule()
  })
}
onMounted(() => window.addEventListener('popstate', restoreUrl))
onUnmounted(() => {
  clearTimeout(debounce)
  window.removeEventListener('popstate', restoreUrl)
})
async function loadTags() {
  tagsLoading.value = true
  tagsError.value = ''
  const result = await api.tags()
  tagsLoading.value = false
  if (result.code !== 0) {
    tagsError.value = result.error.message
    return
  }
  tags.value = result.data.tags
  const valid = new Set(tags.value.map((tag) => tag.id))
  selectedTagIds.value = selectedTagIds.value.filter((id) => valid.has(id))
}
function clearFilters() {
  search.value = ''
  selectedTagIds.value = []
}
function openManage(create = false) {
  manageCreate.value = create
  manageOpen.value = true
}
async function tagsChanged() {
  await loadTags()
  await refresh()
}
async function refresh() {
  banner.value = ''
  await reload({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim(),
    tagIds: selectedTagIds.value,
  })
  if (!state.loading && !state.error && page.value > pageCount.value) {
    page.value = pageCount.value
    await reload({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim(),
      tagIds: selectedTagIds.value,
    })
  }
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
  await loadTags()
  await refresh()
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
  await loadTags()
  await refresh()
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
  state.websites = []
  state.count = 0
  state.total = 0
  tags.value = []
  banner.value = ''
  search.value = ''
  selectedTagIds.value = []
  page.value = 1
}
function openForm(website: Website | null) {
  editing.value = website
  formError.value = ''
  dialogOpen.value = true
}
async function save(input: { name: string; url: string; tag_ids: string[] }) {
  if (saving.value) return
  saving.value = true
  formError.value = ''
  banner.value = ''
  const wasEditing = !!editing.value
  const result = editing.value ? await api.update(editing.value.id, input) : await api.create(input)
  if (result.code !== 0) {
    formError.value = result.error.message
    saving.value = false
    return
  }
  dialogOpen.value = false
  bannerError.value = false
  banner.value = wasEditing ? 'Website updated.' : 'Website added.'
  await refresh()
  saving.value = false
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
        <div class="mb-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <h2 id="website-list-title" class="shrink-0 text-base font-semibold">Website list</h2>
              <Badge
                v-if="(search || selectedTagIds.length) && !state.loading && !state.error"
                variant="secondary"
              >
                {{ state.total }} {{ state.total === 1 ? 'result' : 'results' }}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" @click="openManage(false)">Manage tags</Button>
          </div>
          <div
            class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
            role="group"
            aria-label="Website search and filters"
          >
            <InputGroup class="col-span-2 bg-card sm:col-span-1">
              <InputGroupInput
                v-model="search"
                type="search"
                maxlength="160"
                aria-label="Search websites"
                placeholder="Search by name or URL"
              />
              <InputGroupAddon><PhMagnifyingGlass aria-hidden="true" /></InputGroupAddon>
            </InputGroup>
            <TagPicker
              v-model="selectedTagIds"
              :tags="tags"
              label="Filter by tags"
              :show-selected="false"
              :show-actions="false"
            />
            <Button
              variant="outline"
              :disabled="state.loading"
              aria-label="Refresh websites"
              @click="refresh"
            >
              <PhArrowsClockwise
                :class="{ 'animate-spin motion-reduce:animate-none': state.loading }"
              />
              <span class="hidden sm:inline">Refresh</span>
            </Button>
          </div>
          <div
            v-if="search || selectedTagIds.length"
            class="space-y-2 rounded-md border bg-card px-3 py-2"
            aria-label="Active filters"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-muted-foreground">
                {{ selectedTagIds.length ? 'Matching any selected tag' : 'Search active' }}
              </p>
              <Button variant="ghost" size="sm" class="shrink-0" @click="clearFilters"
                >Clear all</Button
              >
            </div>
            <TagChips
              v-if="activeTags.length"
              :tags="activeTags"
              class="max-h-40 overflow-y-auto pr-1"
              @remove="(id) => (selectedTagIds = selectedTagIds.filter((value) => value !== id))"
            />
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
        <Empty v-else-if="state.count === 0" class="border bg-card">
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
        <Empty v-else-if="state.websites.length === 0" class="border bg-card">
          <EmptyHeader
            ><EmptyTitle>No websites found</EmptyTitle
            ><EmptyDescription
              >Try another search or clear the filter.</EmptyDescription
            ></EmptyHeader
          >
          <EmptyContent
            ><Button variant="outline" @click="clearFilters">Clear filters</Button></EmptyContent
          >
        </Empty>
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WebsiteCard
            v-for="website in state.websites"
            :key="website.id"
            :website="website"
            @edit="openForm"
          />
        </div>
        <div
          v-if="!state.loading && !state.error && state.total"
          class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <span
            >Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, state.total) }} of
            {{ state.total }} websites</span
          >
          <div class="flex items-center gap-1">
            <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--"
              >Previous</Button
            >
            <template v-for="item in pages" :key="item">
              <span v-if="item === '…'" class="px-1">…</span>
              <Button
                v-else
                variant="outline"
                size="sm"
                :aria-label="`Page ${item}`"
                :aria-current="page === item ? 'page' : undefined"
                :disabled="page === item"
                @click="page = Number(item)"
                >{{ item }}</Button
              >
            </template>
            <Button variant="outline" size="sm" :disabled="page >= pageCount" @click="page++"
              >Next</Button
            >
          </div>
          <label class="flex items-center gap-2"
            >Per page
            <select
              v-model.number="pageSize"
              class="rounded border bg-card px-2 py-1"
              aria-label="Websites per page"
            >
              <option :value="12">12</option>
              <option :value="24">24</option>
              <option :value="48">48</option>
            </select></label
          >
        </div>
      </section>
    </main>
    <WebsiteForm
      :open="dialogOpen"
      :website="editing"
      :saving="saving"
      :error="formError"
      :tags="tags"
      @create-tag="openManage(true)"
      @manage-tags="openManage(false)"
      @close="dialogOpen = false"
      @save="save"
    />
    <ManageTags
      :open="manageOpen"
      :tags="tags"
      :loading="tagsLoading"
      :error="tagsError"
      :start-create="manageCreate"
      @close="manageOpen = false"
      @refresh="loadTags"
      @changed="tagsChanged"
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
