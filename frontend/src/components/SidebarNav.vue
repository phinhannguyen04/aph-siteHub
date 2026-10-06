<script setup lang="ts">
import { Link } from '@tanstack/vue-router'
import { PhGlobe, PhUsers, PhKey, PhSignOut } from '@phosphor-icons/vue'
import { Button, buttonVariants } from '@/components/ui/button'
import { defaultWebsiteSearch } from '@/website-search'

defineProps<{ collapsed?: boolean }>()
defineEmits<{ navigate: []; changePassword: []; logout: [] }>()
const activeProps = { class: 'bg-accent text-accent-foreground', 'aria-current': 'page' }
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 p-3">
    <nav aria-label="Main navigation" class="grid gap-1">
      <p
        v-if="!collapsed"
        class="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Workspace
      </p>
      <Link
        to="/"
        :search="defaultWebsiteSearch"
        :active-options="{ exact: true, includeSearch: false }"
        :active-props="activeProps"
        :class="[
          buttonVariants({ variant: 'ghost' }),
          'w-full',
          collapsed ? 'justify-center px-0' : 'justify-start',
        ]"
        :title="collapsed ? 'Websites' : undefined"
        aria-label="Websites"
        @click="$emit('navigate')"
      >
        <PhGlobe class="size-5 shrink-0" aria-hidden="true" /><span v-if="!collapsed"
          >Websites</span
        >
      </Link>
      <Link
        to="/accounts"
        :active-options="{ exact: true }"
        :active-props="activeProps"
        :class="[
          buttonVariants({ variant: 'ghost' }),
          'w-full',
          collapsed ? 'justify-center px-0' : 'justify-start',
        ]"
        :title="collapsed ? 'Accounts' : undefined"
        aria-label="Accounts"
        @click="$emit('navigate')"
      >
        <PhUsers class="size-5 shrink-0" aria-hidden="true" /><span v-if="!collapsed"
          >Accounts</span
        >
      </Link>
    </nav>
    <div class="mt-auto grid gap-1 border-t pt-3">
      <Button
        variant="ghost"
        :class="collapsed ? 'justify-center px-0' : 'justify-start'"
        :title="collapsed ? 'Change password' : undefined"
        aria-label="Change password"
        @click="$emit('changePassword')"
        ><PhKey class="size-5 shrink-0" /><span v-if="!collapsed">Change password</span></Button
      >
      <Button
        variant="ghost"
        :class="collapsed ? 'justify-center px-0' : 'justify-start'"
        :title="collapsed ? 'Sign out' : undefined"
        aria-label="Sign out"
        @click="$emit('logout')"
        ><PhSignOut class="size-5 shrink-0" /><span v-if="!collapsed">Sign out</span></Button
      >
    </div>
  </div>
</template>
