<template>
  <div class="team-wheel">
    <div class="bg-white rounded-xl shadow-2xl p-8">
      <h2 class="text-3xl font-bold mb-6 text-blue-700 text-center border-b pb-4">Team Wheel / Decision Spinner</h2>

      <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        <div class="lg:col-span-1 xl:col-span-1 border-r border-gray-200 pr-4">
          <h3 class="text-2xl font-semibold mb-4 text-gray-800">Configurations</h3>

          <button @click="showCreateConfig = !showCreateConfig" class="w-full bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-800 transition duration-200 shadow-md mb-4">
            <i class="fas fa-plus-square mr-2"></i> {{ showCreateConfig ? 'Hide Form' : 'Create New Configuration' }}
          </button>

          <transition name="slide-fade">
            <div v-if="showCreateConfig" class="mb-6 p-5 bg-yellow-50 rounded-lg border border-yellow-300">
              <h4 class="text-xl font-semibold mb-3 text-yellow-800">New Config Setup</h4>
              <input
                v-model="newConfig.name"
                placeholder="Configuration Name (e.g., Daily Scrum Order)"
                class="w-full p-3 border border-yellow-400 rounded-lg mb-3 focus:ring-yellow-500 focus:border-yellow-500"
              >

              <div class="max-h-48 overflow-y-auto pr-2 mb-3 space-y-2">
                <div v-for="(item, index) in newConfig.items" :key="index" class="flex gap-2">
                  <input v-model="newConfig.items[index]" :placeholder="`Item ${index + 1}`" class="flex-1 p-2 border rounded-lg">
                  <button @click="removeItem(index)" class="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition">
                    <i class="fas fa-minus"></i>
                  </button>
                </div>
              </div>

              <button @click="addItem" class="w-full bg-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition mb-3">
                <i class="fas fa-plus mr-1"></i> Add Item
              </button>
              <button @click="saveConfig" :disabled="!newConfig.name || newConfig.items.filter(i => i.trim()).length < 2"
                class="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">
                <i class="fas fa-save mr-2"></i> Save Configuration
              </button>
            </div>
          </transition>

          <div class="space-y-2">
            <div
              v-for="config in configs"
              :key="config.id"
              @click="loadConfig(config.id)"
              :class="[
                'p-4 rounded-xl cursor-pointer transition-all border shadow-sm',
                selectedConfig?.id === config.id
                  ? 'bg-blue-200 border-blue-600 font-bold text-blue-900 ring-2 ring-blue-500'
                  : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
              ]"
            >
              <div class="font-semibold text-lg">{{ config.name }}</div>
              <div class="text-sm text-gray-600">{{ config.items.length }} items</div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 xl:col-span-3 flex flex-col items-center">
          <audio ref="spinSound" src="/spin.mp3" preload="auto" loop></audio>
          <audio ref="winSound" src="/win.mp3" preload="auto"></audio>
          <canvas id="confetti-canvas" class="fixed top-0 left-0 w-full h-full pointer-events-none z-50"></canvas>

          <div v-if="selectedConfig" class="w-full">
            <h3 class="text-2xl font-semibold mb-5 text-center text-gray-800">{{ selectedConfig.name }}</h3>

            <div class="relative w-full max-w-lg mx-auto mb-8">
              <canvas ref="wheelCanvas" width="500" height="500" class="w-full max-w-full block mx-auto border-4 border-gray-300 rounded-full shadow-2xl"></canvas>

              <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full" style="padding-top: 10px;">
                <div class="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[50px] border-t-red-600 filter drop-shadow-lg tab-animation"></div>
              </div>

              <button
                @click="spinWheel"
                :disabled="isSpinning"
                :class="[
                  'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full font-bold text-xl transition-all duration-300 shadow-xl',
                  isSpinning
                    ? 'bg-gray-400 text-white ring-8 ring-gray-200 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700 ring-8 ring-red-200 animate-pulse'
                ]"
              >
                {{ isSpinning ? 'SPINNING...' : 'GO!' }}
              </button>
            </div>

            <div v-if="selectedItem" class="mt-6 p-5 bg-green-100 border-2 border-green-600 rounded-lg text-center shadow-lg animate-bounce-once">
              <div class="text-md text-gray-700 font-medium">✨ The selection is...</div>
              <div class="text-4xl font-extrabold text-green-800 mt-2">{{ selectedItem }}</div>
            </div>

            <div class="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 class="font-bold text-xl mb-3 text-gray-700 border-b pb-2">Recent Results (Last 5)</h4>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <div v-for="result in recentResults.slice(0, 5)" :key="result.id" class="flex justify-between p-2 bg-white rounded text-sm shadow-sm">
                  <span class="font-medium text-blue-700">{{ result.selected_item }}</span>
                  <span class="text-gray-500">{{ formatDate(result.created_at) }}</span>
                </div>
                <div v-if="recentResults.length === 0" class="text-center text-gray-400 italic">No spins yet.</div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-gray-500 mt-16 p-6 border-2 border-dashed border-gray-300 rounded-xl max-w-md">
            <i class="fas fa-sync-alt text-4xl mb-4 text-blue-300"></i>
            <p class="text-lg font-medium">Select or create a configuration to start spinning!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';

