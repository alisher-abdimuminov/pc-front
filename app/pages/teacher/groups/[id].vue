<script setup lang="ts">
definePageMeta({ middleware: "teacher" });
import type { User, Group } from "@/types/api";
const route = useRoute();
const { api } = useApi();
const students = ref<User[]>([]);
const group = ref<Group | null>(null);
onMounted(async () => {
	[group.value, students.value] = await Promise.all([
		api(`/groups/${route.params.id}/`),
		api(`/students/?group=${route.params.id}`),
	]);
});
</script>
<template>
	<PageTitle
		:title="group?.name || 'Guruh'"
		:description="`${students.length} ta talaba`" />
	<Card>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead
						class="border-b text-xs uppercase text-muted-foreground">
						<tr>
							<th class="p-4">Talaba</th>
							<th class="p-4">HEMIS ID</th>
							<th class="p-4">Kurs</th>
							<th class="p-4">GPA</th>
							<th class="p-4">Telefon</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="s in students"
							:key="s.id"
							class="border-b last:border-0">
							<td class="p-4">
								<div class="flex items-center gap-3">
									<img
										v-if="s.image"
										:src="s.image as string"
										class="h-9 w-9 rounded-full object-cover" />
									<div class="font-medium">
										{{ s.full_name }}
									</div>
								</div>
							</td>
							<td class="p-4">{{ s.username }}</td>
							<td class="p-4">{{ s.course || "—" }}</td>
							<td class="p-4">{{ s.gap ?? "—" }}</td>
							<td class="p-4">{{ s.phone_number || "—" }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
	<EmptyState
		v-if="!students.length"
		class="mt-4"
		title="Talabalar topilmadi" />
</template>
