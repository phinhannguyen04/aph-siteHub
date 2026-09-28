<script setup lang="ts">
import { computed, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import { PhCheck, PhPlus, PhGear } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Tag } from '@/api'
import TagChips from './TagChips.vue'
const props = withDefaults(
  defineProps<{
    tags: Tag[]
    modelValue: string[]
    label?: string
    showSelected?: boolean
    showActions?: boolean
  }>(),
  { showSelected: true, showActions: true },
)
const emit = defineEmits<{ 'update:modelValue': [value: string[]]; create: []; manage: [] }>()
const search = ref('')
const open = ref(false)
const selected = computed(() => props.tags.filter((tag) => props.modelValue.includes(tag.id)))
const matches = computed(() =>
  props.tags.filter(
    (tag) =>
      tag.name.toLocaleLowerCase('vi').includes(search.value.toLocaleLowerCase('vi')) ||
      tag.description.toLocaleLowerCase('vi').includes(search.value.toLocaleLowerCase('vi')),
  ),
)
function action(kind: 'create' | 'manage') {
  open.value = false
  if (kind === 'create') emit('create')
  else emit('manage')
}
function toggle(id: string) {
  emit(
    'update:modelValue',
    props.modelValue.includes(id)
      ? props.modelValue.filter((value) => value !== id)
      : [...props.modelValue, id],
  )
}
</script>
<template>
  <div class="grid gap-2">
    <PopoverRoot v-model:open="open">
      <PopoverTrigger as-child
        ><Button type="button" variant="outline" class="w-full justify-start"
          >{{ label || 'Select tags'
          }}<span
            class="ml-auto min-w-5 rounded bg-secondary px-1 text-center text-xs tabular-nums"
            >{{ modelValue.length }}</span
          ></Button
        ></PopoverTrigger
      >
      <PopoverPortal
        ><PopoverContent
          side="bottom"
          align="start"
          :side-offset="5"
          class="z-60 w-[min(90vw,22rem)] rounded-md border bg-card p-3 shadow-lg"
        >
          <Input v-model="search" aria-label="Search tags" placeholder="Search tags" class="mb-2" />
          <div class="max-h-56 overflow-y-auto" role="group" aria-label="Tags">
            <button
              v-for="tag in matches"
              :key="tag.id"
              type="button"
              class="flex w-full items-start gap-2 rounded p-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
              :aria-pressed="modelValue.includes(tag.id)"
              @click="toggle(tag.id)"
            >
              <span
                class="mt-1 size-3 shrink-0 rounded-full border"
                :style="{ backgroundColor: tag.color }"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1"
                ><strong class="break-all italic">#{{ tag.name }}</strong
                ><span
                  v-if="tag.description"
                  class="block wrap-break-word text-xs text-muted-foreground"
                  >{{ tag.description }}</span
                ></span
              >
              <PhCheck
                v-if="modelValue.includes(tag.id)"
                class="size-4 shrink-0"
                aria-hidden="true"
              />
            </button>
            <p v-if="!matches.length" class="p-2 text-sm text-muted-foreground">No tags found.</p>
          </div>
          <div v-if="showActions" class="mt-2 flex flex-wrap gap-2 border-t pt-2">
            <Button type="button" variant="ghost" size="sm" @click="action('create')"
              ><PhPlus /> Create tag</Button
            >
            <Button type="button" variant="ghost" size="sm" @click="action('manage')"
              ><PhGear /> Manage tags</Button
            >
          </div>
        </PopoverContent></PopoverPortal
      >
    </PopoverRoot>
    <TagChips v-if="showSelected && selected.length" :tags="selected" @remove="toggle" />
  </div>
</template>
