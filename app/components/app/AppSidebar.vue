<script setup lang="ts">
import {
	LayoutDashboard,
	Users,
	ClipboardList,
	MapPin,
	CalendarDays,
	LogOut,
	UserRoundCheck,
	FileCheck2,
	ShieldAlert,
} from "@lucide/vue";
const auth = useAuthStore();
const route = useRoute();
const menus: any = {
	student: [
		{ to: "/student", label: "Bosh sahifa", icon: LayoutDashboard },
		{
			to: "/student/assignments",
			label: "Topshiriqlar",
			icon: ClipboardList,
		},
	],
	teacher: [
		{ to: "/teacher", label: "Bosh sahifa", icon: LayoutDashboard },
		{ to: "/teacher/groups", label: "Guruhlar", icon: Users },
		{
			to: "/teacher/assignments",
			label: "Topshiriqlar",
			icon: ClipboardList,
		},
		{ to: "/teacher/attendance", label: "Davomat", icon: UserRoundCheck },
	],
	admin: [
		{ to: "/admin", label: "Bosh sahifa", icon: LayoutDashboard },
		{ to: "/admin/groups", label: "Guruhlar", icon: Users },
		{ to: "/admin/locations", label: "Joylashuvlar", icon: MapPin },
		{ to: "/admin/schedules", label: "Dars jadvali", icon: CalendarDays },
		{ to: "/admin/users", label: "Foydalanuvchilar", icon: FileCheck2 },
		{ to: "/admin/attendance", label: "Davomat", icon: UserRoundCheck },
		{ to: "/admin/attempts", label: "Xato urinishlar", icon: ShieldAlert },
	],
};
const items = computed(() => menus[auth.user?.role || "student"] || []);
function logout() {
	auth.clear();
	navigateTo("/login");
}
</script>
<template>
	<aside
		class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r md:flex md:flex-col"
	>
		<div class="flex h-16 items-center border-b px-5">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground font-bold text-background"
			>
				PC
			</div>
			<div class="ml-3">
				<div class="font-bold">Amaliyot nazorati</div>
				<div class="text-xs">Monitoring platformasi</div>
			</div>
		</div>
		<nav class="flex-1 space-y-1 p-3">
			<NuxtLink
				v-for="i in items"
				:key="i.to"
				:to="i.to"
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
				:class="
					route.path === i.to || route.name === 'index'
						? 'bg-accent'
						: 'hover:bg-accent'
				"
				><component :is="i.icon" class="h-4 w-4" />{{
					i.label
				}}</NuxtLink
			>
		</nav>
		<div class="border-t p-3">
			<button
				class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-accent"
				@click="logout"
			>
				<LogOut class="h-4 w-4" />Chiqish
			</button>
		</div>
	</aside>
</template>
