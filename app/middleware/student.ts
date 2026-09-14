export default defineNuxtRouteMiddleware(() => {
	const a = useAuthStore();
	if (a.user && a.user.role !== "student")
		return navigateTo(`/${a.user.role}`);
});
