<script setup lang="ts">
import { computed } from 'vue'
import { PhPencilSimple, PhArrowUpRight, PhGlobe } from '@phosphor-icons/vue'
import { Card, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Website } from '@/api'

const props = defineProps<{ website: Website }>()
const emit = defineEmits<{ edit: [website: Website] }>()
const displayUrl = computed(() => {
  const parsed = URL.parse(props.website.url)
  if (!parsed) return props.website.url
  return `${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}${parsed.search}`
})
function openWebsite() {
  const url = URL.parse(props.website.url)
  if (
    !url ||
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password
  )
    return
  window.open(url.href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <Card class="website-card min-w-0 overflow-hidden rounded-lg shadow-sm">
    <Button
      type="button"
      variant="ghost"
      class="h-auto min-h-24 w-full items-start justify-start gap-3 whitespace-normal rounded-none p-4 text-left"
      :aria-label="`Open ${website.name} in a new tab`"
      @click="openWebsite"
    >
      <PhGlobe class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <span class="min-w-0 flex-1">
        <span class="block wrap-break-word text-base font-semibold">{{ website.name }}</span>
        <span
          class="mt-1 block truncate text-sm font-normal text-muted-foreground"
          :title="website.url"
          >{{ displayUrl }}</span
        >
        <span v-if="website.tags?.length" class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="tag in website.tags"
            :key="tag.id"
            class="max-w-full break-all rounded border bg-secondary px-2 py-0.5 text-xs font-bold italic"
            :title="tag.description"
            ><span
              class="mr-1 inline-block size-2 rounded-full border"
              :style="{ backgroundColor: tag.color }"
              aria-hidden="true"
            />#{{ tag.name }}</span
          >
        </span>
      </span>
      <PhArrowUpRight class="mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Button>
    <CardFooter class="justify-end border-t p-2">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        :aria-label="`Edit ${website.name}`"
        @click="emit('edit', website)"
        ><PhPencilSimple /> Edit</Button
      >
    </CardFooter>
  </Card>
</template>
