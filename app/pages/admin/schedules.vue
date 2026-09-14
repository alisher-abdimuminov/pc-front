<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import { Plus, Trash2 } from "@lucide/vue";
import type { Schedule, Group, Location } from "@/types/api";
const { api, errorMessage } = useApi();
const items = ref<Schedule[]>([]),
	groups = ref<Group[]>([]),
	locations = ref<Location[]>([]),
	error = ref("");
const form = reactive({
	weekday: 0,
	location: "" as number | string,
	groups: [] as number[],
	is_active: true,
});
const days = [
	"Dushanba",
	"Seshanba",
	"Chorshanba",
	"Payshanba",
	"Juma",
	"Shanba",
	"Yakshanba",
];
async function load() {
	[items.value, groups.value, locations.value] = await Promise.all([
		api("/schedules/"),
		api("/groups/"),
		api("/locations/"),
	]);
}
onMounted(load);
async function create() {
	try {
		await api("/schedules/", { method: "POST", body: form });
		form.groups = [];
		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}
async function remove(id: number) {
	if (confirm("Jadval o‘chirilsinmi?")) {
		await api(`/schedules/${id}/`, { method: "DELETE" });
		await load();
	}
}
</script>
<template>
	<AppPageTitle title="Dars jadvali" />
	<div
		v-if="error"
		class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
		{{ error }}
	</div>
	<Card class="mb-5">
		<CardContent class="grid gap-4 py-5 md:grid-cols-2">
			<div>
				<Label>Hafta kuni</Label>
				<select
					v-model="form.weekday"
					class="h-10 w-full rounded-lg border px-3">
					<option v-for="(d, i) in days" :value="i">{{ d }}</option>
				</select>
			</div>
			<div>
				<Label>Joylashuv</Label>
				<select
					v-model="form.location"
					class="h-10 w-full rounded-lg border px-3">
					<option value="">Tanlang</option>
					<option v-for="l in locations" :value="l.id">
						{{ l.name }}
					</option>
				</select>
			</div>
			<div class="md:col-span-2">
				<Label>Guruhlar</Label>
				<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					<label
						v-for="g in groups"
						class="flex items-center gap-2 rounded-lg border p-3 text-sm">
						<input
							v-model="form.groups"
							type="checkbox"
							:value="g.id" />
						{{ g.name }}
					</label>
				</div>
			</div>
			<div>
				<Button @click="create">
					<Plus class="mr-2 h-4 w-4" />
					Jadval yaratish
				</Button>
			</div>
		</CardContent>
	</Card>
	<div class="space-y-3">
		<Card v-for="s in items" :key="s.id">
			<CardContent
				class="flex flex-wrap items-center justify-between gap-3 py-4">
				<div>
					<div class="font-semibold">
						{{ days[s.weekday] }} • {{ s.location_detail.name }}
					</div>
					<div class="mt-1 text-sm text-muted-foreground">
						{{ s.group_details.map((g) => g.name).join(", ") }}
					</div>
				</div>
				<Button variant="destructive" size="sm" @click="remove(s.id)">
					<Trash2 class="h-4 w-4" />
				</Button>
			</CardContent>
		</Card>
	</div>
</template>
