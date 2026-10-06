<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  PhPlus,
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
const matches = computed(() =>
  accounts.value.filter((account) =>
    [account.provider, account.login_name, account.email, account.external_account_id].some(
      (value) => value.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()),
    ),
  ),
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
    <div class="mb-5 flex gap-2 border-t pt-5">
      <InputGroup class="bg-card"
        ><InputGroupInput
          v-model="search"
          type="search"
          placeholder="Search accounts"
          aria-label="Search accounts" /><InputGroupAddon><PhMagnifyingGlass /></InputGroupAddon
      ></InputGroup>
      <Button variant="outline" :disabled="loading" @click="refresh"
        ><PhArrowsClockwise :class="{ 'animate-spin motion-reduce:animate-none': loading }" /><span
          class="hidden sm:inline"
          >Refresh</span
        ><span class="sr-only sm:hidden">Refresh accounts</span></Button
      >
    </div>
    <div v-if="loading" role="status" aria-busy="true">
      <span class="sr-only">Loading accounts...</span>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card v-for="n in 3" :key="n" class="p-5"
          ><Skeleton class="h-5 w-2/3" /><Skeleton class="mt-3 h-4 w-full" /><Skeleton
            class="mt-5 h-8 w-24"
        /></Card>
      </div>
    </div>
    <Alert v-else-if="error" variant="destructive"
      ><AlertTitle>Unable to load accounts</AlertTitle
      ><AlertDescription>{{ error }}</AlertDescription
      ><Button variant="outline" class="mt-4" @click="refresh">Try again</Button></Alert
    >
    <Empty v-else-if="!accounts.length" class="border bg-card"
      ><EmptyHeader
        ><EmptyTitle>No accounts yet</EmptyTitle
        ><EmptyDescription>Add an account to manage its secret key.</EmptyDescription></EmptyHeader
      ><EmptyContent
        ><Button @click="begin(null)"><PhPlus /> Add account</Button></EmptyContent
      ></Empty
    >
    <Empty v-else-if="!matches.length" class="border bg-card"
      ><EmptyHeader
        ><EmptyTitle>No accounts found</EmptyTitle
        ><EmptyDescription>Try another search.</EmptyDescription></EmptyHeader
      ><EmptyContent
        ><Button variant="outline" @click="search = ''">Clear search</Button></EmptyContent
      ></Empty
    >
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
