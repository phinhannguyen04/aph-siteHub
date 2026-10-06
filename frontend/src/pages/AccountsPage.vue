<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  PhPlus,
  PhListBullets,
  PhTable,
  PhUsers,
  PhArrowsDownUp,
  PhArrowUp,
  PhArrowDown,
  PhArrowsClockwise,
  PhMagnifyingGlass,
  PhKey,
  PhPencilSimple,
  PhTrash,
  PhEye,
  PhEyeSlash,
} from '@phosphor-icons/vue'
import { api, type Account, type CreateAccountInput, type UpdateAccountInput } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const accounts = ref<Account[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const storedView = useStorage<'list' | 'table'>('sitehub-accounts-view', 'list')
const view = computed({
  get: () => (storedView.value === 'table' ? 'table' : 'list'),
  set: (value: 'list' | 'table') => {
    storedView.value = value
  },
})
const columns = [
  { key: 'login_name', label: 'Account' },
  { key: 'provider', label: 'Provider' },
  { key: 'email', label: 'Email' },
  { key: 'external_account_id', label: 'External ID' },
  { key: 'is_limit', label: 'Status' },
  { key: 'created_at', label: 'Created' },
] as const
const sortKey = ref<(typeof columns)[number]['key']>('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})
function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}
function sortBy(key: (typeof columns)[number]['key']) {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = key
    sortDirection.value = key === 'created_at' ? 'desc' : 'asc'
  }
}
const matches = computed(() =>
  accounts.value.filter((account) =>
    [account.provider, account.login_name, account.email, account.external_account_id].some(
      (value) => value.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()),
    ),
  ),
)
const sortedMatches = computed(() =>
  [...matches.value].sort((a, b) => {
    const key = sortKey.value
    let comparison: number
    if (key === 'created_at')
      comparison = (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0)
    else if (key === 'is_limit') comparison = Number(a.is_limit) - Number(b.is_limit)
    else
      comparison = a[key].localeCompare(b[key], undefined, { numeric: true, sensitivity: 'base' })
    return sortDirection.value === 'asc' ? comparison : -comparison
  }),
)
const limited = computed(() => accounts.value.filter((account) => account.is_limit).length)
const formOpen = ref(false)
const editing = ref<Account | null>(null)
const saving = ref(false)
const formError = ref('')
const input = reactive<CreateAccountInput>({
  provider: '',
  login_name: '',
  external_account_id: '',
  email: '',
  password: '',
  secret_key: '',
  is_limit: false,
})
const deleting = ref<Account | null>(null)
const deleteError = ref('')
const secretAccount = ref<Account | null>(null)
const secret = ref('')
const secretLoading = ref(false)
const secretError = ref('')
const showSecret = ref(false)
let revealRequest = 0

