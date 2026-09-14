export default defineNuxtRouteMiddleware(() => {
	const a = useAuthStore();
	if (a.user && a.user.role !== "teacher")
		return navigateTo(`/${a.user.role}`);
});
