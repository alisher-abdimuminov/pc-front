import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	devtools: { enabled: true },
	telemetry: false,
	modules: ["@pinia/nuxt", "shadcn-nuxt"],
	css: ["~/assets/css/tailwind.css"],
	vite: { plugins: [tailwindcss()] },
	shadcn: { prefix: "", componentDir: "@/components/ui" },
	runtimeConfig: {
		public: {
			apiBase: "https://api.practicum.samdpi.uz/api",
			hemisTeacherURL: "https://hemis.uzfi.uz/oauth/authorize",
			hemisStudentURL: "https://student.uzfi.uz/oauth/authorize",
			hemisClientID: "9",
			hemisRedirectUri: "https://practicum.samdpi.uz/auth/callback/",
		},
	},
	app: {
		head: {
			title: "PC — Amaliyot nazorati",
			meta: [
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
			],
		},
	},
	compatibilityDate: "2026-09-01",

	nitro: {
		preset: "bun",
	},
});
