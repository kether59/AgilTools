<template>
  <div class="planning-poker flex flex-col items-center justify-center py-10 md:py-20">

    <div v-if="!currentSession" class="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full transform transition duration-500 hover:shadow-3xl">
      <h2 class="text-3xl font-bold mb-8 text-blue-700 text-center border-b pb-4">Start or Join a Planning Session</h2>

      <div class="mb-6 space-y-4">
        <label for="join-code" class="block text-gray-700 font-medium text-lg">Session Code</label>
        <input
          id="join-code"
          v-model="joinCode"
          placeholder="Enter 5-digit Session Code (e.g., A4B7C)"
          class="w-full p-3 border-b-2 border-gray-300 rounded-t-lg bg-gray-50 focus:border-blue-700 focus:ring-0 transition duration-200 text-lg"
        >
        <button
          @click="joinSession"
          :disabled="!joinCode"
          class="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-4"
        >
          <i class="fas fa-sign-in-alt mr-2"></i> Join Existing Session
        </button>
      </div>

      <div class="relative flex py-5 items-center">
        <div class="flex-grow border-t border-gray-300"></div>
        <span class="flex-shrink mx-4 text-gray-500 font-medium">OR</span>
        <div class="flex-grow border-t border-gray-300"></div>
      </div>

      <button @click="showCreateForm = !showCreateForm" class="w-full bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-lg hover:bg-blue-800 transition duration-200 shadow-md mb-4">
          <i class="fas fa-plus-circle mr-2"></i> {{ showCreateForm ? 'Hide Creation Form' : 'Create New Session' }}
      </button>

      <transition name="slide-fade">
        <div v-if="showCreateForm" class="p-6 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
          <h3 class="text-xl font-semibold text-blue-700">New Session Details</h3>

          <input
            v-model="newSession.title"
            placeholder="Session Title (e.g., Sprint Planning)"
            class="w-full p-3 border-b-2 border-blue-300 rounded-t-lg bg-white focus:border-blue-700 focus:ring-0 text-lg"
          >
          <textarea
            v-model="newSession.description"
            placeholder="Description (optional)"
            class="w-full p-3 border-b-2 border-blue-300 rounded-t-lg bg-white focus:border-blue-700 focus:ring-0 text-lg"
          ></textarea>
          <button
            @click="createSession"
            :disabled="!newSession.title"
            class="w-full bg-teal-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-teal-700 transition duration-200 disabled:opacity-50 shadow-md mt-4"
          >
            Create & Start
          </button>
        </div>
      </transition>
    </div>

    <div v-else class="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b-2 border-blue-100">
        <div>
          <h2 class="text-3xl font-bold text-blue-700">{{ sessionData.title }}</h2>
          <p class="text-gray-600 italic mt-1">{{ sessionData.description || 'No description provided.' }}</p>
          <p class="text-md font-mono mt-2 bg-blue-100 text-blue-800 inline-block px-3 py-1 rounded-full shadow-inner">
            Code: **{{ currentSession }}**
          </p>
        </div>
        <button @click="leaveSession" class="mt-4 md:mt-0 bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow-md">
          <i class="fas fa-door-open mr-2"></i> Leave Session
        </button>
      </div>

      <div class="mb-10">
        <h3 class="text-2xl font-semibold mb-4 text-gray-800">Select Your Estimate</h3>
        <div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
          <button
            v-for="card in cardValues"
            :key="card.value"
            @click="castVote(card.value)"
            :class="[
              'aspect-square flex flex-col items-center justify-center rounded-xl font-extrabold text-2xl sm:text-3xl transition-all duration-200 transform group',
              selectedVote === card.value
                ? 'bg-blue-700 text-white ring-4 ring-blue-300 scale-105 shadow-2xl'
                : 'bg-gray-100 text-gray-800 hover:bg-blue-100 hover:text-blue-700 shadow-md hover:shadow-lg'
            ]"
            :title="`Vote: ${card.value}`"
          >
            <i :class="['text-4xl sm:text-5xl mb-1', card.icon]"></i>
            <span class="text-sm sm:text-base font-bold group-hover:underline">{{ card.value }}</span>
          </button>
        </div>
      </div>

      <div class="mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h3 class="text-2xl font-semibold mb-4 text-gray-800">
          Participants ({{ sessionData.votes?.length || 0 }})
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div
            v-for="(vote, index) in sessionData.votes"
            :key="index"
            class="p-4 rounded-lg text-center shadow-lg transition-all"
            :class="{
              'bg-blue-100 border-2 border-blue-400': vote.is_revealed,
              'bg-white border border-gray-300': !vote.is_revealed
            }"
          >
            <div class="font-bold text-lg text-gray-700 truncate">{{ vote.user }}</div>
            <div class="mt-1 text-4xl font-extrabold" :class="vote.is_revealed ? 'text-blue-700' : 'text-gray-400'">
              {{ vote.is_revealed ? vote.value : '?' }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <button @click="revealVotes" class="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-teal-700 transition duration-200 shadow-xl">
          <i class="fas fa-eye mr-2"></i> Reveal Votes
        </button>
        <button @click="resetVotes" class="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-orange-700 transition duration-200 shadow-xl">
          <i class="fas fa-redo mr-2"></i> Reset Round
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

    // Card values with icons
    const cardValues = [
      { value: '0', icon: 'fas fa-mug-hot' },
      { value: '1', icon: 'fas fa-bolt' },
      { value: '2', icon: 'fas fa-feather-alt' },
      { value: '3', icon: 'fas fa-trowel' },
      { value: '5', icon: 'fas fa-car' },
      { value: '8', icon: 'fas fa-rocket' },
      { value: '13', icon: 'fas fa-tree' },
      { value: '21', icon: 'fas fa-mountain' },
      { value: '34', icon: 'fas fa-building' },
      { value: '55', icon: 'fas fa-train' },
      { value: '89', icon: 'fas fa-plane' },
      { value: '?', icon: 'fas fa-question-circle' },
    ];
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

<style>
/* Animation for the create session form */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>