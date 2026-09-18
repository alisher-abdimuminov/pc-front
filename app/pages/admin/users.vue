<script setup lang="ts">
definePageMeta({ middleware: "admin" });

import { Search, UserRound } from "@lucide/vue";

import type { User } from "@/types/api";

const { api, errorMessage } = useApi();

const users = ref<User[]>([]);
const error = ref("");
const search = ref("");
const loading = ref(false);

const filtered = computed(() => {
	const q = search.value.trim().toLowerCase();

	if (!q) {
		return users.value;
	}

	return users.value.filter((user) => {
		const text = [user.full_name, user.username, user.role, user.group_name]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		return text.includes(q);
	});
});

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const response = await api<any>("/auth/users/");

		users.value = Array.isArray(response)
			? response
			: response?.results || [];
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

function roleLabel(role: string) {
	if (role === "student") {
		return "Talaba";
	}

	if (role === "teacher") {
		return "O‘qituvchi";
	}

	if (role === "admin") {
		return "Admin";
	}

	return role;
}
</script>

<template>
	<div>
		<AppPageTitle
			title="Foydalanuvchilar"
			description="Tizimdagi talabalar, o‘qituvchilar va administratorlar."
		/>

		<!-- SEARCH -->

		<div class="mb-5 max-w-md">
			<div class="relative">
				<Search
					class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>

				<Input
					v-model="search"
					class="pl-9"
					placeholder="Ism yoki HEMIS ID bo‘yicha qidirish"
				/>
			</div>
		</div>

		<!-- ERROR -->

		<div
			v-if="error"
			class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- TABLE -->

		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead> Foydalanuvchi </TableHead>

								<TableHead> Role </TableHead>

								<TableHead> Guruh </TableHead>

								<TableHead> Status </TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<!-- LOADING -->

							<TableRow v-if="loading">
								<TableCell
									colspan="4"
									class="py-12 text-center text-sm text-muted-foreground"
								>
									Yuklanmoqda...
								</TableCell>
							</TableRow>

							<!-- EMPTY -->

							<TableRow v-else-if="!filtered.length">
								<TableCell
									colspan="4"
									class="py-12 text-center"
								>
									<div
										class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted"
									>
										<UserRound
											class="h-5 w-5 text-muted-foreground"
										/>
									</div>

									<p class="mt-3 text-sm font-medium">
										Foydalanuvchilar topilmadi
									</p>
								</TableCell>
							</TableRow>

							<!-- USERS -->

							<TableRow
								v-for="user in filtered"
								v-else
								:key="user.id"
							>
								<!-- USER -->

								<TableCell>
									<div class="font-medium">
										{{ user.full_name || user.username }}
									</div>

									<div
										class="mt-1 text-xs text-muted-foreground"
									>
										{{ user.username }}
									</div>
								</TableCell>

								<!-- ROLE -->

								<TableCell>
									<Badge variant="outline">
										{{ roleLabel(user.role) }}
									</Badge>
								</TableCell>

								<!-- GROUP -->

								<TableCell>
									<span v-if="user.group_name">
										{{ user.group_name }}
									</span>

									<span v-else class="text-muted-foreground">
										—
									</span>
								</TableCell>

								<!-- STATUS -->

								<TableCell>
									<div class="flex items-center gap-2">
										<span
											class="h-2 w-2 rounded-full"
											:class="
												user.is_active
													? 'bg-emerald-500'
													: 'bg-red-500'
											"
										/>

										<span
											:class="
												user.is_active
													? 'text-emerald-700'
													: 'text-red-600'
											"
											class="text-sm font-medium"
										>
											{{
												user.is_active
													? "Faol"
													: "Nofaol"
											}}
										</span>
									</div>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	</div>
</template>
