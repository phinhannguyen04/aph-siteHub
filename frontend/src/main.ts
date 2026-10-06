import { createApp } from 'vue'
import { RouterProvider } from '@tanstack/vue-router'
import { router } from './router'
import './style.css'

createApp(RouterProvider, { router }).mount('#app')
