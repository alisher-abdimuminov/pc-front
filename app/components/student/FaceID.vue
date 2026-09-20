<script setup lang="ts">
import {
	FaceLandmarker,
	FilesetResolver,
	type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

import { Camera, Loader2, RotateCcw, CheckCircle2 } from "@lucide/vue";

import rodriguesRotationVectorFromMatrix from "@/utils/rodrigues";

const props = defineProps<{
	open: boolean;
	step: number | null;
	latitude: number;
	longitude: number;
}>();

const emit = defineEmits<{
	"update:open": [value: boolean];
	success: [];
}>();

const { api, errorMessage } = useApi();

const videoRef = ref<HTMLVideoElement | null>(null);
const photoRef = ref<HTMLCanvasElement | null>(null);

const loading = ref(false);
const submitting = ref(false);

const message = ref("Kameraga qarang");
const state = ref<"idle" | "warning" | "ready" | "success" | "error">("idle");

const progress = ref(0);

let stream: MediaStream | null = null;
let landmarker: FaceLandmarker | null = null;
let animationFrame: number | null = null;
let lastVideoTime = -1;
let stableStartedAt: number | null = null;
let captured = false;

/**
 * Oval progress:
 * SVG ellipse uchun pathLength=100 ishlatamiz.
 * Shunda progress foizini to‘g‘ridan-to‘g‘ri
 * stroke-dasharray bilan boshqarish oson bo‘ladi.
 */
const progressStroke = computed(() => `${progress.value} 100`);

async function createFaceLandmarker() {
	const resolver = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
	);

	landmarker = await FaceLandmarker.createFromOptions(resolver, {
		baseOptions: {
			modelAssetPath:
				"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
			delegate: "GPU",
		},
		outputFaceBlendshapes: true,
		outputFacialTransformationMatrixes: true,
		runningMode: "VIDEO",
		numFaces: 2,
	});
}

async function startCamera() {
	stopCamera();

	captured = false;
	progress.value = 0;
	stableStartedAt = null;
	lastVideoTime = -1;

	state.value = "idle";
	message.value = "Kameraga qarang";
	loading.value = true;

	try {
		if (!landmarker) {
			await createFaceLandmarker();
		}

		stream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: {
				facingMode: "user",
				width: { ideal: 720 },
				height: { ideal: 1280 },
			},
		});

		const video = videoRef.value;
		if (!video) return;

		video.srcObject = stream;
		await video.play();

		predict();
	} catch (e) {
		state.value = "error";
		message.value = "Kameraga ruxsat berilmadi.";
	} finally {
		loading.value = false;
	}
}

function stopCamera() {
	if (animationFrame !== null) {
		cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}

	if (stream) {
		for (const track of stream.getTracks()) {
			track.stop();
		}
		stream = null;
	}

	stableStartedAt = null;
	progress.value = 0;
}

function resetStable(
	text: string,
	stateValue: "idle" | "warning" | "error" = "warning",
) {
	stableStartedAt = null;
	progress.value = 0;
	state.value = stateValue;
	message.value = text;
}

