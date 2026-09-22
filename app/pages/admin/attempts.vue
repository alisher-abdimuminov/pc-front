<script setup lang="ts">
definePageMeta({
	middleware: "admin",
});

import {
	CalendarIcon,
	CheckCircle2,
	XCircle,
	Search,
	Eye,
	MapPin,
	Wifi,
	Clock,
	ShieldCheck,
	ShieldX,
	User,
	Loader2,
	RotateCcw,
} from "@lucide/vue";

import {
	DateFormatter,
	getLocalTimeZone,
	today,
	type DateValue,
} from "@internationalized/date";

const { api, errorMessage } = useApi();

/* -------------------------------------------------------
 * TYPES
 * ----------------------------------------------------- */

type AuditStatus = "success" | "failed";

interface AuditRow {
	id: string;

	studentId?: number | string | null;
	studentName: string;
	studentUsername?: string;

	step?: number | null;

	status: AuditStatus;

	ipAddress?: string | null;

	latitude?: number | string | null;
	longitude?: number | string | null;

	locationName?: string | null;

	date?: string | null;

	errorCode?: string | null;
	errorMessage?: string | null;

	faceVerified?: boolean | null;
	locationVerified?: boolean | null;

	image?: string | null;

	userAgent?: string | null;

	raw?: any;
}

/* -------------------------------------------------------
 * STATE
 * ----------------------------------------------------- */

const rows = ref<AuditRow[]>([]);

const loading = ref(false);
const error = ref("");

const selectedDate = ref<DateValue | undefined>(today(getLocalTimeZone()));

const calendarOpen = ref(false);

const filters = reactive({
	status: "all",
	errorCode: "all",
	search: "",
});

/* -------------------------------------------------------
 * DETAIL DIALOG
 * ----------------------------------------------------- */

const detailDialogOpen = ref(false);
const selectedRow = ref<AuditRow | null>(null);

function openDetail(row: AuditRow) {
	selectedRow.value = row;
	detailDialogOpen.value = true;
}

/* -------------------------------------------------------
 * DATE FORMAT
 * ----------------------------------------------------- */

