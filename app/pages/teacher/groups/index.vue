<script setup lang="ts">
definePageMeta({
	middleware: "teacher",
});

import { Users, ArrowRight, Loader2, Search } from "@lucide/vue";

import type { Group } from "@/types/api";

const { api, errorMessage } = useApi();

const groups = ref<Group[]>([]);
const loading = ref(false);
const error = ref("");
const search = ref("");

const filteredGroups = computed(() => {
	const q = search.value.trim().toLowerCase();

	if (!q) {
		return groups.value;
	}

	return groups.value.filter((group) => group.name.toLowerCase().includes(q));
});

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const response = await api<any>("/groups/");

		groups.value = Array.isArray(response)
			? response
			: response?.results || [];
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);
</script>

<template>
	<div>
		<AppPageTitle
			title="Guruhlar"
			description="Sizga biriktirilgan guruhlar va talabalar."
		/>

		<!-- ERROR -->

		<div
			v-if="error"
			class="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- SEARCH -->

		<div v-if="groups.length" class="mb-5 max-w-sm">
			<div class="relative">
				<Search
					class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>

				<Input
					v-model="search"
					class="pl-9"
					placeholder="Guruhni qidirish..."
				/>
			</div>
		</div>

		<!-- LOADING -->

		<div
			v-if="loading"
			class="flex min-h-[250px] items-center justify-center"
		>
			<div class="text-center">
				<Loader2
					class="mx-auto h-6 w-6 animate-spin text-muted-foreground"
				/>

				<p class="mt-2 text-sm text-muted-foreground">
					Guruhlar yuklanmoqda...
				</p>
			</div>
		</div>

		<!-- EMPTY -->

		<AppEmptyState
			v-else-if="!groups.length"
			title="Guruh biriktirilmagan"
			description="Sizga hozircha hech qanday guruh biriktirilmagan."
		/>

		<!-- SEARCH EMPTY -->

		<AppEmptyState
			v-else-if="!filteredGroups.length"
			title="Guruh topilmadi"
			description="Qidiruv bo‘yicha guruh topilmadi."
		/>

		<!-- GROUPS -->

		<div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<NuxtLink
				v-for="group in filteredGroups"
				:key="group.id"
				:to="`/teacher/groups/${group.id}`"
				class="group"
			>
				<Card
					class="h-full transition-all hover:border-primary/40 hover:shadow-md"
				>
					<CardContent class="p-5">
						<div class="flex items-start justify-between gap-4">
							<div class="flex min-w-0 items-start gap-3">
								<div
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
								>
									<Users class="h-5 w-5" />
								</div>

								<div class="min-w-0">
									<h2 class="truncate font-semibold">
										{{ group.name }}
									</h2>

									<p
										class="mt-1 text-sm text-muted-foreground"
									>
										{{ group.student_count ?? 0 }}
										ta talaba
									</p>
								</div>
							</div>

							<ArrowRight
								class="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
							/>
						</div>

						<div
							class="mt-5 flex items-center justify-between border-t pt-4"
						>
							<span class="text-xs text-muted-foreground">
								Guruhni ko‘rish
							</span>

							<Badge variant="outline">
								{{ group.student_count ?? 0 }}
								talaba
							</Badge>
						</div>
					</CardContent>
				</Card>
			</NuxtLink>
		</div>
	</div>
</template>
