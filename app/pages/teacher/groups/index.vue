<script setup lang="ts">
definePageMeta({ middleware: "teacher" });
import type { Group } from "@/types/api";
const { api } = useApi();
const groups = ref<Group[]>([]);
onMounted(async () => (groups.value = await api("/groups/")));
</script>
<template>
	<PageTitle title="Guruhlar" description="Sizga biriktirilgan guruhlar." />
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		<NuxtLink
			v-for="g in groups"
			:key="g.id"
			:to="`/teacher/groups/${g.id}`">
			<Card>
				<CardContent class="py-5">
					<h2 class="font-semibold">{{ g.name }}</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						{{ g.student_count }} talaba
					</p>
				</CardContent>
			</Card>
		</NuxtLink>
	</div>
	<EmptyState v-if="!groups.length" title="Guruh biriktirilmagan" />
</template>
