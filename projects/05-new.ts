// import triangleVertWGSL from '../src/shaders/triangle.vert.wgsl';
// import fragWGSL from '../src/shaders/red.frag.wgsl';
import staticMeshVertexWGSL from '../src/shaders/05/static-mesh.vert.wgsl';
import skinnedMeshVertexWGSL from '../src/shaders/05/skinned.vert.wgsl';
import basicFragmentWGSL from '../src/shaders/05/basic.frag.wgsl';

// import { TinyGltfWebGpu } from '../src/utils/tiny-gltf';
import { TinyGltf } from '../src/utils/tiny-gltf';
import OrbitCamera from '../src/utils/orbitCamera';
import { mat4 } from 'gl-matrix';

// const gltfUrl = '../assets/gltf/Buggy.glb';
const gltfUrl = '../assets/gltf/di-player-test.glb';
// const gltfUrl = '../assets/gltf/DamagedHelmet.glb';

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
// class DrawObject

export async function init(context: GPUCanvasContext, device: GPUDevice) {
  // console.log(device);
  interface StaticMeshDrawObject {
    // setVertexBuffer
    // vertexOffset: number;
    // vertexSize: number;

    vertexBuffers: { offset: number; size: number }[];

    // setIndexBuffer
    indexOffset: number;
    indexSize: number;
    // drawIndexed
    drawIndexedCount: number;

    // now used for transform
    instanceCount: number;
    firstInstance: number;

    // TODO: Meterial
  }

  const staticMeshDrawObjects: Array<StaticMeshDrawObject> = [];

  class SkinObject {
    inverseBindMatricesStaticBuffer: GPUBuffer;
    jointMatricesDynamicBuffer: GPUBuffer;

    jointMatrices: Float32Array;

    bindGroup: GPUBindGroup;

    constructor(gltf, skin) {
      const numJoints: number = skin.joints.length;

      this.jointMatrices = new Float32Array(16 * numJoints);
      for (const [idx, jointIdx] of skin.joints.entries()) {
        // nodeIdx2SkinIdx[jointIdx] = idx;

        // update matrix for joint nodes in order
        this.jointMatrices.set(gltf.nodes[jointIdx].worldMatrix, 16 * idx);
      }

      const bufferSize = 64 * numJoints; // mat4 * numJoints

      // for skins inverseBindMatrices
      this.inverseBindMatricesStaticBuffer = device.createBuffer({
        label: 'Skin inverseBindMatricesStaticBuffer',
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
      });

      // for animated object transforms (joints)
      this.jointMatricesDynamicBuffer = device.createBuffer({
        label: 'Skin jointMatricesDynamicBuffer',
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
      });

      {
        const accessor = gltf.accessors[skin.inverseBindMatrices];
        const bufferView = gltf.bufferViews[accessor.bufferView];
        device.queue.writeBuffer(
          this.inverseBindMatricesStaticBuffer,
          0,
          gltf.buffers[bufferView.buffer],
          bufferView.byteOffset + (accessor.byteOffset ?? 0),
          bufferView.byteLength
        );
      }

      {
        device.queue.writeBuffer(
          this.jointMatricesDynamicBuffer,
          0,
          this.jointMatrices.buffer
        );
      }

      this.bindGroup = device.createBindGroup({
        label: `Static Storage Bind Group`,
        layout: skinBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: this.inverseBindMatricesStaticBuffer },
          },
          {
            binding: 1,
            resource: { buffer: this.jointMatricesDynamicBuffer },
          },
        ],
      });
    }
  }

  const skinObjects: Array<SkinObject> = [];

  interface SkinnedMeshDrawObject extends StaticMeshDrawObject {
    skinIdx: number; // in skinObjects
  }

  const skinnedMeshDrawObjects: Array<SkinnedMeshDrawObject> = [];

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
  const zFar = sceneAabb.radius * 4.0;

  const FRAME_BUFFER_SIZE = Float32Array.BYTES_PER_ELEMENT * 36;
  const frameArrayBuffer = new ArrayBuffer(FRAME_BUFFER_SIZE);
  const projectionMatrix = new Float32Array(frameArrayBuffer, 0, 16);
  const viewMatrix = new Float32Array(
    frameArrayBuffer,
    16 * Float32Array.BYTES_PER_ELEMENT,
    16
  );
  const cameraPosition = new Float32Array(
    frameArrayBuffer,
    32 * Float32Array.BYTES_PER_ELEMENT,
    3
  );
  const timeArray = new Float32Array(
    frameArrayBuffer,
    35 * Float32Array.BYTES_PER_ELEMENT,
    1
  );

  const frameUniformBuffer = device.createBuffer({
    size: FRAME_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const frameBindGroupLayout = device.createBindGroupLayout({
    label: `Frame BindGroupLayout`,
    entries: [
      {
        binding: 0, // Camera/Frame uniforms
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {},
      },
    ],
  });

  const frameBindGroup = device.createBindGroup({
    label: `Frame BindGroup`,
    layout: frameBindGroupLayout,
    entries: [
      {
        binding: 0, // Camera uniforms
        resource: { buffer: frameUniformBuffer },
      },
    ],
  });

  // setup

  // renderer constraint:
  // attributes:
  // 0 - Position float32x3
  // 1 - Normal
  // 2 - Texcoord0

  const vertexBuffer = device.createBuffer({
    size: 4 * 1024 * 1024, // 4MB
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  const indexBuffer = device.createBuffer({
    // size: 4 * 1024 * 1024,  // 4MB
    // size: 34062,
    size: 34064,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });

  // for static object transforms
  const staticStorageBuffer = device.createBuffer({
    size: 4 * 1024 * 1024, // 4MB
    // size: 64,  // mat4
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const staticStorageBindGroupLayout = device.createBindGroupLayout({
    label: `Static Storage Bind Group`,
    entries: [
      // Static transform mat buffer
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' },
      },
    ],
  });

  // static inverse bind matrices buffer + dynamic joint matrices buffer
  const skinBindGroupLayout = device.createBindGroupLayout({
    label: `Skin Storage Bind Group`,
    entries: [
      // Static transform Mat4 buffer for inverse bind matrices
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' },
      },
      // Dynamic transform Mat4 buffer for joint matrices
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' },
      },
    ],
  });

  function processGltfModel(gltf) {
    type GPUBufferSetup = {
      curOffset: number;
      mapped: Uint8Array;
    };
    function getGPUBufferSetup(gpuBuffer: GPUBuffer): GPUBufferSetup {
      return {
        curOffset: 0,
        mapped: new Uint8Array(gpuBuffer.getMappedRange()),
      };
    }
    function uploadToBuffer(
      gpuBufferSetup: GPUBufferSetup,
      accessorIndex: number
    ) {
      const accessor = gltf.accessors[accessorIndex];
      const bufferView = gltf.bufferViews[accessor.bufferView];
      gpuBufferSetup.mapped.set(
        new Uint8Array(
          gltf.buffers[bufferView.buffer],
          bufferView.byteOffset + (accessor.byteOffset ?? 0),
          bufferView.byteLength
        ),
        gpuBufferSetup.curOffset
      );

      // if (bufferView.byteLength === 92712) {
      //   console.log(gpuBufferSetup.mapped);
      // } else {
      //   console.log(new Float32Array(gpuBufferSetup.mapped.buffer));
      // }

      const offset = gpuBufferSetup.curOffset;
      gpuBufferSetup.curOffset += bufferView.byteLength;
      // console.log(gpuBufferSetup.curOffset);
      return {
        offset: offset,
        size: bufferView.byteLength,
      };
    }

    // const nodeIdx2SkinIdx: { [key: number]: number } = {};

    if (gltf.skins) {
      // for (const skin of gltf.skins) {
      for (const [idx, skin] of gltf.skins.entries()) {
        // uploadToBuffer();
        skinObjects.push(new SkinObject(gltf, skin));
        console.log(skinObjects[skinObjects.length - 1]);
      }
    }

    // static transform
    // const staticStorageBufferSetup = getGPUBufferSetup(staticStorageBuffer);
    const staticStorageBufferSetup = {
      curOffset: 0,
      mapped: new Float32Array(staticStorageBuffer.getMappedRange()),
    };
    let meshNodeIdx = 0;

    for (const node of gltf.nodes) {
      // for (const [idx, node] of gltf.nodes.entries()) {
      if ('mesh' in node) {
        if ('skin' in node) {
          // gltf.meshes[node.mesh].skinnedMesh = skinObjects[node.skin];
          gltf.meshes[node.mesh].skin = node.skin;
        }

        staticStorageBufferSetup.mapped.set(
          node.worldMatrix,
          staticStorageBufferSetup.curOffset
        );
        staticStorageBufferSetup.curOffset += 16; // mat4:16 float32

        // console.log(node.worldMatrix);

        gltf.meshes[node.mesh].nodeIdx = meshNodeIdx++;
      }

      // TODO: joints
    }

    // console.log(new Float32Array(staticStorageBufferSetup.mapped.buffer));

    const vertexBufferSetup = getGPUBufferSetup(vertexBuffer);
    const indexBufferSetup = getGPUBufferSetup(indexBuffer);

    // const idx2Mesh: { [key: number]: any} = {};

    for (const mesh of gltf.meshes) {
      // for (const [idx, mesh] of gltf.meshes.entries()) {
      for (const primitive of mesh.primitives) {
        if (!('indices' in primitive)) {
          console.error('Unsupported: gltf model mesh does not have indices');
        }

        const a = gltf.accessors[primitive.indices];
        const GL = WebGLRenderingContext;
        if (a.type !== 'SCALAR' || a.componentType !== GL.UNSIGNED_SHORT) {
          console.error('Unsupported index type: ', a);
        }

        const indexInfo = uploadToBuffer(indexBufferSetup, primitive.indices);
        const drawIndexedCount = gltf.accessors[primitive.indices].count;

        if (!('POSITION' in primitive.attributes)) {
          console.error(
            'Unsupported: gltf model mesh primitive has no POSITION attribute'
          );
        }
        if (!('NORMAL' in primitive.attributes)) {
          console.error(
            'Unsupported: gltf model mesh primitive has no NORMAL attribute'
          );
        }
        if (!('TEXCOORD_0' in primitive.attributes)) {
          console.error(
            'Unsupported: gltf model mesh primitive has no TEXCOORD_0 attribute'
          );
        }

        // Assume no arraystride (no interleaved attributes)
        // const vertexOffset = vertexBufferSetup.curOffset;
        // const pb = uploadToBuffer(vertexBufferSetup, primitive.attributes.POSITION);
        // const nb = uploadToBuffer(vertexBufferSetup, primitive.attributes.NORMAL);
        // const tb = uploadToBuffer(vertexBufferSetup, primitive.attributes.TEXCOORD_0);

        if (mesh.skin !== undefined) {
          // const sd = d as SkinnedMeshDrawObject;
          // sd.skinIdx = mesh.skin;
          // const sd: SkinnedMeshDrawObject = { ...d, skinIdx: mesh.skin };
          const sd: SkinnedMeshDrawObject = {
            skinIdx: mesh.skin,
            vertexBuffers: [
              uploadToBuffer(vertexBufferSetup, primitive.attributes.POSITION),
              uploadToBuffer(vertexBufferSetup, primitive.attributes.NORMAL),
              uploadToBuffer(
                vertexBufferSetup,
                primitive.attributes.TEXCOORD_0
              ),
              uploadToBuffer(vertexBufferSetup, primitive.attributes.JOINTS_0),
              uploadToBuffer(vertexBufferSetup, primitive.attributes.WEIGHTS_0),
            ],

            indexOffset: indexInfo.offset,
            indexSize: indexInfo.size,
            drawIndexedCount: drawIndexedCount,

            instanceCount: 1,
            firstInstance: mesh.nodeIdx,
            // firstInstance: 0,
          };
          skinnedMeshDrawObjects.push(sd);
          console.log(sd);
        } else {
          const d: StaticMeshDrawObject = {
            vertexBuffers: [
              uploadToBuffer(vertexBufferSetup, primitive.attributes.POSITION),
              uploadToBuffer(vertexBufferSetup, primitive.attributes.NORMAL),
              uploadToBuffer(
                vertexBufferSetup,
                primitive.attributes.TEXCOORD_0
              ),
            ],

            indexOffset: indexInfo.offset,
            indexSize: indexInfo.size,
            drawIndexedCount: drawIndexedCount,

            instanceCount: 1,
            firstInstance: mesh.nodeIdx,
            // firstInstance: 0,
          };
          staticMeshDrawObjects.push(d);
          // console.log(d);
        }
      }
    }

    skinnedMeshDrawObjects.sort((a, b) => a.skinIdx - b.skinIdx);
  }

  processGltfModel(gltf);

  vertexBuffer.unmap();
  indexBuffer.unmap();
  staticStorageBuffer.unmap();
  // skinStaticStorageBuffer.unmap();
  // dynamicStorageBuffer.unmap();

  //////////////

  const staticStorageBindGroup = device.createBindGroup({
    label: `Static Storage Bind Group`,
    layout: staticStorageBindGroupLayout,
    entries: [
      {
        binding: 0, // Instance storage buffer
        resource: { buffer: staticStorageBuffer },
      },
    ],
  });

  const staticMeshVertexModule = device.createShaderModule({
    code: staticMeshVertexWGSL,
  });
  const skinnedMeshVertexModule = device.createShaderModule({
    code: skinnedMeshVertexWGSL,
  });
  const basicFragmentModule = device.createShaderModule({
    code: basicFragmentWGSL,
  });

  const staticMeshPipeline = device.createRenderPipeline({
    label: 'Static Mesh',
    layout: device.createPipelineLayout({
      label: 'Static Mesh',
      bindGroupLayouts: [frameBindGroupLayout, staticStorageBindGroupLayout],
    }),
    vertex: {
      module: staticMeshVertexModule,
      entryPoint: 'vertexMain',
      buffers: [
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'float32x3',
              offset: 0,
              shaderLocation: 0,
            },
          ],
        },
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'float32x3',
              offset: 0,
              shaderLocation: 1,
            },
          ],
        },
        {
          arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'float32x2',
              offset: 0,
              shaderLocation: 2,
            },
          ],
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    multisample: {
      // count: this.app.sampleCount,
      count: 1,
    },
    depthStencil: {
      // format: this.app.depthFormat,
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    },
    fragment: {
      module: basicFragmentModule,
      entryPoint: 'fragmentMain',
      targets: [
        {
          // format: this.app.colorFormat,
          format: presentationFormat,
        },
      ],
    },
  });

  const skinnedMeshPipeline = device.createRenderPipeline({
    label: 'Skinned Mesh',
    layout: device.createPipelineLayout({
      label: 'Skinned Mesh',
      bindGroupLayouts: [
        frameBindGroupLayout,
        staticStorageBindGroupLayout,
        skinBindGroupLayout,
      ],
    }),
    vertex: {
      module: skinnedMeshVertexModule,
      entryPoint: 'vertexMain',
      buffers: [
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'float32x3',
              offset: 0,
              shaderLocation: 0,
            },
          ],
        },
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'float32x3',
              offset: 0,
              shaderLocation: 1,
            },
          ],
        },
        {
          arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'float32x2',
              offset: 0,
              shaderLocation: 2,
            },
          ],
        },

        // joints
        {
          arrayStride: 4 * Uint8Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'uint8x4',
              offset: 0,
              shaderLocation: 3,
            },
          ],
        },

        // weights
        {
          arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              format: 'float32x4',
              offset: 0,
              shaderLocation: 4,
            },
          ],
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    multisample: {
      // count: this.app.sampleCount,
      count: 1,
    },
    depthStencil: {
      // format: this.app.depthFormat,
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    },
    fragment: {
      module: basicFragmentModule,
      entryPoint: 'fragmentMain',
      targets: [
        {
          // format: this.app.colorFormat,
          format: presentationFormat,
        },
      ],
    },
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
      },
    };

    // camera stuff temp
    mat4.perspectiveZO(projectionMatrix, Math.PI * 0.5, 1, 0.01, zFar);
    viewMatrix.set(camera.viewMatrix);
    cameraPosition.set(camera.position);
    // timeArray[0] = t;

    device.queue.writeBuffer(frameUniformBuffer, 0, frameArrayBuffer);

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setBindGroup(0, frameBindGroup);

    // Draw static mesh object
    // TODO: sort by material
    passEncoder.setBindGroup(1, staticStorageBindGroup);

    passEncoder.setPipeline(staticMeshPipeline);
    for (const d of staticMeshDrawObjects) {
      // for (const [idx, vb] of d.vertexBuffers.entries()) {
      for (let idx = 0; idx < d.vertexBuffers.length; idx++) {
        const vb = d.vertexBuffers[idx];
        // console.log(idx, vertexBuffer, vb.offset, vb.size);
        passEncoder.setVertexBuffer(idx, vertexBuffer, vb.offset, vb.size);
      }
      passEncoder.setIndexBuffer(
        indexBuffer,
        'uint16',
        d.indexOffset,
        d.indexSize
      );

      passEncoder.drawIndexed(
        d.drawIndexedCount,
        d.instanceCount,
        0,
        0,
        d.firstInstance
      );
      // passEncoder.drawIndexed(d.drawIndexedCount);
    }

    // Draw skinned mesh
    passEncoder.setPipeline(skinnedMeshPipeline);
    // for (let skinIdx = 0; skinIdx < skinObjects.length; skinIdx++) {
    // }

    let skinIdx = -1;
    let skin: SkinObject;

    for (const d of skinnedMeshDrawObjects) {
      if (d.skinIdx !== skinIdx) {
        skinIdx = d.skinIdx;
        skin = skinObjects[skinIdx];
        passEncoder.setBindGroup(2, skin.bindGroup);
      }

      for (let idx = 0; idx < d.vertexBuffers.length; idx++) {
        const vb = d.vertexBuffers[idx];
        passEncoder.setVertexBuffer(idx, vertexBuffer, vb.offset, vb.size);
      }
      passEncoder.setIndexBuffer(
        indexBuffer,
        'uint16',
        d.indexOffset,
        d.indexSize
      );

      passEncoder.drawIndexed(
        d.drawIndexedCount,
        d.instanceCount,
        0,
        0,
        d.firstInstance
      );
    }

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
