<script setup lang="ts">
definePageMeta({
	middleware: "teacher",
});

import {
	FileText,
	Download,
	Clock,
	User,
	GraduationCap,
	MessageSquareText,
	Loader2,
	CheckCircle2,
} from "@lucide/vue";

import type { Assignment, Submission } from "@/types/api";

const route = useRoute();

const { api, errorMessage } = useApi();

const assignment = ref<Assignment | null>(null);
const submissions = ref<Submission[]>([]);

const loading = ref(false);
const grading = ref<number | null>(null);
const error = ref("");

const grades = reactive<
	Record<
		number,
		{
			grade: number | string;
			feedback: string;
		}
	>
>({});

/* ----------------------------------
 * HELPERS
 * ---------------------------------- */

function isGraded(submission: Submission) {
	return submission.grade !== null && submission.grade !== undefined;
}

function formatDate(value: string) {
	if (!value) {
		return "—";
	}

	return new Date(value).toLocaleString("uz-UZ", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function assignmentFile() {
	const item = assignment.value as any;

	return item?.file || item?.attachment || null;
}

/* ----------------------------------
 * COUNTS
 * ---------------------------------- */

const gradedCount = computed(() => submissions.value.filter(isGraded).length);

const ungradedCount = computed(
	() =>
		submissions.value.filter((submission) => !isGraded(submission)).length,
);

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		assignment.value = await api<Assignment>(
			`/assignments/${route.params.id}/`,
		);

		const all = await api<Submission[]>("/submissions/");

		submissions.value = all.filter(
			(submission) =>
				Number(submission.assignment) === Number(route.params.id),
		);

		for (const submission of submissions.value) {
			grades[submission.id] = {
				grade: submission.grade ?? "",

				feedback: submission.feedback || "",
			};
		}
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

/* ----------------------------------
 * GRADE
 * ---------------------------------- */

async function grade(submission: Submission) {
	/*
	 * Baholangan submissionga
	 * qayta request yubormaymiz.
	 */
	if (isGraded(submission)) {
		return;
	}

	const form = grades[submission.id];

	if (!form) {
		return;
	}

	const gradeValue = Number(form.grade);

	if (form.grade === "" || Number.isNaN(gradeValue)) {
		error.value = "Bahoni kiriting.";

		return;
	}

	if (gradeValue < 0 || gradeValue > 100) {
		error.value = "Baho 0 dan 100 gacha bo‘lishi kerak.";

		return;
	}

	grading.value = submission.id;

	error.value = "";

	try {
		await api(`/submissions/${submission.id}/grade/`, {
			method: "POST",

			body: {
				grade: gradeValue,
				feedback: form.feedback.trim(),
			},
		});

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		grading.value = null;
	}
}
</script>

<template>
	<div>
		<!-- =========================
		     HEADER
		     ========================= -->

		<AppPageTitle
			:title="assignment?.title || 'Topshiriq'"
			description="Talabalar yuborgan fayllarni ko‘ring va baholang."
		/>

		<!-- =========================
		     ERROR
		     ========================= -->

		<div
			v-if="error"
			class="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- =========================
		     LOADING
		     ========================= -->

		<div
			v-if="loading"
			class="flex min-h-[300px] items-center justify-center"
		>
			<div class="text-center">
				<Loader2
					class="mx-auto h-6 w-6 animate-spin text-muted-foreground"
				/>

				<p class="mt-2 text-sm text-muted-foreground">
					Ma’lumotlar yuklanmoqda...
				</p>
			</div>
		</div>

		<template v-else>
			<!-- =========================
			     ASSIGNMENT INFO
			     ========================= -->

			<Card v-if="assignment" class="mb-5">
				<CardContent class="p-5">
					<div
						class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"
					>
						<div class="min-w-0 flex-1">
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
								>
									<FileText class="h-5 w-5" />
								</div>

								<div>
									<h2 class="font-semibold">
										{{ assignment.title }}
									</h2>

									<div
										class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
									>
										<Clock class="h-3.5 w-3.5" />

										Deadline:

										{{ formatDate(assignment.deadline) }}
									</div>
								</div>
							</div>

							<p
								v-if="assignment.description"
								class="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
							>
								{{ assignment.description }}
							</p>

							<a
								v-if="assignmentFile()"
								:href="assignmentFile()"
								target="_blank"
								rel="noopener noreferrer"
								class="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
							>
								<Download class="h-4 w-4" />

								Vazifa fayli
							</a>
						</div>

						<!-- STATS -->

						<div class="grid grid-cols-3 gap-2 md:min-w-[300px]">
							<div class="rounded-xl border p-3 text-center">
								<p class="text-xl font-semibold">
									{{ submissions.length }}
								</p>

								<p class="mt-1 text-xs text-muted-foreground">
									Yuborilgan
								</p>
							</div>

							<div class="rounded-xl border p-3 text-center">
								<p
									class="text-xl font-semibold text-emerald-600"
								>
									{{ gradedCount }}
								</p>

								<p class="mt-1 text-xs text-muted-foreground">
									Baholangan
								</p>
							</div>

							<div class="rounded-xl border p-3 text-center">
								<p class="text-xl font-semibold text-amber-600">
									{{ ungradedCount }}
								</p>

								<p class="mt-1 text-xs text-muted-foreground">
									Kutilmoqda
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- =========================
			     SUBMISSIONS
			     ========================= -->

			<div v-if="submissions.length" class="space-y-4">
				<Card v-for="submission in submissions" :key="submission.id">
					<CardContent class="p-5">
						<div class="flex flex-col gap-5">
							<!-- STUDENT HEADER -->

							<div
								class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div class="flex min-w-0 items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted"
									>
										<User
											class="h-5 w-5 text-muted-foreground"
										/>
									</div>

									<div class="min-w-0">
										<div
											class="flex flex-wrap items-center gap-2"
										>
											<h3 class="font-semibold">
												{{ submission.student_name }}
											</h3>

											<Badge v-if="isGraded(submission)">
												<CheckCircle2
													class="mr-1 h-3 w-3"
												/>

												Baholangan
											</Badge>

											<Badge v-else variant="outline">
												Baholanmagan
											</Badge>
										</div>

										<p
											v-if="submission.submitted_at"
											class="mt-1 text-xs text-muted-foreground"
										>
											Yuborilgan:
											{{
												formatDate(
													submission.submitted_at,
												)
											}}
										</p>
									</div>
								</div>

								<a
									:href="submission.file"
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
								>
									<Download class="h-4 w-4" />

									Submission fayli
								</a>
							</div>

							<!-- ==================================
							     ALREADY GRADED
							     ================================== -->

							<div
								v-if="isGraded(submission)"
								class="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-[160px_1fr]"
							>
								<!-- GRADE -->

								<div>
									<div
										class="flex items-center gap-2 text-xs font-medium text-muted-foreground"
									>
										<GraduationCap class="h-4 w-4" />

										Baho
									</div>

									<div class="mt-2 flex items-baseline gap-1">
										<span class="text-2xl font-semibold">
											{{ submission.grade }}
										</span>

										<span
											class="text-sm text-muted-foreground"
										>
											/ 100
										</span>
									</div>
								</div>

								<!-- FEEDBACK -->

								<div>
									<div
										class="flex items-center gap-2 text-xs font-medium text-muted-foreground"
									>
										<MessageSquareText class="h-4 w-4" />

										Izoh
									</div>

									<p class="mt-2 whitespace-pre-wrap text-sm">
										{{
											submission.feedback ||
											"Izoh qoldirilmagan."
										}}
									</p>
								</div>
							</div>

							<!-- ==================================
							     NOT GRADED
							     ================================== -->

							<div
								v-else
								class="grid gap-4 border-t pt-5 md:grid-cols-[160px_1fr_auto] md:items-end"
							>
								<!-- GRADE -->

								<div class="space-y-2">
									<Label> Baho </Label>

									<div class="relative">
										<Input
											v-model="
												grades[submission.id].grade
											"
											type="number"
											min="0"
											max="100"
											placeholder="0 - 100"
											class="pr-12"
										/>

										<span
											class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
										>
											/100
										</span>
									</div>
								</div>

								<!-- FEEDBACK -->

								<div class="space-y-2">
									<Label> Izoh </Label>

									<Textarea
										v-model="grades[submission.id].feedback"
										rows="2"
										placeholder="Talaba uchun izoh..."
									/>
								</div>

								<!-- BUTTON -->

								<Button
									:disabled="grading === submission.id"
									@click="grade(submission)"
								>
									<Loader2
										v-if="grading === submission.id"
										class="mr-2 h-4 w-4 animate-spin"
									/>

									<GraduationCap
										v-else
										class="mr-2 h-4 w-4"
									/>

									{{
										grading === submission.id
											? "Saqlanmoqda..."
											: "Baholash"
									}}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- EMPTY -->

			<AppEmptyState
				v-else
				title="Submission yo‘q"
				description="Talabalar hali fayl yubormagan."
			/>
		</template>
	</div>
</template>
