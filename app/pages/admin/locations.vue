<script setup lang="ts">
definePageMeta({ middleware: "admin" });

import { Plus, Pencil, Trash2 } from "@lucide/vue";

import type { Location } from "@/types/api";

const { api, errorMessage } = useApi();

const items = ref<Location[]>([]);
const error = ref("");
const loading = ref(false);

/* ----------------------------------
 * HELPERS
 * ---------------------------------- */

const blankForm = () => ({
	name: "",
	point_1: "",
	point_2: "",
	point_3: "",
	point_4: "",
	is_active: true,
});

/* ----------------------------------
 * CREATE
 * ---------------------------------- */

const createDialogOpen = ref(false);

const createForm = reactive(blankForm());

function openCreateDialog() {
	Object.assign(createForm, blankForm());

	error.value = "";
	createDialogOpen.value = true;
}

async function create() {
	error.value = "";

	if (!createForm.name.trim()) {
		error.value = "Joylashuv nomini kiriting.";
		return;
	}

	if (
		!createForm.point_1 ||
		!createForm.point_2 ||
		!createForm.point_3 ||
		!createForm.point_4
	) {
		error.value = "Barcha 4 ta koordinatani kiriting.";
		return;
	}

	try {
		await api("/locations/", {
			method: "POST",
			body: {
				name: createForm.name.trim(),
				point_1: createForm.point_1.trim(),
				point_2: createForm.point_2.trim(),
				point_3: createForm.point_3.trim(),
				point_4: createForm.point_4.trim(),
				is_active: createForm.is_active,
			},
		});

		createDialogOpen.value = false;

		Object.assign(createForm, blankForm());

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}

/* ----------------------------------
 * EDIT
 * ---------------------------------- */

const editDialogOpen = ref(false);
const editingLocation = ref<Location | null>(null);

const editForm = reactive(blankForm());

function openEditDialog(location: Location) {
	editingLocation.value = location;

	editForm.name = location.name || "";

	editForm.point_1 = location.point_1 || "";

	editForm.point_2 = location.point_2 || "";

	editForm.point_3 = location.point_3 || "";

	editForm.point_4 = location.point_4 || "";

	editForm.is_active = location.is_active ?? true;

	error.value = "";
	editDialogOpen.value = true;
}

async function save() {
	if (!editingLocation.value) {
		return;
	}

	error.value = "";

	if (!editForm.name.trim()) {
		error.value = "Joylashuv nomini kiriting.";
		return;
	}

	if (
		!editForm.point_1 ||
		!editForm.point_2 ||
		!editForm.point_3 ||
		!editForm.point_4
	) {
		error.value = "Barcha koordinatalarni kiriting.";
		return;
	}

	try {
		await api(`/locations/${editingLocation.value.id}/`, {
			method: "PATCH",

			body: {
				name: editForm.name.trim(),

				point_1: editForm.point_1.trim(),

				point_2: editForm.point_2.trim(),

				point_3: editForm.point_3.trim(),

				point_4: editForm.point_4.trim(),

				is_active: editForm.is_active,
			},
		});

		editDialogOpen.value = false;
		editingLocation.value = null;

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}

/* ----------------------------------
 * DELETE
 * ---------------------------------- */

const deleteDialogOpen = ref(false);

const deletingLocation = ref<Location | null>(null);

function openDeleteDialog(location: Location) {
	deletingLocation.value = location;
	deleteDialogOpen.value = true;
}

async function confirmDelete() {
	if (!deletingLocation.value) {
		return;
	}

	error.value = "";

	try {
		await api(`/locations/${deletingLocation.value.id}/`, {
			method: "DELETE",
		});

		deleteDialogOpen.value = false;
		deletingLocation.value = null;

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		items.value = await api<Location>("/locations/");
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
		<!-- =========================
		     HEADER
		     ========================= -->

		<div class="mb-5 flex items-start justify-between gap-4">
			<AppPageTitle
				title="Joylashuvlar"
				description="Geofence uchun to‘rt nuqtali polygon hududlarini boshqaring."
			/>

			<Button @click="openCreateDialog">
				<Plus class="mr-2 h-4 w-4" />
				Joylashuv qo‘shish
			</Button>
		</div>

		<!-- ERROR -->

		<div
			v-if="error"
			class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- =========================
		     TABLE
		     ========================= -->

		<Card>
			<CardContent class="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead class="w-[60px]"> # </TableHead>

							<TableHead> Nomi </TableHead>

							<TableHead> Nuqta 1 </TableHead>

							<TableHead> Nuqta 2 </TableHead>

							<TableHead> Nuqta 3 </TableHead>

							<TableHead> Nuqta 4 </TableHead>

							<TableHead> Holat </TableHead>

							<TableHead class="w-[140px] text-right">
								Amallar
							</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						<!-- LOADING -->

						<TableRow v-if="loading">
							<TableCell
								colspan="8"
								class="py-10 text-center text-sm text-muted-foreground"
							>
								Yuklanmoqda...
							</TableCell>
						</TableRow>

						<!-- EMPTY -->

						<TableRow v-else-if="!items.length">
							<TableCell
								colspan="8"
								class="py-10 text-center text-sm text-muted-foreground"
							>
								Joylashuvlar mavjud emas.
							</TableCell>
						</TableRow>

						<!-- DATA -->

						<TableRow
							v-for="(location, index) in items"
							v-else
							:key="location.id"
						>
							<TableCell>
								{{ index + 1 }}
							</TableCell>

							<TableCell class="font-medium">
								{{ location.name }}
							</TableCell>

							<TableCell class="whitespace-nowrap text-xs">
								{{ location.point_1 }}
							</TableCell>

							<TableCell class="whitespace-nowrap text-xs">
								{{ location.point_2 }}
							</TableCell>

							<TableCell class="whitespace-nowrap text-xs">
								{{ location.point_3 }}
							</TableCell>

							<TableCell class="whitespace-nowrap text-xs">
								{{ location.point_4 }}
							</TableCell>

							<TableCell>
								<Badge
									:variant="
										location.is_active
											? 'default'
											: 'outline'
									"
								>
									{{ location.is_active ? "Faol" : "Nofaol" }}
								</Badge>
							</TableCell>

							<TableCell>
								<div class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="icon"
										@click="openEditDialog(location)"
									>
										<Pencil class="h-4 w-4" />
									</Button>

									<Button
										variant="destructive"
										size="icon"
										@click="openDeleteDialog(location)"
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>

		<!-- =========================
		     CREATE DIALOG
		     ========================= -->

		<Dialog v-model:open="createDialogOpen">
			<DialogContent class="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle> Yangi joylashuv </DialogTitle>

					<DialogDescription>
						Hudud nomi va polygonning to‘rtta koordinatasini
						kiriting.
					</DialogDescription>
				</DialogHeader>

				<div class="space-y-5 py-3">
					<!-- NAME -->

					<div class="space-y-2">
						<Label> Joylashuv nomi </Label>

						<Input
							v-model="createForm.name"
							placeholder="Masalan: SamDPI bosh bino"
						/>
					</div>

					<!-- POINTS -->

					<div class="grid gap-4 sm:grid-cols-2">
						<div v-for="n in 4" :key="n" class="space-y-2">
							<Label> Nuqta {{ n }} </Label>

							<Input
								v-model="(createForm as any)[`point_${n}`]"
								placeholder="39.654321,66.987654"
							/>
						</div>
					</div>

					<p class="text-xs text-muted-foreground">
						Format: latitude,longitude. Masalan: 39.654321,66.987654
					</p>

					<!-- ACTIVE -->

					<label
						class="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
					>
						<input
							v-model="createForm.is_active"
							type="checkbox"
							class="h-4 w-4"
						/>

						<div>
							<div class="text-sm font-medium">Faol</div>

							<div class="text-xs text-muted-foreground">
								Ushbu joylashuvdan dars jadvalida foydalanish
								mumkin.
							</div>
						</div>
					</label>
				</div>

				<DialogFooter>
					<Button variant="outline" @click="createDialogOpen = false">
						Bekor qilish
					</Button>

					<Button @click="create">
						<Plus class="mr-2 h-4 w-4" />
						Qo‘shish
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- =========================
		     EDIT DIALOG
		     ========================= -->

		<Dialog v-model:open="editDialogOpen">
			<DialogContent class="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle> Joylashuvni tahrirlash </DialogTitle>

					<DialogDescription>
						Joylashuv va geofence koordinatalarini o‘zgartiring.
					</DialogDescription>
				</DialogHeader>

				<div class="space-y-5 py-3">
					<!-- NAME -->

					<div class="space-y-2">
						<Label> Joylashuv nomi </Label>

						<Input v-model="editForm.name" />
					</div>

					<!-- POINTS -->

					<div class="grid gap-4 sm:grid-cols-2">
						<div v-for="n in 4" :key="n" class="space-y-2">
							<Label> Nuqta {{ n }} </Label>

							<Input
								v-model="(editForm as any)[`point_${n}`]"
								placeholder="39.654321,66.987654"
							/>
						</div>
					</div>

					<p class="text-xs text-muted-foreground">
						Format: latitude,longitude
					</p>

					<!-- ACTIVE -->

					<label
						class="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
					>
						<input
							v-model="editForm.is_active"
							type="checkbox"
							class="h-4 w-4"
						/>

						<div>
							<div class="text-sm font-medium">Faol</div>

							<div class="text-xs text-muted-foreground">
								Joylashuvni aktiv yoki noaktiv qilish.
							</div>
						</div>
					</label>
				</div>

				<DialogFooter>
					<Button variant="outline" @click="editDialogOpen = false">
						Bekor qilish
					</Button>

					<Button @click="save"> Saqlash </Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- =========================
		     DELETE DIALOG
		     ========================= -->

		<Dialog v-model:open="deleteDialogOpen">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle> Joylashuvni o‘chirish </DialogTitle>

					<DialogDescription>
						<template v-if="deletingLocation">
							<strong>
								{{ deletingLocation.name }}
							</strong>
							joylashuvini o‘chirmoqchimisiz?

							<br /><br />

							Bu amalni ortga qaytarib bo‘lmaydi.
						</template>
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
