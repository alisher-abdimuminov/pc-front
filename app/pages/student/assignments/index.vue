<script setup lang="ts">
definePageMeta({
	middleware: "student",
});

import {
	Upload,
	FileText,
	Loader2,
	Download,
	CheckCircle2,
	Clock,
	GraduationCap,
	MessageSquareText,
	Paperclip,
} from "@lucide/vue";

import type { Assignment, Submission } from "@/types/api";

const { api, errorMessage } = useApi();

const assignments = ref<Assignment[]>([]);
const submissions = ref<Submission[]>([]);

const loading = ref(false);
const uploading = ref<number | null>(null);

const error = ref("");

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const [assignmentData, submissionData] = await Promise.all([
			api<Assignment[]>("/assignments/"),

			api<Submission[]>("/submissions/"),
		]);

		assignments.value = assignmentData;

		submissions.value = submissionData;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

/* ----------------------------------
 * SUBMISSION
 * ---------------------------------- */

const submissionMap = computed(() => {
	const map = new Map<number, Submission>();

	for (const submission of submissions.value) {
		map.set(Number(submission.assignment), submission);
	}

	return map;
});

function mySubmission(assignmentId: number) {
	return submissionMap.value.get(assignmentId) || null;
}

/* ----------------------------------
 * DEADLINE
 * ---------------------------------- */

function isExpired(deadline: string) {
	if (!deadline) {
		return false;
	}

	return new Date(deadline).getTime() < Date.now();
}

