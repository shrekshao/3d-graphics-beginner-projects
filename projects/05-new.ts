// import triangleVertWGSL from '../src/shaders/triangle.vert.wgsl';
// import fragWGSL from '../src/shaders/red.frag.wgsl';
import staticMeshVertexWGSL from '../src/shaders/05/static-mesh.vert.wgsl';
import skinnedMeshVertexWGSL from '../src/shaders/05/skinned.vert.wgsl';
import basicFragmentWGSL from '../src/shaders/05/basic.frag.wgsl';
import skinnedMeshParticleWGSL from '../src/shaders/05/write-position-to-texture.wgsl';

import particleWGSL from '../src/shaders/05/particle.wgsl';

// import { TinyGltfWebGpu } from '../src/utils/tiny-gltf';
// import { TinyGltf, AABB } from '../src/utils/tiny-gltf';
// import OrbitCamera from '../src/utils/orbitCamera';
import { vec3, vec4, quat, mat4 } from 'gl-matrix';
import { assert } from '../src/utils/util';
// import OrbitCamera from '../src/utils/orbitCamera';

import { withBase } from 'vitepress';

const gltfUrl = withBase('/gltf/di-long-idle.glb');

// // Shader locations and source are unchanged from the previous sample.
// const ShaderLocations = {
//   POSITION: 0,
//   NORMAL: 1,
//   TEXCOORD_0: 2,

//   JOINTS_0: 3,
//   WEIGHTS_0: 4,
// };

const Type2NumOfComponent = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

// function getPipelineArgs(primitive, buffers) {
//   return {
//     topology: TinyGltfWebGpu.gpuPrimitiveTopologyForMode(primitive.mode),
//     buffers,
//   };
// }
// class DrawObject