const dateFormatter = new DateFormatter("uz-UZ", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

function apiDate() {
	return selectedDate.value?.toString() || "";
}

function formatDateTime(value?: string | null) {
	if (!value) {
		return "—";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString("uz-UZ", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",

		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

/* -------------------------------------------------------
 * API RESPONSE NORMALIZE
 *
 * apiList emas.
 * Shu componentning ichida oddiy pagination handling.
 * ----------------------------------------------------- */

function getResults(response: any) {
	if (Array.isArray(response)) {
		return response;
	}

	if (response && Array.isArray(response.results)) {
		return response.results;
	}

	return [];
}

/* -------------------------------------------------------
 * FAILED ATTEMPT MAPPING
 * ----------------------------------------------------- */
function mapAttempts(data: any[]): AuditRow[] {
	return data.map((row) => ({
		id: `attempt-${row.id}`,

		studentId: row.student ?? null,

		studentName: row.student_name || "Noma’lum talaba",

		studentUsername: row.student_username || "",

		step: row.step ?? null,

		status: row.success === true ? "success" : "failed",

		ipAddress: row.ip_address || null,

		latitude: row.latitude ?? null,

		longitude: row.longitude ?? null,

		locationName: row.location_name || null,

		date: row.attempted_at || null,

		errorCode: row.error_code || null,

		errorMessage: row.error_message || null,

		faceVerified: row.face_verified ?? null,

		locationVerified: row.location_verified ?? null,

		image: row.image || null,

		userAgent: row.user_agent || null,

		raw: row,
	}));
}
/* -------------------------------------------------------
 * LOAD
 * ----------------------------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const date = apiDate();

		const query = date ? `?date=${encodeURIComponent(date)}` : "";

		const response = await api<any>(`/attendance/attempts/${query}`);

		const attempts = getResults(response);

		rows.value = mapAttempts(attempts).sort((a, b) => {
			const aTime = a.date ? new Date(a.date).getTime() : 0;

			const bTime = b.date ? new Date(b.date).getTime() : 0;

			return bTime - aTime;
		});
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}
onMounted(load);

/* -------------------------------------------------------
 * CALENDAR
 * ----------------------------------------------------- */

async function handleDateChange() {
	calendarOpen.value = false;

	await load();
}

async function clearDate() {
	selectedDate.value = undefined;

	await load();
}

async function setToday() {
	selectedDate.value = today(getLocalTimeZone());

	await load();
}

/* -------------------------------------------------------
 * ERROR CODES
 * ----------------------------------------------------- */

const errorCodes = computed(() => {
	const values = rows.value
		.filter((row) => row.status === "failed" && row.errorCode)
		.map((row) => String(row.errorCode));

	return [...new Set(values)].sort();
});

/* -------------------------------------------------------
 * FILTERED ROWS
 * ----------------------------------------------------- */

const filteredRows = computed(() => {
	const search = filters.search.trim().toLowerCase();

	return rows.value.filter((row) => {
		/* STATUS */

		if (filters.status !== "all" && row.status !== filters.status) {
			return false;
		}

		/* ERROR CODE */

		if (
			filters.errorCode !== "all" &&
			String(row.errorCode) !== filters.errorCode
		) {
			return false;
		}

		/* SEARCH */

		if (search) {
			const searchText = [
				row.studentName,
				row.studentUsername,
				row.ipAddress,
				row.latitude,
				row.longitude,
				row.locationName,
				row.errorCode,
				row.errorMessage,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			if (!searchText.includes(search)) {
				return false;
			}
		}

		return true;
	});
});

/* -------------------------------------------------------
 * COUNTS
 * ----------------------------------------------------- */

const successCount = computed(
	() => rows.value.filter((row) => row.status === "success").length,
);

const failedCount = computed(
	() => rows.value.filter((row) => row.status === "failed").length,
);
</script>

<template>
	<div>
		<!-- =================================================
		     PAGE HEADER
		     ================================================= -->

		<AppPageTitle
			title="Urinishlar"
			description="Davomatning muvaffaqiyatli va muvaffaqiyatsiz tekshiruvlari."
		/>

		<!-- =================================================
		     ERROR
		     ================================================= -->

		<div
			v-if="error"
			class="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- =================================================
		     STATS
		     ================================================= -->

		<div class="mb-5 grid grid-cols-3 gap-3">
			<!-- ALL -->

			<Card>
				<CardContent class="p-4">
					<p class="text-xs text-muted-foreground">Jami</p>

					<p class="mt-1 text-xl font-semibold sm:text-2xl">
						{{ rows.length }}
					</p>
				</CardContent>
			</Card>

			<!-- SUCCESS -->

			<Card class="border border-emerald-600">
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<CheckCircle2 class="h-4 w-4 text-emerald-600" />

						<p class="text-xs text-muted-foreground">
							Muvaffaqiyatli
						</p>
					</div>

					<p
						class="mt-1 text-xl font-semibold text-emerald-600 sm:text-2xl"
					>
						{{ successCount }}
					</p>
				</CardContent>
			</Card>

			<!-- FAILED -->

			<Card class="border border-rose-600">
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<XCircle class="h-4 w-4 text-red-600" />

						<p class="text-xs text-muted-foreground">Xato</p>
					</div>

					<p
						class="mt-1 text-xl font-semibold text-red-600 sm:text-2xl"
					>
						{{ failedCount }}
					</p>
				</CardContent>
			</Card>
		</div>

		<!-- =================================================
		     FILTERS
		     ================================================= -->

		<Card class="mb-5">
			<CardContent
				class="grid gap-4 py-4 md:grid-cols-2 xl:grid-cols-[210px_210px_260px_1fr]"
			>
				<!-- STATUS -->

				<div class="space-y-2">
					<Label> Holat </Label>

					<Select v-model="filters.status">
						<SelectTrigger class="w-full">
							<SelectValue placeholder="Holat" />
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="all"> Barchasi </SelectItem>

							<SelectItem value="success">
								Muvaffaqiyatli
							</SelectItem>

							<SelectItem value="failed"> Xato </SelectItem>
						</SelectContent>
					</Select>
				</div>

				<!-- ERROR CODE -->

				<div class="space-y-2">
					<Label> Xato turi </Label>

					<Select v-model="filters.errorCode">
						<SelectTrigger class="w-full">
							<SelectValue placeholder="Xato turi" />
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="all"> Barchasi </SelectItem>

							<SelectItem
								v-for="code in errorCodes"
								:key="code"
								:value="code"
							>
								{{ code }}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<!-- DATE -->

				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label> Sana </Label>

						<button
							v-if="selectedDate"
							type="button"
							class="text-xs text-muted-foreground hover:text-foreground"
							@click="clearDate"
						>
							Tozalash
						</button>
					</div>

					<Popover v-model:open="calendarOpen">
						<PopoverTrigger as-child>
							<Button
								variant="outline"
								class="w-full justify-start text-left font-normal"
							>
								<CalendarIcon class="mr-2 h-4 w-4" />

								<span v-if="selectedDate">
									{{
										dateFormatter.format(
											selectedDate.toDate(
												getLocalTimeZone(),
											),
										)
									}}
								</span>

								<span v-else class="text-muted-foreground">
									Barcha sanalar
								</span>
							</Button>
						</PopoverTrigger>

						<PopoverContent class="w-auto p-0" align="start">
							<Calendar
								v-model="selectedDate"
								initial-focus
								@update:model-value="handleDateChange"
							/>

							<div class="border-t p-2">
								<Button
									variant="ghost"
									size="sm"
									class="w-full"
									@click="setToday"
								>
									<RotateCcw class="mr-2 h-4 w-4" />
									Bugun
								</Button>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<!-- SEARCH -->

				<div class="space-y-2">
					<Label> Qidiruv </Label>

					<div class="relative">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>

						<Input
							v-model="filters.search"
							class="pl-9"
							placeholder="Talaba, IP, joylashuv, xato..."
						/>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- =================================================
		     LOADING
		     ================================================= -->

		<div
			v-if="loading"
			class="flex min-h-[250px] items-center justify-center"
		>
			<div class="text-center">
				<Loader2
					class="mx-auto h-6 w-6 animate-spin text-muted-foreground"
				/>

				<p class="mt-2 text-sm text-muted-foreground">
					Audit yuklanmoqda...
				</p>
			</div>
		</div>

		<!-- =================================================
		     EMPTY
		     ================================================= -->

		<AppEmptyState
			v-else-if="!filteredRows.length"
			title="Audit yozuvlari topilmadi"
		/>

		<!-- =================================================
		     AUDIT LIST
		     ================================================= -->

		<div v-else class="overflow-hidden rounded-xl border bg-card">
			<!-- HORIZONTAL SCROLL -->

			<div class="overflow-x-auto">
				<div class="min-w-[1000px]">
					<!-- HEADER -->

					<div
						class="grid grid-cols-[minmax(200px,1.5fr)_80px_150px_170px_180px_minmax(180px,1fr)_60px] items-center gap-4 border-b bg-muted/40 px-4 py-3"
					>
						<div
							class="text-xs font-semibold text-muted-foreground"
						>
							Talaba
						</div>

						<div
							class="text-center text-xs font-semibold text-muted-foreground"
						>
							Step
						</div>

						<div
							class="text-xs font-semibold text-muted-foreground"
						>
							Holat
						</div>

						<div
							class="text-xs font-semibold text-muted-foreground"
						>
							Joylashuv
						</div>

						<div
							class="text-xs font-semibold text-muted-foreground"
						>
							Vaqt
						</div>

						<div />
					</div>

					<!-- ROWS -->

					<div class="divide-y">
						<div
							v-for="row in filteredRows"
							:key="row.id"
							class="grid grid-cols-[minmax(200px,1.5fr)_80px_150px_170px_180px_minmax(180px,1fr)_60px] items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/20"
						>
							<!-- STUDENT -->

							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
									>
										<User
											class="h-4 w-4 text-muted-foreground"
										/>
									</div>

									<div class="min-w-0">
										<p class="truncate text-sm font-medium">
											{{ row.studentName }}
										</p>

										<p
											v-if="row.studentUsername"
											class="truncate text-xs text-muted-foreground"
										>
											{{ row.studentUsername }}
										</p>
									</div>
								</div>
							</div>

							<!-- STEP -->

							<div class="text-center">
								<Badge variant="outline">
									{{ row.step ?? "—" }}
								</Badge>
							</div>

							<!-- STATUS -->

							<div>
								<div
									v-if="row.status === 'success'"
									class="flex items-center gap-2 text-sm font-medium text-emerald-600"
								>
									<CheckCircle2 class="h-4 w-4" />

									Muvaffaqiyatli
								</div>

								<div
									v-else
									class="flex items-center gap-2 text-sm font-medium text-red-600"
								>
									<XCircle class="h-4 w-4" />

									Xato
								</div>

								<Badge
									v-if="
										row.status === 'failed' && row.errorCode
									"
									class="mt-1"
									variant="destructive"
								>
									{{ row.errorCode }}
								</Badge>
							</div>

							<!-- LOCATION -->

							<div class="flex items-start gap-2 text-sm">
								<MapPin
									class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
								/>

								<span class="line-clamp-2">
									{{ row.locationName || "—" }}
								</span>
							</div>

							<!-- TIME -->

							<div class="flex items-center gap-2 text-xs">
								<Clock
									class="h-4 w-4 shrink-0 text-muted-foreground"
								/>

								{{ formatDateTime(row.date) }}
							</div>

							<!-- DETAIL -->

							<div class="flex justify-end">
								<Button
									variant="ghost"
									size="icon"
									@click="openDetail(row)"
								>
									<Eye class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- =================================================
		     DETAIL DIALOG
		     ================================================= -->

		<Dialog v-model:open="detailDialogOpen">
			<DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle> Davomat auditi </DialogTitle>

					<DialogDescription>
						Tekshiruvning to‘liq texnik ma’lumotlari.
					</DialogDescription>
				</DialogHeader>

				<div v-if="selectedRow" class="space-y-5 py-2">
					<!-- STATUS -->

					<div
						class="flex items-center justify-between gap-3 rounded-xl border p-4"
					>
						<div>
							<p class="font-semibold">
								{{ selectedRow.studentName }}
							</p>

							<p
								v-if="selectedRow.studentUsername"
								class="text-sm text-muted-foreground"
							>
								{{ selectedRow.studentUsername }}
							</p>
						</div>

						<div
							v-if="selectedRow.status === 'success'"
							class="flex items-center gap-2 text-emerald-600"
						>
							<ShieldCheck class="h-5 w-5" />

							Muvaffaqiyatli
						</div>

						<div
							v-else
							class="flex items-center gap-2 text-red-600"
						>
							<ShieldX class="h-5 w-5" />

							Xato
						</div>
					</div>

					<!-- IMAGE -->

					<div v-if="selectedRow.image">
						<Label> Tasdiqlash rasmi </Label>

						<img
							:src="selectedRow.image"
							alt="Attendance"
							class="mt-2 max-h-[350px] w-full rounded-xl border object-contain"
						/>
					</div>

					<!-- INFORMATION -->

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="rounded-xl border p-3">
							<p class="text-xs text-muted-foreground">Step</p>

							<p class="mt-1 font-medium">
								{{ selectedRow.step ?? "—" }}
							</p>
						</div>

						<div class="rounded-xl border p-3">
							<p class="text-xs text-muted-foreground">Vaqt</p>

							<p class="mt-1 text-sm font-medium">
								{{ formatDateTime(selectedRow.date) }}
							</p>
						</div>

						<div class="rounded-xl border p-3">
							<p class="text-xs text-muted-foreground">
								IP address
							</p>

							<p class="mt-1 font-medium">
								{{ selectedRow.ipAddress || "—" }}
							</p>
						</div>

						<div class="rounded-xl border p-3">
							<p class="text-xs text-muted-foreground">GPS</p>

							<p class="mt-1 font-medium">
								{{ selectedRow.latitude ?? "—" }},
								{{ selectedRow.longitude ?? "—" }}
							</p>
						</div>

						<div class="rounded-xl border p-3">
							<p class="text-xs text-muted-foreground">
								Joylashuv
							</p>

							<p class="mt-1 font-medium">
								{{ selectedRow.locationName || "—" }}
							</p>
						</div>

						<div class="rounded-xl border p-3">
							<p class="text-xs text-muted-foreground">Face ID</p>

							<p class="mt-1 font-medium">
								{{
									selectedRow.faceVerified === true
										? "Tasdiqlangan"
										: selectedRow.faceVerified === false
											? "Tasdiqlanmagan"
											: "—"
								}}
							</p>
						</div>

						<div class="rounded-xl border p-3">
							<p class="text-xs text-muted-foreground">
								Location verification
							</p>

							<p class="mt-1 font-medium">
								{{
									selectedRow.locationVerified === true
										? "Tasdiqlangan"
										: selectedRow.locationVerified === false
											? "Tasdiqlanmagan"
											: "—"
								}}
							</p>
						</div>
					</div>

					<!-- ERROR -->

					<div
						v-if="selectedRow.status === 'failed'"
						class="rounded-xl border border-red-200 bg-red-50 p-4"
					>
						<p class="text-xs font-medium text-red-500">Xato</p>

						<Badge
							v-if="selectedRow.errorCode"
							variant="destructive"
							class="mt-2"
						>
							{{ selectedRow.errorCode }}
						</Badge>

						<p class="mt-2 text-sm text-red-700">
							{{
								selectedRow.errorMessage ||
								"Xatolik qayd etilgan."
							}}
						</p>
					</div>

					<!-- USER AGENT -->

					<div
						v-if="selectedRow.userAgent"
						class="rounded-xl border p-4"
					>
						<p class="text-xs text-muted-foreground">User Agent</p>

						<p class="mt-2 break-all text-xs">
							{{ selectedRow.userAgent }}
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" @click="detailDialogOpen = false">
						Yopish
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
