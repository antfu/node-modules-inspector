<script setup lang="ts">
import { shallowRef } from 'vue'
import { createDevBackend } from '~/backends/dev'
import { backend } from '../backends'
import { fetchData } from '../state/data'
import MainEntry from './main.vue'

const error = shallowRef()

createDevBackend()
  .then(async (b) => {
    backend.value = b
    await b.connect()
    return b
  })
  .then(() => fetchData())
  .catch((e) => {
    console.error(e)
    error.value = e
  })
</script>

<template>
  <MainEntry :backend :error />
</template>