// --- CONFETTI FUNCTION (Self-Contained) ---
const triggerConfetti = () => {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#fff', '#000'];
  const pieces = [];
  const totalPieces = 50;

  for (let i = 0; i < totalPieces; i++) {
    pieces.push({
      x: canvas.width * 0.5,
      y: canvas.height * 0.5,
      w: Math.random() * 8 + 4,
      h: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      d: Math.random() * totalPieces,
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 4 + 2),
        y: Math.random() * -10 - 5
      },
      gravity: 0.3,
      terminalVelocity: 10
    });
  }

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let done = true;

    pieces.forEach(p => {
      p.velocity.y += p.gravity;
      p.y += p.velocity.y;
      p.x += p.velocity.x;
      p.rotation += 5; // Simple rotation

      if (p.y <= canvas.height) {
        done = false;
      }

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (!done) {
      requestAnimationFrame(update);
    } else {
       // Clear the canvas after the animation finishes
       setTimeout(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
       }, 500);
    }
  }
  update();
};
// ----------------------------------------


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

    // ADDED: Audio element refs
    const spinSound = ref(null);
    const winSound = ref(null);

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B88B', '#AAB7B8', '#5DADE2', '#F1948A'
    ];

    // Sound control functions
    const playSpinSound = () => {
      if (spinSound.value) {
        spinSound.value.volume = 0.5;
        spinSound.value.play().catch(e => console.log('Audio play blocked:', e));
      }
    };
    const stopSpinSound = () => {
      if (spinSound.value) {
        spinSound.value.pause();
        spinSound.value.currentTime = 0;
      }
    };
    const playWinSound = () => {
      if (winSound.value) {
        winSound.value.volume = 0.8;
        winSound.value.play().catch(e => console.log('Audio play blocked:', e));
      }
    };

    // Data fetching and mutation functions
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

    // Drawing logic
    const drawWheel = (rotation = 0) => {
      if (!wheelCanvas.value || !selectedConfig.value) return;

      const canvas = wheelCanvas.value;
      const ctx = canvas.getContext('2d');
      const items = selectedConfig.value.items;

      canvas.width = 500;
      canvas.height = 500;

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
        ctx.font = 'bold 16px Arial';

        const maxTextWidth = radius * 0.8;
        let displayText = item;
        if (ctx.measureText(item).width > maxTextWidth) {
          displayText = item.substring(0, 10) + '...';
        }

        ctx.fillText(displayText, radius / 2, 0);
        ctx.restore();

        // Draw Notches on the rim
        const notchColor = '#333';
        const notchLength = 8;
        const notchWidth = 3;

        ctx.save();
        ctx.rotate(angle + arc); // Rotate to the end of the current slice
        ctx.fillStyle = notchColor;
        ctx.fillRect(radius - notchLength, -notchWidth / 2, notchLength, notchWidth);
        ctx.restore();
      });

      ctx.restore();
    };


    const spinWheel = async () => {
      if (!selectedConfig.value || isSpinning.value) return;

      isSpinning.value = true;
      selectedItem.value = null;
      playSpinSound(); // Start spin sound

      const items = selectedConfig.value.items;
      const selectedIndex = Math.floor(Math.random() * items.length);
      const arc = (2 * Math.PI) / items.length;
      const offset = Math.PI / 2;

      const targetAngle = offset - (selectedIndex * arc + arc / 2);

      const fullSpins = 5 + Math.random() * 2;
      const totalRotation = currentRotation.value + fullSpins * 2 * Math.PI + targetAngle;

      const duration = 4000;
      const startTime = Date.now();
      const startRotation = currentRotation.value;
      currentRotation.value = startRotation;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentRotation.value = startRotation + (totalRotation - startRotation) * easeOut;
        drawWheel(currentRotation.value);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentRotation.value = totalRotation % (2 * Math.PI);
          selectedItem.value = items[selectedIndex];
          isSpinning.value = false;
          stopSpinSound(); // Stop spin sound
          playWinSound(); // Play win sound
          triggerConfetti(); // Trigger confetti
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
      spinSound,
      winSound,
      // FIX: Ensure all functions used in the template are returned/exposed here
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

<style>
/* Animation for create config form (same as poker) */
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

/* Custom bounce-once animation for the result */
@keyframes bounce-once {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-2px);
  }
}

.animate-bounce-once {
  animation: bounce-once 1.5s ease-in-out;
}

/* NEW: Animation for the flexible tab/pointer */
@keyframes tab-wobble {
  0%, 100% { transform: scaleX(1); }
  50% { transform: scaleX(1.1); }
}

.tab-animation {
  animation: tab-wobble 0.2s ease-in-out infinite alternate;
}
</style>