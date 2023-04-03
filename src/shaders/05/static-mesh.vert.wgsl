struct Camera {
  projection : mat4x4<f32>,
  view : mat4x4<f32>,
  position : vec3<f32>,
  time : f32,
};
@group(0) @binding(0) var<uniform> camera : Camera;

@group(1) @binding(0) var<storage> model : array<mat4x4<f32>>;

struct VertexInput {
  @builtin(instance_index) instance : u32,
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texcoord : vec2<f32>,
  // @location(${ShaderLocations.POSITION}) position : vec3<f32>,
  // @location(${ShaderLocations.NORMAL}) normal : vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) texcoord : vec2<f32>,
};

@vertex
fn vertexMain(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;

  let modelMatrix = model[input.instance];
  output.position = camera.projection * camera.view * modelMatrix * vec4(input.position, 1.0);
  output.normal = normalize((camera.view * modelMatrix * vec4(input.normal, 0.0)).xyz);
  output.texcoord = input.texcoord;

  return output;
}