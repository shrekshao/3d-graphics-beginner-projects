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
  // @location(${ShaderLocations.POSITION}) position : vec3<f32>,
  // @location(${ShaderLocations.NORMAL}) normal : vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) normal : vec3<f32>,
};

@vertex
fn vertexMain(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;

  let modelMatrix = model[input.instance];
  output.position = camera.projection * camera.view * modelMatrix * vec4(input.position, 1.0);
  output.normal = normalize((camera.view * modelMatrix * vec4(input.normal, 0.0)).xyz);

  return output;
}

// Some hardcoded lighting
const lightDir = vec3(0.25, 0.5, 1.0);
const lightColor = vec3(1.0, 1.0, 1.0);
const ambientColor = vec3(0.1, 0.1, 0.1);

@fragment
fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
  // An extremely simple directional lighting model, just to give our model some shape.
  let N = normalize(input.normal);
  let L = normalize(lightDir);
  let NDotL = max(dot(N, L), 0.0);
  let surfaceColor = ambientColor + NDotL;

  return vec4(surfaceColor, 1.0);
}