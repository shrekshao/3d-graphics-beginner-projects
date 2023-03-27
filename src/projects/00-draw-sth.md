aaa

<canvas id='s' width='600px' height='600px'></canvas>
ss

<script setup lang='ts'>
import init from './init';

// document.body.onload = async () => {
async function a() {
  // await init(document.querySelector('canvas'), {active: true});

  const c = document.createElement("canvas");
  c.width = 600;
  c.height = 600;
  document.body.appendChild(c);

  await init({
    // canvas: document.querySelector('canvas'), 
    canvas: c, 
    pageState: {active: true}
  });
}

a();
</script>