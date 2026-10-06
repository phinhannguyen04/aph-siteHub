<script setup lang="ts">
import { Link } from '@tanstack/vue-router'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { buttonVariants } from '@/components/ui/button'
import { defaultWebsiteSearch } from '@/website-search'
</script>
<template>
  <Empty class="m-6 border bg-card"
    ><EmptyHeader
      ><EmptyTitle>Page not found</EmptyTitle
      ><EmptyDescription>The page you requested could not be found.</EmptyDescription></EmptyHeader
    ><EmptyContent
      ><Link to="/" :search="defaultWebsiteSearch" :class="buttonVariants()"
        >Back to websites</Link
      ></EmptyContent
    ></Empty
  >
</template>
