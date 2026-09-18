<script setup lang="ts">
definePageMeta({ middleware: "teacher" });
import { Users, ClipboardList, UserCheck, UserGroup } from "@lucide/vue";
import type { Group, Assignment, Attendance } from "@/types/api";
const { api } = useApi();
const groups = ref<Group[]>([]),
	assignments = ref<Assignment[]>([]),
	attendance = ref<Attendance[]>([]);
onMounted(async () => {
	[groups.value, assignments.value, attendance.value] = await Promise.all([
		api("/groups/"),
		api("/assignments/"),
		api(
			`/attendance/records/?date=${new Date().toISOString().slice(0, 10)}`,
		),
	]);
});
</script>
<template>
	<AppPageTitle
		title="O‘qituvchi paneli"
		description="Biriktirilgan guruhlar, vazifalar va bugungi davomat."
	/>
	<div class="grid gap-4 sm:grid-cols-3">
		<Card class="border border-amber-600">
			<CardContent class="flex items-center gap-4 py-5">
				<div class="bg-amber-600 p-2 rounded-xl text-white">
					<UserGroup class="h-5 w-5" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Guruhlar</div>
					<div class="text-2xl font-bold">{{ groups.length }}</div>
				</div>
			</CardContent>
		</Card>
		<Card class="border border-emerald-600">
			<CardContent class="flex items-center gap-4 py-5">
				<div class="bg-emerald-600 p-2 rounded-xl text-white">
					<ClipboardList class="h-5 w-5" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">
						Topshiriqlar
					</div>
					<div class="text-2xl font-bold">
						{{ assignments.length }}
					</div>
				</div>
			</CardContent>
		</Card>
		<Card class="border border-rose-600">
			<CardContent class="flex items-center gap-4 py-5">
				<div class="bg-rose-600 p-2 rounded-xl text-white">
					<UserCheck class="h-5 w-5" />
				</div>
				<div>
					<div class="text-sm text-muted-foreground">
						Bugun qatnashgan
					</div>
					<div class="text-2xl font-bold">
						{{ attendance.length }}
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
	<div class="mt-8">
		<h2 class="mb-3 text-lg font-semibold">Guruhlarim</h2>
		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			<NuxtLink
				v-for="g in groups"
				:key="g.id"
				:to="`/teacher/groups/${g.id}`"
			>
				<Card class="transition hover:-translate-y-0.5 hover:shadow-md">
					<CardContent class="py-5">
						<div class="font-semibold">{{ g.name }}</div>
						<div class="mt-1 text-sm text-muted-foreground">
							{{ g.student_count }} talaba
						</div>
					</CardContent>
				</Card>
			</NuxtLink>
		</div>
	</div>
</template>
