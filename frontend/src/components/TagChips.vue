<script setup lang="ts">
import { PhX } from '@phosphor-icons/vue'
import type { Tag } from '@/api'
defineProps<{ tags: Tag[] }>()
const emit = defineEmits<{ remove: [id: string] }>()
</script>

<template>
  <ul class="flex min-w-0 flex-wrap gap-2" aria-label="Selected tags">
    <li
      v-for="tag in tags"
      :key="tag.id"
      class="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border bg-secondary py-0.5 pl-2 pr-0.5 text-sm"
    >
      <span
        class="size-2 shrink-0 rounded-full border"
        :style="{ backgroundColor: tag.color }"
        aria-hidden="true"
      />
      <strong class="min-w-0 max-w-48 truncate italic" :title="'#' + tag.name"
        >#{{ tag.name }}</strong
      >
      <button
        type="button"
        :aria-label="`Remove tag ${tag.name}`"
        class="inline-flex size-7 shrink-0 items-center justify-center rounded hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
        @click="emit('remove', tag.id)"
      >
        <PhX class="size-3.5" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>
