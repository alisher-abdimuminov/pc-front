<script setup lang="ts">
import {
	LayoutDashboard,
	Users,
	ClipboardList,
	MapPin,
	CalendarDays,
	UserRoundCheck,
} from "@lucide/vue";
const a = useAuthStore();
const r = useRoute();
const menus: any = {
	student: [
		["/student", "Bosh sahifa", LayoutDashboard],
		["/student/assignments", "Vazifalar", ClipboardList],
	],
	teacher: [
		["/teacher", "Bosh sahifa", LayoutDashboard],
		["/teacher/groups", "Guruhlar", Users],
		["/teacher/assignments", "Vazifalar", ClipboardList],
		["/teacher/attendance", "Davomat", UserRoundCheck],
	],
	admin: [
		["/admin", "Bosh sahifa", LayoutDashboard],
		["/admin/groups", "Guruhlar", Users],
		["/admin/locations", "Joylar", MapPin],
		["/admin/schedules", "Jadval", CalendarDays],
		["/admin/attendance", "Davomat", UserRoundCheck],
	],
};
const items = computed(() => menus[a.user?.role || "student"] || []);
</script>
<template>
	<nav
		class="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t bg-background md:hidden"
	>
		<NuxtLink
			v-for="i in items"
			:key="i[0]"
			:to="i[0]"
			class="flex min-w-19 flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px]"
			:class="
				r.path === i[0] ? 'text-foreground' : 'text-muted-foreground'
			"
		>
			<component :is="i[2]" class="h-4 w-4" />{{ i[1] }}
		</NuxtLink>
	</nav>
</template>