async function refresh() {
  loading.value = true
  error.value = ''
  const result = await api.accounts()
  loading.value = false
  if (result.code !== 0) {
    error.value = result.error.message
    accounts.value = []
    return
  }
  accounts.value = result.data.accounts
}
onMounted(refresh)
function begin(account: Account | null) {
  editing.value = account
  Object.assign(input, {
    provider: account?.provider ?? '',
    login_name: account?.login_name ?? '',
    external_account_id: account?.external_account_id ?? '',
    email: account?.email ?? '',
    password: '',
    secret_key: '',
    is_limit: account?.is_limit ?? false,
  })
  formError.value = ''
  formOpen.value = true
}
watch(formOpen, (open) => {
  if (!open) {
    input.password = ''
    input.secret_key = ''
  }
})
async function save() {
  if (saving.value) return
  saving.value = true
  formError.value = ''
  const changes: UpdateAccountInput = { is_limit: input.is_limit }
  if (input.password) changes.password = input.password
  if (input.secret_key) changes.secret_key = input.secret_key
  const result = editing.value
    ? await api.updateAccount(editing.value.id, changes)
    : await api.createAccount({ ...input })
  saving.value = false
  if (result.code !== 0) {
    formError.value = result.error.message
    return
  }
  formOpen.value = false
  await refresh()
}
function confirmDelete(account: Account) {
  deleting.value = account
  deleteError.value = ''
}
async function remove() {
  if (!deleting.value || saving.value) return
  saving.value = true
  deleteError.value = ''
  const result = await api.deleteAccount(deleting.value.id)
  saving.value = false
  if (result.code !== 0) {
    deleteError.value = result.error.message
    return
  }
  deleting.value = null
  await refresh()
}
async function reveal(account: Account) {
  const request = ++revealRequest
  secretAccount.value = account
  secret.value = ''
  showSecret.value = false
  secretError.value = ''
  secretLoading.value = true
  const result = await api.accountSecret(account.id)
  if (request !== revealRequest) return
  secretLoading.value = false
  if (result.code !== 0) {
    secretError.value = result.error.message
    return
  }
  secret.value = result.data.secret_key
}
function closeSecret() {
  ++revealRequest
  secretAccount.value = null
  secret.value = ''
  showSecret.value = false
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Accounts</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Manage provider accounts and their secret keys.
        </p>
      </div>
      <Button @click="begin(null)"><PhPlus /> Add account</Button>
    </div>
    <div v-if="!loading && !error" class="mb-5 flex flex-wrap gap-2">
      <Badge variant="secondary"
        >{{ accounts.length }} {{ accounts.length === 1 ? 'account' : 'accounts' }}</Badge
      ><Badge variant="outline">{{ limited }} limited</Badge>
    </div>
    <div class="mb-5 flex flex-wrap items-center gap-2 border-t pt-5">
      <InputGroup class="min-w-0 basis-full bg-card sm:w-auto sm:flex-1 sm:basis-auto"
        ><InputGroupInput
          v-model="search"
          type="search"
          placeholder="Search accounts"
          aria-label="Search accounts" /><InputGroupAddon><PhMagnifyingGlass /></InputGroupAddon
      ></InputGroup>
      <div
        role="group"
        aria-label="Account display mode"
        class="inline-flex shrink-0 items-center gap-1 rounded-md border bg-muted p-1"
      >
        <Button
          variant="ghost"
          size="sm"
          :class="
            view === 'list'
              ? 'bg-card text-primary shadow-xs hover:bg-card'
              : 'text-muted-foreground'
          "
          :aria-pressed="view === 'list'"
          aria-controls="accounts-results"
          @click="view = 'list'"
          ><PhListBullets aria-hidden="true" /> List</Button
        >
        <Button
          variant="ghost"
          size="sm"
          :class="
            view === 'table'
              ? 'bg-card text-primary shadow-xs hover:bg-card'
              : 'text-muted-foreground'
          "
          :aria-pressed="view === 'table'"
          aria-controls="accounts-results"
          @click="view = 'table'"
          ><PhTable aria-hidden="true" /> Table</Button
        >
      </div>
      <Button variant="outline" :disabled="loading" @click="refresh"
        ><PhArrowsClockwise :class="{ 'animate-spin motion-reduce:animate-none': loading }" /><span
          class="hidden sm:inline"
          >Refresh</span
        ><span class="sr-only sm:hidden">Refresh accounts</span></Button
      >
    </div>
    <div id="accounts-results" v-if="loading" role="status" aria-busy="true">
      <span class="sr-only">Loading accounts...</span>
      <div
        v-if="view === 'table'"
        class="overflow-hidden rounded-lg border bg-card"
        aria-hidden="true"
      >
        <div class="flex gap-6 border-b bg-muted/50 p-4">
          <Skeleton v-for="n in 6" :key="n" class="h-4 flex-1" />
        </div>
        <div v-for="row in 5" :key="row" class="flex gap-6 border-b p-4 last:border-b-0">
          <Skeleton v-for="n in 6" :key="n" class="h-5 flex-1" />
        </div>
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card v-for="n in 3" :key="n" class="p-5"
          ><Skeleton class="h-5 w-2/3" /><Skeleton class="mt-3 h-4 w-full" /><Skeleton
            class="mt-5 h-8 w-24"
        /></Card>
      </div>
    </div>
    <Alert id="accounts-results" v-else-if="error" variant="destructive"
      ><AlertTitle>Unable to load accounts</AlertTitle
      ><AlertDescription>{{ error }}</AlertDescription
      ><Button variant="outline" class="mt-4" @click="refresh">Try again</Button></Alert
    >
    <Empty id="accounts-results" v-else-if="!accounts.length" class="border bg-card"
      ><EmptyHeader
        ><EmptyTitle>No accounts yet</EmptyTitle
        ><EmptyDescription>Add an account to manage its secret key.</EmptyDescription></EmptyHeader
      ><EmptyContent
        ><Button @click="begin(null)"><PhPlus /> Add account</Button></EmptyContent
      ></Empty
    >
    <Empty id="accounts-results" v-else-if="!matches.length" class="border bg-card"
      ><EmptyHeader
        ><EmptyTitle>No accounts found</EmptyTitle
        ><EmptyDescription>Try another search.</EmptyDescription></EmptyHeader
      ><EmptyContent
        ><Button variant="outline" @click="search = ''">Clear search</Button></EmptyContent
      ></Empty
    >
    <div
      v-else-if="view === 'table'"
      id="accounts-results"
      role="region"
      aria-label="Accounts table"
      tabindex="0"
      class="max-h-[70dvh] overflow-auto rounded-lg border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table class="w-full min-w-[1000px] table-fixed text-left text-sm">
        <colgroup>
          <col class="w-[22%]" />
          <col class="w-[12%]" />
          <col class="w-[17%]" />
          <col class="w-[13%]" />
          <col class="w-[10%]" />
          <col class="w-[12%]" />
          <col class="w-[14%]" />
        </colgroup>
        <caption class="sr-only">
          Accounts, provider details, status and creation date. Use the column buttons to sort.
        </caption>
        <thead class="sticky top-0 z-10 bg-card">
          <tr class="border-b">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="
                sortKey === column.key
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              "
              class="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-sm text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                :aria-label="`Sort by ${column.label}`"
                @click="sortBy(column.key)"
              >
                {{ column.label }}
                <PhArrowUp
                  v-if="sortKey === column.key && sortDirection === 'asc'"
                  class="size-3.5 text-primary"
                  aria-hidden="true"
                />
                <PhArrowDown
                  v-else-if="sortKey === column.key"
                  class="size-3.5 text-primary"
                  aria-hidden="true"
                />
                <PhArrowsDownUp v-else class="size-3.5 opacity-60" aria-hidden="true" />
              </button>
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="account in sortedMatches"
            :key="account.id"
            class="border-b transition-colors last:border-b-0 hover:bg-muted/40"
          >
            <th scope="row" class="px-4 py-3 font-medium">
              <div class="flex items-center gap-2.5">
                <span
                  class="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-primary"
                  ><PhUsers class="size-4" aria-hidden="true" /></span
                ><button
                  type="button"
                  class="max-w-48 truncate rounded-sm text-left underline decoration-border underline-offset-4 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  :title="account.login_name"
                  :aria-label="`Edit account ${account.login_name}`"
                  @click="begin(account)"
                >
                  {{ account.login_name }}
                </button>
              </div>
            </th>
            <td class="px-4 py-3">
              <span class="block max-w-36 truncate" :title="account.provider">{{
                account.provider
              }}</span>
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              <span class="block max-w-52 truncate" :title="account.email">{{
                account.email
              }}</span>
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              <span
                class="block max-w-40 truncate font-mono text-xs"
                :title="account.external_account_id"
                >{{ account.external_account_id }}</span
              >
            </td>
            <td class="whitespace-nowrap px-4 py-3">
              <Badge :variant="account.is_limit ? 'outline' : 'secondary'">{{
                account.is_limit ? 'Limited' : 'Available'
              }}</Badge>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-muted-foreground">
              <time :datetime="account.created_at" :title="account.created_at">{{
                formatDate(account.created_at)
              }}</time>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`View secret key for ${account.login_name}`"
                  title="Secret key"
                  @click="reveal(account)"
                  ><PhKey /></Button
                ><Button
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`Edit ${account.login_name}`"
                  title="Edit account"
                  @click="begin(account)"
                  ><PhPencilSimple /></Button
                ><Button
                  variant="ghost"
                  size="icon-sm"
                  class="text-destructive"
                  :aria-label="`Delete ${account.login_name}`"
                  title="Delete account"
                  @click="confirmDelete(account)"
                  ><PhTrash
                /></Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else id="accounts-results" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="account in matches" :key="account.id" class="min-w-0 shadow-sm">
        <CardHeader
          ><div class="flex items-start justify-between gap-2">
            <CardTitle class="break-all text-lg">{{ account.login_name }}</CardTitle
            ><Badge :variant="account.is_limit ? 'outline' : 'secondary'">{{
              account.is_limit ? 'Limited' : 'Available'
            }}</Badge>
          </div>
          <CardDescription class="break-all">{{ account.provider }}</CardDescription></CardHeader
        >
        <CardContent class="space-y-2 text-sm"
          ><p class="break-all">{{ account.email }}</p>
          <p class="break-all text-muted-foreground">
            ID: {{ account.external_account_id }}
          </p></CardContent
        >
        <CardFooter class="flex gap-1 border-t pt-4"
          ><Button variant="outline" size="sm" @click="reveal(account)"><PhKey /> Secret key</Button
          ><Button
            variant="ghost"
            size="icon-sm"
            :aria-label="`Edit ${account.login_name}`"
            @click="begin(account)"
            ><PhPencilSimple /></Button
          ><Button
            variant="ghost"
            size="icon-sm"
            class="ml-auto text-destructive"
            :aria-label="`Delete ${account.login_name}`"
            @click="confirmDelete(account)"
            ><PhTrash /></Button
        ></CardFooter>
      </Card>
    </div>
  </div>
  <Dialog
    :open="formOpen"
    @update:open="
      (open) => {
        if (!saving) formOpen = open
      }
    "
  >
    <DialogContent class="sm:max-w-lg"
      ><DialogHeader
        ><DialogTitle>{{ editing ? 'Edit account' : 'Add account' }}</DialogTitle
        ><DialogDescription>{{
          editing
            ? 'Update credentials and the limit status for this account.'
            : 'Save a provider account and its secret key.'
        }}</DialogDescription></DialogHeader
      >
      <form id="account-form" class="grid gap-4" @submit.prevent="save">
        <template v-if="!editing">
          <div class="grid gap-4 sm:grid-cols-2">
            <Field
              ><FieldLabel for="account-provider">Provider</FieldLabel
              ><Input id="account-provider" v-model="input.provider" required /></Field
            ><Field
              ><FieldLabel for="account-login">Login name</FieldLabel
              ><Input id="account-login" v-model="input.login_name" required autocomplete="off"
            /></Field>
          </div>
          <Field
            ><FieldLabel for="account-external">External account ID</FieldLabel
            ><Input id="account-external" v-model="input.external_account_id" required
          /></Field>
          <Field
            ><FieldLabel for="account-email">Email</FieldLabel
            ><Input
              id="account-email"
              v-model="input.email"
              type="email"
              required
              autocomplete="off"
          /></Field>
        </template>
        <Field
          ><FieldLabel for="account-password">{{
            editing ? 'New password' : 'Password'
          }}</FieldLabel
          ><Input
            id="account-password"
            v-model="input.password"
            type="password"
            :required="!editing"
            autocomplete="new-password"
          /><FieldDescription v-if="editing"
            >Leave blank to keep the current password.</FieldDescription
          ></Field
        >
        <Field
          ><FieldLabel for="account-secret">{{
            editing ? 'New secret key' : 'Secret key'
          }}</FieldLabel
          ><Input
            id="account-secret"
            v-model="input.secret_key"
            type="password"
            :required="!editing"
            autocomplete="off"
          /><FieldDescription v-if="editing"
            >Leave blank to keep the current secret key.</FieldDescription
          ></Field
        >
        <label class="flex items-center gap-2 text-sm"
          ><input v-model="input.is_limit" type="checkbox" class="size-4 accent-primary" /> Account
          is limited</label
        >
        <Alert v-if="formError" variant="destructive"
          ><AlertDescription>{{ formError }}</AlertDescription></Alert
        >
      </form>
      <DialogFooter
        ><Button variant="outline" :disabled="saving" @click="formOpen = false">Cancel</Button
        ><Button type="submit" form="account-form" :disabled="saving">{{
          saving ? 'Saving...' : 'Save account'
        }}</Button></DialogFooter
      >
    </DialogContent>
  </Dialog>
  <Dialog
    :open="!!deleting"
    @update:open="
      (open) => {
        if (!open && !saving) deleting = null
      }
    "
    ><DialogContent
      ><DialogHeader
        ><DialogTitle>Delete account?</DialogTitle
        ><DialogDescription
          >{{ deleting?.login_name }} and its stored secret key will be deleted.</DialogDescription
        ></DialogHeader
      ><Alert v-if="deleteError" variant="destructive"
        ><AlertDescription>{{ deleteError }}</AlertDescription></Alert
      ><DialogFooter
        ><Button variant="outline" :disabled="saving" @click="deleting = null">Cancel</Button
        ><Button variant="destructive" :disabled="saving" @click="remove">{{
          saving ? 'Deleting...' : 'Delete account'
        }}</Button></DialogFooter
      ></DialogContent
    ></Dialog
  >
  <Dialog
    :open="!!secretAccount"
    @update:open="
      (open) => {
        if (!open) closeSecret()
      }
    "
    ><DialogContent
      ><DialogHeader
        ><DialogTitle>Secret key</DialogTitle
        ><DialogDescription
          >{{ secretAccount?.login_name }} · {{ secretAccount?.provider }}</DialogDescription
        ></DialogHeader
      >
      <p v-if="secretLoading" role="status" class="text-sm text-muted-foreground">
        Loading secret key...
      </p>
      <Alert v-else-if="secretError" variant="destructive"
        ><AlertDescription>{{ secretError }}</AlertDescription></Alert
      >
      <div v-else class="flex gap-2">
        <Input
          :model-value="secret"
          :type="showSecret ? 'text' : 'password'"
          readonly
          autocomplete="off"
          aria-label="Account secret key"
        /><Button
          variant="outline"
          size="icon"
          :aria-label="showSecret ? 'Hide secret key' : 'Show secret key'"
          @click="showSecret = !showSecret"
          ><PhEyeSlash v-if="showSecret" /><PhEye v-else
        /></Button>
      </div>
      <DialogFooter
        ><Button variant="outline" @click="closeSecret">Close</Button></DialogFooter
      ></DialogContent
    ></Dialog
  >
</template>
