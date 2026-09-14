<script setup lang="ts">
definePageMeta({ middleware: "admin" });
const { api } = useApi();
const rows = ref<any[]>([]);
onMounted(async () => (rows.value = await api("/attendance/attempts/")));
</script>
<template>
	<AppPageTitle
		title="Attendance xato urinishlari"
		description="Face, location yoki vaqt tekshiruvlarida qayd etilgan audit yozuvlari."
	/>
	<div class="space-y-3">
		<Card v-for="r in rows" :key="r.id"
			><CardContent class="grid gap-3 py-4 md:grid-cols-4"
				><div>
					<div class="text-xs text-slate-500">Student ID</div>
					<div class="font-medium">{{ r.student }}</div>
				</div>
				<div>
					<div class="text-xs text-slate-500">IP</div>
					<div>{{ r.ip_address || "—" }}</div>
				</div>
				<div>
					<div class="text-xs text-slate-500">GPS</div>
					<div>{{ r.latitude }}, {{ r.longitude }}</div>
				</div>
				<div>
					<div class="text-xs text-slate-500">Vaqt</div>
					<div>
						{{ new Date(r.attempted_at).toLocaleString("uz-UZ") }}
					</div>
				</div>
				<div class="md:col-span-4">
					<Badge variant="destructive">{{
						r.error_code || r.status || "FAILED"
					}}</Badge
					><span class="ml-2 text-sm text-slate-600">{{
						r.error_message || r.reason || ""
					}}</span>
				</div></CardContent
			></Card
		>
	</div>
	<AppEmptyState v-if="!rows.length" title="Xato urinishlar yo‘q" />
</template>
