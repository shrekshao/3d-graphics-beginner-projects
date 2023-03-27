// import { makeSample, SampleInit } from '../../components/SampleLayout';

// import triangleVertWGSL from '../../shaders/triangle.vert.wgsl';
// import redFragWGSL from '../../shaders/red.frag.wgsl';

// temp
const triangleVertWGSL = `
@vertex
fn main(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
    vec2(0.0, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5)
  );

  return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}
`;

const redFragWGSL = `
@fragment
fn main() -> @location(0) vec4<f32> {
  return vec4(1.0, 0.0, 0.0, 1.0);
}
`;

// const init: SampleInit = async ({ canvas, pageState }) => {
const init = async ({ canvas, pageState }) => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  if (!pageState.active) return;
  const context = canvas.getContext('webgpu') as GPUCanvasContext;

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'opaque',
  });

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: triangleVertWGSL,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: redFragWGSL,
      }),
      entryPoint: 'main',
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  function frame() {
    // Sample is no longer the active page.
    if (!pageState.active) return;

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
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
};

// export default init;
export default init;
// export init;

// const HelloTriangle: () => JSX.Element = () =>
//   makeSample({
//     name: 'Hello Triangle',
//     description: 'Shows rendering a basic triangle.',
//     init,
//     sources: [
//       {
//         name: __filename.substring(__dirname.length + 1),
//         contents: __SOURCE__,
//       },
//       {
//         name: '../../shaders/triangle.vert.wgsl',
//         contents: triangleVertWGSL,
//         editable: true,
//       },
//       {
//         name: '../../shaders/red.frag.wgsl',
//         contents: redFragWGSL,
//         editable: true,
//       },
//     ],
//     filename: __filename,
//   });

// export default HelloTriangle;
