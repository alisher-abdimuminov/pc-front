<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import {
	MapPin,
	ShieldAlert,
	GraduationCap,
	UserGroup,
	UserShield,
} from "@lucide/vue";
import type { Group, Location, Schedule, User } from "@/types/api";
const { api } = useApi();
const students = ref<User[]>([]);
const teachers = ref<User[]>([]);
const groups = ref<Group[]>([]);
const locations = ref<Location[]>([]);
const schedules = ref<Schedule[]>([]);
const attempts = ref<any[]>([]);
onMounted(async () => {
	[
		students.value,
		teachers.value,
		groups.value,
		locations.value,
		schedules.value,
		attempts.value,
	] = await Promise.all([
		api<User[]>("/auth/users/?type=student"),
		api<User[]>("/auth/users/?type=teacher"),
		api<Group[]>("/groups/"),
		api<Location[]>("/locations/"),
		api<Schedule[]>("/schedules/"),
		api<any[]>("/attendance/attempts/"),
	]);
});
</script>
<template>
	<AppPageTitle
		title="Administrator paneli"
		description="Platformaning asosiy obyektlari va monitoring."
	/>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="border border-indigo-600">
			<CardHeader class="flex items-center justify-between">
				<span>Talabalar</span>
				<div class="bg-indigo-600 p-2 rounded-xl">
					<GraduationCap class="h-5 w-5 text-white" />
				</div>
			</CardHeader>
			<CardContent class="flex items-center gap-4 py-5">
				<p class="text-5xl font-bold">{{ students.length }}</p>
			</CardContent>
		</Card>

		<Card class="border border-sky-600">
			<CardHeader class="flex items-center justify-between">
				<span>O'qituvchilar</span>
				<div class="bg-sky-600 p-2 rounded-xl">
					<UserShield class="h-5 w-5 text-white" />
				</div>
			</CardHeader>
			<CardContent class="flex items-center gap-4 py-5">
				<p class="text-5xl font-bold">{{ teachers.length }}</p>
			</CardContent>
		</Card>

		<Card class="border border-amber-600">
			<CardHeader class="flex items-center justify-between">
				<span>Guruhlar</span>
				<div class="bg-amber-600 p-2 rounded-xl">
					<UserGroup class="h-5 w-5 text-white" />
				</div>
			</CardHeader>
			<CardContent class="flex items-center gap-4 py-5">
				<p class="text-5xl font-bold">{{ groups.length }}</p>
			</CardContent>
		</Card>

		<Card class="border border-emerald-600">
			<CardHeader class="flex items-center justify-between">
				<span>Joylashuvlar</span>
				<div class="bg-emerald-600 p-2 rounded-xl">
					<MapPin class="h-5 w-5 text-white" />
				</div>
			</CardHeader>
			<CardContent class="flex items-center gap-4 py-5">
				<p class="text-5xl font-bold">{{ locations.length }}</p>
			</CardContent>
		</Card>

		<Card class="border border-rose-600">
			<CardHeader class="flex items-center justify-between">
				<span>Xato urinishlar</span>
				<div class="bg-rose-600 p-2 rounded-xl">
					<ShieldAlert class="h-5 w-5 text-white" />
				</div>
			</CardHeader>
			<CardContent class="flex items-center gap-4 py-5">
				<p class="text-5xl font-bold">{{ attempts.length }}</p>
			</CardContent>
		</Card>
	</div>
</template>
