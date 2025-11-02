<template>
  <div class="planning-poker">
    <div v-if="!currentSession" class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-4">Planning Poker</h2>

      <div class="mb-4">
        <button @click="showCreateForm = !showCreateForm" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create New Session
        </button>
      </div>

      <div v-if="showCreateForm" class="mb-4 p-4 bg-gray-50 rounded">
        <input v-model="newSession.title" placeholder="Session Title" class="w-full p-2 border rounded mb-2">
        <textarea v-model="newSession.description" placeholder="Description (optional)" class="w-full p-2 border rounded mb-2"></textarea>
        <button @click="createSession" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Create
        </button>
      </div>

      <div class="mb-4">
        <input v-model="joinCode" placeholder="Enter Session Code" class="w-full p-2 border rounded mb-2">
        <button @click="joinSession" class="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Join Session
        </button>
      </div>
    </div>

    <div v-else class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold">{{ sessionData.title }}</h2>
          <p class="text-gray-600">{{ sessionData.description }}</p>
          <p class="text-sm text-gray-500">Code: <span class="font-mono font-bold">{{ currentSession }}</span></p>
        </div>
        <button @click="leaveSession" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Leave
        </button>
      </div>

      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-3">Select Your Estimate</h3>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="value in cardValues"
            :key="value"
            @click="castVote(value)"
            :class="[
              'p-4 rounded-lg font-bold text-xl transition-all',
              selectedVote === value
                ? 'bg-blue-600 text-white scale-110'
                : 'bg-gray-200 hover:bg-gray-300'
            ]"
          >
            {{ value }}
          </button>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-3">Votes ({{ sessionData.votes?.length || 0 }})</h3>
        <div class="grid grid-cols-4 gap-3">
          <div
            v-for="(vote, index) in sessionData.votes"
            :key="index"
            class="bg-gray-100 p-3 rounded text-center"
          >
            <div class="font-semibold">{{ vote.user }}</div>
            <div class="text-2xl font-bold text-blue-600">{{ vote.value }}</div>
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button @click="revealVotes" class="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Reveal Votes
        </button>
        <button @click="resetVotes" class="flex-1 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
          Reset Round
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

export default {
  name: 'PlanningPoker',
  props: ['user'],
  setup() {
    const currentSession = ref(null);
    const sessionData = ref({});
    const showCreateForm = ref(false);
    const newSession = ref({ title: '', description: '' });
    const joinCode = ref('');
    const selectedVote = ref(null);
    const cardValues = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'];
    let pollInterval = null;

    const createSession = async () => {
      try {
        const response = await axios.post('/api/poker/sessions', newSession.value);
        currentSession.value = response.data.session_code;
        await loadSession();
        showCreateForm.value = false;
        newSession.value = { title: '', description: '' };
      } catch (error) {
        console.error('Failed to create session:', error);
        alert('Failed to create session');
      }
    };

    const joinSession = async () => {
      if (!joinCode.value) return;
      currentSession.value = joinCode.value;
      await loadSession();
    };

    const loadSession = async () => {
      try {
        const response = await axios.get(`/api/poker/sessions/${currentSession.value}`);
        sessionData.value = response.data;
      } catch (error) {
        console.error('Failed to load session:', error);
        alert('Session not found');
        currentSession.value = null;
      }
    };

    const castVote = async (value) => {
      selectedVote.value = value;
      try {
        await axios.post(`/api/poker/sessions/${currentSession.value}/vote`, {
          vote_value: value
        });
        await loadSession();
      } catch (error) {
        console.error('Failed to cast vote:', error);
      }
    };

    const revealVotes = async () => {
      try {
        await axios.post(`/api/poker/sessions/${currentSession.value}/reveal`);
        await loadSession();
      } catch (error) {
        console.error('Failed to reveal votes:', error);
      }
    };

    const resetVotes = async () => {
      try {
        await axios.post(`/api/poker/sessions/${currentSession.value}/reset`);
        selectedVote.value = null;
        await loadSession();
      } catch (error) {
        console.error('Failed to reset votes:', error);
      }
    };

    const leaveSession = () => {
      currentSession.value = null;
      sessionData.value = {};
      selectedVote.value = null;
    };

    const startPolling = () => {
      pollInterval = setInterval(() => {
        if (currentSession.value) {
          loadSession();
        }
      }, 2000);
    };

    onMounted(() => {
      startPolling();
    });

    onUnmounted(() => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    });

    return {
      currentSession,
      sessionData,
      showCreateForm,
      newSession,
      joinCode,
      selectedVote,
      cardValues,
      createSession,
      joinSession,
      castVote,
      revealVotes,
      resetVotes,
      leaveSession
    };
  }
};
</script>