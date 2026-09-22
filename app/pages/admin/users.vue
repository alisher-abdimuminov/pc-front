<script setup lang="ts">
definePageMeta({ middleware: "admin" });

import { Search, UserRound, Loader2 } from "@lucide/vue";

import type { User } from "@/types/api";

const { api, errorMessage } = useApi();

const users = ref<User[]>([]);
const error = ref("");
const search = ref("");
const loading = ref(false);

/* ----------------------------------
 * PAGINATION
 * ---------------------------------- */

const currentPage = ref(1);
const total = ref(0);

/*
 * Backend REST_FRAMEWORK PAGE_SIZE
 * bilan bir xil bo‘lishi kerak.
 */
const pageSize = 20;

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const params = new URLSearchParams();

		params.set("page", String(currentPage.value));

		if (search.value.trim()) {
			params.set("search", search.value.trim());
		}

		const response = await api<any>(`/auth/users/?${params.toString()}`);

		users.value = response?.results || [];

		total.value = response?.count || 0;
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

/* ----------------------------------
 * SEARCH
 * ---------------------------------- */

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
	if (searchTimer) {
		clearTimeout(searchTimer);
	}

	searchTimer = setTimeout(async () => {
		currentPage.value = 1;

		await load();
	}, 400);
});

/* ----------------------------------
 * PAGE
 * ---------------------------------- */

async function handlePageChange(page: number) {
	if (page === currentPage.value) {
		return;
	}

	currentPage.value = page;

	await load();
}

/* ----------------------------------
 * ROLE
 * ---------------------------------- */

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

		<!-- =========================
		     SEARCH
		     ========================= -->

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

		<!-- =========================
		     ERROR
		     ========================= -->

		<div
			v-if="error"
			class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- =========================
		     TABLE
		     ========================= -->

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
									class="py-12 text-center"
								>
									<div
										class="flex items-center justify-center gap-2 text-sm text-muted-foreground"
									>
										<Loader2 class="h-4 w-4 animate-spin" />

										Yuklanmoqda...
									</div>
								</TableCell>
							</TableRow>

							<!-- EMPTY -->

							<TableRow v-else-if="!users.length">
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
								v-for="user in users"
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
											class="text-sm font-medium"
											:class="
												user.is_active
													? 'text-emerald-700'
													: 'text-red-600'
											"
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

				<!-- =========================
				     PAGINATION
				     ========================= -->

				<div
					v-if="!loading && total > pageSize"
					class="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<p class="text-sm text-muted-foreground">
						Jami
						{{ total }}
						ta foydalanuvchi
					</p>

					<Pagination
						:page="currentPage"
						:total="total"
						:items-per-page="pageSize"
						:sibling-count="1"
						show-edges
						@update:page="handlePageChange"
					>
						<PaginationContent v-slot="{ items }">
							<PaginationPrevious />

							<template
								v-for="(item, index) in items"
								:key="index"
							>
								<PaginationItem
									v-if="item.type === 'page'"
									:value="item.value"
									:is-active="item.value === currentPage"
								>
									{{ item.value }}
								</PaginationItem>

								<PaginationEllipsis v-else :index="index" />
							</template>

							<PaginationNext />
						</PaginationContent>
					</Pagination>
				</div>
			</CardContent>
		</Card>
	</div>
</template>
