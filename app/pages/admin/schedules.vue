<script setup lang="ts">
definePageMeta({ middleware: "admin" });

import { Plus, Trash2, MapPin, Users, CalendarDays } from "@lucide/vue";

import type { Schedule, Group, Location } from "@/types/api";

const { api, errorMessage } = useApi();

const items = ref<Schedule[]>([]);
const groups = ref<Group[]>([]);
const locations = ref<Location[]>([]);

const error = ref("");
const loading = ref(false);

/* ----------------------------------
 * DAYS
 * ---------------------------------- */

const days = [
	{
		value: 0,
		label: "Dushanba",
	},
	{
		value: 1,
		label: "Seshanba",
	},
	{
		value: 2,
		label: "Chorshanba",
	},
	{
		value: 3,
		label: "Payshanba",
	},
	{
		value: 4,
		label: "Juma",
	},
	{
		value: 5,
		label: "Shanba",
	},
];

/* ----------------------------------
 * CREATE
 * ---------------------------------- */

const createDialogOpen = ref(false);

const form = reactive({
	weekday: "",
	location: "",
	shift: "1",
	groups: [] as string[],
	is_active: true,
});

function resetForm() {
	form.weekday = "";
	form.location = "";
	((form.shift = "1"), (form.groups = []));
	form.is_active = true;
}

function openCreateDialog() {
	resetForm();
	error.value = "";
	createDialogOpen.value = true;
}

/* ----------------------------------
 * GROUP BY WEEKDAY
 * ---------------------------------- */

const groupedSchedules = computed(() => {
	return days.map((day) => ({
		...day,

		schedules: items.value.filter(
			(schedule) => Number(schedule.weekday) === day.value,
		),
	}));
});

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const [scheduleData, groupData, locationData] = await Promise.all([
			api<Schedule[]>("/schedules/"),

			api<Group[]>("/groups/"),

			api<Location[]>("/locations/"),
		]);

		items.value = scheduleData;
		groups.value = groupData;

		locations.value = locationData.filter((location) => location.is_active);
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		loading.value = false;
	}
}

onMounted(load);

/* ----------------------------------
 * CREATE
 * ---------------------------------- */

