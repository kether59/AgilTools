<template>
  <div id="app" class="min-h-screen bg-gray-100">
    <nav class="bg-blue-600 text-white p-4 shadow-lg">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold">Agile Tools</h1>
        <div class="flex gap-4 items-center">
          <span v-if="user">{{ user.username }}</span>
          <button @click="currentView = 'poker'" class="px-4 py-2 bg-blue-500 rounded hover:bg-blue-400">
            Planning Poker
          </button>
          <button @click="currentView = 'wheel'" class="px-4 py-2 bg-blue-500 rounded hover:bg-blue-400">
            Team Wheel
          </button>
        </div>
      </div>
    </nav>

    <div class="container mx-auto p-4">
      <PlanningPoker v-if="currentView === 'poker'" :user="user" />
      <TeamWheel v-else-if="currentView === 'wheel'" :user="user" />
    </div>
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

    // Configure axios to send x-auth-user header
    axios.defaults.baseURL = 'http://localhost:8000';
    axios.defaults.headers.common['x-auth-user'] = 'demo-user'; // Replace with actual OAuth token username

    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/user/me');
        user.value = response.data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    onMounted(() => {
      fetchUser();
    });

    return {
      currentView,
      user
    };
  }
};
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>