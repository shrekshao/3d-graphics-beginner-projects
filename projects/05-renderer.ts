// import triangleVertWGSL from '../src/shaders/triangle.vert.wgsl';
// import fragWGSL from '../src/shaders/red.frag.wgsl';
// import shaderWGSL from '../src/shaders/05/code.wgsl';

import { TinyGltfWebGpu } from '../src/utils/tiny-gltf';
import OrbitCamera from '../src/utils/orbitCamera';
import { mat4 } from 'gl-matrix';
import shaderWGSL from '../src/shaders/05/code.wgsl';

// const gltfUrl = '../assets/gltf/Buggy.glb';
// const gltfUrl = '../assets/gltf/di-player-test.glb';
const gltfUrl = '../assets/gltf/DamagedHelmet.glb';

// Shader locations and source are unchanged from the previous sample.
const ShaderLocations = {
  POSITION: 0,
  NORMAL: 1,
  TEXCOORD_0: 2,

  // JOINTS_0: 3,
  // WEIGHTS_0: 4,
};

function setupMeshNode(gltf, node, primitiveInstances) {
  const mesh = gltf.meshes[node.mesh];
  for (const primitive of mesh.primitives) {
    let instances = primitiveInstances.matrices.get(primitive);
    if (!instances) {
      instances = [];
      primitiveInstances.matrices.set(primitive, instances);
    }
    instances.push(node.worldMatrix);
  }
  // Make sure to add the number of matrices used for this mesh to the total.
  primitiveInstances.total += mesh.primitives.length;
}

function setupPrimitiveInstances(primitive, primitiveInstances) {
  // Get the list of instance transform matricies for this primitive.
  const instances = primitiveInstances.matrices.get(primitive);

  const first = primitiveInstances.offset;
  const count = instances.length;

  // Place the matrices in the instances buffer at the given offset.
  for (let i = 0; i < count; ++i) {
    primitiveInstances.arrayBuffer.set(instances[i], (first + i) * 16);
  }

  // Update the offset for the next primitive.
  primitiveInstances.offset += count;

  // Return the index of the first instance and the count.
  return { first, count };
}

function getPipelineArgs(primitive, buffers) {
  return {
    topology: TinyGltfWebGpu.gpuPrimitiveTopologyForMode(primitive.mode),
    buffers,
  };
}

