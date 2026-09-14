<script setup lang="ts">
import { Inbox } from "@lucide/vue";
defineProps<{ title: string; description?: string }>();
</script>
<template>
	<div class="rounded-2xl border border-dashed p-10 text-center">
		<Inbox class="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
		<div class="font-semibold">{{ title }}</div>
		<p v-if="description" class="mt-1 text-sm text-muted-foreground">
			{{ description }}
		</p>
	</div>
</template>
