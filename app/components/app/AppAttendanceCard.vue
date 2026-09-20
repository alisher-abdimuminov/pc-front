<script setup lang="ts">
import {
	Camera,
	Check,
	Lock,
	MapPin,
	X,
	Loader2,
	RotateCcw,
	AlertTriangle,
	Navigation,
	CheckCircle2,
} from "@lucide/vue";

import type { TodayAttendance } from "@/types/api";

const props = defineProps<{
	data: TodayAttendance;
}>();

const emit = defineEmits<{
	refresh: [];
}>();

const { api, errorMessage } = useApi();

/* ----------------------------------
 * FACE DRAWER
 * ---------------------------------- */

const faceDrawerOpen = ref(false);

const selectedStep = ref<number | null>(null);

/* ----------------------------------
 * LOCATION
 * ---------------------------------- */

const locationLoading = ref(false);

const locationError = ref("");

const locationResult = ref<{
	has_class: boolean;
	inside: boolean;
	message: string;

	location?: {
		id: number;
		name: string;
	};
} | null>(null);

const coordinates = reactive({
	latitude: 0,
	longitude: 0,
});

/* ----------------------------------
 * SUCCESS
 * ---------------------------------- */

const success = ref("");

/* ----------------------------------
 * LOCATION STATE
 * ---------------------------------- */

const locationAllowed = computed(() => locationResult.value?.inside === true);

const locationChecked = computed(() => locationResult.value !== null);

/* ----------------------------------
 * GET BROWSER LOCATION
 * ---------------------------------- */

function getPosition() {
	return new Promise<GeolocationPosition>((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Geolocation mavjud emas"));

			return;
		}

		navigator.geolocation.getCurrentPosition(resolve, reject, {
			enableHighAccuracy: true,

			timeout: 15000,

			maximumAge: 0,
		});
	});
}

/* ----------------------------------
 * CHECK LOCATION
 * ---------------------------------- */

async function requestLocation() {
	if (!props.data.has_schedule) {
		return;
	}

	locationLoading.value = true;

	locationError.value = "";

	locationResult.value = null;

	success.value = "";

	try {
		const position = await getPosition();

		coordinates.latitude = position.coords.latitude;

		coordinates.longitude = position.coords.longitude;

		const response = await api<any>("/attendance/location-check/", {
			method: "POST",

			body: {
				latitude: coordinates.latitude,

				longitude: coordinates.longitude,
			},
		});

		locationResult.value = response;
	} catch (e: any) {
		/*
		 * Browser location error.
		 */

		if (e?.code === GeolocationPositionError.PERMISSION_DENIED) {
			locationError.value =
				"Davomatdan o‘tish uchun joylashuvga ruxsat berishingiz kerak.";
		} else if (e?.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
			locationError.value = "Joylashuvingizni aniqlab bo‘lmadi.";
		} else if (e?.code === GeolocationPositionError.TIMEOUT) {
			locationError.value =
				"Joylashuvni aniqlash vaqti tugadi. Qaytadan urinib ko‘ring.";
		} else {
			locationError.value = errorMessage(e);
		}
	} finally {
		locationLoading.value = false;
	}
}

/* ----------------------------------
 * STEP
 * ---------------------------------- */

function openStep(step: number, status: string) {
	/*
	 * Faqat available step.
	 */

	if (status !== "available") {
		return;
	}

	/*
	 * Location tasdiqlanmagan.
	 */

	if (!locationAllowed.value) {
		return;
	}

	selectedStep.value = step;

	faceDrawerOpen.value = true;

	success.value = "";
}

/* ----------------------------------
 * DRAWER OPEN/CLOSE
 * ---------------------------------- */

function handleDrawerOpen(value: boolean) {
	faceDrawerOpen.value = value;

	if (!value) {
		selectedStep.value = null;
	}
}

/* ----------------------------------
 * FACE SUCCESS
 * ---------------------------------- */

async function handleFaceSuccess() {
	const step = selectedStep.value;

	faceDrawerOpen.value = false;

	selectedStep.value = null;

	if (step) {
		success.value = `${step}-step muvaffaqiyatli tasdiqlandi.`;
	}

	emit("refresh");

	/*
	 * Refreshdan keyin ham
	 * locationni qayta tekshirib
	 * o‘tirmaymiz.
	 *
	 * Backend /attendance/check/
	 * requestida location yana
	 * tekshirilishi kerak.
	 */
}

