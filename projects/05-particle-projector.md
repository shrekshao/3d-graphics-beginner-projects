<script setup lang='ts'>
import ProjectCanvas from './gpu-canvas.vue';
import { init } from './05-particle.ts';
</script>

# Particles

<ProjectCanvas @init="init" />