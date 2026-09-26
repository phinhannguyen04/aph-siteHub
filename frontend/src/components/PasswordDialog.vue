<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { PhArrowsClockwise, PhEye, PhEyeSlash } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group'
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

const props = defineProps<{ open: boolean; saving: boolean; error: string }>()
const emit = defineEmits<{
  close: []
  save: [input: { currentPassword: string; newPassword: string }]
}>()
const currentPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')
const visible = reactive({ current: false, next: false, confirmation: false })
const errors = reactive({ current: '', next: '', confirmation: '' })
watch(
  () => props.open,
  () => {
    currentPassword.value = ''
    newPassword.value = ''
    confirmation.value = ''
    visible.current = visible.next = visible.confirmation = false
    errors.current = errors.next = errors.confirmation = ''
  },
)
function generate() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
  const values = crypto.getRandomValues(new Uint32Array(24))
  newPassword.value = Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
  confirmation.value = newPassword.value
  visible.next = true
  errors.next = errors.confirmation = ''
}
function submit() {
  errors.current =
    currentPassword.value && currentPassword.value.length <= 256
      ? ''
      : 'Enter your current password (up to 256 characters).'
  errors.next =
    newPassword.value.length < 12 || !newPassword.value.trim()
      ? 'New password must be at least 12 characters.'
      : newPassword.value.length > 256
        ? 'New password must be at most 256 characters.'
        : newPassword.value === currentPassword.value
          ? 'New password must differ from your current password.'
          : ''
  errors.confirmation = confirmation.value === newPassword.value ? '' : 'Passwords do not match.'
  if (!errors.current && !errors.next && !errors.confirmation)
    emit('save', { currentPassword: currentPassword.value, newPassword: newPassword.value })
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
        <DialogTitle>Change password</DialogTitle>
        <DialogDescription
          >Enter your current password, then set or generate a new one. Other sessions will be
          signed out.</DialogDescription
        >
      </DialogHeader>
      <form id="password-form" class="my-5 grid gap-5" novalidate @submit.prevent="submit">
        <Field>
          <FieldLabel for="current-password">Current password</FieldLabel>
          <InputGroup class="password-field">
            <InputGroupInput
              id="current-password"
              v-model="currentPassword"
              :type="visible.current ? 'text' : 'password'"
              autocomplete="current-password"
              :aria-invalid="!!errors.current"
              :aria-describedby="errors.current ? 'current-password-error' : undefined"
              @input="errors.current = ''"
            />
            <InputGroupAddon v-if="currentPassword" align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                :aria-label="visible.current ? 'Hide current password' : 'Show current password'"
                :aria-pressed="visible.current"
                @click="visible.current = !visible.current"
              >
                <PhEyeSlash v-if="visible.current" :size="18" />
                <PhEye v-else :size="18" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError id="current-password-error" v-if="errors.current">{{
            errors.current
          }}</FieldError>
        </Field>
        <Field>
          <FieldLabel for="new-password">New password</FieldLabel>
          <InputGroup class="password-field">
            <InputGroupInput
              id="new-password"
              v-model="newPassword"
              :type="visible.next ? 'text' : 'password'"
              autocomplete="new-password"
              :aria-invalid="!!errors.next"
              :aria-describedby="errors.next ? 'new-password-error' : undefined"
              @input="errors.next = ''"
            />
            <InputGroupAddon v-if="newPassword" align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                :aria-label="visible.next ? 'Hide new password' : 'Show new password'"
                :aria-pressed="visible.next"
                @click="visible.next = !visible.next"
              >
                <PhEyeSlash v-if="visible.next" :size="18" />
                <PhEye v-else :size="18" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError id="new-password-error" v-if="errors.next">{{ errors.next }}</FieldError>
          <Button
            type="button"
            variant="link"
            class="h-auto w-fit justify-start px-0 text-sm"
            @click="generate"
            ><PhArrowsClockwise :size="15" /> Generate strong password</Button
          >
        </Field>
        <Field>
          <FieldLabel for="confirm-password">Confirm new password</FieldLabel>
          <InputGroup class="password-field">
            <InputGroupInput
              id="confirm-password"
              v-model="confirmation"
              :type="visible.confirmation ? 'text' : 'password'"
              autocomplete="new-password"
              :aria-invalid="!!errors.confirmation"
              :aria-describedby="errors.confirmation ? 'confirm-password-error' : undefined"
              @input="errors.confirmation = ''"
            />
            <InputGroupAddon v-if="confirmation" align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                :aria-label="
                  visible.confirmation ? 'Hide confirmed password' : 'Show confirmed password'
                "
                :aria-pressed="visible.confirmation"
                @click="visible.confirmation = !visible.confirmation"
              >
                <PhEyeSlash v-if="visible.confirmation" :size="18" />
                <PhEye v-else :size="18" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError id="confirm-password-error" v-if="errors.confirmation">
            {{ errors.confirmation }}
          </FieldError>
        </Field>
        <Alert v-if="error" variant="destructive"
          ><AlertDescription>{{ error }}</AlertDescription></Alert
        >
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" :disabled="saving" @click="emit('close')"
          >Cancel</Button
        >
        <Button type="submit" form="password-form" :disabled="saving">{{
          saving ? 'Updating...' : 'Change password'
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
