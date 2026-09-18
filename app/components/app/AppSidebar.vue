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
	UserGroup,
	ListCheck,
} from "@lucide/vue";
const auth = useAuthStore();
const route = useRoute();
const menus: any = {
	student: [
		{
			to: "/student",
			label: "Bosh sahifa",
			icon: LayoutDashboard,
			klass: "bg-indigo-600",
		},
		{
			to: "/student/assignments",
			label: "Topshiriqlar",
			icon: ClipboardList,
			klass: "bg-emerald-600",
		},
	],
	teacher: [
		{
			to: "/teacher",
			label: "Bosh sahifa",
			icon: LayoutDashboard,
			klass: "bg-indigo-600",
		},
		{
			to: "/teacher/groups",
			label: "Guruhlar",
			icon: Users,
			klass: "bg-amber-600",
		},
		{
			to: "/teacher/assignments",
			label: "Topshiriqlar",
			icon: ClipboardList,
			klass: "bg-emerald-600",
		},
		{
			to: "/teacher/attendance",
			label: "Davomat",
			icon: UserRoundCheck,
			klass: "bg-rose-600",
		},
	],
	admin: [
		{
			to: "/admin",
			label: "Bosh sahifa",
			icon: LayoutDashboard,
			klass: "bg-indigo-600",
		},
		{
			to: "/admin/groups",
			label: "Guruhlar",
			icon: UserGroup,
			klass: "bg-amber-600",
		},
		{
			to: "/admin/locations",
			label: "Joylashuvlar",
			icon: MapPin,
			klass: "bg-emerald-600",
		},
		{
			to: "/admin/schedules",
			label: "Dars jadvali",
			icon: CalendarDays,
			klass: "bg-sky-600",
		},
		{
			to: "/admin/users",
			label: "Foydalanuvchilar",
			icon: Users,
			klass: "bg-amber-600",
		},
		{
			to: "/admin/attendance",
			label: "Davomat",
			icon: UserRoundCheck,
			klass: "bg-lime-600",
		},
		{
			to: "/admin/attempts",
			label: "Urinishlar",
			icon: ListCheck,
			klass: "bg-fuchsia-600",
		},
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
			<img src="/images/logo.png" class="size-10" alt="" />
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
			>
				<div class="p-2 rounded-lg text-white" :class="i.klass">
					<component :is="i.icon" class="h-4 w-4" />
				</div>
				{{ i.label }}
			</NuxtLink>
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
