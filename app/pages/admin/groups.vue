<script setup lang="ts">
definePageMeta({ middleware: "admin" });

import { Plus, Pencil, Trash2 } from "@lucide/vue";

import type { Group, User } from "@/types/api";

const { api, errorMessage } = useApi();

const groups = ref<Group[]>([]);
const users = ref<User[]>([]);
const error = ref("");
const loading = ref(false);

/* ----------------------------------
 * CREATE
 * ---------------------------------- */

const createDialogOpen = ref(false);

const createForm = reactive({
	name: "",
	teacher: "",
});

/* ----------------------------------
 * EDIT
 * ---------------------------------- */

const editDialogOpen = ref(false);
const editingGroup = ref<Group | null>(null);

const editForm = reactive({
	teacher: "",
});

/* ----------------------------------
 * COMPUTED
 * ---------------------------------- */

const teachers = computed(() =>
	users.value.filter((user) => user.role === "teacher"),
);

/* ----------------------------------
 * LOAD
 * ---------------------------------- */

async function load() {
	loading.value = true;
	error.value = "";

	try {
		const [groupData, userData] = await Promise.all([
			api<Group[]>("/groups/"),
			api<User[]>("/auth/users/"),
		]);

		groups.value = groupData;
		users.value = userData;
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

function openCreateDialog() {
	createForm.name = "";
	createForm.teacher = "";

	createDialogOpen.value = true;
}

async function create() {
	error.value = "";

	if (!createForm.name.trim()) {
		error.value = "Guruh nomini kiriting.";
		return;
	}

	try {
		await api("/groups/", {
			method: "POST",
			body: {
				name: createForm.name.trim(),

				teacher: createForm.teacher ? Number(createForm.teacher) : null,
			},
		});

		createDialogOpen.value = false;

		createForm.name = "";
		createForm.teacher = "";

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}

/* ----------------------------------
 * EDIT
 * ---------------------------------- */

function openEditDialog(group: Group) {
	editingGroup.value = group;

	editForm.teacher = group.teacher != null ? String(group.teacher) : "";

	editDialogOpen.value = true;
}

async function saveTeacher() {
	if (!editingGroup.value) {
		return;
	}

	error.value = "";

	try {
		await api(`/groups/${editingGroup.value.id}/`, {
			method: "PATCH",

			body: {
				teacher: editForm.teacher ? Number(editForm.teacher) : null,
			},
		});

		editDialogOpen.value = false;
		editingGroup.value = null;
		editForm.teacher = "";

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}

/* ----------------------------------
 * DELETE
 * ---------------------------------- */

const deleteDialogOpen = ref(false);
const deletingGroup = ref<Group | null>(null);

function openDeleteDialog(group: Group) {
	deletingGroup.value = group;
	deleteDialogOpen.value = true;
}

async function confirmDelete() {
	if (!deletingGroup.value) return;

	try {
		await api(`/groups/${deletingGroup.value.id}/`, {
			method: "DELETE",
		});

		deleteDialogOpen.value = false;
		deletingGroup.value = null;

		await load();
	} catch (e) {
		error.value = errorMessage(e);
	}
}
</script>

<template>
	<div>
		<!-- Header -->
		<div class="mb-5 flex items-center justify-between gap-4">
			<AppPageTitle title="Guruhlar" />

			<Button @click="openCreateDialog">
				<Plus class="mr-2 h-4 w-4" />
				Guruh qo‘shish
			</Button>
		</div>

		<!-- Error -->
		<div
			v-if="error"
			class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
		>
			{{ error }}
		</div>

		<!-- Table -->
		<Card>
			<CardContent class="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead class="w-[70px]"> # </TableHead>

							<TableHead> Guruh </TableHead>

							<TableHead> O‘qituvchi </TableHead>

							<TableHead> Talabalar soni </TableHead>

							<TableHead class="w-[140px] text-right">
								Amallar
							</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						<TableRow v-if="loading">
							<TableCell
								colspan="5"
								class="py-10 text-center text-sm text-muted-foreground"
							>
								Yuklanmoqda...
							</TableCell>
						</TableRow>

						<TableRow v-else-if="!groups.length">
							<TableCell
								colspan="5"
								class="py-10 text-center text-sm text-muted-foreground"
							>
								Guruhlar mavjud emas.
							</TableCell>
						</TableRow>

						<TableRow
							v-for="(group, index) in groups"
							v-else
							:key="group.id"
						>
							<TableCell>
								{{ index + 1 }}
							</TableCell>

							<TableCell class="font-medium">
								{{ group.name }}
							</TableCell>

							<TableCell>
								<span v-if="group.teacher_name">
									{{ group.teacher_name }}
								</span>

								<span v-else class="text-muted-foreground">
									O‘qituvchi biriktirilmagan
								</span>
							</TableCell>

							<TableCell>
								{{ group.student_count ?? 0 }}
							</TableCell>

							<TableCell>
								<div class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="icon"
										@click="openEditDialog(group)"
									>
										<Pencil class="h-4 w-4" />
									</Button>

									<Button
										variant="destructive"
										size="icon"
										@click="openDeleteDialog(group)"
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
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle> Yangi guruh </DialogTitle>

					<DialogDescription>
						Guruh ma’lumotlarini kiriting.
					</DialogDescription>
				</DialogHeader>

				<div class="space-y-4 py-3">
					<div class="space-y-2">
						<Label> Guruh nomi </Label>

						<Input
							v-model="createForm.name"
							placeholder="Masalan: 101-guruh"
							@keyup.enter="create"
						/>
					</div>

					<div class="space-y-2">
						<Label> O‘qituvchi </Label>

						<select
							v-model="createForm.teacher"
							class="h-10 w-full rounded-lg border bg-background px-3 text-sm"
						>
							<option value="">Biriktirilmagan</option>

							<option
								v-for="t in teachers"
								:key="t.id"
								:value="String(t.id)"
							>
								{{ t.full_name }}
							</option>
						</select>
					</div>
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
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle> O‘qituvchini tahrirlash </DialogTitle>

					<DialogDescription>
						<span v-if="editingGroup">
							{{ editingGroup.name }}
							guruhiga o‘qituvchi biriktiring.
						</span>
					</DialogDescription>
				</DialogHeader>

				<div class="space-y-2 py-3">
					<Label> O‘qituvchi </Label>

					<select
						v-model="editForm.teacher"
						class="h-10 w-full rounded-lg border bg-background px-3 text-sm"
					>
						<option value="">Biriktirilmagan</option>

						<option
							v-for="t in teachers"
							:key="t.id"
							:value="String(t.id)"
						>
							{{ t.full_name }}
						</option>
					</select>
				</div>

				<DialogFooter>
					<Button variant="outline" @click="editDialogOpen = false">
						Bekor qilish
					</Button>

					<Button @click="saveTeacher"> Saqlash </Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- ============== DELETE DIALOG ============== -->
		<Dialog v-model:open="deleteDialogOpen">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle> Guruhni o‘chirish </DialogTitle>

					<DialogDescription>
						<span v-if="deletingGroup">
							<strong>{{ deletingGroup.name }}</strong>
							guruhini o‘chirmoqchimisiz? Bu amalni ortga qaytarib
							bo‘lmaydi.
						</span>
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
