<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhPencilSimple, PhTrash, PhPlus } from '@phosphor-icons/vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api, type Tag } from '@/api'
import { normalizeTagName, validateTag } from '@/tag-validation'
const props = defineProps<{
  open: boolean
  tags: Tag[]
  loading: boolean
  error: string
  startCreate: boolean
}>()
const emit = defineEmits<{ close: []; refresh: []; changed: [] }>()
const search = ref('')
const editing = ref<Tag | null>(null)
const formOpen = ref(false)
const name = ref('')
const description = ref('')
const color = ref('#166534')
const saving = ref(false)
const formError = ref('')
const deleting = ref<Tag | null>(null)
const matches = computed(() =>
  props.tags.filter(
    (tag) =>
      tag.name.toLocaleLowerCase('vi').includes(search.value.toLocaleLowerCase('vi')) ||
      tag.description.toLocaleLowerCase('vi').includes(search.value.toLocaleLowerCase('vi')),
  ),
)
watch(
  () => [props.open, props.startCreate],
  () => {
    if (props.open && props.startCreate) begin(null)
  },
)
function begin(tag: Tag | null) {
  editing.value = tag
  name.value = tag?.name ?? ''
  description.value = tag?.description ?? ''
  color.value = tag?.color ?? '#166534'
  formError.value = ''
  formOpen.value = true
}
async function save() {
  if (saving.value) return
  const input = {
    name: normalizeTagName(name.value),
    description: description.value.trim(),
    color: color.value,
  }
  formError.value = validateTag(input)
  if (formError.value) return
  saving.value = true
  try {
    if (editing.value) await api.updateTag(editing.value.id, input)
    else await api.createTag(input)
    formOpen.value = false
    emit('changed')
  } catch (cause) {
    formError.value = cause instanceof Error ? cause.message : 'Unable to save tag'
  } finally {
    saving.value = false
  }
}
function confirmDelete(tag: Tag) {
  deleting.value = tag
  formError.value = ''
}
async function remove() {
  if (!deleting.value || saving.value) return
  saving.value = true
  try {
    await api.deleteTag(deleting.value.id)
    deleting.value = null
    emit('changed')
  } catch (cause) {
    formError.value = cause instanceof Error ? cause.message : 'Unable to delete tag'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <Dialog
    :open="open"
    @update:open="
      (value) => {
        if (!value) emit('close')
      }
    "
  >
    <DialogContent class="sm:max-w-xl">
      <DialogHeader
        ><DialogTitle>Manage tags</DialogTitle
        ><DialogDescription
          >Create and organize tags for your websites.</DialogDescription
        ></DialogHeader
      >
      <div class="flex gap-2">
        <Input v-model="search" aria-label="Search tags" placeholder="Search tags" /><Button
          type="button"
          @click="begin(null)"
          ><PhPlus /> Create tag</Button
        >
      </div>
      <div v-if="loading" role="status">Loading tags...</div>
      <div v-else-if="error" role="alert">
        {{ error }} <Button variant="outline" @click="emit('refresh')">Try again</Button>
      </div>
      <div v-else class="max-h-80 overflow-y-auto">
        <p v-if="!matches.length" class="py-6 text-center text-sm text-muted-foreground">
          No tags found.
        </p>
        <div v-for="tag in matches" :key="tag.id" class="flex items-start gap-3 border-b py-3">
          <span
            class="mt-1 size-4 shrink-0 rounded-full border"
            :style="{ backgroundColor: tag.color }"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <strong class="break-all italic">#{{ tag.name }}</strong>
            <p v-if="tag.description" class="text-sm text-muted-foreground">
              {{ tag.description }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="`Edit ${tag.name}`"
            @click="begin(tag)"
            ><PhPencilSimple
          /></Button>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="`Delete ${tag.name}`"
            @click="confirmDelete(tag)"
            ><PhTrash
          /></Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  <Dialog
    :open="formOpen"
    @update:open="
      (value) => {
        if (!value && !saving) formOpen = false
      }
    "
  >
    <DialogContent class="sm:max-w-md"
      ><DialogHeader
        ><DialogTitle>{{ editing ? 'Edit tag' : 'Create tag' }}</DialogTitle
        ><DialogDescription
          >Choose a name, description, and display color.</DialogDescription
        ></DialogHeader
      >
      <form id="tag-form" class="grid gap-3" @submit.prevent="save">
        <label class="grid gap-1 text-sm font-medium"
          >Name<Input v-model="name" maxlength="66" required
        /></label>
        <label class="grid gap-1 text-sm font-medium"
          >Description<Input v-model="description" maxlength="240"
        /></label>
        <label class="grid gap-1 text-sm font-medium"
          >Color
          <input v-model="color" type="color" class="h-10 w-20 cursor-pointer rounded border"
        /></label>
        <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
      </form>
      <DialogFooter
        ><Button variant="outline" :disabled="saving" @click="formOpen = false">Cancel</Button
        ><Button type="submit" form="tag-form" :disabled="saving">{{
          saving ? 'Saving...' : 'Save tag'
        }}</Button></DialogFooter
      >
    </DialogContent>
  </Dialog>
  <Dialog
    :open="!!deleting"
    @update:open="
      (value) => {
        if (!value && !saving) deleting = null
      }
    "
  >
    <DialogContent class="sm:max-w-md"
      ><DialogHeader
        ><DialogTitle>Delete tag?</DialogTitle
        ><DialogDescription
          >This will remove #{{ deleting?.name }} from all websites that use it. Websites will be
          kept.</DialogDescription
        ></DialogHeader
      >
      <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
      <DialogFooter
        ><Button variant="outline" :disabled="saving" @click="deleting = null">Cancel</Button
        ><Button variant="destructive" :disabled="saving" @click="remove">{{
          saving ? 'Deleting...' : 'Delete tag'
        }}</Button></DialogFooter
      >
    </DialogContent>
  </Dialog>
</template>
