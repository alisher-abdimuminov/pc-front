<script setup lang="ts">
definePageMeta({ middleware: "teacher" });
import type { Attendance, Group } from "@/types/api";
const { api } = useApi();
const groups = ref<Group[]>([]),
	rows = ref<Attendance[]>([]);
const filters = reactive({
	group: "",
	date: new Date().toISOString().slice(0, 10),
});
async function load() {
	let q = `?date=${filters.date}`;
	if (filters.group) q += `&group=${filters.group}`;
	rows.value = await api(`/attendance/records/${q}`);
}
onMounted(async () => {
	groups.value = await api("/groups/");
	await load();
});
</script>
<template>
	<PageTitle title="Davomat" />
	<div class="mb-4 flex flex-wrap gap-3">
		<select
			v-model="filters.group"
			class="h-10 rounded-lg border px-3 text-sm"
			@change="load">
			<option value="">Barcha guruhlar</option>
			<option v-for="g in groups" :value="g.id">{{ g.name }}</option>
		</select>
		<Input
			v-model="filters.date"
			type="date"
			class="w-auto"
			@change="load" />
	</div>
	<Card>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="border-b">
						<tr>
							<th class="p-4 text-left">Talaba</th>
							<th class="p-4">Step 1</th>
							<th class="p-4">Step 2</th>
							<th class="p-4">Step 3</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="r in rows" :key="r.id" class="border-b">
							<td class="p-4 font-medium">
								{{ r.student_name }}
							</td>
							<td v-for="n in 3" :key="n" class="p-4 text-center">
								<Badge
									:variant="
										r.records.some((x) => x.step === n)
											? 'default'
											: 'destructive'
									">
									{{
										r.records.some((x) => x.step === n)
											? "✓"
											: "—"
									}}
								</Badge>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</template>