async function create() {
	error.value = "";

	if (form.weekday === "") {
		error.value = "Hafta kunini tanlang.";
		return;
	}

	if (!form.location) {
		error.value = "Joylashuvni tanlang.";
		return;
	}

	if (!form.groups.length) {
		error.value = "Kamida bitta guruh tanlang.";
		return;
	}

	try {
		await api("/schedules/", {
			method: "POST",

			body: {
				weekday: Number(form.weekday),

				location: Number(form.location),

				shift: Number(form.shift),

				groups: form.groups.map((id) => Number(id)),

				is_active: form.is_active,
			},
		});

		createDialogOpen.value = false;

		resetForm();

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}

/* ----------------------------------
 * DELETE
 * ---------------------------------- */

const deleteDialogOpen = ref(false);

const deletingSchedule = ref<Schedule | null>(null);

function openDeleteDialog(schedule: Schedule) {
	deletingSchedule.value = schedule;

	deleteDialogOpen.value = true;
}

async function confirmDelete() {
	if (!deletingSchedule.value) {
		return;
	}

	try {
		await api(`/schedules/${deletingSchedule.value.id}/`, {
			method: "DELETE",
		});

		deleteDialogOpen.value = false;

		deletingSchedule.value = null;

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}

/* ----------------------------------
 * HELPERS
 * ---------------------------------- */

function scheduleGroups(schedule: Schedule) {
	return (schedule.group_details || []).map((group) => group.name).join(", ");
}
</script>

<template>
	<div>
		<!-- HEADER -->

		<div class="mb-6 flex items-start justify-between gap-4">
			<AppPageTitle
				title="Dars jadvali"
				description="Haftalik amaliyot jadvalini boshqaring."
			/>

			<Button @click="openCreateDialog">
				<Plus class="mr-2 h-4 w-4" />
				Jadval qo‘shish
			</Button>
		</div>

		<!-- ERROR -->

		<div
			v-if="error"
			class="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- LOADING -->

		<Card v-if="loading">
			<CardContent
				class="py-12 text-center text-sm text-muted-foreground"
			>
				Yuklanmoqda...
			</CardContent>
		</Card>

		<!-- 6 DAYS -->

		<div v-else class="grid gap-5">
			<section v-for="day in groupedSchedules" :key="day.value">
				<!-- DAY HEADER -->

				<div class="mb-3 flex items-center gap-2">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<CalendarDays class="h-4 w-4" />
					</div>

					<div>
						<h2 class="font-semibold">
							{{ day.label }}
						</h2>

						<p class="text-xs text-muted-foreground">
							{{ day.schedules.length }}
							ta jadval
						</p>
					</div>
				</div>

				<!-- EMPTY -->

				<Card v-if="!day.schedules.length">
					<CardContent
						class="py-7 text-center text-sm text-muted-foreground"
					>
						Bu kun uchun dars jadvali mavjud emas.
					</CardContent>
				</Card>

				<!-- DAY SCHEDULES -->

				<div v-else class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
					<Card v-for="schedule in day.schedules" :key="schedule.id">
						<CardContent class="p-5">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<!-- LOCATION / SCHOOL -->

									<div class="flex items-start gap-2">
										<MapPin
											class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
										/>

										<div>
											<p
												class="text-xs text-muted-foreground"
											>
												Maktab / Joylashuv
											</p>

											<p class="font-medium">
												{{
													schedule.location_detail
														?.name ||
													"Joylashuv belgilanmagan"
												}}
											</p>
										</div>
									</div>

									<Badge variant="outline">
										{{
											schedule.shift_name ||
											(schedule.shift === 2
												? "2-smena"
												: "1-smena")
										}}
									</Badge>

									<!-- GROUPS -->

									<div class="mt-4 flex items-start gap-2">
										<Users
											class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
										/>

										<div>
											<p
												class="text-xs text-muted-foreground"
											>
												Guruhlar
											</p>

											<p class="text-sm font-medium">
												{{
													scheduleGroups(schedule) ||
													"Guruh biriktirilmagan"
												}}
											</p>
										</div>
									</div>
								</div>

								<Button
									size="icon"
									variant="ghost"
									class="text-destructive hover:bg-destructive/10 hover:text-destructive"
									@click="openDeleteDialog(schedule)"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>

							<div class="mt-4 border-t pt-3">
								<Badge
									:variant="
										schedule.is_active
											? 'default'
											: 'outline'
									"
								>
									{{ schedule.is_active ? "Faol" : "Nofaol" }}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>

		<!-- ======================
		     CREATE DIALOG
		     ====================== -->

		<Dialog v-model:open="createDialogOpen">
			<DialogContent class="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle> Yangi dars jadvali </DialogTitle>

					<DialogDescription>
						Hafta kuni, joylashuv va guruhlarni tanlang.
					</DialogDescription>
				</DialogHeader>

				<div class="space-y-5 py-3">
					<!-- WEEKDAY -->

					<div class="space-y-2">
						<Label> Hafta kuni </Label>

						<Select v-model="form.weekday">
							<SelectTrigger class="w-full">
								<SelectValue
									placeholder="Hafta kunini tanlang"
								/>
							</SelectTrigger>

							<SelectContent>
								<SelectItem
									v-for="day in days"
									:key="day.value"
									:value="String(day.value)"
								>
									{{ day.label }}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<!-- Smena -->
					<div class="space-y-2">
						<Label> Smena </Label>

						<Select v-model="form.shift">
							<SelectTrigger class="w-full">
								<SelectValue placeholder="Smenani tanlang" />
							</SelectTrigger>

							<SelectContent>
								<SelectItem value="1">
									1-smena (08:00 — 14:00)
								</SelectItem>

								<SelectItem value="2">
									2-smena (12:00 — 18:00)
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<!-- LOCATION -->

					<div class="space-y-2">
						<Label> Maktab / Joylashuv </Label>

						<Select v-model="form.location">
							<SelectTrigger class="w-full">
								<SelectValue
									placeholder="Joylashuvni tanlang"
								/>
							</SelectTrigger>

							<SelectContent>
								<SelectItem
									v-for="location in locations"
									:key="location.id"
									:value="String(location.id)"
								>
									{{ location.name }}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<!-- GROUPS MULTIPLE -->

					<div class="space-y-2">
						<Label> Guruhlar </Label>

						<Select class="w-96" v-model="form.groups" multiple>
							<SelectTrigger class="w-72 md:w-96">
								<SelectValue placeholder="Guruhlarni tanlang" />
							</SelectTrigger>

							<SelectContent>
								<SelectItem
									v-for="group in groups"
									:key="group.id"
									:value="String(group.id)"
								>
									{{ group.name }}
								</SelectItem>
							</SelectContent>
						</Select>

						<p class="text-xs text-muted-foreground">
							Bir nechta guruh tanlash mumkin.
						</p>

						<!-- SELECTED GROUPS -->

						<div v-if="form.groups.length" class="grid gap-2 pt-1">
							<Badge
								v-for="groupId in form.groups"
								:key="groupId"
							>
								{{
									groups.find(
										(group) => String(group.id) === groupId,
									)?.name || groupId
								}}
							</Badge>
						</div>
					</div>

					<!-- ACTIVE -->

					<label
						class="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
					>
						<input
							v-model="form.is_active"
							type="checkbox"
							class="h-4 w-4"
						/>

						<div>
							<p class="text-sm font-medium">Faol</p>

							<p class="text-xs text-muted-foreground">
								Jadval darhol aktiv bo‘ladi.
							</p>
						</div>
					</label>
				</div>

				<DialogFooter>
					<Button variant="outline" @click="createDialogOpen = false">
						Bekor qilish
					</Button>

					<Button @click="create">
						<Plus class="mr-2 h-4 w-4" />
						Yaratish
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- ======================
		     DELETE DIALOG
		     ====================== -->

		<Dialog v-model:open="deleteDialogOpen">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle> Jadvalni o‘chirish </DialogTitle>

					<DialogDescription>
						Ushbu dars jadvalini o‘chirmoqchimisiz?

						<br /><br />

						Bu amalni ortga qaytarib bo‘lmaydi.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button variant="outline" @click="deleteDialogOpen = false">
						Bekor qilish
					</Button>

					<Button variant="destructive" @click="confirmDelete">
						<Trash2 class="mr-2 h-4 w-4" />
						O‘chirish
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
