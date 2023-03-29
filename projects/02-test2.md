<script setup lang='ts'>
import ProjectCanvas from './gpu-canvas.vue';
import init from './02-test2.ts';
</script>

bbb

<!-- <ProjectCanvas /> -->
<!-- <ProjectCanvas :init="init"/> -->
<ProjectCanvas @init="init" :width=300 :height=300 />
