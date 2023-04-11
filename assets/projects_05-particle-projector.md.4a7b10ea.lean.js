import{_ as Te}from"./chunks/gpu-canvas.vue_vue_type_script_setup_true_lang.4f2e62a7.js";import{p as Oe,a1 as ne,d as Ge,c as Ae,C as Ve,b as Le,x as re,a as Ie,o as Ue}from"./chunks/framework.9695c624.js";import{c as F,s as Re,a as Ce,b as ke,d as Fe,e as ze,p as je,f as Ne,m as De,g as qe,l as We,h as Ye,i as Xe,j as Je}from"./chunks/quat.eb419a7f.js";const He=`struct Camera {
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
}`,z=`////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////
var<private> rand_seed : vec2<f32>;

fn init_rand(invocation_id : u32, seed : vec4<f32>) {
  rand_seed = seed.xz;
  rand_seed = fract(rand_seed * cos(35.456+f32(invocation_id) * seed.yw));
  rand_seed = fract(rand_seed * cos(41.235+f32(invocation_id) * seed.xw));
}

fn rand() -> f32 {
  rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
  rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
  return rand_seed.y;
}

////////////////////////////////////////////////////////////////////////////////
// Vertex shader
////////////////////////////////////////////////////////////////////////////////

// struct RenderParams {
//   modelViewProjectionMatrix : mat4x4<f32>,
//   right : vec3<f32>,
//   up : vec3<f32>
// }

// @binding(0) @group(0) var<uniform> render_params : RenderParams;

struct Camera {
  projection : mat4x4<f32>,
  view : mat4x4<f32>,
  position : vec3<f32>,
  time : f32,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) color : vec4<f32>,
  @location(2) quad_pos : vec2<f32>, // -1..+1
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) quad_pos : vec2<f32>, // -1..+1
}

@vertex
fn vs_main(in : VertexInput) -> VertexOutput {
  // var quad_pos = mat2x3<f32>(render_params.right, render_params.up) * in.quad_pos;
  // var position = in.position + quad_pos * 0.01;
  // var out : VertexOutput;
  // out.position = render_params.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
  // out.color = in.color;
  // out.quad_pos = in.quad_pos;
  // return out;

  var out : VertexOutput;
  // out.position = vec4f(in.quad_pos, 0.0, 1.0);

  let d = in.position - camera.position;
  let up = vec3f(0, 1, 0);
  let right = normalize(cross(d, up));

  var quad_pos = mat2x3<f32>(vec3f(1, 0, 0), vec3f(0, 1, 0)) * in.quad_pos;
  out.position = camera.projection * camera.view * vec4f(in.position + quad_pos * 0.015, 1.0);
  // out.color = vec4f(1.0, 1.0, 0.0, 1.0);
  out.color = in.color;
  out.quad_pos = in.quad_pos;
  return out;
}

////////////////////////////////////////////////////////////////////////////////
// Fragment shader
////////////////////////////////////////////////////////////////////////////////
@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  var color = in.color;
  // Apply a circular particle alpha mask
  color.a = color.a * max(1.0 - length(in.quad_pos), 0.0);
  return color;
}

////////////////////////////////////////////////////////////////////////////////
// Simulation Compute shader
////////////////////////////////////////////////////////////////////////////////
struct SimulationParams {
  deltaTime : f32,
  seed : vec4<f32>,
}

struct Particle {
  position : vec3<f32>,
  lifetime : f32,
  color    : vec4<f32>,
  velocity : vec3<f32>,
}

struct Particles {
  particles : array<Particle>,
}

@binding(0) @group(0) var<uniform> sim_params : SimulationParams;
@binding(1) @group(0) var<storage, read_write> data : Particles;

// texture with world space position drawn by uv
@binding(2) @group(0) var texture : texture_2d<f32>;

@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {
  let idx = global_invocation_id.x;

  init_rand(idx, sim_params.seed);

  var particle = data.particles[idx];

  _ = rand();
  let coord: vec2i = vec2i(floor(rand_seed * vec2f(600, 600)));
  let worldPosition = textureLoad(texture, coord, 0);
  
  // var worldPosition = textureLoad(texture, coord, 0);
  // worldPosition = vec4f(f32(idx) / 5000, 0, 0, 1);

  // // Simple position pin
  // particle.position = worldPosition.xyz;
  // particle.lifetime = 0;
  // particle.color = vec4f(1, 0, 0, 1);
  // particle.velocity = vec3f(0);


  // Some simulation
  particle.lifetime = 0;
  

  if (worldPosition.x >= 99999.0) {
    // no triangles on uv position texture
    particle.velocity = vec3f(0.0);
    particle.position = vec3(99999, 99999, 99999);
    particle.color = vec4f(0, 0, 0, 0);
  } else {
    particle.color = vec4f(1, 0, 0, 1);

    var dir = worldPosition.xyz - particle.position;
    let dist = length(dir);
    // dir = dir / dist;

    // var acc = vec3f(0);
    // // acc = 0.0005 * normalize(dir) * (dist * dist) * rand();
    // acc = 0.000005 * normalize(dir) * (dist * dist);

    // let acc = (0.0001 - 0.00005 * dot(dir, particle.velocity) ) * dir * dist * dist * 0.01 ;

    // particle.velocity = 0.999 * particle.velocity + acc;

    // smoothstep()

    // let expectedVelocity = dir * (0.9 + 0.2 * rand());
    let expectedVelocity = dir;

    let acc = 0.09 * (expectedVelocity - particle.velocity) + 0.01 * normalize(dir);

    particle.velocity = particle.velocity + acc;

    // particle.velocity = 0.1 * dir * dist;


    particle.position = particle.position + particle.velocity;
  }

  

  
  

  // // Apply gravity
  // particle.velocity.z = particle.velocity.z - sim_params.deltaTime * 0.5;

  // // Basic velocity integration
  // particle.position = particle.position + sim_params.deltaTime * particle.velocity;

  // // Age each particle. Fade out before vanishing.
  // particle.lifetime = particle.lifetime - sim_params.deltaTime;
  // particle.color.a = smoothstep(0.0, 0.5, particle.lifetime);

  // // If the lifetime has gone negative, then the particle is dead and should be
  // // respawned.
  // if (particle.lifetime < 0.0) {
  //   // Use the probability map to find where the particle should be spawned.
  //   // Starting with the 1x1 mip level.
  //   var coord : vec2<i32>;
  //   for (var level = u32(textureNumLevels(texture) - 1); level > 0; level--) {
  //     // Load the probability value from the mip-level
  //     // Generate a random number and using the probabilty values, pick the
  //     // next texel in the next largest mip level:
  //     //
  //     // 0.0    probabilites.r    probabilites.g    probabilites.b   1.0
  //     //  |              |              |              |              |
  //     //  |   TOP-LEFT   |  TOP-RIGHT   | BOTTOM-LEFT  | BOTTOM_RIGHT |
  //     //
  //     let probabilites = textureLoad(texture, coord, level);
  //     let value = vec4<f32>(rand());
  //     let mask = (value >= vec4<f32>(0.0, probabilites.xyz)) & (value < probabilites);
  //     coord = coord * 2;
  //     coord.x = coord.x + select(0, 1, any(mask.yw)); // x  y
  //     coord.y = coord.y + select(0, 1, any(mask.zw)); // z  w
  //   }
  //   let uv = vec2<f32>(coord) / vec2<f32>(textureDimensions(texture));
  //   particle.position = vec3<f32>((uv - 0.5) * 3.0 * vec2<f32>(1.0, -1.0), 0.0);
  //   particle.color = textureLoad(texture, coord, 0);
  //   particle.velocity.x = (rand() - 0.5) * 0.1;
  //   particle.velocity.y = (rand() - 0.5) * 0.1;
  //   particle.velocity.z = rand() * 0.3;
  //   particle.lifetime = 0.5 + rand() * 3.0;
  // }

  // Store the new particle value
  data.particles[idx] = particle;
}
`;function E(f,n){if(!f)throw new Error(n&&(typeof n=="string"?n:n()))}const $e=Oe("/gltf/di-long-idle.glb"),Ze={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};async function Ke(f,n){const j=(await ne(()=>import("./chunks/orbitCamera.49e28956.js"),["assets/chunks/orbitCamera.49e28956.js","assets/chunks/quat.eb419a7f.js"])).default,{TinyGltf:ie,AABB:ae}=await ne(()=>import("./chunks/tiny-gltf.51cc1fa0.js"),["assets/chunks/tiny-gltf.51cc1fa0.js","assets/chunks/quat.eb419a7f.js"]);class oe{constructor(i,s){this.nodeIdx2JointIdx={};const a=s.joints.length;this.jointMatrices=new Float32Array(16*a);for(const[o,u]of s.joints.entries())this.jointMatrices.set(i.nodes[u].worldMatrix,16*o),this.nodeIdx2JointIdx[u]=o;const t=64*a;this.inverseBindMatricesStaticBuffer=n.createBuffer({label:"Skin inverseBindMatricesStaticBuffer",size:t,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.jointMatricesDynamicBuffer=n.createBuffer({label:"Skin jointMatricesDynamicBuffer",size:t,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});{const o=i.accessors[s.inverseBindMatrices],u=i.bufferViews[o.bufferView];n.queue.writeBuffer(this.inverseBindMatricesStaticBuffer,0,i.buffers[u.buffer],u.byteOffset+(o.byteOffset??0),u.byteLength)}this.updateJointMatricesDynamicBuffer(),this.bindGroup=n.createBindGroup({label:"Static Storage Bind Group",layout:L,entries:[{binding:0,resource:{buffer:this.inverseBindMatricesStaticBuffer}},{binding:1,resource:{buffer:this.jointMatricesDynamicBuffer}}]})}updateJointMatricesDynamicBuffer(){n.queue.writeBuffer(this.jointMatricesDynamicBuffer,0,this.jointMatrices.buffer)}}const T=[],O=[],M=navigator.gpu.getPreferredCanvasFormat();f.configure({device:n,format:M,alphaMode:"opaque"});const N="rgba32float",se=[f.canvas.width,f.canvas.height],D=n.createTexture({size:se,format:N,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT}),ce=n.createTexture({size:[f.canvas.width,f.canvas.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});E(f.canvas instanceof HTMLCanvasElement);const h=new j(f.canvas),y=await new ie().loadFromUrl($e),p=new ae({min:new Float32Array([-2.878838062286377,-.021465064957737923,-3.228097915649414]),max:new Float32Array([2.8631608486175537,11.281305313110352,3.417842388153076])});console.log(y),h.target=p.center,h.maxDistance=p.radius*8,h.minDistance=p.radius*.25,h.distance=p.radius*2.5;const ue=p.radius*4,q=Float32Array.BYTES_PER_ELEMENT*36,g=new ArrayBuffer(q),le=new Float32Array(g,0,16),de=new Float32Array(g,16*Float32Array.BYTES_PER_ELEMENT,16),fe=new Float32Array(g,32*Float32Array.BYTES_PER_ELEMENT,3),pe=new Float32Array(g,35*Float32Array.BYTES_PER_ELEMENT,1),W=n.createBuffer({size:q,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),v=n.createBindGroupLayout({label:"Frame BindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{}}]}),Y=n.createBindGroup({label:"Frame BindGroup",layout:v,entries:[{binding:0,resource:{buffer:W}}]}),G=n.createBuffer({size:4*1024*1024,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),A=n.createBuffer({size:34064,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0}),V=n.createBuffer({size:4*1024*1024,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0}),B=n.createBindGroupLayout({label:"Static Storage Bind Group",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),L=n.createBindGroupLayout({label:"Skin Storage Bind Group",entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),I=F(),U=F(),x=F();class me{constructor(i,s,a){this.channels=[];function t(o){const u=i.accessors[o],e=i.bufferViews[u.bufferView];return new Float32Array(i.buffers[e.buffer],e.byteOffset+(u.byteOffset??0),e.byteLength/4)}this.skin=a;for(const o of s.channels){const u=o.target.node,e=s.samplers[o.sampler],r={input:t(e.input),output:t(e.output),outputCount:Ze[i.accessors[e.output].type],idx:0,endT:0,inputMax:0};r.endT=r.input[r.input.length-1],r.inputMax=r.endT-r.input[0];const l={nodeIdx:u,jointIdx:a.nodeIdx2JointIdx[u],target:o.target.path,sampler:r};this.channels.push(l)}}parseNode(i,s){const a=y.nodes[i];if(Ne(a.localMatrix,a.rotation,a.translation,a.scale),De(a.worldMatrix,s,a.localMatrix),i in this.skin.nodeIdx2JointIdx){const t=this.skin.nodeIdx2JointIdx[i];this.skin.jointMatrices.set(a.worldMatrix,16*t)}if(a.children)for(const t of a.children)this.parseNode(t,a.worldMatrix)}update(i){for(const s of this.channels){let a=i;const t=s.sampler,o=y.nodes[s.nodeIdx][s.target];o||console.error("Unsupported animation channel target ",s.target);const u=t.input.length;if(u>1){for(a>t.endT&&(a-=t.inputMax*Math.ceil((a-t.endT)/t.inputMax),t.idx=0);t.idx<=u-2&&a>=t.input[t.idx+1];)t.idx++;t.idx>=u-1&&(a-=t.inputMax,t.idx=0);const e=t.idx,r=e*t.outputCount,l=r+t.outputCount,m=Math.max(0,a-t.input[e])/(t.input[e+1]-t.input[e]);for(let d=0;d<t.outputCount;d++)I[d]=t.output[r+d],U[d]=t.output[l+d];t.outputCount===4?qe(x,I,U,m):We(x,I,U,m)}else{a=t.input[0],t.idx=0;for(let e=0;e<t.outputCount;e++)x[e]=t.output[e]}t.outputCount===4?Ye(o,x):Xe(o,x[0],x[1],x[2])}for(const s of y.scenes[0].nodes)this.parseNode(s,Je());this.skin.updateJointMatricesDynamicBuffer()}}function xe(c){function i(e){return{curOffset:0,mapped:new Uint8Array(e.getMappedRange())}}function s(e,r){const l=c.accessors[r],m=c.bufferViews[l.bufferView];e.mapped.set(new Uint8Array(c.buffers[m.buffer],m.byteOffset+(l.byteOffset??0),m.byteLength),e.curOffset);const d=e.curOffset;return e.curOffset+=m.byteLength,{offset:d,size:m.byteLength}}if(c.skins){for(const[e,r]of c.skins.entries())T.push(new oe(c,r));if(c.animations){const e=c.animations[0];console.log(e),R=new me(c,e,T[0])}}const a={curOffset:0,mapped:new Float32Array(V.getMappedRange())};let t=0;for(const e of c.nodes)"mesh"in e&&("skin"in e&&(c.meshes[e.mesh].skin=e.skin),a.mapped.set(e.worldMatrix,a.curOffset),a.curOffset+=16,c.meshes[e.mesh].nodeIdx=t++);const o=i(G),u=i(A);for(const e of c.meshes)for(const r of e.primitives){"indices"in r||console.error("Unsupported: gltf model mesh does not have indices");const l=c.accessors[r.indices],m=WebGLRenderingContext;(l.type!=="SCALAR"||l.componentType!==m.UNSIGNED_SHORT)&&console.error("Unsupported index type: ",l);const d=s(u,r.indices),te=c.accessors[r.indices].count;if(E("POSITION"in r.attributes),E("NORMAL"in r.attributes),E("TEXCOORD_0"in r.attributes),e.skin!==void 0){const Ee={skinIdx:e.skin,vertexBuffers:[s(o,r.attributes.POSITION),s(o,r.attributes.NORMAL),s(o,r.attributes.TEXCOORD_0),s(o,r.attributes.JOINTS_0),s(o,r.attributes.WEIGHTS_0)],indexOffset:d.offset,indexSize:d.size,drawIndexedCount:te,instanceCount:1,firstInstance:e.nodeIdx};O.push(Ee)}else s(o,r.attributes.POSITION),s(o,r.attributes.NORMAL),s(o,r.attributes.TEXCOORD_0),d.offset,d.size,e.nodeIdx}O.sort((e,r)=>e.skinIdx-r.skinIdx)}let R;xe(y),G.unmap(),A.unmap(),V.unmap();const he=n.createBindGroup({label:"Static Storage Bind Group",layout:B,entries:[{binding:0,resource:{buffer:V}}]}),be=n.createShaderModule({code:Re}),ye=n.createShaderModule({code:Ce}),X=n.createShaderModule({code:ke}),J=[{arrayStride:3*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x3",offset:0,shaderLocation:0}]},{arrayStride:3*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x3",offset:0,shaderLocation:1}]},{arrayStride:2*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x2",offset:0,shaderLocation:2}]}];n.createRenderPipeline({label:"Static Mesh",layout:n.createPipelineLayout({label:"Static Mesh",bindGroupLayouts:[v,B]}),vertex:{module:be,entryPoint:"vertexMain",buffers:J},primitive:{topology:"triangle-list",cullMode:"back"},multisample:{count:1},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"},fragment:{module:X,entryPoint:"fragmentMain",targets:[{format:M}]}});const H=[...J,{arrayStride:4*Uint8Array.BYTES_PER_ELEMENT,attributes:[{format:"uint8x4",offset:0,shaderLocation:3}]},{arrayStride:4*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x4",offset:0,shaderLocation:4}]}];n.createRenderPipeline({label:"Skinned Mesh",layout:n.createPipelineLayout({label:"Skinned Mesh",bindGroupLayouts:[v,B,L]}),vertex:{module:ye,entryPoint:"vertexMain",buffers:H},primitive:{topology:"triangle-list",cullMode:"back"},multisample:{count:1},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"},fragment:{module:X,entryPoint:"fragmentMain",targets:[{format:M}]}});const $=n.createShaderModule({code:He}),ge=n.createRenderPipeline({label:"Skinned Mesh Write Particle Position",layout:n.createPipelineLayout({label:"Skinned Mesh Write Particle Position",bindGroupLayouts:[v,B,L]}),vertex:{module:$,entryPoint:"vertexMain",buffers:H},primitive:{topology:"triangle-list",cullMode:"none"},multisample:{count:1},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"},fragment:{module:$,entryPoint:"fragmentMain",targets:[{format:N}]}}),P=1e5,ve=0,Pe=4*4,_=3*4+1*4+4*4+3*4+1*4+0,w=n.createBuffer({size:P*_,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!0}),b=new Float32Array(w.getMappedRange()),S=Fe();ze(S,p.max,p.min);for(let c=0;c<P;c++){const i=c*_/4;b[i]=Math.random()*S[0]+p.min[0],b[i+1]=Math.random()*S[1]+p.min[1],b[i+2]=Math.random()*S[2]+p.min[2],b[i+9]=0,b[i+10]=0,b[i+11]=0}w.unmap();const Z=n.createComputePipeline({layout:"auto",compute:{module:n.createShaderModule({code:z}),entryPoint:"simulate"}}),Me={simulate:!0,deltaTime:.04},Be=1*4+3*4+4*4+0,K=n.createBuffer({size:Be,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(K,0,new Float32Array([Me.deltaTime,0,0,0,Math.random()*100,Math.random()*100,1+Math.random(),1+Math.random()]));const _e=n.createBindGroup({layout:Z.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:K}},{binding:1,resource:{buffer:w,offset:0,size:P*_}},{binding:2,resource:D.createView()}]}),C=n.createBuffer({size:6*2*4,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0}),we=[-1,-1,1,-1,-1,1,-1,1,1,-1,1,1];new Float32Array(C.getMappedRange()).set(we),C.unmap();const Se=n.createRenderPipeline({label:"Particle render pipeline",layout:n.createPipelineLayout({label:"Particle render pipeline",bindGroupLayouts:[v]}),vertex:{module:n.createShaderModule({code:z}),entryPoint:"vs_main",buffers:[{arrayStride:_,stepMode:"instance",attributes:[{shaderLocation:0,offset:ve,format:"float32x3"},{shaderLocation:1,offset:Pe,format:"float32x4"}]},{arrayStride:2*4,stepMode:"vertex",attributes:[{shaderLocation:2,offset:0,format:"float32x2"}]}]},fragment:{module:n.createShaderModule({code:z}),entryPoint:"fs_main",targets:[{format:M,blend:{color:{srcFactor:"src-alpha",dstFactor:"one",operation:"add"},alpha:{srcFactor:"zero",dstFactor:"one",operation:"add"}}}]},primitive:{topology:"triangle-list"}});let Q=performance.now()*.001,k=0;function ee(c){c*=.001;const i=n.createCommandEncoder(),a={colorAttachments:[{view:D.createView(),clearValue:{r:99999,g:99999,b:99999,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:ce.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};je(le,Math.PI*.5,1,.01,ue),de.set(h.viewMatrix),fe.set(h.position),pe[0]=k,R&&R.update(k),k+=c-Q,Q=c,n.queue.writeBuffer(W,0,g);const t=i.beginRenderPass(a);t.setBindGroup(0,Y),t.setBindGroup(1,he),t.setPipeline(ge);let o=-1,u;for(const e of O){e.skinIdx!==o&&(o=e.skinIdx,u=T[o],t.setBindGroup(2,u.bindGroup));for(let r=0;r<e.vertexBuffers.length;r++){const l=e.vertexBuffers[r];t.setVertexBuffer(r,G,l.offset,l.size)}t.setIndexBuffer(A,"uint16",e.indexOffset,e.indexSize),t.drawIndexed(e.drawIndexedCount,e.instanceCount,0,0,e.firstInstance)}t.end();{const e=i.beginComputePass();e.setPipeline(Z),e.setBindGroup(0,_e),e.dispatchWorkgroups(Math.ceil(P/64)),e.end()}{const e={colorAttachments:[{view:f.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]},r=i.beginRenderPass(e);r.setPipeline(Se),r.setBindGroup(0,Y),r.setVertexBuffer(0,w),r.setVertexBuffer(1,C),r.draw(6,P,0,0),r.end()}n.queue.submit([i.finish()]),requestAnimationFrame(ee)}requestAnimationFrame(ee)}const Qe=re("h1",{id:"particles",tabindex:"-1"},[Ie("Particles "),re("a",{class:"header-anchor",href:"#particles","aria-label":'Permalink to "Particles"'},"​")],-1),at=JSON.parse('{"title":"Particles","description":"","frontmatter":{},"headers":[],"relativePath":"projects/05-particle-projector.md"}'),et={name:"projects/05-particle-projector.md"},ot=Ge({...et,setup(f){return(n,j)=>(Ue(),Ae("div",null,[Qe,Ve(Te,{onInit:Le(Ke)},null,8,["onInit"])]))}});export{at as __pageData,ot as default};
