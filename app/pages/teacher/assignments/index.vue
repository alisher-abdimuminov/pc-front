<script setup lang="ts">
definePageMeta({ middleware: "teacher" });
import { Plus, FileText } from "@lucide/vue";
import type { Assignment } from "@/types/api";
const { api } = useApi();
const items = ref<Assignment[]>([]);
onMounted(async () => (items.value = await api("/assignments/")));
</script>
<template>
	<div class="flex items-start justify-between gap-4">
		<PageTitle
			title="Topshiriqlar"
			description="Vazifalar va student submissionlari." />
		<Button @click="navigateTo('/teacher/assignments/create')">
			<Plus class="mr-2 h-4 w-4" />
			Yangi vazifa
		</Button>
	</div>
	<div class="space-y-3">
		<NuxtLink
			v-for="a in items"
			:key="a.id"
			:to="`/teacher/assignments/${a.id}`">
			<Card>
				<CardContent
					class="flex items-center justify-between gap-4 py-5">
					<div class="flex items-start gap-3">
						<FileText class="mt-0.5 h-5 w-5" />
						<div>
							<div class="font-semibold">{{ a.title }}</div>
							<div class="mt-1 text-xs text-muted-foreground">
								Deadline:
								{{
									new Date(a.deadline).toLocaleString("uz-UZ")
								}}
							</div>
						</div>
					</div>
					<Badge variant="outline">{{ a.groups.length }} guruh</Badge>
				</CardContent>
			</Card>
		</NuxtLink>
	</div>
	<EmptyState v-if="!items.length" title="Hali vazifa yaratilmagan" />
</template>
