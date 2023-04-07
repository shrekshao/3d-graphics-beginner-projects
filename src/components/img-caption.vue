<script setup lang="ts">
defineProps<{
  src: string;
}>();
</script>

<style scoped>
figure {
  margin: 16px 0;
}
img {
  text-align: center;
  display: block;
  margin-left: auto;
  margin-right: auto;
  background-color: #666;
  border-radius: 16px;
};

/* :slotted(figcaption) {
  text-align: center;
  margin: auto;
}; */

</style>

<template>
  <figure>
    <img :src="src" />
    <figcaption style="text-align: center; font-size: var(--vp-custom-block-font-size); color: var(--vp-c-text-2);">
        <slot></slot>
    </figcaption>
  </figure>
</template>