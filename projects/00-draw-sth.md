<script setup lang='ts'>
import ProjectCanvas from './gpu-canvas.vue';
import init from './00-draw-sth.ts';
</script>

Project 00 - Draw something first!

<ProjectCanvas @init="init" :width=300 :height=300 />

::: tip
This set of projects uses typescript. Familiar yourself with it first if you are not yet. Here are [tutorials for programmers from different background](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html).
:::
