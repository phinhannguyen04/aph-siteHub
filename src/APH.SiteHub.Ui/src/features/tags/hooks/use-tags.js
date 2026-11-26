import { useQuery } from '@tanstack/react-query'
import { query } from '@/lib/api'

/** All tags, shared by the tag filter, the tag manager and the website form. */
export const useTags = () => useQuery({ queryKey: ['tags'], queryFn: () => query('/api/tags') })
