<script setup lang="ts">
import { useRouter, useSearch } from '@tanstack/vue-router'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { PhPlus, PhArrowsClockwise, PhMagnifyingGlass, PhX } from '@phosphor-icons/vue'
import { Card } from '@/components/ui/card'
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
import { api, type Website, type Tag, type ListOptions } from '@/api'
import { useWebsites } from '@/websites-state'

const banner = ref('')
const bannerError = ref(false)
const dialogOpen = ref(false)
const editing = ref<Website | null>(null)
const saving = ref(false)
const formError = ref('')
const router = useRouter()
const routeSearch = useSearch({ from: '/' })
function updateSearch(changes: Partial<ListOptions>) {
  return router.navigate({
    to: '/',
    search: { ...routeSearch.value, ...changes },
    replace: true,
    resetScroll: false,
  })
}
const search = computed({
  get: () => routeSearch.value.search,
  set: (search: string) => updateSearch({ search, page: 1 }),
})
const selectedTagIds = computed({
  get: () => routeSearch.value.tagIds,
  set: (tagIds: string[]) => updateSearch({ tagIds, page: 1 }),
})
const page = computed({
  get: () => routeSearch.value.page,
  set: (page: number) => updateSearch({ page }),
})
const pageSize = computed({
  get: () => routeSearch.value.pageSize,
  set: (pageSize: number) => updateSearch({ pageSize, page: 1 }),
})
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
let debounce: ReturnType<typeof setTimeout> | undefined
watch(
  routeSearch,
  () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => void refresh(), 250)
  },
  { deep: true },
)
onMounted(async () => {
  await loadTags()
  await refresh()
})
onUnmounted(() => clearTimeout(debounce))
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
  const selected = selectedTagIds.value.filter((id) => valid.has(id))
  if (selected.length !== selectedTagIds.value.length) selectedTagIds.value = selected
}
function clearFilters() {
  updateSearch({ search: '', tagIds: [], page: 1 })
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
    await updateSearch({ page: pageCount.value })
    await reload({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim(),
      tagIds: selectedTagIds.value,
    })
  }
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
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
          ><EmptyDescription>Add your first website to get started.</EmptyDescription></EmptyHeader
        >
        <EmptyContent
          ><Button @click="openForm(null)"><PhPlus /> Add website</Button></EmptyContent
        >
      </Empty>
      <Empty v-else-if="state.websites.length === 0" class="border bg-card">
        <EmptyHeader
          ><EmptyTitle>No websites found</EmptyTitle
          ><EmptyDescription>Try another search or clear the filter.</EmptyDescription></EmptyHeader
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
  </div>
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
</template>
