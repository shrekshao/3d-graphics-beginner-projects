import{_ as Te}from"./chunks/gpu-canvas.vue_vue_type_script_setup_true_lang.83420e45.js";import{s as Oe,a2 as re,d as Ge,c as Ae,G as Ve,b as Le,z as ne,a as Ie,o as Ue}from"./chunks/framework.afa996b7.js";import{c as j,s as Re,a as Ce,b as ke,d as je,e as ze,p as Fe,f as Ne,m as De,g as qe,l as We,h as Ye,i as Xe,j as Je}from"./chunks/quat.b941390c.js";const He=`struct Camera {\r
  projection : mat4x4<f32>,\r
  view : mat4x4<f32>,\r
  position : vec3<f32>,\r
  time : f32,\r
};\r
@group(0) @binding(0) var<uniform> camera : Camera;\r
\r
@group(1) @binding(0) var<storage> model : array<mat4x4<f32>>;\r
\r
@group(2) @binding(0) var<storage> inverseBindMatrices : array<mat4x4<f32>>;\r
\r
@group(2) @binding(1) var<storage> joints : array<mat4x4<f32>>;\r
\r
\r
struct VertexInput {\r
  @builtin(instance_index) instance : u32,\r
  @location(0) position : vec3<f32>,\r
  @location(1) normal : vec3<f32>,\r
  @location(2) texcoord : vec2<f32>,\r
\r
  @location(3) joints0 : vec4<u32>,\r
  @location(4) weights0 : vec4<f32>,\r
};\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) worldPosition : vec3<f32>,\r
  // @location(0) normal : vec3<f32>,\r
  // @location(1) texcoord : vec2<f32>,\r
};\r
\r
@vertex\r
fn vertexMain(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  \r
  let skinMatrix = \r
    input.weights0.x * joints[input.joints0.x] * inverseBindMatrices[input.joints0.x] +\r
    input.weights0.y * joints[input.joints0.y] * inverseBindMatrices[input.joints0.y] +\r
    input.weights0.z * joints[input.joints0.z] * inverseBindMatrices[input.joints0.z] +\r
    input.weights0.w * joints[input.joints0.w] * inverseBindMatrices[input.joints0.w];\r
\r
  let modelMatrix = skinMatrix;\r
  let worldPosition = modelMatrix * vec4(input.position, 1.0);\r
\r
  // let uv = input.texcoord.xy;\r
  let uv = (input.texcoord.xy * 2.0) - vec2f(1, 1);\r
  output.position = vec4<f32>(uv, 0.0, 1.0);\r
\r
  output.worldPosition = worldPosition.xyz / worldPosition.w;\r
\r
  return output;\r
}\r
\r
\r
// @binding(1) @group(0) var<storage, read_write> data : Particles;\r
\r
@fragment\r
fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {\r
  return vec4f(input.worldPosition.xyz, 1.0);\r
}`,z=`////////////////////////////////////////////////////////////////////////////////\r
// Utilities\r
////////////////////////////////////////////////////////////////////////////////\r
var<private> rand_seed : vec2<f32>;\r
\r
fn init_rand(invocation_id : u32, seed : vec4<f32>) {\r
  rand_seed = seed.xz;\r
  rand_seed = fract(rand_seed * cos(35.456+f32(invocation_id) * seed.yw));\r
  rand_seed = fract(rand_seed * cos(41.235+f32(invocation_id) * seed.xw));\r
}\r
\r
fn rand() -> f32 {\r
  rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);\r
  rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);\r
  return rand_seed.y;\r
}\r
\r
////////////////////////////////////////////////////////////////////////////////\r
// Vertex shader\r
////////////////////////////////////////////////////////////////////////////////\r
\r
// struct RenderParams {\r
//   modelViewProjectionMatrix : mat4x4<f32>,\r
//   right : vec3<f32>,\r
//   up : vec3<f32>\r
// }\r
\r
// @binding(0) @group(0) var<uniform> render_params : RenderParams;\r
\r
struct Camera {\r
  projection : mat4x4<f32>,\r
  view : mat4x4<f32>,\r
  position : vec3<f32>,\r
  time : f32,\r
};\r
@group(0) @binding(0) var<uniform> camera : Camera;\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) color : vec4<f32>,\r
  @location(2) quad_pos : vec2<f32>, // -1..+1\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) color : vec4<f32>,\r
  @location(1) quad_pos : vec2<f32>, // -1..+1\r
}\r
\r
@vertex\r
fn vs_main(in : VertexInput) -> VertexOutput {\r
  // var quad_pos = mat2x3<f32>(render_params.right, render_params.up) * in.quad_pos;\r
  // var position = in.position + quad_pos * 0.01;\r
  // var out : VertexOutput;\r
  // out.position = render_params.modelViewProjectionMatrix * vec4<f32>(position, 1.0);\r
  // out.color = in.color;\r
  // out.quad_pos = in.quad_pos;\r
  // return out;\r
\r
  var out : VertexOutput;\r
  // out.position = vec4f(in.quad_pos, 0.0, 1.0);\r
\r
  let d = in.position - camera.position;\r
  let up = vec3f(0, 1, 0);\r
  let right = normalize(cross(d, up));\r
\r
  var quad_pos = mat2x3<f32>(vec3f(1, 0, 0), vec3f(0, 1, 0)) * in.quad_pos;\r
  out.position = camera.projection * camera.view * vec4f(in.position + quad_pos * 0.015, 1.0);\r
  // out.color = vec4f(1.0, 1.0, 0.0, 1.0);\r
  out.color = in.color;\r
  out.quad_pos = in.quad_pos;\r
  return out;\r
}\r
\r
////////////////////////////////////////////////////////////////////////////////\r
// Fragment shader\r
////////////////////////////////////////////////////////////////////////////////\r
@fragment\r
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {\r
  var color = in.color;\r
  // Apply a circular particle alpha mask\r
  color.a = color.a * max(1.0 - length(in.quad_pos), 0.0);\r
  return color;\r
}\r
\r
////////////////////////////////////////////////////////////////////////////////\r
// Simulation Compute shader\r
////////////////////////////////////////////////////////////////////////////////\r
struct SimulationParams {\r
  deltaTime : f32,\r
  seed : vec4<f32>,\r
}\r
\r
struct Particle {\r
  position : vec3<f32>,\r
  lifetime : f32,\r
  color    : vec4<f32>,\r
  velocity : vec3<f32>,\r
}\r
\r
struct Particles {\r
  particles : array<Particle>,\r
}\r
\r
@binding(0) @group(0) var<uniform> sim_params : SimulationParams;\r
@binding(1) @group(0) var<storage, read_write> data : Particles;\r
\r
// texture with world space position drawn by uv\r
@binding(2) @group(0) var texture : texture_2d<f32>;\r
\r
@compute @workgroup_size(64)\r
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {\r
  let idx = global_invocation_id.x;\r
\r
  init_rand(idx, sim_params.seed);\r
\r
  var particle = data.particles[idx];\r
\r
  _ = rand();\r
  let coord: vec2i = vec2i(floor(rand_seed * vec2f(600, 600)));\r
  let worldPosition = textureLoad(texture, coord, 0);\r
  \r
  // var worldPosition = textureLoad(texture, coord, 0);\r
  // worldPosition = vec4f(f32(idx) / 5000, 0, 0, 1);\r
\r
  // // Simple position pin\r
  // particle.position = worldPosition.xyz;\r
  // particle.lifetime = 0;\r
  // particle.color = vec4f(1, 0, 0, 1);\r
  // particle.velocity = vec3f(0);\r
\r
\r
  // Some simulation\r
  particle.lifetime = 0;\r
  \r
\r
  if (worldPosition.x >= 99999.0) {\r
    // no triangles on uv position texture\r
    particle.velocity = vec3f(0.0);\r
    particle.position = vec3(99999, 99999, 99999);\r
    particle.color = vec4f(0, 0, 0, 0);\r
  } else {\r
    particle.color = vec4f(1, 0, 0, 1);\r
\r
    var dir = worldPosition.xyz - particle.position;\r
    let dist = length(dir);\r
    // dir = dir / dist;\r
\r
    // var acc = vec3f(0);\r
    // // acc = 0.0005 * normalize(dir) * (dist * dist) * rand();\r
    // acc = 0.000005 * normalize(dir) * (dist * dist);\r
\r
    // let acc = (0.0001 - 0.00005 * dot(dir, particle.velocity) ) * dir * dist * dist * 0.01 ;\r
\r
    // particle.velocity = 0.999 * particle.velocity + acc;\r
\r
    // smoothstep()\r
\r
    // let expectedVelocity = dir * (0.9 + 0.2 * rand());\r
    let expectedVelocity = dir;\r
\r
    let acc = 0.09 * (expectedVelocity - particle.velocity) + 0.01 * normalize(dir);\r
\r
    particle.velocity = particle.velocity + acc;\r
\r
    // particle.velocity = 0.1 * dir * dist;\r
\r
\r
    particle.position = particle.position + particle.velocity;\r
  }\r
\r
  \r
\r
  \r
  \r
\r
  // // Apply gravity\r
  // particle.velocity.z = particle.velocity.z - sim_params.deltaTime * 0.5;\r
\r
  // // Basic velocity integration\r
  // particle.position = particle.position + sim_params.deltaTime * particle.velocity;\r
\r
  // // Age each particle. Fade out before vanishing.\r
  // particle.lifetime = particle.lifetime - sim_params.deltaTime;\r
  // particle.color.a = smoothstep(0.0, 0.5, particle.lifetime);\r
\r
  // // If the lifetime has gone negative, then the particle is dead and should be\r
  // // respawned.\r
  // if (particle.lifetime < 0.0) {\r
  //   // Use the probability map to find where the particle should be spawned.\r
  //   // Starting with the 1x1 mip level.\r
  //   var coord : vec2<i32>;\r
  //   for (var level = u32(textureNumLevels(texture) - 1); level > 0; level--) {\r
  //     // Load the probability value from the mip-level\r
  //     // Generate a random number and using the probabilty values, pick the\r
  //     // next texel in the next largest mip level:\r
  //     //\r
  //     // 0.0    probabilites.r    probabilites.g    probabilites.b   1.0\r
  //     //  |              |              |              |              |\r
  //     //  |   TOP-LEFT   |  TOP-RIGHT   | BOTTOM-LEFT  | BOTTOM_RIGHT |\r
  //     //\r
  //     let probabilites = textureLoad(texture, coord, level);\r
  //     let value = vec4<f32>(rand());\r
  //     let mask = (value >= vec4<f32>(0.0, probabilites.xyz)) & (value < probabilites);\r
  //     coord = coord * 2;\r
  //     coord.x = coord.x + select(0, 1, any(mask.yw)); // x  y\r
  //     coord.y = coord.y + select(0, 1, any(mask.zw)); // z  w\r
  //   }\r
  //   let uv = vec2<f32>(coord) / vec2<f32>(textureDimensions(texture));\r
  //   particle.position = vec3<f32>((uv - 0.5) * 3.0 * vec2<f32>(1.0, -1.0), 0.0);\r
  //   particle.color = textureLoad(texture, coord, 0);\r
  //   particle.velocity.x = (rand() - 0.5) * 0.1;\r
  //   particle.velocity.y = (rand() - 0.5) * 0.1;\r
  //   particle.velocity.z = rand() * 0.3;\r
  //   particle.lifetime = 0.5 + rand() * 3.0;\r
  // }\r
\r
  // Store the new particle value\r
  data.particles[idx] = particle;\r
}\r
`;function E(f,r){if(!f)throw new Error(r&&(typeof r=="string"?r:r()))}const $e=Oe("/gltf/di-long-idle.glb"),Ze={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};async function Ke(f,r){const F=(await re(()=>import("./chunks/orbitCamera.38aaa470.js"),["assets/chunks/orbitCamera.38aaa470.js","assets/chunks/quat.b941390c.js"])).default,{TinyGltf:ie,AABB:ae}=await re(()=>import("./chunks/tiny-gltf.70e0c985.js"),["assets/chunks/tiny-gltf.70e0c985.js","assets/chunks/quat.b941390c.js"]);class oe{constructor(i,s){this.nodeIdx2JointIdx={};const a=s.joints.length;this.jointMatrices=new Float32Array(16*a);for(const[o,u]of s.joints.entries())this.jointMatrices.set(i.nodes[u].worldMatrix,16*o),this.nodeIdx2JointIdx[u]=o;const t=64*a;this.inverseBindMatricesStaticBuffer=r.createBuffer({label:"Skin inverseBindMatricesStaticBuffer",size:t,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.jointMatricesDynamicBuffer=r.createBuffer({label:"Skin jointMatricesDynamicBuffer",size:t,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});{const o=i.accessors[s.inverseBindMatrices],u=i.bufferViews[o.bufferView];r.queue.writeBuffer(this.inverseBindMatricesStaticBuffer,0,i.buffers[u.buffer],u.byteOffset+(o.byteOffset??0),u.byteLength)}this.updateJointMatricesDynamicBuffer(),this.bindGroup=r.createBindGroup({label:"Static Storage Bind Group",layout:L,entries:[{binding:0,resource:{buffer:this.inverseBindMatricesStaticBuffer}},{binding:1,resource:{buffer:this.jointMatricesDynamicBuffer}}]})}updateJointMatricesDynamicBuffer(){r.queue.writeBuffer(this.jointMatricesDynamicBuffer,0,this.jointMatrices.buffer)}}const T=[],O=[],M=navigator.gpu.getPreferredCanvasFormat();f.configure({device:r,format:M,alphaMode:"opaque"});const N="rgba32float",se=[f.canvas.width,f.canvas.height],D=r.createTexture({size:se,format:N,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT}),ce=r.createTexture({size:[f.canvas.width,f.canvas.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});E(f.canvas instanceof HTMLCanvasElement);const h=new F(f.canvas),y=await new ie().loadFromUrl($e),p=new ae({min:new Float32Array([-2.878838062286377,-.021465064957737923,-3.228097915649414]),max:new Float32Array([2.8631608486175537,11.281305313110352,3.417842388153076])});console.log(y),h.target=p.center,h.maxDistance=p.radius*8,h.minDistance=p.radius*.25,h.distance=p.radius*2.5;const ue=p.radius*4,q=Float32Array.BYTES_PER_ELEMENT*36,g=new ArrayBuffer(q),le=new Float32Array(g,0,16),de=new Float32Array(g,16*Float32Array.BYTES_PER_ELEMENT,16),fe=new Float32Array(g,32*Float32Array.BYTES_PER_ELEMENT,3),pe=new Float32Array(g,35*Float32Array.BYTES_PER_ELEMENT,1),W=r.createBuffer({size:q,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),v=r.createBindGroupLayout({label:"Frame BindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]}),Y=r.createBindGroup({label:"Frame BindGroup",layout:v,entries:[{binding:0,resource:{buffer:W}}]}),G=r.createBuffer({size:4*1024*1024,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),A=r.createBuffer({size:34064,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0}),V=r.createBuffer({size:4*1024*1024,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0}),B=r.createBindGroupLayout({label:"Static Storage Bind Group",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),L=r.createBindGroupLayout({label:"Skin Storage Bind Group",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),I=j(),U=j(),x=j();class me{constructor(i,s,a){this.channels=[];function t(o){const u=i.accessors[o],e=i.bufferViews[u.bufferView];return new Float32Array(i.buffers[e.buffer],e.byteOffset+(u.byteOffset??0),e.byteLength/4)}this.skin=a;for(const o of s.channels){const u=o.target.node,e=s.samplers[o.sampler],n={input:t(e.input),output:t(e.output),outputCount:Ze[i.accessors[e.output].type],idx:0,endT:0,inputMax:0};n.endT=n.input[n.input.length-1],n.inputMax=n.endT-n.input[0];const l={nodeIdx:u,jointIdx:a.nodeIdx2JointIdx[u],target:o.target.path,sampler:n};this.channels.push(l)}}parseNode(i,s){const a=y.nodes[i];if(Ne(a.localMatrix,a.rotation,a.translation,a.scale),De(a.worldMatrix,s,a.localMatrix),i in this.skin.nodeIdx2JointIdx){const t=this.skin.nodeIdx2JointIdx[i];this.skin.jointMatrices.set(a.worldMatrix,16*t)}if(a.children)for(const t of a.children)this.parseNode(t,a.worldMatrix)}update(i){for(const s of this.channels){let a=i;const t=s.sampler,o=y.nodes[s.nodeIdx][s.target];o||console.error("Unsupported animation channel target ",s.target);const u=t.input.length;if(u>1){for(a>t.endT&&(a-=t.inputMax*Math.ceil((a-t.endT)/t.inputMax),t.idx=0);t.idx<=u-2&&a>=t.input[t.idx+1];)t.idx++;t.idx>=u-1&&(a-=t.inputMax,t.idx=0);const e=t.idx,n=e*t.outputCount,l=n+t.outputCount,m=Math.max(0,a-t.input[e])/(t.input[e+1]-t.input[e]);for(let d=0;d<t.outputCount;d++)I[d]=t.output[n+d],U[d]=t.output[l+d];t.outputCount===4?qe(x,I,U,m):We(x,I,U,m)}else{a=t.input[0],t.idx=0;for(let e=0;e<t.outputCount;e++)x[e]=t.output[e]}t.outputCount===4?Ye(o,x):Xe(o,x[0],x[1],x[2])}for(const s of y.scenes[0].nodes)this.parseNode(s,Je());this.skin.updateJointMatricesDynamicBuffer()}}function xe(c){function i(e){return{curOffset:0,mapped:new Uint8Array(e.getMappedRange())}}function s(e,n){const l=c.accessors[n],m=c.bufferViews[l.bufferView];e.mapped.set(new Uint8Array(c.buffers[m.buffer],m.byteOffset+(l.byteOffset??0),m.byteLength),e.curOffset);const d=e.curOffset;return e.curOffset+=m.byteLength,{offset:d,size:m.byteLength}}if(c.skins){for(const[e,n]of c.skins.entries())T.push(new oe(c,n));if(c.animations){const e=c.animations[0];console.log(e),R=new me(c,e,T[0])}}const a={curOffset:0,mapped:new Float32Array(V.getMappedRange())};let t=0;for(const e of c.nodes)"mesh"in e&&("skin"in e&&(c.meshes[e.mesh].skin=e.skin),a.mapped.set(e.worldMatrix,a.curOffset),a.curOffset+=16,c.meshes[e.mesh].nodeIdx=t++);const o=i(G),u=i(A);for(const e of c.meshes)for(const n of e.primitives){"indices"in n||console.error("Unsupported: gltf model mesh does not have indices");const l=c.accessors[n.indices],m=WebGLRenderingContext;(l.type!=="SCALAR"||l.componentType!==m.UNSIGNED_SHORT)&&console.error("Unsupported index type: ",l);const d=s(u,n.indices),te=c.accessors[n.indices].count;if(E("POSITION"in n.attributes),E("NORMAL"in n.attributes),E("TEXCOORD_0"in n.attributes),e.skin!==void 0){const Ee={skinIdx:e.skin,vertexBuffers:[s(o,n.attributes.POSITION),s(o,n.attributes.NORMAL),s(o,n.attributes.TEXCOORD_0),s(o,n.attributes.JOINTS_0),s(o,n.attributes.WEIGHTS_0)],indexOffset:d.offset,indexSize:d.size,drawIndexedCount:te,instanceCount:1,firstInstance:e.nodeIdx};O.push(Ee)}else s(o,n.attributes.POSITION),s(o,n.attributes.NORMAL),s(o,n.attributes.TEXCOORD_0),d.offset,d.size,e.nodeIdx}O.sort((e,n)=>e.skinIdx-n.skinIdx)}let R;xe(y),G.unmap(),A.unmap(),V.unmap();const he=r.createBindGroup({label:"Static Storage Bind Group",layout:B,entries:[{binding:0,resource:{buffer:V}}]}),be=r.createShaderModule({code:Re}),ye=r.createShaderModule({code:Ce}),X=r.createShaderModule({code:ke}),J=[{arrayStride:3*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x3",offset:0,shaderLocation:0}]},{arrayStride:3*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x3",offset:0,shaderLocation:1}]},{arrayStride:2*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x2",offset:0,shaderLocation:2}]}];r.createRenderPipeline({label:"Static Mesh",layout:r.createPipelineLayout({label:"Static Mesh",bindGroupLayouts:[v,B]}),vertex:{module:be,entryPoint:"vertexMain",buffers:J},primitive:{topology:"triangle-list",cullMode:"back"},multisample:{count:1},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"},fragment:{module:X,entryPoint:"fragmentMain",targets:[{format:M}]}});const H=[...J,{arrayStride:4*Uint8Array.BYTES_PER_ELEMENT,attributes:[{format:"uint8x4",offset:0,shaderLocation:3}]},{arrayStride:4*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x4",offset:0,shaderLocation:4}]}];r.createRenderPipeline({label:"Skinned Mesh",layout:r.createPipelineLayout({label:"Skinned Mesh",bindGroupLayouts:[v,B,L]}),vertex:{module:ye,entryPoint:"vertexMain",buffers:H},primitive:{topology:"triangle-list",cullMode:"back"},multisample:{count:1},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"},fragment:{module:X,entryPoint:"fragmentMain",targets:[{format:M}]}});const $=r.createShaderModule({code:He}),ge=r.createRenderPipeline({label:"Skinned Mesh Write Particle Position",layout:r.createPipelineLayout({label:"Skinned Mesh Write Particle Position",bindGroupLayouts:[v,B,L]}),vertex:{module:$,entryPoint:"vertexMain",buffers:H},primitive:{topology:"triangle-list",cullMode:"none"},multisample:{count:1},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"},fragment:{module:$,entryPoint:"fragmentMain",targets:[{format:N}]}}),P=1e5,ve=0,Pe=4*4,_=3*4+1*4+4*4+3*4+1*4+0,w=r.createBuffer({size:P*_,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0}),b=new Float32Array(w.getMappedRange()),S=je();ze(S,p.max,p.min);for(let c=0;c<P;c++){const i=c*_/4;b[i]=Math.random()*S[0]+p.min[0],b[i+1]=Math.random()*S[1]+p.min[1],b[i+2]=Math.random()*S[2]+p.min[2],b[i+9]=0,b[i+10]=0,b[i+11]=0}w.unmap();const Z=r.createComputePipeline({layout:"auto",compute:{module:r.createShaderModule({code:z}),entryPoint:"simulate"}}),Me={simulate:!0,deltaTime:.04},Be=1*4+3*4+4*4+0,K=r.createBuffer({size:Be,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});r.queue.writeBuffer(K,0,new Float32Array([Me.deltaTime,0,0,0,Math.random()*100,Math.random()*100,1+Math.random(),1+Math.random()]));const _e=r.createBindGroup({layout:Z.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:K}},{binding:1,resource:{buffer:w,offset:0,size:P*_}},{binding:2,resource:D.createView()}]}),C=r.createBuffer({size:6*2*4,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),we=[-1,-1,1,-1,-1,1,-1,1,1,-1,1,1];new Float32Array(C.getMappedRange()).set(we),C.unmap();const Se=r.createRenderPipeline({label:"Particle render pipeline",layout:r.createPipelineLayout({label:"Particle render pipeline",bindGroupLayouts:[v]}),vertex:{module:r.createShaderModule({code:z}),entryPoint:"vs_main",buffers:[{arrayStride:_,stepMode:"instance",attributes:[{shaderLocation:0,offset:ve,format:"float32x3"},{shaderLocation:1,offset:Pe,format:"float32x4"}]},{arrayStride:2*4,stepMode:"vertex",attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]}]},fragment:{module:r.createShaderModule({code:z}),entryPoint:"fs_main",targets:[{format:M,blend:{color:{srcFactor:"src-alpha",dstFactor:"one",operation:"add"},alpha:{srcFactor:"zero",dstFactor:"one",operation:"add"}}}]},primitive:{topology:"triangle-list"}});let Q=performance.now()*.001,k=0;function ee(c){c*=.001;const i=r.createCommandEncoder(),a={colorAttachments:[{view:D.createView(),clearValue:{r:99999,g:99999,b:99999,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:ce.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};Fe(le,Math.PI*.5,1,.01,ue),de.set(h.viewMatrix),fe.set(h.position),pe[0]=k,R&&R.update(k),k+=c-Q,Q=c,r.queue.writeBuffer(W,0,g);const t=i.beginRenderPass(a);t.setBindGroup(0,Y),t.setBindGroup(1,he),t.setPipeline(ge);let o=-1,u;for(const e of O){e.skinIdx!==o&&(o=e.skinIdx,u=T[o],t.setBindGroup(2,u.bindGroup));for(let n=0;n<e.vertexBuffers.length;n++){const l=e.vertexBuffers[n];t.setVertexBuffer(n,G,l.offset,l.size)}t.setIndexBuffer(A,"uint16",e.indexOffset,e.indexSize),t.drawIndexed(e.drawIndexedCount,e.instanceCount,0,0,e.firstInstance)}t.end();{const e=i.beginComputePass();e.setPipeline(Z),e.setBindGroup(0,_e),e.dispatchWorkgroups(Math.ceil(P/64)),e.end()}{const e={colorAttachments:[{view:f.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]},n=i.beginRenderPass(e);n.setPipeline(Se),n.setBindGroup(0,Y),n.setVertexBuffer(0,w),n.setVertexBuffer(1,C),n.draw(6,P,0,0),n.end()}r.queue.submit([i.finish()]),requestAnimationFrame(ee)}requestAnimationFrame(ee)}const Qe=ne("h1",{id:"particles",tabindex:"-1"},[Ie("Particles "),ne("a",{class:"header-anchor",href:"#particles","aria-label":'Permalink to "Particles"'},"​")],-1),at=JSON.parse('{"title":"Particles","description":"","frontmatter":{},"headers":[],"relativePath":"projects/05-particle-projector.md","filePath":"projects/05-particle-projector.md"}'),et={name:"projects/05-particle-projector.md"},ot=Ge({...et,setup(f){return(r,F)=>(Ue(),Ae("div",null,[Qe,Ve(Te,{onInit:Le(Ke)},null,8,["onInit"])]))}});export{at as __pageData,ot as default};
