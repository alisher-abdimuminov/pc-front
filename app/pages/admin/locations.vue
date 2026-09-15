<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import { Plus, Trash2 } from "@lucide/vue";
import type { Location } from "@/types/api";
const { api, errorMessage } = useApi();
const items = ref<Location[]>([]),
	error = ref("");
const blank = () => ({
	name: "",
	point_1: "",
	point_2: "",
	point_3: "",
	point_4: "",
	is_active: true,
});
const form = reactive(blank());
async function load() {
	items.value = await api("/locations/");
}
onMounted(load);
async function create() {
	try {
		await api("/locations/", { method: "POST", body: form });
		Object.assign(form, blank());
		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}
async function remove(id: number) {
	if (confirm("Joylashuv o‘chirilsinmi?")) {
		await api(`/locations/${id}/`, { method: "DELETE" });
		await load();
	}
}
</script>
<template>
	<AppPageTitle
		title="Joylashuvlar"
		description="Geofence uchun to‘rt nuqtali polygon kiriting." />
	<div
		v-if="error"
		class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
		{{ error }}
	</div>
	<Card class="mb-5">
		<CardContent class="space-y-4 py-5">
			<div>
				<Label>Nomi</Label>
				<Input v-model="form.name" />
			</div>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div v-for="n in 4" :key="n" class="rounded-xl border p-3">
					<div class="mb-2 text-sm font-semibold">Nuqta {{ n }}</div>
					<Input
						v-model="(form as any)[`point_${n}`]"
						placeholder="Lat and Lan" />
				</div>
				<!-- <Input
					v-model="(form as any)[`location`]"
					placeholder="Joylashuv"
				/> -->
			</div>
			<Button @click="create">
				<Plus class="mr-2 h-4 w-4" />
				Joylashuv qo‘shish
			</Button>
		</CardContent>
	</Card>
	<div class="grid gap-3 md:grid-cols-2">
		<Card v-for="x in items" :key="x.id">
			<CardContent class="py-5">
				<div class="flex items-start justify-between">
					<div>
						<div class="font-semibold">{{ x.name }}</div>
						<Badge
							class="mt-2"
							:variant="x.is_active ? 'default' : 'outline'">
							{{ x.is_active ? "Faol" : "Nofaol" }}
						</Badge>
					</div>
					<Button
						size="sm"
						variant="destructive"
						@click="remove(x.id)">
						<Trash2 class="h-4 w-4" />
					</Button>
				</div>
				<div class="mt-4 grid grid-cols-2 gap-2 text-xs">
					<div v-for="n in 4" :key="n">
						{{ (x as any)[`point_${n}`] }}
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</template>
