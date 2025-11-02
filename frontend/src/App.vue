<template>
  <div id="app" class="min-h-screen bg-gray-50 flex flex-col">
    <nav class="bg-blue-700 text-white p-4 shadow-xl sticky top-0 z-10">
      <div class="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <h1 class="text-3xl font-extrabold tracking-tight mb-3 md:mb-0">
          Agile <span class="text-blue-200">Tools</span>
        </h1>
        <div class="flex flex-wrap justify-center gap-3 items-center text-sm md:text-base">
          <div v-if="user" class="px-3 py-1 bg-blue-600 rounded-full font-semibold">
            {{ user.username }}
          </div>

          <button @click="currentView = 'poker'" :class="buttonClass('poker')">
            <i class="fas fa-hand-paper mr-2"></i> Planning Poker
          </button>
          <button @click="currentView = 'wheel'" :class="buttonClass('wheel')">
            <i class="fas fa-dice mr-2"></i> Team Wheel
          </button>
        </div>
      </div>
    </nav>

    <main class="container mx-auto p-4 flex-grow">
      <transition name="fade" mode="out-in">
        <component :is="currentView === 'poker' ? PlanningPoker : TeamWheel" :user="user" :key="currentView" />
      </transition>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import PlanningPoker from './components/PlanningPoker.vue';
import TeamWheel from './components/TeamWheel.vue';
import axios from 'axios';

export default {
  name: 'App',
  components: {
    PlanningPoker,
    TeamWheel
  },
  setup() {
    const currentView = ref('poker');
    const user = ref(null);

    // Dynamic button class based on active view
    const buttonClass = (view) => [
      'px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center',
      view === currentView.value
        ? 'bg-blue-300 text-blue-900 shadow-inner' // Active state
        : 'bg-blue-500 hover:bg-blue-400 text-white' // Inactive state
    ];

    // Configure axios to send x-auth-user header
    axios.defaults.baseURL = 'http://localhost:8000';
    axios.defaults.headers.common['x-auth-user'] = 'demo-user'; // Replace with actual OAuth token username

    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/user/me');
        user.value = response.data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Fallback user for better UI experience
        user.value = { username: 'Guest User' };
      }
    };

    onMounted(() => {
      fetchUser();
    });

    return {
      currentView,
      user,
      PlanningPoker, // expose components for <component :is>
      TeamWheel, // expose components for <component :is>
      buttonClass
    };
  }
};
</script>

<style>
/* Transition for view changes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure the app is full height for sticky footer/layout */
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>