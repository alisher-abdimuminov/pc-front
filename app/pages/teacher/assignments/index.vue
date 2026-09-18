<script setup lang="ts">
definePageMeta({ middleware: "teacher" });

import {
	Plus,
	FileText,
	Loader2,
	CalendarIcon,
	Paperclip,
	Clock,
	Users,
	Search,
} from "@lucide/vue";

import {
	DateFormatter,
	getLocalTimeZone,
	type DateValue,
} from "@internationalized/date";

import type { Assignment, Group } from "@/types/api";

const { api, errorMessage } = useApi();

/* ----------------------------------
 * DATA
 * ---------------------------------- */

const items = ref<Assignment[]>([]);
const groups = ref<Group[]>([]);

const loading = ref(false);
const creating = ref(false);

const error = ref("");
const search = ref("");

/* ----------------------------------
 * CREATE DIALOG
 * ---------------------------------- */

const createDialogOpen = ref(false);

const selectedDeadlineDate = ref<DateValue | undefined>();

const deadlineCalendarOpen = ref(false);

const form = reactive({
	title: "",
	description: "",
	groups: [] as string[],
	deadlineTime: "23:59",
	file: null as File | null,
});

const dateFormatter = new DateFormatter("uz-UZ", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

/* ----------------------------------
 * HELPERS
 * ---------------------------------- */

function normalizeResponse<T>(response: any): T[] {
	if (Array.isArray(response)) {
		return response;
	}

	if (response && Array.isArray(response.results)) {
		return response.results;
	}

	return [];
}

function formatDeadline(value: string) {
	if (!value) return "—";

	return new Date(value).toLocaleString("uz-UZ", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function isExpired(deadline: string) {
	if (!deadline) return false;

	return new Date(deadline).getTime() < Date.now();
}

function assignmentGroupCount(assignment: any) {
	if (Array.isArray(assignment.groups)) {
		return assignment.groups.length;
	}

	if (Array.isArray(assignment.group_details)) {
		return assignment.group_details.length;
	}

	return 0;
}

/* ----------------------------------
 * FILTERED
 * ---------------------------------- */

const filteredItems = computed(() => {
	const q = search.value.trim().toLowerCase();

	if (!q) {
		return items.value;
	}

	return items.value.filter((assignment) =>
		[assignment.title, assignment.description]
			.filter(Boolean)
			.join(" ")
			.toLowerCase()
			.includes(q),
	);
});

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const [assignmentsResponse, groupsResponse] = await Promise.all([
			api<any>("/assignments/"),

			api<any>("/groups/"),
		]);

		items.value = normalizeResponse<Assignment>(assignmentsResponse);

		groups.value = normalizeResponse<Group>(groupsResponse);
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

/* ----------------------------------
 * DIALOG
 * ---------------------------------- */

function resetForm() {
	form.title = "";
	form.description = "";
	form.groups = [];
	form.deadlineTime = "23:59";
	form.file = null;

	selectedDeadlineDate.value = undefined;
}

function openCreateDialog() {
	resetForm();

	error.value = "";

	createDialogOpen.value = true;
}

/* ----------------------------------
 * FILE
 * ---------------------------------- */

function onFileChange(event: Event) {
	const input = event.target as HTMLInputElement;

	form.file = input.files?.[0] || null;
}

/* ----------------------------------
 * DEADLINE
 * ---------------------------------- */

function selectDeadlineDate(value: DateValue | undefined) {
	if (!value) return;

	selectedDeadlineDate.value = value;

	deadlineCalendarOpen.value = false;
}

function getDeadline() {
	if (!selectedDeadlineDate.value) {
		return null;
	}

	return `${selectedDeadlineDate.value.toString()}T${form.deadlineTime}:00`;
}

/* ----------------------------------
 * CREATE
 * ---------------------------------- */

async function create() {
	error.value = "";

	if (!form.title.trim()) {
		error.value = "Topshiriq nomini kiriting.";

		return;
	}

	if (!form.description.trim()) {
		error.value = "Topshiriq tavsifini kiriting.";

		return;
	}

	if (!form.groups.length) {
		error.value = "Kamida bitta guruh tanlang.";

		return;
	}

	const deadline = getDeadline();

	if (!deadline) {
		error.value = "Deadline sanasini tanlang.";

		return;
	}

	creating.value = true;

	try {
		const body = new FormData();

		body.append("title", form.title.trim());

		body.append("description", form.description.trim());

		body.append("deadline", deadline);

		/*
		 * DRF ManyToMany uchun
		 * har bir group alohida append.
		 */
		for (const groupId of form.groups) {
			body.append("groups", groupId);
		}

		if (form.file) {
			body.append("attachment", form.file);
		}

		await api("/assignments/", {
			method: "POST",
			body,
		});

		createDialogOpen.value = false;

		resetForm();

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		creating.value = false;
	}
}
</script>

<template>
	<div>
		<!-- =========================
		     HEADER
		     ========================= -->

		<div class="mb-5 flex items-start justify-between gap-4">
			<AppPageTitle
				title="Topshiriqlar"
				description="Vazifalar va student submissionlari."
			/>

			<Button @click="openCreateDialog">
				<Plus class="mr-2 h-4 w-4" />

				Yangi vazifa
			</Button>
		</div>

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
		     SEARCH
		     ========================= -->

		<div v-if="items.length" class="mb-5 max-w-sm">
			<div class="relative">
				<Search
					class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>

				<Input
					v-model="search"
					class="pl-9"
					placeholder="Topshiriqni qidirish..."
				/>
			</div>
		</div>

		<!-- =========================
		     LOADING
		     ========================= -->

		<div
			v-if="loading"
			class="flex min-h-[250px] items-center justify-center"
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
			v-else-if="!items.length"
			title="Hali vazifa yaratilmagan"
			description="Yangi vazifa yaratish uchun yuqoridagi tugmani bosing."
		/>

		<AppEmptyState
			v-else-if="!filteredItems.length"
			title="Topshiriq topilmadi"
		/>

		<!-- =========================
		     ASSIGNMENTS
		     ========================= -->

		<div v-else class="space-y-3">
			<NuxtLink
				v-for="assignment in filteredItems"
				:key="assignment.id"
				:to="`/teacher/assignments/${assignment.id}`"
				class="block"
			>
				<Card
					class="transition-all hover:border-primary/40 hover:shadow-sm"
				>
					<CardContent
						class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex min-w-0 items-start gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
							>
								<FileText class="h-5 w-5" />
							</div>

							<div class="min-w-0">
								<h2 class="truncate font-semibold">
									{{ assignment.title }}
								</h2>

								<p
									v-if="assignment.description"
									class="mt-1 line-clamp-1 text-sm text-muted-foreground"
								>
									{{ assignment.description }}
								</p>

								<div
									class="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
								>
									<div class="flex items-center gap-1">
										<Clock class="h-3.5 w-3.5" />

										{{
											formatDeadline(assignment.deadline)
										}}
									</div>

									<div class="flex items-center gap-1">
										<Users class="h-3.5 w-3.5" />

										{{ assignmentGroupCount(assignment) }}
										guruh
									</div>
								</div>
							</div>
						</div>

						<div class="flex shrink-0 items-center gap-2">
							<Badge
								:variant="
									isExpired(assignment.deadline)
										? 'destructive'
										: 'outline'
								"
							>
								{{
									isExpired(assignment.deadline)
										? "Deadline o‘tgan"
										: "Aktiv"
								}}
							</Badge>
						</div>
					</CardContent>
				</Card>
			</NuxtLink>
		</div>

		<!-- ==================================================
		     CREATE ASSIGNMENT DIALOG
		     ================================================== -->

		<Dialog v-model:open="createDialogOpen">
			<DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle> Yangi topshiriq </DialogTitle>

					<DialogDescription>
						Topshiriq ma’lumotlarini kiriting va guruhlarni tanlang.
					</DialogDescription>
				</DialogHeader>

				<div class="space-y-5 py-3">
					<!-- TITLE -->

					<div class="space-y-2">
						<Label> Topshiriq nomi </Label>

						<Input
							v-model="form.title"
							placeholder="Masalan: Amaliyot hisoboti #1"
						/>
					</div>

					<!-- DESCRIPTION -->

					<div class="space-y-2">
						<Label> Tavsif </Label>

						<Textarea
							v-model="form.description"
							rows="5"
							placeholder="Talabalar bajarishi kerak bo‘lgan vazifani yozing..."
						/>
					</div>

					<!-- GROUPS -->

					<div class="space-y-2">
						<Label> Guruhlar </Label>

						<Select v-model="form.groups" multiple>
							<SelectTrigger class="w-full">
								<SelectValue placeholder="Guruhlarni tanlang" />
							</SelectTrigger>

							<SelectContent>
								<SelectItem
									v-for="group in groups"
									:key="group.id"
									:value="String(group.id)"
								>
									{{ group.name }}
								</SelectItem>
							</SelectContent>
						</Select>

						<!-- SELECTED -->

						<div
							v-if="form.groups.length"
							class="flex flex-wrap gap-2 pt-1"
						>
							<Badge
								v-for="groupId in form.groups"
								:key="groupId"
								variant="secondary"
							>
								{{
									groups.find(
										(group) => String(group.id) === groupId,
									)?.name || groupId
								}}
							</Badge>
						</div>
					</div>

					<!-- DEADLINE -->

					<div class="grid gap-4 sm:grid-cols-2">
						<!-- DATE -->

						<div class="space-y-2">
							<Label> Deadline sanasi </Label>

							<Popover v-model:open="deadlineCalendarOpen">
								<PopoverTrigger as-child>
									<Button
										variant="outline"
										class="w-full justify-start text-left font-normal"
									>
										<CalendarIcon class="mr-2 h-4 w-4" />

										<span v-if="selectedDeadlineDate">
											{{
												dateFormatter.format(
													selectedDeadlineDate.toDate(
														getLocalTimeZone(),
													),
												)
											}}
										</span>

										<span
											v-else
											class="text-muted-foreground"
										>
											Sanani tanlang
										</span>
									</Button>
								</PopoverTrigger>

								<PopoverContent
									class="w-auto p-0"
									align="start"
								>
									<Calendar
										v-model="selectedDeadlineDate"
										initial-focus
										@update:model-value="selectDeadlineDate"
									/>
								</PopoverContent>
							</Popover>
						</div>

						<!-- TIME -->

						<div class="space-y-2">
							<Label> Vaqt </Label>

							<Input v-model="form.deadlineTime" type="time" />
						</div>
					</div>

					<!-- FILE -->

					<div class="space-y-2">
						<Label> Qo‘shimcha fayl </Label>

						<label
							class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-colors hover:bg-muted/30"
						>
							<Paperclip class="h-5 w-5 text-muted-foreground" />

							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">
									{{ form.file?.name || "Fayl tanlash" }}
								</p>

								<p class="text-xs text-muted-foreground">
									Ixtiyoriy
								</p>
							</div>

							<input
								type="file"
								class="hidden"
								@change="onFileChange"
							/>
						</label>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						:disabled="creating"
						@click="createDialogOpen = false"
					>
						Bekor qilish
					</Button>

					<Button :disabled="creating" @click="create">
						<Loader2
							v-if="creating"
							class="mr-2 h-4 w-4 animate-spin"
						/>

						<Plus v-else class="mr-2 h-4 w-4" />

						{{ creating ? "Yaratilmoqda..." : "Vazifa yaratish" }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
