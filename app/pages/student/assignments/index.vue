<script setup lang="ts">
definePageMeta({ middleware: "student" });
import { Upload, FileText, Loader2 } from "@lucide/vue";
import type { Assignment, Submission } from "@/types/api";
const { api, errorMessage } = useApi();
const assignments = ref<Assignment[]>([]);
const submissions = ref<Submission[]>([]);
const error = ref("");
const uploading = ref<number | null>(null);
async function load() {
	[assignments.value, submissions.value] = await Promise.all([
		api("/assignments/"),
		api("/submissions/"),
	]);
}
onMounted(load);
function mySub(id: number) {
	return submissions.value.find((s) => s.assignment === id);
}
async function upload(a: Assignment, e: Event) {
	const f = (e.target as HTMLInputElement).files?.[0];
	if (!f) return;
	uploading.value = a.id;
	error.value = "";
	try {
		const fd = new FormData();
		fd.append("file", f);
		await api(`/assignments/${a.id}/submit/`, { method: "POST", body: fd });
		await load();
	} catch (x) {
		error.value = errorMessage(x);
	} finally {
		uploading.value = null;
	}
}
</script>
<template>
	<AppPageTitle
		title="Topshiriqlar"
		description="O‘qituvchi bergan vazifalarni ko‘ring va fayl yuboring." />
	<div
		v-if="error"
		class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
		{{ error }}
	</div>
	<div v-if="assignments.length" class="space-y-4">
		<Card v-for="a in assignments" :key="a.id">
			<CardContent class="py-5">
				<div
					class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
					<div class="max-w-2xl">
						<div class="flex items-center gap-2">
							<FileText class="h-5 w-5" />
							<h2 class="font-semibold">{{ a.title }}</h2>
							<Badge
								:variant="a.submitted ? 'outline' : 'default'">
								{{
									a.submitted ? "Yuborilgan" : "Yuborilmagan"
								}}
							</Badge>
						</div>
						<p
							class="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
							{{ a.description || "Tavsif yo‘q" }}
						</p>
						<div class="mt-3 text-xs text-muted-foreground">
							{{ a.teacher_name }} • Deadline:
							{{ new Date(a.deadline).toLocaleString("uz-UZ") }}
						</div>
						<a
							v-if="a.file"
							:href="a.file"
							target="_blank"
							class="mt-3 inline-block text-sm font-medium underline">
							Vazifa faylini ochish
						</a>
						<div
							v-if="mySub(a.id)"
							class="mt-4 rounded-xl p-3 text-sm">
							<div>
								<b>Submission:</b>
								<a
									:href="mySub(a.id)?.file"
									target="_blank"
									class="underline">
									faylni ko‘rish
								</a>
							</div>
							<div
								v-if="mySub(a.id)?.grade !== null"
								class="mt-1">
								<b>Baho:</b>
								{{ mySub(a.id)?.grade }} / 100
							</div>
							<div v-if="mySub(a.id)?.feedback" class="mt-1">
								<b>Izoh:</b>
								{{ mySub(a.id)?.feedback }}
							</div>
						</div>
					</div>
					<label
						class="inline-flex cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium">
						<Loader2
							v-if="uploading === a.id"
							class="mr-2 h-4 w-4 animate-spin" />
						<Upload v-else class="mr-2 h-4 w-4" />
						{{
							a.submitted
								? "Faylni almashtirish"
								: "Fayl yuborish"
						}}
						<input
							type="file"
							class="hidden"
							:disabled="uploading === a.id"
							@change="upload(a, $event)" />
					</label>
				</div>
			</CardContent>
		</Card>
	</div>
	<AppEmptyState v-else title="Topshiriqlar mavjud emas" />
</template>
