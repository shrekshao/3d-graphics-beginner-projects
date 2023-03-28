<script setup lang="ts">
import { defineEmits, onMounted } from 'vue';

const emit = defineEmits<{
  (e: 'init', context: GPUCanvasContext, device: GPUDevice): void;
}>();

// type WebGPUInit = (context: GPUCanvasContext, device: GPUDevice) => void;

onMounted(async () => {
  const canvas = document.querySelector('canvas');

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const context = canvas.getContext('webgpu') as GPUCanvasContext;

  emit('init', context, device);
});

// export default defineComponent({
//   // props: defineProps<{
//   //   width: number,
//   // }>(),
//   emit,

//   async mounted() {
//     // mounted() {
//     const canvas = document.querySelector('canvas');

//     const adapter = await navigator.gpu.requestAdapter();
//     const device = await adapter.requestDevice();

//     // if (!pageState.active) return;
//     const context = canvas.getContext('webgpu') as GPUCanvasContext;

//     this.$emit('init', context, device);

//     // },
//   },
// });
</script>

<template>
  <canvas width="600" height="600" />
</template>
