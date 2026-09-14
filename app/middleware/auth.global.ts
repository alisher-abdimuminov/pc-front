export default defineNuxtRouteMiddleware(async (to) => {
	if (to.path === "/login" || to.path.startsWith("/auth/")) return;
	const auth = useAuthStore();
	if (!auth.access) return navigateTo("/login");
	if (!auth.user) {
		const u = await auth.fetchMe();
		if (!u) {
			auth.clear();
			return navigateTo("/login");
		}
	}
	if (to.path === "/") return navigateTo(`/${auth.user!.role}`);
});
