<script setup lang="ts">
import {
	Camera,
	Check,
	Lock,
	MapPin,
	X,
	Loader2,
	RotateCcw,
} from "@lucide/vue";
import type { TodayAttendance } from "@/types/api";
const props = defineProps<{ data: TodayAttendance }>();
const emit = defineEmits<{ refresh: [] }>();
const { api, errorMessage } = useApi();
const selected = ref<number | null>(null);
const stream = ref<MediaStream | null>(null);
const video = ref<HTMLVideoElement | null>(null);
const busy = ref(false);
const error = ref("");
const success = ref("");
async function openCamera(step: number) {
	selected.value = step;
	error.value = "";
	success.value = "";
	try {
		stream.value = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: "user" },
			audio: false,
		});
		await nextTick();
		if (video.value) video.value.srcObject = stream.value;
	} catch {
		error.value = "Kameraga ruxsat berilmadi.";
	}
}
function closeCamera() {
	stream.value?.getTracks().forEach((t) => t.stop());
	stream.value = null;
	selected.value = null;
}
function getPosition() {
	return new Promise<GeolocationPosition>((res, rej) =>
		navigator.geolocation.getCurrentPosition(res, rej, {
			enableHighAccuracy: true,
			timeout: 15000,
			maximumAge: 0,
		}),
	);
}
async function verify() {
	if (!video.value || !selected.value) return;
	busy.value = true;
	error.value = "";
	try {
		const pos = await getPosition();
		const canvas = document.createElement("canvas");
		canvas.width = video.value.videoWidth || 720;
		canvas.height = video.value.videoHeight || 720;
		canvas
			.getContext("2d")!
			.drawImage(video.value, 0, 0, canvas.width, canvas.height);
		const blob = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(b) => (b ? resolve(b) : reject()),
				"image/jpeg",
				0.9,
			),
		);
		const fd = new FormData();
		fd.append("face_image", blob, "attendance.jpg");
		fd.append("latitude", String(pos.coords.latitude));
		fd.append("longitude", String(pos.coords.longitude));
		await api("/attendance/check/", { method: "POST", body: fd });
		success.value = `${selected.value}-step muvaffaqiyatli tasdiqlandi`;
		closeCamera();
		emit("refresh");
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		busy.value = false;
	}
}
onBeforeUnmount(() => closeCamera());
const badge = (s: string) =>
	s === "completed"
		? "success"
		: s === "available"
			? "default"
			: s === "missed"
				? "destructive"
				: "outline";
</script>
<template>
	<Card>
		<CardHeader>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="font-semibold">Bugungi davomat</h2>
					<p
						v-if="data.has_schedule"
						class="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
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
			<AppEmptyState
				v-if="!data.has_schedule"
				title="Bugun amaliyot yo‘q"
				description="Guruhingiz uchun bugungi kunga jadval topilmadi." />
			<div v-else class="grid gap-3 sm:grid-cols-3">
				<button
					v-for="s in data.steps"
					:key="s.step"
					class="rounded-2xl border p-4 text-left"
					:class="
						s.status === 'available'
							? 'border-foreground border-dashed'
							: 'border'
					"
					:disabled="s.status !== 'available'"
					@click="openCamera(s.step)">
					<div class="flex items-center justify-between">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-full border">
							<Check
								v-if="s.status === 'completed'"
								class="h-4 w-4 text-emerald-600" />
							<Camera
								v-else-if="s.status === 'available'"
								class="h-4 w-4" />
							<Lock
								v-else-if="s.status === 'locked'"
								class="h-4 w-4 text-muted-foreground" />
							<X v-else class="h-4 w-4 text-red-500" />
						</div>
						<Badge :variant="badge(s.status) as any">
							{{ s.status }}
						</Badge>
					</div>
					<div class="mt-5 font-semibold">Step {{ s.step }}</div>
					<div class="mt-1 text-xs text-muted-foreground">
						{{ s.start }} — {{ s.end }}
					</div>
				</button>
			</div>
			<div v-if="selected" class="mt-5 rounded-2xl border p-3">
				<video
					ref="video"
					autoplay
					playsinline
					muted
					class="aspect-video w-full rounded-xl object-cover" />
				<div class="mt-3 flex gap-2">
					<Button class="flex-1" :disabled="busy" @click="verify">
						<Loader2
							v-if="busy"
							class="mr-2 h-4 w-4 animate-spin" />
						<Camera v-else class="mr-2 h-4 w-4" />
						Tasdiqlash
					</Button>
					<Button variant="outline" @click="closeCamera">
						<RotateCcw class="mr-2 h-4 w-4" />
						Bekor qilish
					</Button>
				</div>
			</div>
			<div
				v-if="error"
				class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
				{{ error }}
			</div>
			<div
				v-if="success"
				class="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
				{{ success }}
			</div>
		</CardContent>
	</Card>
</template>
