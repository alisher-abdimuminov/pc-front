<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import { Users, MapPin, CalendarDays, ShieldAlert } from "@lucide/vue";
import type { Group, Location, Schedule } from "@/types/api";
const { api } = useApi();
const groups = ref<Group[]>([]),
	locations = ref<Location[]>([]),
	schedules = ref<Schedule[]>([]),
	attempts = ref<any[]>([]);
onMounted(async () => {
	[groups.value, locations.value, schedules.value, attempts.value] =
		await Promise.all([
			api("/groups/"),
			api("/locations/"),
			api("/schedules/"),
			api("/attendance/attempts/"),
		]);
});
</script>
<template>
	<AppPageTitle
		title="Administrator paneli"
		description="Platformaning asosiy obyektlari va monitoring."
	/>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card
			><CardContent class="flex items-center gap-4 py-5"
				><Users class="h-5 w-5" />
				<div>
					<div class="text-sm">Guruhlar</div>
					<div class="text-2xl font-bold">{{ groups.length }}</div>
				</div></CardContent
			></Card
		><Card
			><CardContent class="flex items-center gap-4 py-5"
				><MapPin class="h-5 w-5" />
				<div>
					<div class="text-sm">Joylashuvlar</div>
					<div class="text-2xl font-bold">{{ locations.length }}</div>
				</div></CardContent
			></Card
		><Card
			><CardContent class="flex items-center gap-4 py-5"
				><CalendarDays class="h-5 w-5" />
				<div>
					<div class="text-sm">Jadvallar</div>
					<div class="text-2xl font-bold">{{ schedules.length }}</div>
				</div></CardContent
			></Card
		><Card
			><CardContent class="flex items-center gap-4 py-5"
				><ShieldAlert class="h-5 w-5" />
				<div>
					<div class="text-sm">Xato urinishlar</div>
					<div class="text-2xl font-bold">{{ attempts.length }}</div>
				</div></CardContent
			></Card
		>
	</div>
</template>
