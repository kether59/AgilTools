<template>
  <div class="team-wheel">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-4">Team Wheel / Wheel of Decision</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Configuration Panel -->
        <div>
          <h3 class="text-xl font-semibold mb-3">Configurations</h3>

          <div class="mb-4">
            <button @click="showCreateConfig = !showCreateConfig" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Create New Configuration
            </button>
          </div>

          <div v-if="showCreateConfig" class="mb-4 p-4 bg-gray-50 rounded">
            <input v-model="newConfig.name" placeholder="Configuration Name" class="w-full p-2 border rounded mb-2">
            <div v-for="(item, index) in newConfig.items" :key="index" class="flex gap-2 mb-2">
              <input v-model="newConfig.items[index]" placeholder="Item name" class="flex-1 p-2 border rounded">
              <button @click="removeItem(index)" class="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600">
                ×
              </button>
            </div>
            <button @click="addItem" class="w-full bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 mb-2">
              + Add Item
            </button>
            <button @click="saveConfig" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Save Configuration
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="config in configs"
              :key="config.id"
              @click="loadConfig(config.id)"
              :class="[
                'p-3 rounded cursor-pointer transition-all',
                selectedConfig?.id === config.id ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 hover:bg-gray-200'
              ]"
            >
              <div class="font-semibold">{{ config.name }}</div>
              <div class="text-sm text-gray-600">{{ config.items.length }} items</div>
            </div>
          </div>
        </div>

        <!-- Wheel Panel -->
        <div class="flex flex-col items-center">
          <div v-if="selectedConfig" class="w-full">
            <h3 class="text-xl font-semibold mb-3 text-center">{{ selectedConfig.name }}</h3>

            <div class="relative w-full max-w-md mx-auto">
              <canvas ref="wheelCanvas" width="400" height="400" class="w-full"></canvas>

              <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div class="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-600"></div>
              </div>
            </div>

            <div class="text-center mt-4">
              <button
                @click="spinWheel"
                :disabled="isSpinning"
                :class="[
                  'px-8 py-3 rounded-lg font-bold text-lg transition-all',
                  isSpinning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                ]"
              >
                {{ isSpinning ? 'Spinning...' : 'SPIN!' }}
              </button>
            </div>

            <div v-if="selectedItem" class="mt-6 p-4 bg-green-100 border-2 border-green-600 rounded-lg text-center">
              <div class="text-sm text-gray-600">Selected:</div>
              <div class="text-2xl font-bold text-green-800">{{ selectedItem }}</div>
            </div>

            <div class="mt-6">
              <h4 class="font-semibold mb-2">Recent Results</h4>
              <div class="space-y-1">
                <div v-for="result in recentResults" :key="result.id" class="p-2 bg-gray-100 rounded text-sm">
                  {{ result.selected_item }} - {{ formatDate(result.created_at) }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-gray-500 mt-8">
            Select or create a configuration to start
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';

export default {
  name: 'TeamWheel',
  props: ['user'],
  setup() {
    const configs = ref([]);
    const selectedConfig = ref(null);
    const showCreateConfig = ref(false);
    const newConfig = ref({ name: '', items: [''] });
    const wheelCanvas = ref(null);
    const isSpinning = ref(false);
    const selectedItem = ref(null);
    const recentResults = ref([]);
    const currentRotation = ref(0);

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B88B', '#AAB7B8', '#5DADE2', '#F1948A'
    ];

    const fetchConfigs = async () => {
      try {
        const response = await axios.get('/api/wheel/configs');
        configs.value = response.data;
      } catch (error) {
        console.error('Failed to fetch configs:', error);
      }
    };

    const addItem = () => {
      newConfig.value.items.push('');
    };

    const removeItem = (index) => {
      newConfig.value.items.splice(index, 1);
    };

    const saveConfig = async () => {
      const validItems = newConfig.value.items.filter(item => item.trim() !== '');
      if (!newConfig.value.name || validItems.length < 2) {
        alert('Please provide a name and at least 2 items');
        return;
      }

      try {
        await axios.post('/api/wheel/configs', {
          name: newConfig.value.name,
          items: validItems
        });
        await fetchConfigs();
        newConfig.value = { name: '', items: [''] };
        showCreateConfig.value = false;
      } catch (error) {
        console.error('Failed to save config:', error);
      }
    };

    const loadConfig = async (configId) => {
      try {
        const response = await axios.get(`/api/wheel/configs/${configId}`);
        selectedConfig.value = response.data;
        selectedItem.value = null;
        await fetchResults(configId);
        await nextTick();
        drawWheel();
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };

    const fetchResults = async (configId) => {
      try {
        const response = await axios.get(`/api/wheel/configs/${configId}/results`);
        recentResults.value = response.data;
      } catch (error) {
        console.error('Failed to fetch results:', error);
      }
    };

    const drawWheel = (rotation = 0) => {
      if (!wheelCanvas.value || !selectedConfig.value) return;

      const canvas = wheelCanvas.value;
      const ctx = canvas.getContext('2d');
      const items = selectedConfig.value.items;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      const arc = (2 * Math.PI) / items.length;

      items.forEach((item, i) => {
        const angle = i * arc;

        // Draw slice
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(item, radius / 2, 0);
        ctx.restore();
      });

      ctx.restore();
    };

    const spinWheel = async () => {
      if (!selectedConfig.value || isSpinning.value) return;

      isSpinning.value = true;
      selectedItem.value = null;

      const items = selectedConfig.value.items;
      const selectedIndex = Math.floor(Math.random() * items.length);
      const arc = (2 * Math.PI) / items.length;

      // Calculate target rotation (5-7 full spins + landing on selected item)
      const spins = 5 + Math.random() * 2;
      const targetRotation = spins * 2 * Math.PI + (selectedIndex * arc);

      const duration = 3000;
      const startTime = Date.now();
      const startRotation = currentRotation.value;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentRotation.value = startRotation + targetRotation * easeOut;
        drawWheel(currentRotation.value);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          selectedItem.value = items[selectedIndex];
          isSpinning.value = false;
          saveResult(items[selectedIndex]);
        }
      };

      animate();
    };

    const saveResult = async (item) => {
      try {
        await axios.post('/api/wheel/results', {
          config_id: selectedConfig.value.id,
          selected_item: item
        });
        await fetchResults(selectedConfig.value.id);
      } catch (error) {
        console.error('Failed to save result:', error);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    onMounted(() => {
      fetchConfigs();
    });

    return {
      configs,
      selectedConfig,
      showCreateConfig,
      newConfig,
      wheelCanvas,
      isSpinning,
      selectedItem,
      recentResults,
      fetchConfigs,
      addItem,
      removeItem,
      saveConfig,
      loadConfig,
      spinWheel,
      formatDate
    };
  }
};
</script>