export async function init(context: GPUCanvasContext, device: GPUDevice) {
  // console.log(device);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'opaque',
  });

  const camera = new OrbitCamera(context.canvas);

  const loader = new TinyGltfWebGpu(device);
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

  const pipelineGpuData = new Map();

  const instanceBindGroupLayout = device.createBindGroupLayout({
    label: `glTF Instance BindGroupLayout`,
    entries: [
      {
        binding: 0, // Node uniforms
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'read-only-storage' },
      },
    ],
  });

  const gltfPipelineLayout = device.createPipelineLayout({
    label: 'glTF Pipeline Layout',
    bindGroupLayouts: [frameBindGroupLayout, instanceBindGroupLayout],
  });

  const primitiveInstances = {
    matrices: new Map(), // The instance matrices for each primitive.
    total: 0, // The total number of instance matrices.
    arrayBuffer: null, // The array buffer that the matrices will be placed in.
    offset: 0, // The offset (in matrices) of the last matrix written into arrayBuffer.
  };

  for (const node of gltf.nodes) {
    if ('mesh' in node) {
      setupMeshNode(gltf, node, primitiveInstances);
    }
  }

  //////////////////////////////////////
  // Create a buffer large enough to contain all the instance matrices for the entire scene.
  const instanceBuffer = device.createBuffer({
    size: 16 * Float32Array.BYTES_PER_ELEMENT * primitiveInstances.total,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  // Map the instance matrices buffer so we can write all the matrices into it.
  primitiveInstances.arrayBuffer = new Float32Array(
    instanceBuffer.getMappedRange()
  );

  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      setupPrimitive(gltf, primitive, primitiveInstances);
    }
  }

  // console.log(primitiveInstances.arrayBuffer);

  // Unmap the buffer when we're finished writing all the instance matrices.
  instanceBuffer.unmap();

  // Create a bind group for the instance buffer.
  const instanceBindGroup = device.createBindGroup({
    label: `glTF Instance BindGroup`,
    layout: instanceBindGroupLayout,
    entries: [
      {
        binding: 0, // Instance storage buffer
        resource: { buffer: instanceBuffer },
      },
    ],
  });

  //////////////////////////////////////////////////////

  function setupPrimitive(gltf, primitive, primitiveInstances) {
    const bufferLayout = new Map();
    const gpuBuffers = new Map();
    let drawCount = 0;

    for (const [attribName, accessorIndex] of Object.entries(
      primitive.attributes
    )) {
      const accessor = gltf.accessors[accessorIndex as number];
      const bufferView = gltf.bufferViews[accessor.bufferView];

      const shaderLocation = ShaderLocations[attribName];
      if (shaderLocation === undefined) {
        continue;
      }

      const offset = accessor.byteOffset;

      let buffer = bufferLayout.get(accessor.bufferView);
      let gpuBuffer;

      const separate =
        buffer &&
        Math.abs(offset - buffer.attributes[0].offset) >= buffer.arrayStride;
      if (!buffer || separate) {
        buffer = {
          arrayStride:
            bufferView.byteStride ||
            TinyGltfWebGpu.packedArrayStrideForAccessor(accessor),
          attributes: [],
        };

        bufferLayout.set(separate ? attribName : accessor.bufferView, buffer);
        gpuBuffers.set(buffer, {
          buffer: gltf.gpuBuffers[accessor.bufferView],
          offset,
        });
      } else {
        gpuBuffer = gpuBuffers.get(buffer);
        gpuBuffer.offset = Math.min(gpuBuffer.offset, offset);
      }

      buffer.attributes.push({
        shaderLocation,
        format: TinyGltfWebGpu.gpuFormatForAccessor(accessor),
        offset,
      });

      drawCount = accessor.count;
    }

    // Sort the attributes and buffers
    for (const buffer of bufferLayout.values()) {
      const gpuBuffer = gpuBuffers.get(buffer);
      for (const attribute of buffer.attributes) {
        attribute.offset -= gpuBuffer.offset;
      }
      buffer.attributes = buffer.attributes.sort((a, b) => {
        return a.shaderLocation - b.shaderLocation;
      });
    }
    const sortedBufferLayout = [...bufferLayout.values()].sort((a, b) => {
      return a.attributes[0].shaderLocation - b.attributes[0].shaderLocation;
    });

    console.log(sortedBufferLayout);

    // Ensure that the gpuBuffers are saved in the same order as the buffer layout.
    const sortedGpuBuffers = [];
    for (const buffer of sortedBufferLayout) {
      sortedGpuBuffers.push(gpuBuffers.get(buffer));
    }

    const gpuPrimitive = {
      buffers: sortedGpuBuffers,
      drawCount,
      instances: setupPrimitiveInstances(primitive, primitiveInstances),

      // Temp for typescript, optional stuff with indices
      indexBuffer: null,
      indexOffset: 0,
      indexType: null,
    };

    if ('indices' in primitive) {
      const accessor = gltf.accessors[primitive.indices];
      gpuPrimitive.indexBuffer = gltf.gpuBuffers[accessor.bufferView];
      gpuPrimitive.indexOffset = accessor.byteOffset;
      gpuPrimitive.indexType = TinyGltfWebGpu.gpuIndexFormatForComponentType(
        accessor.componentType
      );
      gpuPrimitive.drawCount = accessor.count;
    }

    const pipelineArgs = getPipelineArgs(primitive, sortedBufferLayout);
    const pipeline = getPipelineForPrimitive(pipelineArgs);
    pipeline.primitives.push(gpuPrimitive);

    // console.log(primitiveInstances);
  }

  function getPipelineForPrimitive(args) {
    const key = JSON.stringify(args);

    let pipeline = pipelineGpuData.get(key);
    if (pipeline) {
      return pipeline;
    }

    // const module = getShaderModule();
    const module = device.createShaderModule({
      code: shaderWGSL,
    });
    pipeline = device.createRenderPipeline({
      label: 'glTF renderer pipeline',
      layout: gltfPipelineLayout,
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: args.buffers,
      },
      primitive: {
        topology: args.topology,
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
        module,
        entryPoint: 'fragmentMain',
        targets: [
          {
            // format: this.app.colorFormat,
            format: presentationFormat,
          },
        ],
      },
    });

    const gpuPipeline = {
      pipeline,
      primitives: [], // Start tracking every primitive that uses this pipeline.
    };

    pipelineGpuData.set(key, gpuPipeline);

    return gpuPipeline;
  }

  const depthTexture = device.createTexture({
    size: [context.canvas.width, context.canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  function frame() {
    // Sample is no longer the active page.
    // if (!pageState.active) return;

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

    // Set the bind group containing all of the instance transforms.
    passEncoder.setBindGroup(1, instanceBindGroup);

    for (const gpuPipeline of pipelineGpuData.values()) {
      passEncoder.setPipeline(gpuPipeline.pipeline);

      for (const gpuPrimitive of gpuPipeline.primitives) {
        for (const [bufferIndex, gpuBuffer] of Object.entries(
          gpuPrimitive.buffers
        )) {
          // passEncoder.setVertexBuffer(bufferIndex, gpuBuffer.buffer, gpuBuffer.offset);
          // console.log(bufferIndex, gpuBuffer.buffer, gpuBuffer.offset);
          passEncoder.setVertexBuffer(
            bufferIndex,
            gpuBuffer.buffer,
            gpuBuffer.offset as number
          );
        }
        if (gpuPrimitive.indexBuffer) {
          passEncoder.setIndexBuffer(
            gpuPrimitive.indexBuffer,
            gpuPrimitive.indexType,
            gpuPrimitive.indexOffset
          );
        }

        // Every time we draw, pass an offset (in instances) into the instance buffer as the
        // "firstInstance" argument. This will change the initial instance_index passed to the
        // shader and ensure we pull the right transform matrices from the buffer.
        if (gpuPrimitive.indexBuffer) {
          // console.log(gpuPrimitive.drawCount, gpuPrimitive.instances.count, 0, 0, gpuPrimitive.instances.first);
          passEncoder.drawIndexed(
            gpuPrimitive.drawCount,
            gpuPrimitive.instances.count,
            0,
            0,
            gpuPrimitive.instances.first
          );
        } else {
          passEncoder.draw(
            gpuPrimitive.drawCount,
            gpuPrimitive.instances.count,
            0,
            gpuPrimitive.instances.first
          );
        }
      }
    }

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
