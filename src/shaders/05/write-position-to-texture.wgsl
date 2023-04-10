struct Camera {
  projection : mat4x4<f32>,
  view : mat4x4<f32>,
  position : vec3<f32>,
  time : f32,
};
@group(0) @binding(0) var<uniform> camera : Camera;

@group(1) @binding(0) var<storage> model : array<mat4x4<f32>>;

@group(2) @binding(0) var<storage> inverseBindMatrices : array<mat4x4<f32>>;

@group(2) @binding(1) var<storage> joints : array<mat4x4<f32>>;


struct VertexInput {
  @builtin(instance_index) instance : u32,
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texcoord : vec2<f32>,

  @location(3) joints0 : vec4<u32>,
  @location(4) weights0 : vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) worldPosition : vec3<f32>,
  // @location(0) normal : vec3<f32>,
  // @location(1) texcoord : vec2<f32>,
};

@vertex
fn vertexMain(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  
  let skinMatrix = 
    input.weights0.x * joints[input.joints0.x] * inverseBindMatrices[input.joints0.x] +
    input.weights0.y * joints[input.joints0.y] * inverseBindMatrices[input.joints0.y] +
    input.weights0.z * joints[input.joints0.z] * inverseBindMatrices[input.joints0.z] +
    input.weights0.w * joints[input.joints0.w] * inverseBindMatrices[input.joints0.w];

  let modelMatrix = skinMatrix;
  let worldPosition = modelMatrix * vec4(input.position, 1.0);

  // let uv = input.texcoord.xy;
  let uv = (input.texcoord.xy * 2.0) - vec2f(1, 1);
  output.position = vec4<f32>(uv, 0.0, 1.0);

  output.worldPosition = worldPosition.xyz / worldPosition.w;

  return output;
}


// @binding(1) @group(0) var<storage, read_write> data : Particles;

@fragment
fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
  return vec4f(input.worldPosition.xyz, 1.0);
}