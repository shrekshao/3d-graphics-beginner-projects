<script setup lang='ts'>
import ProjectCanvas from './gpu-canvas.vue';
import { init } from './05-new.ts';
// import { init } from './05-particle.ts';
// import { init } from './05-renderer.ts';
</script>

# Particles

<ProjectCanvas @init="init" />