export async function init(context: GPUCanvasContext, device: GPUDevice) {
  // hacky workaround for vitepress build
  const OrbitCamera = (await import('../src/utils/orbitCamera')).default;
  const { TinyGltf, AABB } = await import('../src/utils/tiny-gltf');

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

    // Used by animation lookup
    nodeIdx2JointIdx: { [key: number]: number } = {};

    bindGroup: GPUBindGroup;

    updateJointMatricesDynamicBuffer() {
      device.queue.writeBuffer(
        this.jointMatricesDynamicBuffer,
        0,
        this.jointMatrices.buffer
      );
    }

    constructor(gltf, skin) {
      const numJoints: number = skin.joints.length;

      this.jointMatrices = new Float32Array(16 * numJoints);
      for (const [jointIdx, nodeIdx] of skin.joints.entries()) {
        // nodeIdx2SkinIdx[nodeIdx] = idx;

        // update matrix for joint nodes in order
        this.jointMatrices.set(gltf.nodes[nodeIdx].worldMatrix, 16 * jointIdx);
        this.nodeIdx2JointIdx[nodeIdx] = jointIdx;
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

      this.updateJointMatricesDynamicBuffer();

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

  const positionTextureFormat = 'rgba32float';
  // const positionTextureSize = [1024, 1024];
  const positionTextureSize = [context.canvas.width, context.canvas.height];
  const positionTexture = device.createTexture({
    size: positionTextureSize,
    format: positionTextureFormat,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const depthTexture = device.createTexture({
    size: [context.canvas.width, context.canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  assert(context.canvas instanceof HTMLCanvasElement);
  const camera = new OrbitCamera(context.canvas);

  const loader = new TinyGltf();
  const gltf = await loader.loadFromUrl(gltfUrl);
  // const sceneAabb = gltf.scenes[gltf.scene].aabb;
  // console.log(sceneAabb);
  // Temp hack for gltf with only skinned mesh
  // The aabb computed for static mesh is not correct anymore.
  const sceneAabb = new AABB({
    min: new Float32Array([
      -2.878838062286377, -0.021465064957737923, -3.228097915649414,
    ]),
    max: new Float32Array([
      2.8631608486175537, 11.281305313110352, 3.417842388153076,
    ]),
  });

  console.log(gltf);

  camera.target = sceneAabb.center;
  // camera.maxDistance = sceneAabb.radius * 2.0;
  camera.maxDistance = sceneAabb.radius * 8.0;
  camera.minDistance = sceneAabb.radius * 0.25;
  // if (url.includes('Sponza')) {
  //   camera.distance = camera.minDistance;
  // } else {
  // camera.distance = sceneAabb.radius * 1.5;
  camera.distance = sceneAabb.radius * 2.5;
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

  // // For animating purpose
  // interface Node {
  //   children: Node[];

  //   scale: vec3,
  //   rotation: vec3,
  //   translation: vec3,

  //   matrix: mat4,
  // };
  // const sceneNodes: Node[] = [];

  interface AnimationSampler {
    // Only takes care of float32 type
    // Assume linear interpolation
    input: Float32Array;
    output: Float32Array;

    outputCount: number; // 4->quad.lerp, 3->vec.lerp

    endT: number;
    inputMax: number;

    // lerp(idx, idx+1)
    idx: number;
  }

  interface AnimationChannel {
    sampler: AnimationSampler;
    target: 'rotation' | 'translation' | 'scale';
    // for joint node transform only
    // This is idx in SkinObject.jointMatrices dynamic buffer
    jointIdx: number;

    // node idx in gltf scene node graph
    nodeIdx: number;
  }

  const animationOutputValueVec4a = vec4.create();
  const animationOutputValueVec4b = vec4.create();
  const lerpResult = vec4.create();

  class Animation {
    channels: Array<AnimationChannel> = [];
    skin: SkinObject;

    // Need to maintain a node tree to update matrix for animation
    // nodes: any;

    constructor(gltf, animation, skin: SkinObject) {
      function getGltfBufferByte(accessorIndex) {
        const accessor = gltf.accessors[accessorIndex];
        const bufferView = gltf.bufferViews[accessor.bufferView];
        return new Float32Array(
          gltf.buffers[bufferView.buffer],
          bufferView.byteOffset + (accessor.byteOffset ?? 0),
          bufferView.byteLength / 4
        );
        // return new Uint8Array(
        //   gltf.buffers[bufferView.buffer],
        //   bufferView.byteOffset + (accessor.byteOffset ?? 0),
        //   bufferView.byteLength
        // );
      }
      // this.nodes = gltf.nodes;
      // this.gltf = gltf;
      this.skin = skin;

      // const samplerIdx2Samplers: { [key: number]: AnimationSampler } = {};

      for (const c of animation.channels) {
        const nodeIdx = c.target.node;

        // if (!(nodeIdx in skin.nodeIdx2JointIdx)) {
        //   console.error('Unrelated animation target nodeIdx: ', nodeIdx);
        // }

        // let sampler: AnimationSampler;
        // if (c.sampler in samplerIdx2Samplers) {
        //   const s = animation.samplers[c.sampler];
        //   sampler = {
        //     input: new Float32Array(getGltfBufferByte(s.input).buffer),
        //     output: new Float32Array(getGltfBufferByte(s.output).buffer),

        //     idx: 0,
        //   };
        // } else {
        //   sampler = samplerIdx2Samplers[c.sampler];
        // }

        const s = animation.samplers[c.sampler];
        const sampler: AnimationSampler = {
          // input: new Float32Array(getGltfBufferByte(s.input).buffer),
          // output: new Float32Array(getGltfBufferByte(s.output).buffer),
          input: getGltfBufferByte(s.input),
          output: getGltfBufferByte(s.output),
          outputCount: Type2NumOfComponent[gltf.accessors[s.output].type],

          idx: 0,

          endT: 0,
          inputMax: 0,
        };

        sampler.endT = sampler.input[sampler.input.length - 1];
        sampler.inputMax = sampler.endT - sampler.input[0];

        // console.log(sampler);

        const channel: AnimationChannel = {
          nodeIdx,
          jointIdx: skin.nodeIdx2JointIdx[nodeIdx],
          target: c.target.path,
          sampler,
        };

        this.channels.push(channel);
      }
    }

    private parseNode(nodeIdx, parentMatrix) {
      const node = gltf.nodes[nodeIdx];
      // assume roation, translation, scale
      mat4.fromRotationTranslationScale(
        node.localMatrix,
        node.rotation,
        node.translation,
        node.scale
      );

      mat4.multiply(node.worldMatrix, parentMatrix, node.localMatrix);

      if (nodeIdx in this.skin.nodeIdx2JointIdx) {
        // update matrix
        const jointIdx = this.skin.nodeIdx2JointIdx[nodeIdx];
        this.skin.jointMatrices.set(node.worldMatrix, 16 * jointIdx);
      }

      if (node.children) {
        for (const childIdx of node.children) {
          this.parseNode(childIdx, node.worldMatrix);
        }
      }
    }

    update(curTime: number) {
      // Get value from sampler and channel
      for (const c of this.channels) {
        let t = curTime;
        const s = c.sampler;

        // LINEAR
        const target = gltf.nodes[c.nodeIdx][c.target];
        if (!target) {
          console.error('Unsupported animation channel target ', c.target);
        }

        const len = s.input.length;
        if (len > 1) {
          if (t > s.endT) {
            t -= s.inputMax * Math.ceil((t - s.endT) / s.inputMax);
            s.idx = 0;
          }

          while (s.idx <= len - 2 && t >= s.input[s.idx + 1]) {
            s.idx++;
          }

          if (s.idx >= len - 1) {
            // loop
            t -= s.inputMax;
            s.idx = 0;
          }

          // const v4lerp = s.outputCount === 4 ? quat.slerp : vec4.lerp;

          const i = s.idx;
          const o = i * s.outputCount;
          const on = o + s.outputCount;

          const u = Math.max(0, t - s.input[i]) / (s.input[i + 1] - s.input[i]);

          for (let j = 0; j < s.outputCount; j++) {
            animationOutputValueVec4a[j] = s.output[o + j];
            animationOutputValueVec4b[j] = s.output[on + j];
          }

          if (s.outputCount === 4) {
            // quat
            quat.slerp(
              lerpResult,
              animationOutputValueVec4a,
              animationOutputValueVec4b,
              u
            );
          } else {
            // translate, scale, (vec3)
            vec4.lerp(
              lerpResult,
              animationOutputValueVec4a,
              animationOutputValueVec4b,
              u
            );
          }
        } else {
          t = s.input[0];
          s.idx = 0;
          for (let j = 0; j < s.outputCount; j++) {
            lerpResult[j] = s.output[j];
          }
        }

        if (s.outputCount === 4) {
          // quat
          vec4.copy(target, lerpResult);
        } else {
          // translate, scale, (vec3)
          vec3.set(target, lerpResult[0], lerpResult[1], lerpResult[2]);
        }
      }

      // Parse scene node to reflect transform hierachy
      for (const nodeIdx of gltf.scenes[0].nodes) {
        this.parseNode(nodeIdx, mat4.create());
      }

      this.skin.updateJointMatricesDynamicBuffer();
    }
  }

  function processGltfModel(gltf) {
    interface GPUBufferSetup {
      curOffset: number;
      mapped: Uint8Array;
    }

    // let printed = false;

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

      // console.log(new Float32Array(gpuBufferSetup.mapped.buffer));

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
        // console.log(skinObjects[skinObjects.length - 1]);
      }

      // temp, striking animation
      if (gltf.animations) {
        // const animation = gltf.animations[42];
        // const animation = gltf.animations[14];  // forward dribble
        // const animation = gltf.animations[16];  // juggle
        // const animation = gltf.animations[17];  // strike
        // const animation = gltf.animations[20]; //
        const animation = gltf.animations[0]; //
        console.log(animation);
        curAnimation = new Animation(gltf, animation, skinObjects[0]);
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

        assert('POSITION' in primitive.attributes);
        assert('NORMAL' in primitive.attributes);
        assert('TEXCOORD_0' in primitive.attributes);

        // if (!('POSITION' in primitive.attributes)) {
        //   console.error(
        //     'Unsupported: gltf model mesh primitive has no POSITION attribute'
        //   );
        // }
        // if (!('NORMAL' in primitive.attributes)) {
        //   console.error(
        //     'Unsupported: gltf model mesh primitive has no NORMAL attribute'
        //   );
        // }
        // if (!('TEXCOORD_0' in primitive.attributes)) {
        //   console.error(
        //     'Unsupported: gltf model mesh primitive has no TEXCOORD_0 attribute'
        //   );
        // }

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
          // console.log(sd);
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

  let curAnimation: Animation;
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

  const staticMeshVertexBufferLayout: GPUVertexBufferLayout[] = [
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
  ];

  const staticMeshPipeline = device.createRenderPipeline({
    label: 'Static Mesh',
    layout: device.createPipelineLayout({
      label: 'Static Mesh',
      bindGroupLayouts: [frameBindGroupLayout, staticStorageBindGroupLayout],
    }),
    vertex: {
      module: staticMeshVertexModule,
      entryPoint: 'vertexMain',
      buffers: staticMeshVertexBufferLayout,
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

  const skinnedMeshVertexBufferLayout: GPUVertexBufferLayout[] = [
    ...staticMeshVertexBufferLayout,
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
  ];

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
      buffers: skinnedMeshVertexBufferLayout,
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

  const skinnedMeshWriteParticlePositionTextureModule =
    device.createShaderModule({
      code: skinnedMeshParticleWGSL,
    });

  const skinnedMeshWriteParticlePositionTexturePipeline =
    device.createRenderPipeline({
      label: 'Skinned Mesh Write Particle Position',
      layout: device.createPipelineLayout({
        label: 'Skinned Mesh Write Particle Position',
        bindGroupLayouts: [
          frameBindGroupLayout,
          staticStorageBindGroupLayout,
          skinBindGroupLayout,
        ],
      }),
      vertex: {
        module: skinnedMeshWriteParticlePositionTextureModule,
        entryPoint: 'vertexMain',
        buffers: skinnedMeshVertexBufferLayout,
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',
        // cullMode: 'back',
      },
      multisample: {
        count: 1,
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
      fragment: {
        module: skinnedMeshWriteParticlePositionTextureModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            // TODO: use float32
            // format: presentationFormat,
            format: positionTextureFormat,
          },
        ],
      },
    });

  // Particle stuff

  const numParticles = 100000;
  const particlePositionOffset = 0;
  const particleColorOffset = 4 * 4;
  const particleInstanceByteSize =
    3 * 4 + // position
    1 * 4 + // lifetime
    4 * 4 + // color
    3 * 4 + // velocity
    1 * 4 + // padding
    0;

  const particlesBuffer = device.createBuffer({
    size: numParticles * particleInstanceByteSize,
    // usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
    usage:
      GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,

    mappedAtCreation: true,
  });

  // TEMP: test particlesBuffer
  // let tempParticlePositions = new Float32Array([1.8367099231598242e-40, 5.605193857299268e-45, 4.5918308598381336e-40, 5.510157795448759e-40, 1.8368360400216135e-40, 3.673545963181438e-40, 8.265250706157782e-40, 3.673573989150724e-40, 1.1938768643369933e-39, 3.673489911242865e-40, 4.591956976699923e-40, 1.3775506592499044e-39, 1.56123566455053e-39, 2.112247240200013e-39, 2.2040827363580042e-39, 2.3877579325693796e-39, 2.295925239008317e-39, 2.5714317274822907e-39, 2.2959140286206025e-39, 1.744913663358834e-39, 1.8367491595168253e-39, 2.7551055223952018e-39, 2.6632728288341392e-39, 2.938779317308113e-39, 2.6632658223418176e-39, 2.38776774165863e-39, 2.479603237816621e-39, 3.122453112221024e-39, 3.0306204186599614e-39, 3.306126907133935e-39, 3.03062322125689e-39, 3.3979638045903905e-39, 3.489799300748382e-39, 2.0204145466389504e-39, 2.204056111687182e-39, 9.183970005338419e-41, 3.214292812274408e-39, 3.306135314924721e-39, 3.9489837880306594e-39, 1.9285762478840306e-39, 2.0203921258635213e-39, 2.7551769886168823e-40, 2.5714219183930404e-39, 1.8367239361444675e-39, 6.428624860905817e-40, 2.4795976326227638e-39, 2.5714107080053258e-39, 9.18371777161484e-40, 2.9387737121142555e-39, 2.4795780144442633e-39, 1.1020455720743951e-39, 2.846945222448586e-39, 2.938758297831148e-39, 1.2857193669873062e-39, 3.306131111029328e-39, 3.489809109837632e-39, 4.1326575829435705e-39, 2.1122710622739065e-39, 3.581631994309444e-39, 3.030619017361497e-39, 2.2040841376564685e-39, 2.1122654570800492e-39, 3.1224559148179526e-39, 3.581626389115587e-39, 2.755111127589059e-39, 3.3979596006949975e-39, 2.7551083249921304e-39, 2.8469522289409076e-39, 3.489800702046846e-39, 9.1869127321135e-41, 2.2041093610288264e-39, 3.21429981876673e-39, 4.5917748078995606e-40, 5.885453550164232e-44, 3.67347870085515e-39, 1.3775394488621898e-39, 4.5923913792238635e-40, 3.857152495768061e-39, 2.8469228016731568e-39, 1.4694211878695037e-39, 4.132650576451249e-39, 4.408168275312937e-39, 4.2245014868923476e-39, 4.5918434715243125e-39, 4.5000093766647856e-39, 4.5918476754197055e-39, 4.95918966005167e-39, 5.234691944630251e-39, 4.5000219883509645e-39, 4.775528476824938e-39, 5.6020325279637515e-39, 4.4081836895960447e-39, 4.500019185754036e-39, 5.87756003591469e-39, 5.7857273423536274e-39, 6.153069326985592e-39, 6.428581420653423e-39, 6.33673891800311e-39, 5.785725941055163e-39, 6.612255215566334e-39]);

  // const particlesBuffer = device.createBuffer({
  //   size: numParticles * particleInstanceByteSize,
  //   usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
  //   // usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  //   mappedAtCreation: true,
  // });
  const tempParticlePositions = new Float32Array(
    particlesBuffer.getMappedRange()
  );
  const aabbExtent = vec3.create();
  vec3.subtract(aabbExtent, sceneAabb.max, sceneAabb.min);
  for (let i = 0; i < numParticles; i++) {
    const o = (i * particleInstanceByteSize) / 4;
    tempParticlePositions[o] = Math.random() * aabbExtent[0] + sceneAabb.min[0];
    tempParticlePositions[o + 1] =
      Math.random() * aabbExtent[1] + sceneAabb.min[1];
    tempParticlePositions[o + 2] =
      Math.random() * aabbExtent[2] + sceneAabb.min[2];

    // velocity
    tempParticlePositions[o + 9] = 0;
    tempParticlePositions[o + 10] = 0;
    tempParticlePositions[o + 11] = 0;
  }
  // console.log(tempParticlePositions);
  particlesBuffer.unmap();

  // device.queue.writeBuffer(particlesBuffer, 0, tempParticlePositions);

  const particleComputePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: device.createShaderModule({
        code: particleWGSL,
      }),
      entryPoint: 'simulate',
    },
  });

  const simulationParams = {
    simulate: true,
    deltaTime: 0.04,
  };

  const simulationUBOBufferSize =
    1 * 4 + // deltaTime
    3 * 4 + // padding
    4 * 4 + // seed
    0;
  const simulationUBOBuffer = device.createBuffer({
    size: simulationUBOBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    simulationUBOBuffer,
    0,
    new Float32Array([
      simulationParams.simulate ? simulationParams.deltaTime : 0.0,
      0.0,
      0.0,
      0.0, // padding
      Math.random() * 100,
      Math.random() * 100, // seed.xy
      1 + Math.random(),
      1 + Math.random(), // seed.zw
    ])
  );

  const particleComputeBindGroup = device.createBindGroup({
    layout: particleComputePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: simulationUBOBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: particlesBuffer,
          offset: 0,
          size: numParticles * particleInstanceByteSize,
        },
      },
      {
        binding: 2,
        resource: positionTexture.createView(),
      },
    ],
  });

  const quadVertexBuffer = device.createBuffer({
    size: 6 * 2 * 4, // 6x vec2<f32>
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  // prettier-ignore
  const vertexData = [
    -1.0, -1.0, +1.0, -1.0, -1.0, +1.0, -1.0, +1.0, +1.0, -1.0, +1.0, +1.0,
  ];
  new Float32Array(quadVertexBuffer.getMappedRange()).set(vertexData);
  quadVertexBuffer.unmap();

  // device.queue.writeBuffer(
  //   quadVertexBuffer,
  //   0,
  //   new Float32Array(vertexData),
  // );

  const particleRenderPipeline = device.createRenderPipeline({
    label: 'Particle render pipeline',
    layout: device.createPipelineLayout({
      label: 'Particle render pipeline',
      bindGroupLayouts: [frameBindGroupLayout],
    }),
    vertex: {
      module: device.createShaderModule({
        code: particleWGSL,
      }),
      entryPoint: 'vs_main',
      buffers: [
        {
          // instanced particles buffer
          arrayStride: particleInstanceByteSize,
          stepMode: 'instance',
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: particlePositionOffset,
              format: 'float32x3',
            },
            {
              // color
              shaderLocation: 1,
              offset: particleColorOffset,
              format: 'float32x4',
            },
          ],
        },
        {
          // quad vertex buffer
          arrayStride: 2 * 4, // vec2<f32>
          stepMode: 'vertex',
          attributes: [
            {
              // vertex positions
              shaderLocation: 2,
              offset: 0,
              format: 'float32x2',
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: particleWGSL,
      }),
      entryPoint: 'fs_main',
      targets: [
        {
          format: presentationFormat,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'zero',
              dstFactor: 'one',
              operation: 'add',
            },
          },
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },

    // depthStencil: {
    //   depthWriteEnabled: false,
    //   // depthCompare: 'less',
    //   depthCompare: 'always',
    //   format: 'depth24plus',
    // },
  });

  // upload gltf models buffer to renderer buffer, and process draw info
  let prevTime = performance.now() * 0.001;
  let curTime = 0;

  function frame(t: number) {
    t *= 0.001;
    const commandEncoder = device.createCommandEncoder();
    // const textureView = context.getCurrentTexture().createView();
    const textureView = positionTexture.createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          // clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          clearValue: { r: 99999.0, g: 99999.0, b: 99999.0, a: 1.0 },
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
    timeArray[0] = curTime;

    if (curAnimation) {
      curAnimation.update(curTime);
    }

    curTime += t - prevTime;
    prevTime = t;

    device.queue.writeBuffer(frameUniformBuffer, 0, frameArrayBuffer);

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setBindGroup(0, frameBindGroup);

    // Draw static mesh object
    // TODO: sort by material
    passEncoder.setBindGroup(1, staticStorageBindGroup);

    // if (staticMeshDrawObjects.length > 0) {
    //   passEncoder.setPipeline(staticMeshPipeline);
    //   for (const d of staticMeshDrawObjects) {
    //     // for (const [idx, vb] of d.vertexBuffers.entries()) {
    //     for (let idx = 0; idx < d.vertexBuffers.length; idx++) {
    //       const vb = d.vertexBuffers[idx];
    //       // console.log(idx, vertexBuffer, vb.offset, vb.size);
    //       passEncoder.setVertexBuffer(idx, vertexBuffer, vb.offset, vb.size);
    //     }
    //     passEncoder.setIndexBuffer(
    //       indexBuffer,
    //       'uint16',
    //       d.indexOffset,
    //       d.indexSize
    //     );

    //     passEncoder.drawIndexed(
    //       d.drawIndexedCount,
    //       d.instanceCount,
    //       0,
    //       0,
    //       d.firstInstance
    //     );
    //     // passEncoder.drawIndexed(d.drawIndexedCount);
    //   }
    // }

    // Draw skinned mesh
    // passEncoder.setPipeline(skinnedMeshPipeline);
    passEncoder.setPipeline(skinnedMeshWriteParticlePositionTexturePipeline);
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

    // Particle simulation
    {
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(particleComputePipeline);
      passEncoder.setBindGroup(0, particleComputeBindGroup);
      passEncoder.dispatchWorkgroups(Math.ceil(numParticles / 64));
      passEncoder.end();
    }

    // Particle draw
    {
      const particleRenderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
        // depthStencilAttachment: {
        //   view: depthTexture.createView(),

        //   depthClearValue: 1.0,
        //   depthLoadOp: 'clear',
        //   depthStoreOp: 'store',
        // },
      };
      const passEncoder = commandEncoder.beginRenderPass(
        particleRenderPassDescriptor
      );
      passEncoder.setPipeline(particleRenderPipeline);
      passEncoder.setBindGroup(0, frameBindGroup);
      passEncoder.setVertexBuffer(0, particlesBuffer);
      passEncoder.setVertexBuffer(1, quadVertexBuffer);
      passEncoder.draw(6, numParticles, 0, 0);
      passEncoder.end();
    }

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
