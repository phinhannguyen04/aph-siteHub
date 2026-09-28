<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Website, Tag } from '@/api'
import TagPicker from './TagPicker.vue'

const props = defineProps<{
  open: boolean
  website: Website | null
  saving: boolean
  error: string
  tags: Tag[]
}>()
const emit = defineEmits<{
  close: []
  save: [input: { name: string; url: string; tag_ids: string[] }]
  createTag: []
  manageTags: []
}>()
const name = ref('')
const url = ref('')
const tagIds = ref<string[]>([])
const errors = reactive({ name: '', url: '' })
watch(
  () => [props.open, props.website] as const,
  () => {
    name.value = props.website?.name ?? ''
    url.value = props.website?.url ?? ''
    tagIds.value = [...(props.website?.tag_ids ?? [])]
    errors.name = ''
    errors.url = ''
  },
)
watch(
  () => props.tags,
  (tags) => {
    const valid = new Set(tags.map((tag) => tag.id))
    tagIds.value = tagIds.value.filter((id) => valid.has(id))
  },
)
watch(name, () => {
  if (errors.name) validateName()
})
watch(url, () => {
  if (errors.url) validateUrl()
})
function validateName() {
  errors.name = !name.value.trim()
    ? 'Enter a website name.'
    : name.value.trim().length > 160
      ? 'Name must be at most 160 characters.'
      : ''
  return !errors.name
}
function validateUrl() {
  if (!url.value.trim()) errors.url = 'Enter a URL.'
  else {
    try {
      const parsed = new URL(url.value.trim())
      errors.url =
        !['http:', 'https:'].includes(parsed.protocol) ||
        !parsed.hostname ||
        parsed.username ||
        parsed.password
          ? 'URL must start with http:// or https:// and must not contain credentials.'
          : parsed.href.length > 2048
            ? 'URL must be at most 2048 characters.'
            : ''
    } catch {
      errors.url = 'Enter a valid URL, such as https://example.com'
    }
  }
  return !errors.url
}
function submit() {
  if (props.saving) return
  const validName = validateName()
  const validUrl = validateUrl()
  if (validName && validUrl)
    emit('save', { name: name.value.trim(), url: url.value.trim(), tag_ids: tagIds.value })
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (value) => {
        if (!value && !saving) emit('close')
      }
    "
  >
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ website ? 'Edit website' : 'Add website' }}</DialogTitle>
        <DialogDescription>{{
          website ? 'Update the website name and URL.' : 'Enter the website details.'
        }}</DialogDescription>
      </DialogHeader>
      <form id="website-form" class="my-5 grid gap-5" novalidate @submit.prevent="submit">
        <Field>
          <FieldLabel for="website-name">Website name</FieldLabel>
          <Input
            id="website-name"
            v-model="name"
            maxlength="160"
            autocomplete="off"
            placeholder="For example: Internal portal"
            :aria-invalid="!!errors.name"
            :aria-describedby="errors.name ? 'website-name-error' : undefined"
            @blur="validateName"
          />
          <FieldError v-if="errors.name" id="website-name-error">
            {{ errors.name }}
          </FieldError>
        </Field>
        <Field>
          <FieldLabel for="website-url">URL</FieldLabel>
          <Input
            id="website-url"
            v-model="url"
            type="url"
            maxlength="2048"
            placeholder="https://example.com"
            :aria-invalid="!!errors.url"
            :aria-describedby="errors.url ? 'website-url-error' : undefined"
            @blur="validateUrl"
          />
          <FieldError v-if="errors.url" id="website-url-error">
            {{ errors.url }}
          </FieldError>
        </Field>
        <Field>
          <FieldLabel>Tags</FieldLabel>
          <TagPicker
            v-model="tagIds"
            :tags="tags"
            @create="emit('createTag')"
            @manage="emit('manageTags')"
          />
        </Field>
        <Alert v-if="error" variant="destructive"
          ><AlertDescription>{{ error }}</AlertDescription></Alert
        >
      </form>
      <DialogFooter>
        <Button variant="outline" type="button" :disabled="saving" @click="emit('close')"
          >Cancel</Button
        >
        <Button type="submit" form="website-form" :disabled="saving">{{
          saving ? 'Saving...' : website ? 'Save changes' : 'Add website'
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