function formatDeadline(deadline: string) {
	if (!deadline) {
		return "—";
	}

	return new Date(deadline).toLocaleString("uz-UZ", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDate(date?: string | null) {
	if (!date) {
		return "—";
	}

	return new Date(date).toLocaleString("uz-UZ", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/* ----------------------------------
 * GRADE
 * ---------------------------------- */

function isGraded(assignmentId: number) {
	const submission = mySubmission(assignmentId);

	return submission?.grade !== null && submission?.grade !== undefined;
}

/* ----------------------------------
 * UPLOAD PERMISSION
 * ---------------------------------- */

function canUpload(assignment: Assignment) {
	return !isExpired(assignment.deadline) && !isGraded(assignment.id);
}

/* ----------------------------------
 * STATUS
 * ---------------------------------- */

function assignmentStatus(assignment: Assignment) {
	if (isGraded(assignment.id)) {
		return "graded";
	}

	if (isExpired(assignment.deadline)) {
		return "expired";
	}

	if (mySubmission(assignment.id)) {
		return "submitted";
	}

	return "pending";
}

/* ----------------------------------
 * ASSIGNMENT FILE
 * ---------------------------------- */

function assignmentFile(assignment: any) {
	return assignment.file || assignment.attachment || null;
}

/* ----------------------------------
 * UPLOAD
 * ---------------------------------- */

async function upload(assignment: Assignment, event: Event) {
	const input = event.target as HTMLInputElement;

	const file = input.files?.[0];

	if (!file) {
		return;
	}

	/*
	 * Frontend himoyasi.
	 */
	if (!canUpload(assignment)) {
		input.value = "";
		return;
	}

	uploading.value = assignment.id;

	error.value = "";

	try {
		const formData = new FormData();

		formData.append("file", file);

		await api(`/assignments/${assignment.id}/submit/`, {
			method: "POST",
			body: formData,
		});

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		uploading.value = null;

		/*
		 * Bir xil faylni yana
		 * tanlash imkoniyati.
		 */
		input.value = "";
	}
}
</script>

<template>
	<div>
		<AppPageTitle
			title="Topshiriqlar"
			description="O‘qituvchi bergan vazifalarni ko‘ring va bajarilgan faylni yuboring."
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
					Topshiriqlar yuklanmoqda...
				</p>
			</div>
		</div>

		<!-- =========================
		     EMPTY
		     ========================= -->

		<AppEmptyState
			v-else-if="!assignments.length"
			title="Topshiriqlar mavjud emas"
			description="Hozircha sizning guruhingizga topshiriq berilmagan."
		/>

		<!-- =========================
		     ASSIGNMENTS
		     ========================= -->

		<div v-else class="space-y-4">
			<Card v-for="assignment in assignments" :key="assignment.id">
				<CardContent class="p-5">
					<div
						class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
					>
						<!-- =====================
						     LEFT CONTENT
						     ===================== -->

						<div class="min-w-0 flex-1">
							<!-- HEADER -->

							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
								>
									<FileText class="h-5 w-5" />
								</div>

								<div class="min-w-0 flex-1">
									<div
										class="flex flex-wrap items-center gap-2"
									>
										<h2 class="font-semibold">
											{{ assignment.title }}
										</h2>

										<!-- GRADED -->

										<Badge
											v-if="
												assignmentStatus(assignment) ===
												'graded'
											"
										>
											Baholangan
										</Badge>

										<!-- EXPIRED -->

										<Badge
											v-else-if="
												assignmentStatus(assignment) ===
												'expired'
											"
											variant="destructive"
										>
											Deadline o‘tgan
										</Badge>

										<!-- SUBMITTED -->

										<Badge
											v-else-if="
												assignmentStatus(assignment) ===
												'submitted'
											"
											variant="secondary"
										>
											Yuborilgan
										</Badge>

										<!-- PENDING -->

										<Badge v-else variant="outline">
											Yuborilmagan
										</Badge>
									</div>

									<!-- META -->

									<div
										class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
									>
										<span v-if="assignment.teacher_name">
											{{ assignment.teacher_name }}
										</span>

										<div class="flex items-center gap-1.5">
											<Clock class="h-3.5 w-3.5" />

											<span> Deadline: </span>

											<span
												:class="
													isExpired(
														assignment.deadline,
													)
														? 'font-medium text-red-600'
														: ''
												"
											>
												{{
													formatDeadline(
														assignment.deadline,
													)
												}}
											</span>
										</div>
									</div>
								</div>
							</div>

							<!-- DESCRIPTION -->

							<p
								class="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
							>
								{{ assignment.description || "Tavsif yo‘q." }}
							</p>

							<!-- TEACHER ATTACHMENT -->

							<a
								v-if="assignmentFile(assignment)"
								:href="assignmentFile(assignment)"
								target="_blank"
								rel="noopener noreferrer"
								class="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
							>
								<Download class="h-4 w-4" />

								Vazifa faylini ochish
							</a>

							<!-- =====================
							     STUDENT SUBMISSION
							     ===================== -->

							<div
								v-if="mySubmission(assignment.id)"
								class="mt-5 rounded-xl border bg-muted/20 p-4"
							>
								<div class="flex flex-col gap-4">
									<!-- TITLE -->

									<div class="flex items-center gap-2">
										<CheckCircle2
											class="h-4 w-4 text-emerald-600"
										/>

										<p class="text-sm font-semibold">
											Sizning javobingiz
										</p>
									</div>

									<!-- FILE / GRADE -->

									<div
										class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<a
												:href="
													mySubmission(assignment.id)
														?.file
												"
												target="_blank"
												rel="noopener noreferrer"
												class="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
											>
												<Paperclip class="h-4 w-4" />

												Yuborilgan faylni ko‘rish
											</a>

											<p
												v-if="
													mySubmission(assignment.id)
														?.submitted_at
												"
												class="mt-1 text-xs text-muted-foreground"
											>
												Yuborilgan:

												{{
													formatDate(
														mySubmission(
															assignment.id,
														)?.submitted_at,
													)
												}}
											</p>
										</div>

										<!-- GRADE -->

										<div
											v-if="isGraded(assignment.id)"
											class="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
										>
											<GraduationCap
												class="h-4 w-4 text-primary"
											/>

											<span class="text-sm"> Baho: </span>

											<span class="font-semibold">
												{{
													mySubmission(assignment.id)
														?.grade
												}}
												/ 100
											</span>
										</div>
									</div>

									<!-- FEEDBACK -->

									<div
										v-if="
											mySubmission(assignment.id)
												?.feedback
										"
										class="border-t pt-4"
									>
										<div class="flex items-start gap-2">
											<MessageSquareText
												class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
											/>

											<div>
												<p
													class="text-xs font-medium text-muted-foreground"
												>
													O‘qituvchi izohi
												</p>

												<p
													class="mt-1 whitespace-pre-wrap text-sm"
												>
													{{
														mySubmission(
															assignment.id,
														)?.feedback
													}}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- =====================
						     RIGHT ACTION
						     ===================== -->

						<div class="shrink-0 lg:w-[200px]">
							<!-- =====================
							     CAN UPLOAD
							     ===================== -->

							<label
								v-if="canUpload(assignment)"
								class="flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
								:class="
									uploading === assignment.id
										? 'pointer-events-none opacity-50'
										: 'cursor-pointer hover:bg-muted'
								"
							>
								<Loader2
									v-if="uploading === assignment.id"
									class="mr-2 h-4 w-4 animate-spin"
								/>

								<Upload v-else class="mr-2 h-4 w-4" />

								<span v-if="uploading === assignment.id">
									Yuklanmoqda...
								</span>

								<span v-else-if="mySubmission(assignment.id)">
									Faylni almashtirish
								</span>

								<span v-else> Fayl yuborish </span>

								<input
									type="file"
									class="hidden"
									:disabled="uploading === assignment.id"
									@change="upload(assignment, $event)"
								/>
							</label>

							<!-- =====================
							     GRADED
							     ===================== -->

							<div
								v-else-if="isGraded(assignment.id)"
								class="rounded-xl border bg-muted/20 p-4 text-center"
							>
								<div
									class="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"
								>
									<GraduationCap class="h-5 w-5" />
								</div>

								<p class="mt-2 text-sm font-semibold">
									Baholangan
								</p>

								<p class="mt-1 text-xs text-muted-foreground">
									Faylni endi o‘zgartirib bo‘lmaydi.
								</p>
							</div>

							<!-- =====================
							     EXPIRED
							     ===================== -->

							<div
								v-else-if="isExpired(assignment.deadline)"
								class="rounded-xl border border-red-200 bg-red-50 p-4 text-center"
							>
								<div
									class="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600"
								>
									<Clock class="h-5 w-5" />
								</div>

								<p
									class="mt-2 text-sm font-semibold text-red-700"
								>
									Deadline o‘tgan
								</p>

								<p class="mt-1 text-xs text-red-600">
									Fayl yuborish yopilgan.
								</p>
							</div>

							<!-- INFO -->

							<p
								v-if="
									canUpload(assignment) &&
									mySubmission(assignment.id)
								"
								class="mt-2 text-center text-xs text-muted-foreground"
							>
								Yangi fayl yuklasangiz, avvalgi fayl
								almashtiriladi.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</template>
