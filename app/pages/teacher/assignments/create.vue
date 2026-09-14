<script setup lang="ts">
definePageMeta({ middleware: "teacher" });
import type { Group } from "@/types/api";
const { api, errorMessage } = useApi();
const groups = ref<Group[]>([]);
const form = reactive({
	title: "",
	description: "",
	deadline: "",
	groups: [] as number[],
});
const file = ref<File | null>(null),
	error = ref(""),
	busy = ref(false);
onMounted(async () => (groups.value = await api("/groups/")));
async function submit() {
	busy.value = true;
	error.value = "";
	try {
		const fd = new FormData();
		fd.append("title", form.title);
		fd.append("description", form.description);
		fd.append("deadline", new Date(form.deadline).toISOString());
		form.groups.forEach((g) => fd.append("groups", String(g)));
		if (file.value) fd.append("file", file.value);
		await api("/assignments/", { method: "POST", body: fd });
		await navigateTo("/teacher/assignments");
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		busy.value = false;
	}
}
</script>
<template>
	<PageTitle title="Yangi topshiriq" />
	<Card class="max-w-3xl">
		<CardContent class="space-y-5 py-6">
			<div
				v-if="error"
				class="rounded-xl bg-red-50 p-3 text-sm text-red-700">
				{{ error }}
			</div>
			<div>
				<Label>Sarlavha</Label>
				<Input v-model="form.title" />
			</div>
			<div>
				<Label>Tavsif</Label>
				<Textarea v-model="form.description" />
			</div>
			<div>
				<Label>Deadline</Label>
				<Input v-model="form.deadline" type="datetime-local" />
			</div>
			<div>
				<Label>Guruhlar</Label>
				<div class="grid gap-2 sm:grid-cols-2">
					<label
						v-for="g in groups"
						:key="g.id"
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
				<Label>Biriktirma (ixtiyoriy)</Label>
				<input
					type="file"
					class="block w-full text-sm"
					@change="
						file =
							($event.target as HTMLInputElement).files?.[0] ||
							null
					" />
			</div>
			<div class="flex gap-2">
				<Button :disabled="busy" @click="submit">Saqlash</Button>
				<Button
					variant="outline"
					@click="navigateTo('/teacher/assignments')">
					Bekor qilish
				</Button>
			</div>
		</CardContent>
	</Card>
</template>
