<template>
  <div id="app" class="flex h-screen bg-black text-white">
    <!-- ─── SIDEBAR ─────────────────────────────────────────────────────────────── -->
    <aside
      class="w-64 bg-white bg-opacity-10 backdrop-blur-lg text-white flex flex-col p-6 space-y-8"
    >
      <!-- Logo (fixed height, auto width, pinned top-left) -->
      <img
        src="@/assets/logo-white.png"
        alt="All My Friends Logo"
        class="h-10 w-auto self-start"
      />

      <!-- Navigation Links -->
      <nav class="flex flex-col space-y-5 mt-4">
        <router-link
          to="/artists"
          class="text-lg font-semibold hover:text-gray-200 transition-colors"
        >
          Artists
        </router-link>
        <router-link
          to="/projects"
          class="text-lg font-semibold hover:text-gray-200 transition-colors"
        >
          Projects
        </router-link>
        <router-link
          to="/invoices"
          class="text-lg font-semibold hover:text-gray-200 transition-colors"
        >
          Invoices
        </router-link>
      </nav>

      <!-- Spacer pushes the bottom‐left links down -->
      <div class="mt-auto">
        <router-link
          to="/settings"
          class="text-sm hover:text-gray-300 transition-colors"
        >
          Settings
        </router-link>
      </div>
    </aside>

    <!-- ─── MAIN CONTENT ───────────────────────────────────────────────────────── -->
    <main
      class="flex-1 overflow-auto bg-gradient-to-b from-gray-900 via-black to-black relative"
    >
      <!-- Optional decorative background layering -->
      <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-30 pointer-events-none"></div>

      <!-- Actual page content -->
      <div class="relative z-10 p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style scoped>
/* ─── GLOBAL FONT & BASE STYLES ─────────────────────────────────────────────── */
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* On very large monitors, keep sidebar glassy backdrop from becoming too bright */
aside {
  /* A slightly darker tint so the blur feels “glassy” */
  background-color: rgba(255, 255, 255, 0.08);
}

/* Slight scroll‐bar styling for a “premium” look */
main::-webkit-scrollbar {
  width: 10px;
}
main::-webkit-scrollbar-track {
  background: transparent;
}
main::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
main::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
  background-clip: padding-box;
}
</style>
