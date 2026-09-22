<script setup lang="ts">
definePageMeta({
	middleware: "admin",
});

import { Check, X, Loader2, CalendarIcon, RotateCcw, Users } from "@lucide/vue";

import {
	DateFormatter,
	getLocalTimeZone,
	today,
	type DateValue,
} from "@internationalized/date";

import type { Attendance, Group } from "@/types/api";

const { api, errorMessage } = useApi();

const rows = ref<Attendance[]>([]);
const groups = ref<Group[]>([]);

const loading = ref(false);
const error = ref("");

/* ----------------------------------
 * FILTERS
 * ---------------------------------- */

const selectedDate = ref<DateValue>(today(getLocalTimeZone()));

/*
 * "none" = guruh tanlanmagan.
 *
 * SelectItem uchun bo‘sh string
 * ishlatmaymiz.
 */
const filters = reactive({
	group: "none",
});

const calendarOpen = ref(false);

const dateFormatter = new DateFormatter("uz-UZ", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

/* ----------------------------------
 * HELPERS
 * ---------------------------------- */

function hasStep(row: Attendance, step: number) {
	return (row.records || []).some((record) => Number(record.step) === step);
}

function normalizeResponse<T>(response: any): T[] {
	if (Array.isArray(response)) {
		return response;
	}

	if (response && Array.isArray(response.results)) {
		return response.results;
	}

	return [];
}

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	error.value = "";

	/*
	 * Guruh tanlanmagan bo‘lsa
	 * attendance request yubormaymiz.
	 */
	if (filters.group === "none") {
		rows.value = [];
		return;
	}

	loading.value = true;

	try {
		const params = new URLSearchParams();

		params.set("date", selectedDate.value.toString());

		params.set("group", filters.group);

		const response = await api<any>(
			`/attendance/records/?${params.toString()}`,
		);

		rows.value = normalizeResponse<Attendance>(response);
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

/* ----------------------------------
 * DATE
 * ---------------------------------- */

async function handleDateChange(value: DateValue | undefined) {
	if (!value) {
		return;
	}

	selectedDate.value = value;

	calendarOpen.value = false;

	if (filters.group !== "none") {
		await load();
	}
}

/* ----------------------------------
 * GROUP
 * ---------------------------------- */

async function handleGroupChange() {
	if (filters.group === "none") {
		rows.value = [];
		return;
	}

	await load();
}

/* ----------------------------------
 * RESET
 * ---------------------------------- */

function resetFilters() {
	selectedDate.value = today(getLocalTimeZone());

	filters.group = "none";

	rows.value = [];

	error.value = "";
}

/* ----------------------------------
 * INIT
 * ---------------------------------- */

onMounted(async () => {
	try {
		const response = await api<any>("/groups/");

		groups.value = normalizeResponse<Group>(response);

		/*
		 * Attendance avtomatik
		 * yuklanmaydi.
		 *
		 * Admin avval guruh tanlaydi.
		 */
	} catch (e) {
		error.value = errorMessage(e);
	}
});
</script>

<template>
	<div>
		<AppPageTitle
			title="Davomat monitoring"
			description="Guruh talabalarining kunlik davomat holati."
		/>

		<!-- =========================
		     FILTERS
		     ========================= -->

		<Card class="mb-5">
			<CardContent
				class="flex flex-col gap-4 py-4 sm:flex-row sm:items-end"
			>
				<!-- DATE -->

				<div class="w-full space-y-2 sm:w-[260px]">
					<Label> Sana </Label>

					<Popover v-model:open="calendarOpen">
						<PopoverTrigger as-child>
							<Button
								variant="outline"
								class="w-full justify-start text-left font-normal"
							>
								<CalendarIcon class="mr-2 h-4 w-4" />

								<span>
									{{
										dateFormatter.format(
											selectedDate.toDate(
												getLocalTimeZone(),
											),
										)
									}}
								</span>
							</Button>
						</PopoverTrigger>

						<PopoverContent class="w-auto p-0" align="start">
							<Calendar
								v-model="selectedDate"
								initial-focus
								@update:model-value="handleDateChange"
							/>
						</PopoverContent>
					</Popover>
				</div>

				<!-- GROUP -->

				<div class="w-full space-y-2 sm:w-[380px]">
					<Label> Guruh </Label>

					<Select
						v-model="filters.group"
						@update:model-value="handleGroupChange"
					>
						<SelectTrigger class="w-full">
							<div class="flex min-w-0 items-center gap-2">
								<Users
									class="h-4 w-4 shrink-0 text-muted-foreground"
								/>

								<SelectValue placeholder="Guruhni tanlang" />
							</div>
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="none">
								Guruhni tanlang
							</SelectItem>

							<SelectItem
								v-for="group in groups"
								:key="group.id"
								:value="String(group.id)"
							>
								{{ group.name }}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<!-- RESET -->

				<Button
					variant="outline"
					class="w-full sm:w-auto"
					@click="resetFilters"
				>
					<RotateCcw class="mr-2 h-4 w-4" />

					Tozalash
				</Button>
			</CardContent>
		</Card>

		<!-- =========================
		     ERROR
		     ========================= -->

		<div
			v-if="error"
			class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- =========================
		     ATTENDANCE
		     ========================= -->

		<div class="overflow-hidden rounded-xl border bg-card">
			<!-- HEADER -->

			<div
				class="grid grid-cols-[minmax(120px,1fr)_60px_60px_60px] items-center gap-1 border-b bg-muted/40 px-3 py-3 sm:grid-cols-[minmax(220px,1fr)_100px_100px_100px] sm:px-5"
			>
				<div
					class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
				>
					Talaba
				</div>

				<div
					class="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
				>
					Step 1
				</div>

				<div
					class="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
				>
					Step 2
				</div>

				<div
					class="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
				>
					Step 3
				</div>
			</div>

			<!-- NO GROUP -->

			<div
				v-if="filters.group === 'none'"
				class="py-12 text-center text-sm text-muted-foreground"
			>
				Davomatni ko‘rish uchun guruhni tanlang.
			</div>

			<!-- LOADING -->

			<div
				v-else-if="loading"
				class="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
			>
				<Loader2 class="h-4 w-4 animate-spin" />

				Yuklanmoqda...
			</div>

			<!-- EMPTY GROUP -->

			<div
				v-else-if="!rows.length"
				class="py-12 text-center text-sm text-muted-foreground"
			>
				Tanlangan guruhda talabalar mavjud emas.
			</div>

			<!-- ROWS -->

			<div v-else class="divide-y">
				<div
					v-for="row in rows"
					:key="row.id"
					class="grid grid-cols-[minmax(120px,1fr)_60px_60px_60px] items-center gap-1 px-3 py-3 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(220px,1fr)_100px_100px_100px] sm:px-5 sm:py-4"
				>
					<!-- STUDENT -->

					<div class="min-w-0 pr-2">
						<p class="truncate text-sm font-medium">
							{{ row.student_name }}
						</p>

						<p
							v-if="row.student_username"
							class="mt-0.5 truncate text-xs text-muted-foreground"
						>
							{{ row.student_username }}
						</p>
					</div>

					<!-- STEP 1 / 2 / 3 -->

					<div
						v-for="step in 3"
						:key="step"
						class="flex justify-center"
					>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9"
							:class="
								hasStep(row, step)
									? 'bg-emerald-100 text-emerald-700'
									: 'bg-red-100 text-red-600'
							"
						>
							<Check
								v-if="hasStep(row, step)"
								class="h-4 w-4 sm:h-5 sm:w-5"
							/>

							<X v-else class="h-4 w-4 sm:h-5 sm:w-5" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
