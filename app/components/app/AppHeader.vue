<script setup lang="ts">
import { LogOut, LucideSun } from "@lucide/vue";
const a = useAuthStore();
function logout() {
	a.clear();
	navigateTo("/login");
}
</script>
<template>
	<header
		class="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4 backdrop-blur md:px-8">
		<div class="md:hidden font-bold">PC</div>
		<div class="ml-auto flex items-center gap-3">
			<Button size="icon" variant="ghost" @click="$toggleTheme">
				<LucideSun />
			</Button>
			<div class="hidden text-right sm:block">
				<div class="text-sm font-semibold">{{ a.user?.full_name }}</div>
				<div class="text-xs capitalize">
					{{ a.user?.role }}
				</div>
			</div>
			<img
				v-if="a.user?.image_url"
				:src="a.user.image_url"
				class="h-9 w-9 rounded-full border object-cover" />
			<div
				v-else
				class="flex h-9 w-9 items-center justify-center rounded-full border-4 text-sm font-bold">
				A
			</div>
			<Button class="md:hidden" variant="ghost" size="sm" @click="logout">
				<LogOut class="h-4 w-4" />
			</Button>
		</div>
	</header>
</template>