function predict() {
	const video = videoRef.value;

	if (!video || !landmarker || captured) {
		return;
	}

	if (video.readyState < 2) {
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	const now = performance.now();

	let result: FaceLandmarkerResult | null = null;

	if (lastVideoTime !== video.currentTime) {
		lastVideoTime = video.currentTime;
		result = landmarker.detectForVideo(video, now);
	}

	if (!result) {
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	const faces = result.faceLandmarks;

	// Yuz topilmadi
	if (!faces.length) {
		resetStable("Yuz aniqlanmadi. Kameraga qarang.");
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	// Bir nechta yuz
	if (faces.length > 1) {
		resetStable("Kadrda faqat bitta odam bo‘lishi kerak.");
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	const landmarks = faces[0];
	if (!landmarks) {
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	let x1 = 1;
	let y1 = 1;
	let x2 = 0;
	let y2 = 0;

	for (const landmark of landmarks) {
		x1 = Math.min(x1, landmark.x);
		y1 = Math.min(y1, landmark.y);
		x2 = Math.max(x2, landmark.x);
		y2 = Math.max(y2, landmark.y);
	}

	const faceWidth = x2 - x1;
	const faceHeight = y2 - y1;
	const centerX = (x1 + x2) / 2;
	const centerY = (y1 + y2) / 2;

	const centered =
		centerX > 0.35 && centerX < 0.65 && centerY > 0.3 && centerY < 0.7;

	if (!centered) {
		resetStable("Yuzingizni ramka markaziga joylashtiring.");
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	if (faceWidth < 0.2 || faceHeight < 0.25) {
		resetStable("Kameraga biroz yaqinroq keling.");
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	if (faceWidth > 0.65 || faceHeight > 0.75) {
		resetStable("Kameradan biroz uzoqlashing.");
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	const matrix = result.facialTransformationMatrixes?.[0];

	if (!matrix) {
		resetStable("Yuz holatini aniqlab bo‘lmadi.");
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	const rotationMatrix = [
		matrix.data[0],
		matrix.data[1],
		matrix.data[2],
		matrix.data[4],
		matrix.data[5],
		matrix.data[6],
		matrix.data[8],
		matrix.data[9],
		matrix.data[10],
	];

	const rotation = rodriguesRotationVectorFromMatrix(rotationMatrix);

	const pitch = rotation[0] || 0;
	const yaw = rotation[1] || 0;
	const roll = rotation[2] || 0;

	const straight =
		Math.abs(pitch) <= 7 && Math.abs(yaw) <= 7 && Math.abs(roll) <= 7;

	if (!straight) {
		resetStable("Boshingizni to‘g‘ri tuting va kameraga qarang.");
		animationFrame = requestAnimationFrame(predict);
		return;
	}

	state.value = "ready";
	message.value = "3 soniya to‘g‘riga qarab turing";

	if (stableStartedAt === null) {
		stableStartedAt = now;
	}

	const elapsed = now - stableStartedAt;
	progress.value = Math.min(100, (elapsed / 3000) * 100);

	if (elapsed >= 3000) {
		captured = true;
		progress.value = 100;
		captureAndSend();
		return;
	}

	animationFrame = requestAnimationFrame(predict);
}

async function captureAndSend() {
	const video = videoRef.value;
	const canvas = photoRef.value;

	if (!video || !canvas || !props.step) {
		return;
	}

	submitting.value = true;
	state.value = "ready";
	message.value = "Yuz tekshirilmoqda...";

	try {
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const context = canvas.getContext("2d");

		if (!context) {
			throw new Error("Canvas mavjud emas");
		}

		context.drawImage(video, 0, 0, canvas.width, canvas.height);

		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(value) => {
					if (value) {
						resolve(value);
					} else {
						reject(new Error("Rasm olinmadi"));
					}
				},
				"image/jpeg",
				0.9,
			);
		});

		const formData = new FormData();

		formData.append("face_image", blob, "attendance.jpg");
		formData.append("step", String(props.step));
		formData.append("latitude", String(props.latitude));
		formData.append("longitude", String(props.longitude));

		await api("/attendance/verify/", {
			method: "POST",
			body: formData,
		});

		state.value = "success";
		message.value = "Davomat muvaffaqiyatli tasdiqlandi.";

		stopCamera();

		setTimeout(() => {
			emit("update:open", false);
			emit("success");
		}, 900);
	} catch (e) {
		state.value = "error";
		message.value = errorMessage(e);
		stopCamera();
	} finally {
		submitting.value = false;
	}
}

async function retry() {
	await startCamera();
}

watch(
	() => props.open,
	async (open) => {
		if (open) {
			await nextTick();
			await startCamera();
		} else {
			stopCamera();
		}
	},
);

onBeforeUnmount(() => {
	stopCamera();
	landmarker?.close();
});
</script>

<template>
	<Drawer
		class="h-[95dvh]"
		:open="open"
		@update:open="emit('update:open', $event)"
	>
		<DrawerContent class="h-[95dvh] max-h-[95dvh] rounded-t-3xl p-0">
			<div
				class="mx-auto flex h-full w-full max-w-xl flex-col px-4 pb-4 pt-2"
			>
				<DrawerHeader class="shrink-0 px-0 pb-3 pt-2">
					<DrawerTitle>Face ID</DrawerTitle>

					<DrawerDescription>
						Step {{ step }} uchun yuzingizni tasdiqlang.
					</DrawerDescription>
				</DrawerHeader>

				<div class="flex min-h-0 flex-1 flex-col">
					<div
						class="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black"
					>
						<!-- CAMERA -->
						<video
							ref="videoRef"
							autoplay
							playsinline
							muted
							class="h-full w-full scale-x-[-1] object-cover"
						/>

						<!-- AUTO CAPTURE CANVAS -->
						<canvas ref="photoRef" class="hidden" />

						<!-- OVAL FRAME + PROGRESS -->
						<div
							class="pointer-events-none absolute inset-0 flex items-center justify-center"
						>
							<div class="relative h-[58%] w-[70%]">
								<!-- Static oval -->
								<div
									class="absolute inset-0 rounded-[45%] border-4 transition-colors"
									:class="{
										'border-white': state === 'idle',
										'border-yellow-400':
											state === 'warning',
										'border-red-500': state === 'error',
										'border-emerald-500':
											state === 'success' ||
											state === 'ready',
									}"
								/>

								<!-- SVG progress around oval -->
								<svg
									class="absolute inset-0 h-full w-full -rotate-90"
									viewBox="0 0 100 100"
									preserveAspectRatio="none"
								>
									<!-- faint track -->
									<ellipse
										cx="50"
										cy="50"
										rx="46"
										ry="42"
										fill="none"
										pathLength="100"
										stroke="rgba(255,255,255,0.22)"
										stroke-width="3"
										stroke-dasharray="4 3"
									/>

									<!-- progress stroke -->
									<ellipse
										v-if="
											state === 'ready' ||
											submitting ||
											state === 'success'
										"
										cx="50"
										cy="50"
										rx="46"
										ry="42"
										fill="none"
										pathLength="100"
										stroke="rgb(16 185 129)"
										stroke-width="4"
										stroke-linecap="round"
										:stroke-dasharray="
											state === 'success'
												? '100 100'
												: progressStroke
										"
									/>
								</svg>
							</div>
						</div>

						<!-- STATUS BOX -->
						<div
							class="absolute inset-x-3 bottom-4 rounded-xl bg-black/60 p-3 text-center text-sm text-white backdrop-blur"
						>
							<div class="flex items-center justify-center gap-2">
								<Loader2
									v-if="loading || submitting"
									class="h-4 w-4 animate-spin"
								/>

								<CheckCircle2
									v-else-if="state === 'success'"
									class="h-4 w-4 text-emerald-400"
								/>

								<Camera v-else class="h-4 w-4" />

								{{ message }}
							</div>

							<div
								v-if="state === 'ready' && !submitting"
								class="mt-2 text-xs text-white/70"
							>
								Tayyor turing, ramka to‘lgach rasm avtomatik
								yuboriladi
							</div>
						</div>
					</div>

					<div class="mt-4 shrink-0">
						<Button
							v-if="state === 'error'"
							variant="outline"
							class="w-full"
							@click="retry"
						>
							<RotateCcw class="mr-2 h-4 w-4" />
							Qayta urinish
						</Button>
					</div>
				</div>
			</div>
		</DrawerContent>
	</Drawer>
</template>
