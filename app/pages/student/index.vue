<script setup lang="ts">
definePageMeta({ middleware: "student" });

import { ClipboardList, GraduationCap } from "@lucide/vue";
import type { TodayAttendance, Assignment } from "@/types/api";

const auth = useAuthStore();
const { api } = useApi();

const attendance = ref<TodayAttendance>({
	has_schedule: false,
	date: "",
	steps: [],
});
const assignments = ref<Assignment[]>([]);
const loading = ref(true);
const locationLoading = ref(true);
const locationError = ref("");
const locationAllowed = ref(false);

const coordinates = reactive({
	latitude: 0,
	longitude: 0,
});

const upcoming = computed(() =>
	assignments.value
		.filter((a) => new Date(a.deadline) >= new Date())
		.slice(0, 4),
);

const locationResult = ref<{
	has_class: boolean;
	inside: boolean;
	message: string;
	location?: {
		id: number;
		name: string;
	};
} | null>(null);

const faceDrawerOpen = ref(false);
const selectedStep = ref<number | null>(null);

async function load() {
	loading.value = true;
	try {
		[attendance.value, assignments.value] = await Promise.all([
			api<TodayAttendance>("/attendance/today/"),
			api<Assignment[]>("/assignments/"),
		]);
	} finally {
		loading.value = false;
	}
}

onMounted(async () => {
	await load();
});
</script>
<template>
	<AppPageTitle
		:title="`Salom, ${auth.user?.full_name || ''}`"
		:description="`${auth.user?.group_name || 'Guruh biriktirilmagan'} • ${auth.user?.faculty || ''}`"
	/>
	<div v-if="loading" class="grid gap-4">
		<div class="h-64 animate-pulse rounded-2xl" />
	</div>
	<template v-else>
		<AppAttendanceCard :data="attendance" @refresh="load" />
		<div class="mt-6 grid gap-4 md:grid-cols-3">
			<Card>
				<CardContent class="flex items-center gap-4 py-5">
					<div class="rounded-xl p-3">
						<GraduationCap class="h-5 w-5" />
					</div>
					<div>
						<div class="text-sm text-muted-foreground">Kurs</div>
						<div class="font-semibold">
							{{ auth.user?.course || "—" }}
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex items-center gap-4 py-5">
					<div class="rounded-xl p-3">
						<ClipboardList class="h-5 w-5" />
					</div>
					<div>
						<div class="text-sm text-muted-foreground">
							Faol topshiriqlar
						</div>
						<div class="font-semibold">{{ upcoming.length }}</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="py-5">
					<div class="text-sm text-muted-foreground">GPA</div>
					<div class="mt-1 text-xl font-semibold">
						{{ auth.user?.gap ?? "—" }}
					</div>
				</CardContent>
			</Card>
		</div>
		<div class="mt-8">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Yaqin topshiriqlar</h2>
				<NuxtLink
					to="/student/assignments"
					class="text-sm font-medium text-muted-foreground"
				>
					Barchasi →
				</NuxtLink>
			</div>
			<div v-if="upcoming.length" class="grid gap-3 md:grid-cols-2">
				<Card v-for="a in upcoming" :key="a.id">
					<CardContent class="py-5">
						<div class="flex items-start justify-between gap-3">
							<div>
								<div class="font-semibold">{{ a.title }}</div>
								<div class="mt-1 text-sm text-muted-foreground">
									{{ a.teacher_name }}
								</div>
							</div>
							<Badge
								:variant="a.submitted ? 'outline' : 'default'"
							>
								{{ a.submitted ? "Yuborilgan" : "Kutilmoqda" }}
							</Badge>
						</div>
						<div class="mt-4 text-xs text-muted-foreground">
							Deadline:
							{{ new Date(a.deadline).toLocaleString("uz-UZ") }}
						</div>
					</CardContent>
				</Card>
			</div>
			<AppEmptyState v-else title="Topshiriq yo‘q" />
		</div>
	</template>
</template>
