<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhKey, PhPencilSimple } from '@phosphor-icons/vue'
import { api, type Account } from '@/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const props = defineProps<{ accountId: string | null }>()
const emit = defineEmits<{ close: []; edit: [account: Account]; secret: [account: Account] }>()
const account = ref<Account | null>(null)
const loading = ref(false)
const error = ref('')
const retry = ref(0)
const fields = computed(() => {
  if (!account.value) return []
  const value = account.value
  const date = new Date(value.created_at)
  return [
    { label: 'Login name', value: value.login_name },
    { label: 'Provider', value: value.provider },
    { label: 'Email', value: value.email },
    { label: 'External account ID', value: value.external_account_id },
    { label: 'Account ID', value: value.id },
    { label: 'Created', value: Number.isNaN(date.getTime()) ? '—' : date.toLocaleString() },
  ]
})

watch(
  [() => props.accountId, retry],
  async ([id], _, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    account.value = null
    error.value = ''
    loading.value = !!id
    if (!id) return
    const result = await api.account(id)
    if (cancelled) return
    loading.value = false
    if (result.code !== 0) {
      error.value = result.error.message
      return
    }
    account.value = result.data.account
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :open="!!accountId"
    @update:open="
      (open) => {
        if (!open) emit('close')
      }
    "
  >
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Account details</DialogTitle>
        <DialogDescription>View account information and manage its credentials.</DialogDescription>
      </DialogHeader>
      <div v-if="loading" role="status" aria-busy="true" class="space-y-4">
        <span class="sr-only">Loading account details...</span>
        <div v-for="n in 6" :key="n" class="space-y-2" aria-hidden="true">
          <Skeleton class="h-3 w-24" /><Skeleton class="h-5 w-2/3" />
        </div>
      </div>
      <Alert v-else-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
        <Button variant="outline" class="mt-3" @click="retry++">Try again</Button>
      </Alert>
      <dl v-else-if="account" class="divide-y rounded-lg border bg-card px-4">
        <div
          v-for="field in fields"
          :key="field.label"
          class="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
        >
          <dt class="text-sm text-muted-foreground">{{ field.label }}</dt>
          <dd class="min-w-0 break-all text-sm font-medium">{{ field.value }}</dd>
        </div>
        <div class="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
          <dt class="text-sm text-muted-foreground">Status</dt>
          <dd>
            <Badge :variant="account.is_limit ? 'outline' : 'secondary'">{{
              account.is_limit ? 'Limited' : 'Available'
            }}</Badge>
          </dd>
        </div>
      </dl>
      <DialogFooter class="flex-wrap gap-2">
        <Button variant="outline" @click="emit('close')">Close</Button>
        <Button v-if="account" variant="outline" @click="emit('secret', account)"
          ><PhKey /> Secret key</Button
        >
        <Button v-if="account" @click="emit('edit', account)"
          ><PhPencilSimple /> Edit account</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
