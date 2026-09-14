<script setup lang="ts">
definePageMeta({ layout: "auth" });
import { GraduationCap, UsersRound, Loader2 } from "@lucide/vue";

const auth = useAuthStore();
const { api, errorMessage } = useApi();
const runtimeConfig = useRuntimeConfig();

const loading = ref<"student" | "teacher" | "">("");
const error = ref("");

if (auth.access && auth.user) await navigateTo(`/${auth.user.role}`);

const hemisTeacherLogin = () => {
	useCookie("type").value = "teacher";
	navigateTo(
		`${runtimeConfig.public.hemisTeacherURL}?client_id=${runtimeConfig.public.hemisClientID}&redirect_uri=${runtimeConfig.public.hemisRedirectUri}&response_type=code`,
		{
			external: true,
		},
	);
};

const hemisStudentLogin = () => {
	useCookie("type").value = "student";
	navigateTo(
		`${runtimeConfig.public.hemisStudentURL}?client_id=${runtimeConfig.public.hemisClientID}&redirect_uri=${runtimeConfig.public.hemisRedirectUri}&response_type=code`,
		{
			external: true,
		},
	);
};

const form = reactive({ username: "", password: "" });
const localLoading = ref(false);
async function localLogin() {
	error.value = "";
	localLoading.value = true;
	try {
		const d = await api<any>("/auth/login/", {
			method: "POST",
			body: form,
		});
		auth.setSession(d);
		await navigateTo(`/${d.user.role}`);
	} catch (e) {
		error.value = errorMessage(e);
	} finally {
		localLoading.value = false;
	}
}
</script>

<template>
	<div
		class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center"
	>
		<div
			class="grid w-full overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-2"
		>
			<section class="hidden p-10 lg:flex lg:flex-col lg:justify-between">
				<div>
					<div
						class="inline-flex h-12 w-12 items-center justify-center rounded-2xl font-black bg-foreground text-background"
					>
						PC
					</div>
					<h1 class="mt-8 text-4xl font-bold leading-tight">
						Amaliyot davomatini aniq nazorat qiling.
					</h1>
					<p class="mt-4">
						HEMIS, geolokatsiya va yuzni tasdiqlash bilan yagona
						platforma.
					</p>
				</div>
				<div class="text-sm">Talaba • O‘qituvchi • Administrator</div>
			</section>
			<section class="p-6 sm:p-10">
				<h2 class="text-2xl font-bold">Tizimga kirish</h2>
				<p class="mt-1 text-sm">
					Talaba va o‘qituvchi HEMIS orqali kiradi.
				</p>
				<div
					v-if="error"
					class="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
				>
					{{ error }}
				</div>
				<div class="mt-7 space-y-3">
					<Button
						class="w-full gap-2"
						size="lg"
						:disabled="!!loading"
						@click="hemisStudentLogin"
					>
						<Loader2
							v-if="loading === 'student'"
							class="h-4 w-4 animate-spin"
						/><GraduationCap v-else class="h-5 w-5" />
						Talaba sifatida HEMIS orqali kirish
					</Button>
					<Button
						class="w-full gap-2"
						variant="outline"
						size="lg"
						:disabled="!!loading"
						@click="hemisTeacherLogin"
					>
						<Loader2
							v-if="loading === 'teacher'"
							class="h-4 w-4 animate-spin"
						/><UsersRound v-else class="h-5 w-5" />
						O‘qituvchi sifatida HEMIS orqali kirish
					</Button>
				</div>
				<div class="my-7 flex items-center gap-3 text-xs">
					<span class="h-px flex-1 border" />
					Admin uchun
					<span class="h-px flex-1 border" />
				</div>
				<form class="space-y-4" @submit.prevent="localLogin">
					<div class="space-y-2">
						<Label>Username</Label
						><Input
							v-model="form.username"
							autocomplete="username"
						/>
					</div>
					<div class="space-y-2">
						<Label>Parol</Label
						><Input
							v-model="form.password"
							type="password"
							autocomplete="current-password"
						/>
					</div>
					<Button
						class="w-full"
						type="submit"
						:disabled="localLoading"
					>
						<Loader2
							v-if="localLoading"
							class="mr-2 h-4 w-4 animate-spin"
						/>
						Kirish
					</Button>
				</form>
			</section>
		</div>
	</div>
</template>
