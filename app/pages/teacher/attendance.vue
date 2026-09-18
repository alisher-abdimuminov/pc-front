<script setup lang="ts">
definePageMeta({ middleware: "teacher" });

import { Check, X, Loader2, CalendarIcon, RotateCcw, Users } from "@lucide/vue";

import {
	DateFormatter,
	getLocalTimeZone,
	today,
	type DateValue,
} from "@internationalized/date";

import type { Attendance, Group } from "@/types/api";

const { api, errorMessage } = useApi();

const groups = ref<Group[]>([]);
const rows = ref<Attendance[]>([]);

const loading = ref(false);
const error = ref("");

/* ----------------------------------
 * FILTERS
 * ---------------------------------- */

const selectedDate = ref<DateValue>(today(getLocalTimeZone()));

const calendarOpen = ref(false);

const filters = reactive({
	group: "all",
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

function hasStep(row: Attendance, step: number) {
	return (row.records || []).some((record) => Number(record.step) === step);
}

/* ----------------------------------
 * LOAD ATTENDANCE
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("date", selectedDate.value.toString());

		if (filters.group !== "all") {
			params.set("group", filters.group);
		}

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

	await load();
}

/* ----------------------------------
 * GROUP
 * ---------------------------------- */

async function handleGroupChange() {
	await load();
}

/* ----------------------------------
 * RESET
 * ---------------------------------- */

async function resetFilters() {
	selectedDate.value = today(getLocalTimeZone());

	filters.group = "all";

	await load();
}

/* ----------------------------------
 * INIT
 * ---------------------------------- */

onMounted(async () => {
	try {
		const response = await api<any>("/groups/");

		groups.value = normalizeResponse<Group>(response);

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
});
</script>

<template>
	<div>
		<AppPageTitle
			title="Davomat"
			description="Sizga biriktirilgan guruhlardagi talabalar davomatini kuzating."
		/>

		<!-- =========================
		     FILTERS
		     ========================= -->

		<Card class="mb-5">
			<CardContent
				class="flex flex-col gap-4 py-4 sm:flex-row sm:items-end"
			>
				<!-- GROUP -->

				<div class="w-full space-y-2 sm:w-[260px]">
					<Label> Guruh </Label>

					<Select
						v-model="filters.group"
						@update:model-value="handleGroupChange"
					>
						<SelectTrigger class="w-full">
							<div class="flex items-center gap-2">
								<Users class="h-4 w-4 text-muted-foreground" />

								<SelectValue placeholder="Guruhni tanlang" />
							</div>
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="all">
								Barcha guruhlar
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

								{{
									dateFormatter.format(
										selectedDate.toDate(getLocalTimeZone()),
									)
								}}
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
			class="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- =========================
		     ATTENDANCE LIST
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

			<!-- LOADING -->

			<div
				v-if="loading"
				class="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
			>
				<Loader2 class="h-4 w-4 animate-spin" />

				Yuklanmoqda...
			</div>

			<!-- EMPTY -->

			<div
				v-else-if="!rows.length"
				class="py-12 text-center text-sm text-muted-foreground"
			>
				Tanlangan sana va guruh uchun davomat mavjud emas.
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

					<!-- STEPS -->

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
