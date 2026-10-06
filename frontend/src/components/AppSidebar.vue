<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { PhGlobe, PhSidebarSimple } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import SidebarNav from './SidebarNav.vue'

const collapsed = useStorage('sitehub-sidebar-collapsed', false)
defineEmits<{ changePassword: []; logout: [] }>()
</script>

<template>
  <aside
    :class="[
      'sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card transition-[width] duration-200 motion-reduce:transition-none md:flex',
      collapsed ? 'w-16' : 'w-60',
    ]"
    aria-label="Workspace sidebar"
  >
    <div
      :class="[
        'flex h-16 shrink-0 items-center border-b',
        collapsed ? 'justify-center' : 'gap-2 px-3',
      ]"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        class="shrink-0"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        aria-controls="desktop-navigation"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <PhSidebarSimple class="size-5" aria-hidden="true" />
      </Button>
      <PhGlobe v-if="!collapsed" class="size-5 shrink-0 text-primary" aria-hidden="true" />
      <span v-if="!collapsed" class="whitespace-nowrap font-semibold tracking-tight"
        >APH SiteHub</span
      >
    </div>
    <SidebarNav
      id="desktop-navigation"
      :collapsed="collapsed"
      class="flex-1"
      @change-password="$emit('changePassword')"
      @logout="$emit('logout')"
    />
  </aside>
</template>
