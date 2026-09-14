<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import { Trash2, Plus } from "@lucide/vue";
import type { Group, User } from "@/types/api";
const { api, errorMessage } = useApi();
const groups = ref<Group[]>([]),
	users = ref<User[]>([]),
	error = ref("");
const form = reactive({ name: "", teacher: "" as string });
const teachers = computed(() =>
	users.value.filter((x) => x.role === "teacher"),
);
async function load() {
	[groups.value, users.value] = await Promise.all([
		api("/groups/"),
		api("/auth/users/"),
	]);
}
onMounted(load);
async function create() {
	try {
		await api("/groups/", {
			method: "POST",
			body: { name: form.name, teacher: form.teacher || null },
		});
		form.name = "";
		form.teacher = "";
		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}
async function save(g: Group) {
	try {
		await api(`/groups/${g.id}/`, {
			method: "PATCH",
			body: { name: g.name, teacher: g.teacher },
		});
		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}
async function remove(id: number) {
	if (!confirm("Guruh o‘chirilsinmi?")) return;
	try {
		await api(`/groups/${id}/`, { method: "DELETE" });
		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}
</script>
<template>
	<AppPageTitle title="Guruhlar" />
	<div
		v-if="error"
		class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
		{{ error }}
	</div>
	<Card class="mb-5">
		<CardContent
			class="grid gap-3 py-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
			<div>
				<Label>Guruh nomi</Label>
				<Input v-model="form.name" />
			</div>
			<div>
				<Label>O‘qituvchi</Label>

				<select
					v-model="form.teacher"
					class="h-10 w-full rounded-lg border px-3 text-sm">
					<option value="">Biriktirilmagan</option>
					<option v-for="t in teachers" :value="t.id">
						{{ t.full_name }}
					</option>
				</select>
			</div>
			<Button @click="create">
				<Plus class="mr-2 h-4 w-4" />
				Qo‘shish
			</Button>
		</CardContent>
	</Card>

	<div class="space-y-3">
		<Card v-for="g in groups" :key="g.id">
			<CardContent
				class="grid gap-3 py-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
				<div>
					<Label>Nomi</Label>
					<Input v-model="g.name" />
				</div>
				<div>
					<Label>O‘qituvchi</Label>
					<select
						v-model="g.teacher"
						class="h-10 w-full rounded-lg border px-3 text-sm">
						<option :value="null">Biriktirilmagan</option>
						<option v-for="t in teachers" :value="t.id">
							{{ t.full_name }}
						</option>
					</select>
				</div>
				<Button variant="outline" @click="save(g)">Saqlash</Button>
				<Button variant="destructive" @click="remove(g.id)">
					<Trash2 class="h-4 w-4" />
				</Button>
			</CardContent>
		</Card>
	</div>
</template>
