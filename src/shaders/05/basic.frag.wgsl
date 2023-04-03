struct FragmentInput {
  @builtin(position) position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) texcoord : vec2<f32>,
};

// Some hardcoded lighting
const lightDir = vec3(0.25, 0.5, 1.0);
const lightColor = vec3(1.0, 1.0, 1.0);
const ambientColor = vec3(0.1, 0.1, 0.1);

@fragment
fn fragmentMain(input : FragmentInput) -> @location(0) vec4<f32> {
  // An extremely simple directional lighting model, just to give our model some shape.
  let N = normalize(input.normal);
  let L = normalize(lightDir);
  let NDotL = max(dot(N, L), 0.0);
  // let surfaceColor = ambientColor + NDotL;
  let surfaceColor = vec3(input.texcoord.xy, 0.0);

  return vec4(surfaceColor, 1.0);
  // return vec4(1.0, 1.0, 1.0, 1.0);
}