/* ----------------------------------
 * STEP BADGE
 * ---------------------------------- */

function badge(status: string) {
	if (status === "completed") {
		return "success";
	}

	if (status === "available") {
		return "default";
	}

	if (status === "missed") {
		return "destructive";
	}

	return "outline";
}

function statusLabel(status: string) {
	if (status === "completed") {
		return "Bajarildi";
	}

	if (status === "available") {
		return "Ochiq";
	}

	if (status === "locked") {
		return "Yopiq";
	}

	if (status === "missed") {
		return "O‘tkazib yuborilgan";
	}

	return status;
}

/* ----------------------------------
 * INIT
 * ---------------------------------- */

onMounted(() => {
	if (props.data.has_schedule) {
		requestLocation();
	}
});

/*
 * Parent data keyinroq kelsa ham
 * location so‘raladi.
 */

watch(
	() => props.data.has_schedule,

	(value, oldValue) => {
		if (
			value &&
			value !== oldValue &&
			!locationChecked.value &&
			!locationLoading.value
		) {
			requestLocation();
		}
	},
);
</script>

<template>
	<div>
		<!-- =========================================
		     LOCATION WARNING
		     ========================================= -->

		<Alert v-if="locationError" variant="destructive" class="mb-4">
			<AlertTriangle class="h-4 w-4" />

			<AlertTitle> Joylashuv aniqlanmadi </AlertTitle>

			<AlertDescription>
				<p>
					{{ locationError }}
				</p>

				<Button
					variant="outline"
					size="sm"
					class="mt-3"
					:disabled="locationLoading"
					@click="requestLocation"
				>
					<Loader2
						v-if="locationLoading"
						class="mr-2 h-4 w-4 animate-spin"
					/>

					<RotateCcw v-else class="mr-2 h-4 w-4" />

					Qayta urinish
				</Button>
			</AlertDescription>
		</Alert>

		<!-- =========================================
		     OUTSIDE LOCATION
		     ========================================= -->

		<Alert
			v-else-if="locationResult?.has_class && !locationResult.inside"
			variant="destructive"
			class="mb-4"
		>
			<MapPin class="h-4 w-4" />

			<AlertTitle> Siz dars joyida emassiz </AlertTitle>

			<AlertDescription>
				<p>
					{{
						locationResult.message ||
						"Siz dars bo‘ladigan joyda emassiz. Dars joyiga boring va qaytadan urinib ko‘ring."
					}}
				</p>

				<p
					v-if="locationResult.location?.name"
					class="mt-2 font-medium"
				>
					Dars joyi:
					{{ locationResult.location.name }}
				</p>

				<Button
					variant="outline"
					size="sm"
					class="mt-3"
					:disabled="locationLoading"
					@click="requestLocation"
				>
					<Loader2
						v-if="locationLoading"
						class="mr-2 h-4 w-4 animate-spin"
					/>

					<Navigation v-else class="mr-2 h-4 w-4" />

					Joylashuvni qayta tekshirish
				</Button>
			</AlertDescription>
		</Alert>

		<!-- =========================================
		     LOCATION SUCCESS
		     ========================================= -->

		<Alert
			v-else-if="locationResult?.inside"
			class="mb-4 border-emerald-600 bg-emerald-600/10 text-emerald-600"
		>
			<CheckCircle2 class="h-4 w-4 text-emerald-600" />

			<AlertTitle> Joylashuv tasdiqlandi </AlertTitle>

			<AlertDescription>
				<span v-if="locationResult.location?.name">
					Siz
					<strong>
						{{ locationResult.location.name }}
					</strong>
					hududidasiz.
				</span>

				<span v-else> Davomatdan o‘tishingiz mumkin. </span>
			</AlertDescription>
		</Alert>

		<!-- =========================================
		     SUCCESS
		     ========================================= -->

		<Alert
			v-if="success"
			class="mb-4 border-emerald-200 bg-emerald-50 text-emerald-800"
		>
			<CheckCircle2 class="h-4 w-4 text-emerald-600" />

			<AlertTitle> Davomat tasdiqlandi </AlertTitle>

			<AlertDescription>
				{{ success }}
			</AlertDescription>
		</Alert>

		<!-- =========================================
		     ATTENDANCE CARD
		     ========================================= -->

		<Card>
			<CardHeader>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 class="font-semibold">Bugungi davomat</h2>

						<p
							v-if="data.has_schedule"
							class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"
						>
							<MapPin class="h-4 w-4" />

							{{ data.location?.name }}
						</p>
					</div>

					<Badge v-if="data.has_schedule" variant="outline">
						{{ data.date }}
					</Badge>
				</div>
			</CardHeader>

			<CardContent>
				<!-- =====================
				     NO SCHEDULE
				     ===================== -->

				<AppEmptyState
					v-if="!data.has_schedule"
					title="Bugun amaliyot yo‘q"
					description="Guruhingiz uchun bugungi kunga jadval topilmadi."
				/>

				<template v-else>
					<!-- =====================
					     LOCATION LOADING
					     ===================== -->

					<div
						v-if="locationLoading"
						class="mb-5 flex items-center gap-3 rounded-xl border bg-muted/20 p-4"
					>
						<Loader2
							class="h-5 w-5 animate-spin text-muted-foreground"
						/>

						<div>
							<p class="text-sm font-medium">
								Joylashuv tekshirilmoqda
							</p>

							<p class="mt-1 text-xs text-muted-foreground">
								Davomatdan o‘tish uchun hozirgi joylashuvingiz
								tekshirilmoqda.
							</p>
						</div>
					</div>

					<!-- =====================
					     STEPS
					     ===================== -->

					<div class="grid gap-3 sm:grid-cols-3">
						<button
							v-for="step in data.steps"
							:key="step.step"
							type="button"
							class="relative rounded-2xl border-2 p-4 text-left transition-all"
							:class="[
								step.status === 'available' && locationAllowed
									? 'cursor-pointer border-emerald-600 bg-emerald-600/10 hover:bg-emerald-600/15'
									: '',

								step.status === 'completed'
									? 'border-emerald-600 bg-emerald-600/10'
									: '',

								step.status === 'missed'
									? 'border-red-600 bg-red-600/10'
									: '',

								step.status === 'locked' ||
								(step.status === 'available' &&
									!locationAllowed)
									? 'cursor-not-allowed opacity-60'
									: '',
							]"
							:disabled="
								step.status !== 'available' || !locationAllowed
							"
							@click="openStep(step.step, step.status)"
						>
							<div
								class="flex items-center justify-between gap-2"
							>
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full border bg-background"
								>
									<Check
										v-if="step.status === 'completed'"
										class="h-4 w-4 text-emerald-600"
									/>

									<Camera
										v-else-if="
											step.status === 'available' &&
											locationAllowed
										"
										class="h-4 w-4 text-emerald-600"
									/>

									<MapPin
										v-else-if="
											step.status === 'available' &&
											!locationAllowed
										"
										class="h-4 w-4 text-muted-foreground"
									/>

									<Lock
										v-else-if="step.status === 'locked'"
										class="h-4 w-4 text-muted-foreground"
									/>

									<X v-else class="h-4 w-4 text-red-500" />
								</div>

								<Badge :variant="badge(step.status) as any">
									{{ statusLabel(step.status) }}
								</Badge>
							</div>

							<div class="mt-5">
								<p class="font-semibold">
									Step
									{{ step.step }}
								</p>

								<p class="mt-1 text-xs text-muted-foreground">
									{{ step.start }}
									—
									{{ step.end }}
								</p>
							</div>

							<!-- AVAILABLE BUT LOCATION BLOCKED -->

							<p
								v-if="
									step.status === 'available' &&
									!locationAllowed &&
									!locationLoading
								"
								class="mt-3 text-xs text-muted-foreground"
							>
								Avval joylashuvni tasdiqlang
							</p>

							<!-- AVAILABLE -->

							<p
								v-else-if="
									step.status === 'available' &&
									locationAllowed
								"
								class="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-700"
							>
								<Camera class="h-3.5 w-3.5" />

								Face ID uchun bosing
							</p>
						</button>
					</div>
				</template>
			</CardContent>
		</Card>

		<!-- =========================================
		     FACE ID DRAWER
		     ========================================= -->

		<StudentFaceID
			:open="faceDrawerOpen"
			:step="selectedStep"
			:latitude="coordinates.latitude"
			:longitude="coordinates.longitude"
			@update:open="handleDrawerOpen"
			@success="handleFaceSuccess"
		/>
	</div>
</template>
