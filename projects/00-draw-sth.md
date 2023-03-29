<script setup lang='ts'>
import ProjectCanvas from './gpu-canvas.vue';
import init from './00-draw-sth.ts';
</script>

Project 00 - Draw something first!

<ProjectCanvas @init="init" :width=300 :height=300 />
