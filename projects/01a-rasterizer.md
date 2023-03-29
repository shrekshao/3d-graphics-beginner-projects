<script setup lang='ts'>
import ProjectCanvas from './gpu-canvas.vue';
import init from './00-draw-sth.ts';
</script>

# Project 01a - Rasterizer, CPU and GPU

<ProjectCanvas @init="init" />

If you are interested, you can write your own rasterizer in plain typescript running on CPU.
