// import triangleVertWGSL from '../src/shaders/triangle.vert.wgsl';
// import fragWGSL from '../src/shaders/red.frag.wgsl';
import shaderWGSL from '../src/shaders/05/code.wgsl';

// import { TinyGltfWebGpu } from '../src/utils/tiny-gltf';
import { TinyGltf } from '../src/utils/tiny-gltf';
import OrbitCamera from '../src/utils/orbitCamera';
import { mat4 } from 'gl-matrix';

// const gltfUrl = '../assets/gltf/Buggy.glb';
const gltfUrl = '../assets/gltf/di-player-test.glb';

// Shader locations and source are unchanged from the previous sample.
const ShaderLocations = {
  POSITION: 0,
  NORMAL: 1,
  TEXCOORD_0: 2,

  JOINTS_0: 3,
  WEIGHTS_0: 4,
};




// function getPipelineArgs(primitive, buffers) {
//   return {
//     topology: TinyGltfWebGpu.gpuPrimitiveTopologyForMode(primitive.mode),
//     buffers,
//   };
// }

class StaticMeshDrawObject {
  // setVertexBuffer
  vertexOffset: number;
  vertexSize: number;
  // setIndexBuffer
  indexOffset: number;
  indexSize: number;
  // drawIndexed
  drawCount: number;
  instanceCount: number;
  firstInstance: number;

  // Meterial
};

class SkinnedMeshDrawObject extends StaticMeshDrawObject {

};



export async function init(
  context: GPUCanvasContext,
  device: GPUDevice
) {
  // console.log(device);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'opaque',
  });

  const depthTexture = device.createTexture({
    size: [context.canvas.width, context.canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const camera = new OrbitCamera(context.canvas);

  const loader = new TinyGltf();
  const gltf = await loader.loadFromUrl(gltfUrl);
  const sceneAabb = gltf.scenes[gltf.scene].aabb;
  console.log(gltf);

  camera.target = sceneAabb.center;
  camera.maxDistance = sceneAabb.radius * 2.0;
  camera.minDistance = sceneAabb.radius * 0.25;
  // if (url.includes('Sponza')) {
  //   camera.distance = camera.minDistance;
  // } else {
    camera.distance = sceneAabb.radius * 1.5;
  // }
  let zFar = sceneAabb.radius * 4.0;
  


  const FRAME_BUFFER_SIZE = Float32Array.BYTES_PER_ELEMENT * 36;
  const frameArrayBuffer = new ArrayBuffer(FRAME_BUFFER_SIZE);
  const projectionMatrix = new Float32Array(frameArrayBuffer, 0, 16);
  const viewMatrix = new Float32Array(frameArrayBuffer, 16 * Float32Array.BYTES_PER_ELEMENT, 16);
  const cameraPosition = new Float32Array(frameArrayBuffer, 32 * Float32Array.BYTES_PER_ELEMENT, 3);
  const timeArray = new Float32Array(frameArrayBuffer, 35 * Float32Array.BYTES_PER_ELEMENT, 1);

  const frameUniformBuffer = device.createBuffer({
    size: FRAME_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const frameBindGroupLayout = device.createBindGroupLayout({
    label: `Frame BindGroupLayout`,
    entries: [{
      binding: 0, // Camera/Frame uniforms
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: {},
    }],
  });

  const frameBindGroup = device.createBindGroup({
    label: `Frame BindGroup`,
    layout: frameBindGroupLayout,
    entries: [{
      binding: 0, // Camera uniforms
      resource: { buffer: frameUniformBuffer },
    }],
  });


  // setup

  // renderer constraint:
  // attributes:
  // 0 - Position float32x3
  // 1 - Normal
  // 2 - Texcoord0
  const vertexBuffer = device.createBuffer({
    size: 1024,
    usage: GPUBufferUsage.VERTEX,
  });

  const indexBuffer = device.createBuffer({
    size: 1024,
    usage: GPUBufferUsage.INDEX,
  });

  // for static object transforms + inverseBindMatrices
  const staticStorageBuffer = device.createBuffer({
    size: 1024,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  // for animated object transforms (joints)
  const dynamicStorageBuffer = device.createBuffer({
    size: 1024,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });


  // upload gltf models buffer to renderer buffer, and process draw info




  function frame() {

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),

        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      }
    };

    // camera stuff temp
    mat4.perspectiveZO(projectionMatrix, Math.PI * 0.5, 1, 0.01, zFar);
    viewMatrix.set(camera.viewMatrix);
    cameraPosition.set(camera.position);
    // timeArray[0] = t;

    device.queue.writeBuffer(frameUniformBuffer, 0, frameArrayBuffer);

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);


    passEncoder.setBindGroup(0, frameBindGroup);





    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
