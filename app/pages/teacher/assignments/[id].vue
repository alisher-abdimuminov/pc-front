<script setup lang="ts">
definePageMeta({ middleware: "teacher" });
import type { Assignment, Submission } from "@/types/api";
const route = useRoute();
const { api, errorMessage } = useApi();
const a = ref<Assignment | null>(null),
	subs = ref<Submission[]>([]),
	error = ref("");
const grades = reactive<
	Record<number, { grade: number | string; feedback: string }>
>({});
async function load() {
	a.value = await api(`/assignments/${route.params.id}/`);
	const all = await api<Submission[]>("/submissions/");
	subs.value = all.filter((s) => s.assignment === Number(route.params.id));
	subs.value.forEach(
		(s) =>
			(grades[s.id] = {
				grade: s.grade ?? "",
				feedback: s.feedback || "",
			}),
	);
}
onMounted(load);
async function grade(id: number) {
	try {
		await api(`/submissions/${id}/grade/`, {
			method: "POST",
			body: grades[id],
		});
		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}
</script>
<template>
	<PageTitle
		:title="a?.title || 'Topshiriq'"
		:description="
			a ? `Deadline: ${new Date(a.deadline).toLocaleString('uz-UZ')}` : ''
		" />
	<p
		v-if="a?.description"
		class="mb-5 whitespace-pre-wrap text-sm text-muted-foreground">
		{{ a.description }}
	</p>
	<div
		v-if="error"
		class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
		{{ error }}
	</div>
	<div class="space-y-3">
		<Card v-for="s in subs" :key="s.id">
			<CardContent
				class="grid gap-4 py-5 md:grid-cols-[1fr_120px_1fr_auto] md:items-end">
				<div>
					<Label>Talaba</Label>
					<div class="font-medium">{{ s.student_name }}</div>
					<a :href="s.file" target="_blank" class="text-sm underline">
						Submission fayli
					</a>
				</div>
				<div>
					<Label>Baho</Label>
					<Input
						v-model="grades[s.id].grade"
						type="number"
						min="0"
						max="100" />
				</div>
				<div>
					<Label>Izoh</Label>
					<Input v-model="grades[s.id].feedback" />
				</div>
				<Button @click="grade(s.id)">Baholash</Button>
			</CardContent>
		</Card>
	</div>
	<EmptyState
		v-if="!subs.length"
		title="Submission yo‘q"
		description="Talabalar hali fayl yubormagan." />
</template>
