<script setup lang="ts">
import { onMounted } from 'vue';

// `defineEmits` is a compiler macro and no longer needs to be imported.
const emit = defineEmits<{
  (e: 'init', context: GPUCanvasContext, device: GPUDevice): void;
}>();

const props = defineProps<{
  width?: number,
  height?: number,
  device?: GPUDevice
}>();

// type WebGPUInit = (context: GPUCanvasContext, device: GPUDevice) => void;

onMounted(async () => {
  let device = props.device;
  if (!device) {
    const adapter = await navigator.gpu.requestAdapter();
    device = await adapter.requestDevice();
  }

  const canvas = document.querySelector('canvas');
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
  <canvas :width="width ?? 600" :height="height ?? 600" />
</template>
