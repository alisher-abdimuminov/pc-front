<template>
	<div>
		<AppSidebar />
		<div class="md:pl-64">
			<AppHeader />
			<main class="mx-auto max-w-7xl p-4 pb-24 md:p-8"><slot /></main>
		</div>
		<AppMobileNav />
	</div>
</template>
