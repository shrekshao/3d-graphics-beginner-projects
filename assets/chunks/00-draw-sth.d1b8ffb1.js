const c=`@vertex\r
fn main(\r
  @builtin(vertex_index) VertexIndex : u32\r
) -> @builtin(position) vec4<f32> {\r
  var pos = array<vec2<f32>, 3>(\r
    vec2(0.0, 0.5),\r
    vec2(-0.5, -0.5),\r
    vec2(0.5, -0.5)\r
  );\r
\r
  return vec4<f32>(pos[VertexIndex], 0.0, 1.0);\r
}`,u=`@fragment\r
fn main() -> @location(0) vec4<f32> {\r
  return vec4(1.0, 0.0, 0.0, 1.0);\r
}`;function l(n,e){const t=navigator.gpu.getPreferredCanvasFormat();n.configure({device:e,format:t,alphaMode:"opaque"});const i=e.createRenderPipeline({layout:"auto",vertex:{module:e.createShaderModule({code:c}),entryPoint:"main"},fragment:{module:e.createShaderModule({code:u}),entryPoint:"main",targets:[{format:t}]},primitive:{topology:"triangle-list"}});function a(){const o=e.createCommandEncoder(),s={colorAttachments:[{view:n.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:.3,a:1},loadOp:"clear",storeOp:"store"}]},r=o.beginRenderPass(s);r.setPipeline(i),r.draw(3,1,0,0),r.end(),e.queue.submit([o.finish()]),requestAnimationFrame(a)}requestAnimationFrame(a)}export{l as i};
