<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import type { Attendance, Group } from "@/types/api";
const { api } = useApi();
const rows = ref<Attendance[]>([]),
	groups = ref<Group[]>([]);
const filters = reactive({
	date: new Date().toISOString().slice(0, 10),
	group: "" as string | number,
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
	<AppPageTitle title="Davomat monitoring" />
	<div class="mb-4 flex gap-3">
		<Input
			v-model="filters.date"
			type="date"
			class="w-auto"
			@change="load" />
		<select
			v-model="filters.group"
			class="h-10 rounded-lg border px-3"
			@change="load">
			<option value="">Barcha guruhlar</option>
			<option v-for="g in groups" :value="g.id">{{ g.name }}</option>
		</select>
	</div>
	<Card>
		<CardContent class="p-0">
			<table class="w-full text-sm">
				<thead class="border-b">
					<tr>
						<th class="p-4 text-left">Talaba</th>
						<th v-for="n in 3" class="p-4">Step {{ n }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="r in rows" class="border-b">
						<td class="p-4 font-medium">{{ r.student_name }}</td>
						<td v-for="n in 3" class="p-4 text-center">
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
		</CardContent>
	</Card>
</template>
