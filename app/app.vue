<script setup lang="ts">
const { init } = useColorScheme();
onMounted(init);
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
