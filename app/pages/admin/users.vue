<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import type { User } from "@/types/api";
const { api, errorMessage } = useApi();
const users = ref<User[]>([]),
	error = ref(""),
	search = ref("");
const filtered = computed(() =>
	users.value.filter((u) =>
		(u.full_name + " " + u.username)
			.toLowerCase()
			.includes(search.value.toLowerCase()),
	),
);
async function load() {
	users.value = await api("/auth/users/");
}
onMounted(load);
async function toggle(u: User) {
	try {
		await api(`/auth/users/${u.id}/`, {
			method: "PATCH",
			body: { is_active: u.is_active },
		});
	} catch (e) {
		error.value = errorMessage(e);
		u.is_active = !u.is_active;
	}
}
</script>
<template>
	<AppPageTitle title="Foydalanuvchilar" />
	<Input
		v-model="search"
		class="mb-4 max-w-md"
		placeholder="Ism yoki HEMIS ID bo‘yicha qidirish" />
	<div
		v-if="error"
		class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
		{{ error }}
	</div>
	<Card>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b">
						<tr>
							<th class="p-4">Foydalanuvchi</th>
							<th class="p-4">Role</th>
							<th class="p-4">Guruh</th>
							<th class="p-4">Status</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="u in filtered" :key="u.id" class="border-b">
							<td class="p-4">
								<div class="font-medium">
									{{ u.full_name || u.username }}
								</div>
								<div class="text-xs text-muted-foreground">
									{{ u.username }}
								</div>
							</td>
							<td class="p-4">
								<Badge variant="outline">{{ u.role }}</Badge>
							</td>
							<td class="p-4">{{ u.group_name || "—" }}</td>
							<td class="p-4">
								<label class="flex items-center gap-2">
									<input
										v-model="u.is_active"
										type="checkbox"
										@change="toggle(u)" />
									{{ u.is_active ? "Aktiv" : "Nofaol" }}
								</label>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</template>
