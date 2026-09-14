<script setup lang="ts">
definePageMeta({ middleware: "student" });
const route = useRoute();
await navigateTo("/student/assignments", { replace: true });
</script>
<template><div /></template>
