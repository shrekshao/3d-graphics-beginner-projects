const H=`struct Camera {\r
  projection : mat4x4<f32>,\r
  view : mat4x4<f32>,\r
  position : vec3<f32>,\r
  time : f32,\r
};\r
@group(0) @binding(0) var<uniform> camera : Camera;\r
\r
@group(1) @binding(0) var<storage> model : array<mat4x4<f32>>;\r
\r
struct VertexInput {\r
  @builtin(instance_index) instance : u32,\r
  @location(0) position : vec3<f32>,\r
  @location(1) normal : vec3<f32>,\r
  @location(2) texcoord : vec2<f32>,\r
  // @location(\${ShaderLocations.POSITION}) position : vec3<f32>,\r
  // @location(\${ShaderLocations.NORMAL}) normal : vec3<f32>,\r
};\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) normal : vec3<f32>,\r
  @location(1) texcoord : vec2<f32>,\r
};\r
\r
@vertex\r
fn vertexMain(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
\r
  let modelMatrix = model[input.instance];\r
  output.position = camera.projection * camera.view * modelMatrix * vec4(input.position, 1.0);\r
  output.normal = normalize((camera.view * modelMatrix * vec4(input.normal, 0.0)).xyz);\r
  output.texcoord = input.texcoord;\r
\r
  return output;\r
}`,J=`struct Camera {\r
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
  // @location(\${ShaderLocations.POSITION}) position : vec3<f32>,\r
  // @location(\${ShaderLocations.NORMAL}) normal : vec3<f32>,\r
};\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) normal : vec3<f32>,\r
  @location(1) texcoord : vec2<f32>,\r
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
  // let modelMatrix = model[input.instance];\r
  // let modelMatrix = skinMatrix * model[input.instance];\r
  let modelMatrix = skinMatrix;\r
  output.position = camera.projection * camera.view * modelMatrix * vec4(input.position, 1.0);\r
  output.normal = normalize((camera.view * modelMatrix * vec4(input.normal, 0.0)).xyz);\r
  output.texcoord = input.texcoord;\r
\r
  return output;\r
}\r
`,K=`struct FragmentInput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) normal : vec3<f32>,\r
  @location(1) texcoord : vec2<f32>,\r
};\r
\r
// Some hardcoded lighting\r
const lightDir = vec3(0.25, 0.5, 1.0);\r
const lightColor = vec3(1.0, 1.0, 1.0);\r
const ambientColor = vec3(0.1, 0.1, 0.1);\r
\r
@fragment\r
fn fragmentMain(input : FragmentInput) -> @location(0) vec4<f32> {\r
  // An extremely simple directional lighting model, just to give our model some shape.\r
  let N = normalize(input.normal);\r
  let L = normalize(lightDir);\r
  let NDotL = max(dot(N, L), 0.0);\r
  // let surfaceColor = ambientColor + NDotL;\r
  let surfaceColor = vec3(input.texcoord.xy, 0.0);\r
\r
  return vec4(surfaceColor, 1.0);\r
  // return vec4(1.0, 1.0, 1.0, 1.0);\r
}`;var D=1e-6,j=typeof Float32Array<"u"?Float32Array:Array;Math.hypot||(Math.hypot=function(){for(var r=0,n=arguments.length;n--;)r+=arguments[n]*arguments[n];return Math.sqrt(r)});function q(){var r=new j(9);return j!=Float32Array&&(r[1]=0,r[2]=0,r[3]=0,r[5]=0,r[6]=0,r[7]=0),r[0]=1,r[4]=1,r[8]=1,r}function Q(){var r=new j(16);return j!=Float32Array&&(r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[11]=0,r[12]=0,r[13]=0,r[14]=0),r[0]=1,r[5]=1,r[10]=1,r[15]=1,r}function k(r){var n=new j(16);return n[0]=r[0],n[1]=r[1],n[2]=r[2],n[3]=r[3],n[4]=r[4],n[5]=r[5],n[6]=r[6],n[7]=r[7],n[8]=r[8],n[9]=r[9],n[10]=r[10],n[11]=r[11],n[12]=r[12],n[13]=r[13],n[14]=r[14],n[15]=r[15],n}function rr(r){return r[0]=1,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=1,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function nr(r,n){var i=n[0],e=n[1],a=n[2],t=n[3],c=n[4],v=n[5],s=n[6],f=n[7],l=n[8],p=n[9],o=n[10],y=n[11],z=n[12],d=n[13],g=n[14],V=n[15],A=i*v-e*c,M=i*s-a*c,x=i*f-t*c,m=e*s-a*v,h=e*f-t*v,L=a*f-t*s,O=l*d-p*z,$=l*g-o*z,I=l*V-y*z,S=p*g-o*d,C=p*V-y*d,F=o*V-y*g,w=A*F-M*C+x*S+m*I-h*$+L*O;return w?(w=1/w,r[0]=(v*F-s*C+f*S)*w,r[1]=(a*C-e*F-t*S)*w,r[2]=(d*L-g*h+V*m)*w,r[3]=(o*h-p*L-y*m)*w,r[4]=(s*I-c*F-f*$)*w,r[5]=(i*F-a*I+t*$)*w,r[6]=(g*x-z*L-V*M)*w,r[7]=(l*L-o*x+y*M)*w,r[8]=(c*C-v*I+f*O)*w,r[9]=(e*I-i*C-t*O)*w,r[10]=(z*h-d*x+V*A)*w,r[11]=(p*x-l*h-y*A)*w,r[12]=(v*$-c*S-s*O)*w,r[13]=(i*S-e*$+a*O)*w,r[14]=(d*M-z*m-g*A)*w,r[15]=(l*m-p*M+o*A)*w,r):null}function er(r,n,i){var e=n[0],a=n[1],t=n[2],c=n[3],v=n[4],s=n[5],f=n[6],l=n[7],p=n[8],o=n[9],y=n[10],z=n[11],d=n[12],g=n[13],V=n[14],A=n[15],M=i[0],x=i[1],m=i[2],h=i[3];return r[0]=M*e+x*v+m*p+h*d,r[1]=M*a+x*s+m*o+h*g,r[2]=M*t+x*f+m*y+h*V,r[3]=M*c+x*l+m*z+h*A,M=i[4],x=i[5],m=i[6],h=i[7],r[4]=M*e+x*v+m*p+h*d,r[5]=M*a+x*s+m*o+h*g,r[6]=M*t+x*f+m*y+h*V,r[7]=M*c+x*l+m*z+h*A,M=i[8],x=i[9],m=i[10],h=i[11],r[8]=M*e+x*v+m*p+h*d,r[9]=M*a+x*s+m*o+h*g,r[10]=M*t+x*f+m*y+h*V,r[11]=M*c+x*l+m*z+h*A,M=i[12],x=i[13],m=i[14],h=i[15],r[12]=M*e+x*v+m*p+h*d,r[13]=M*a+x*s+m*o+h*g,r[14]=M*t+x*f+m*y+h*V,r[15]=M*c+x*l+m*z+h*A,r}function ir(r,n,i){var e=i[0],a=i[1],t=i[2],c,v,s,f,l,p,o,y,z,d,g,V;return n===r?(r[12]=n[0]*e+n[4]*a+n[8]*t+n[12],r[13]=n[1]*e+n[5]*a+n[9]*t+n[13],r[14]=n[2]*e+n[6]*a+n[10]*t+n[14],r[15]=n[3]*e+n[7]*a+n[11]*t+n[15]):(c=n[0],v=n[1],s=n[2],f=n[3],l=n[4],p=n[5],o=n[6],y=n[7],z=n[8],d=n[9],g=n[10],V=n[11],r[0]=c,r[1]=v,r[2]=s,r[3]=f,r[4]=l,r[5]=p,r[6]=o,r[7]=y,r[8]=z,r[9]=d,r[10]=g,r[11]=V,r[12]=c*e+l*a+z*t+n[12],r[13]=v*e+p*a+d*t+n[13],r[14]=s*e+o*a+g*t+n[14],r[15]=f*e+y*a+V*t+n[15]),r}function ar(r,n,i){var e=Math.sin(i),a=Math.cos(i),t=n[4],c=n[5],v=n[6],s=n[7],f=n[8],l=n[9],p=n[10],o=n[11];return n!==r&&(r[0]=n[0],r[1]=n[1],r[2]=n[2],r[3]=n[3],r[12]=n[12],r[13]=n[13],r[14]=n[14],r[15]=n[15]),r[4]=t*a+f*e,r[5]=c*a+l*e,r[6]=v*a+p*e,r[7]=s*a+o*e,r[8]=f*a-t*e,r[9]=l*a-c*e,r[10]=p*a-v*e,r[11]=o*a-s*e,r}function tr(r,n,i){var e=Math.sin(i),a=Math.cos(i),t=n[0],c=n[1],v=n[2],s=n[3],f=n[8],l=n[9],p=n[10],o=n[11];return n!==r&&(r[4]=n[4],r[5]=n[5],r[6]=n[6],r[7]=n[7],r[12]=n[12],r[13]=n[13],r[14]=n[14],r[15]=n[15]),r[0]=t*a-f*e,r[1]=c*a-l*e,r[2]=v*a-p*e,r[3]=s*a-o*e,r[8]=t*e+f*a,r[9]=c*e+l*a,r[10]=v*e+p*a,r[11]=s*e+o*a,r}function cr(r,n,i,e){var a=n[0],t=n[1],c=n[2],v=n[3],s=a+a,f=t+t,l=c+c,p=a*s,o=a*f,y=a*l,z=t*f,d=t*l,g=c*l,V=v*s,A=v*f,M=v*l,x=e[0],m=e[1],h=e[2];return r[0]=(1-(z+g))*x,r[1]=(o+M)*x,r[2]=(y-A)*x,r[3]=0,r[4]=(o-M)*m,r[5]=(1-(p+g))*m,r[6]=(d+V)*m,r[7]=0,r[8]=(y+A)*h,r[9]=(d-V)*h,r[10]=(1-(p+z))*h,r[11]=0,r[12]=i[0],r[13]=i[1],r[14]=i[2],r[15]=1,r}function vr(r,n,i,e,a){var t=1/Math.tan(n/2),c;return r[0]=t/i,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=t,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[11]=-1,r[12]=0,r[13]=0,r[15]=0,a!=null&&a!==1/0?(c=1/(e-a),r[10]=a*c,r[14]=a*e*c):(r[10]=-1,r[14]=-e),r}function P(){var r=new j(3);return j!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0),r}function G(r){var n=r[0],i=r[1],e=r[2];return Math.hypot(n,i,e)}function b(r,n,i){var e=new j(3);return e[0]=r,e[1]=n,e[2]=i,e}function sr(r,n){return r[0]=n[0],r[1]=n[1],r[2]=n[2],r}function lr(r,n,i,e){return r[0]=n,r[1]=i,r[2]=e,r}function fr(r,n,i){return r[0]=n[0]-i[0],r[1]=n[1]-i[1],r[2]=n[2]-i[2],r}function pr(r,n,i){return r[0]=Math.min(n[0],i[0]),r[1]=Math.min(n[1],i[1]),r[2]=Math.min(n[2],i[2]),r}function or(r,n,i){return r[0]=Math.max(n[0],i[0]),r[1]=Math.max(n[1],i[1]),r[2]=Math.max(n[2],i[2]),r}function xr(r,n){var i=n[0]-r[0],e=n[1]-r[1],a=n[2]-r[2];return Math.hypot(i,e,a)}function W(r,n){var i=n[0],e=n[1],a=n[2],t=i*i+e*e+a*a;return t>0&&(t=1/Math.sqrt(t)),r[0]=n[0]*t,r[1]=n[1]*t,r[2]=n[2]*t,r}function Y(r,n){return r[0]*n[0]+r[1]*n[1]+r[2]*n[2]}function N(r,n,i){var e=n[0],a=n[1],t=n[2],c=i[0],v=i[1],s=i[2];return r[0]=a*s-t*v,r[1]=t*c-e*s,r[2]=e*v-a*c,r}function mr(r,n,i){var e=n[0],a=n[1],t=n[2],c=i[3]*e+i[7]*a+i[11]*t+i[15];return c=c||1,r[0]=(i[0]*e+i[4]*a+i[8]*t+i[12])/c,r[1]=(i[1]*e+i[5]*a+i[9]*t+i[13])/c,r[2]=(i[2]*e+i[6]*a+i[10]*t+i[14])/c,r}var _=G;(function(){var r=P();return function(n,i,e,a,t,c){var v,s;for(i||(i=3),e||(e=0),a?s=Math.min(a*i+e,n.length):s=n.length,v=e;v<s;v+=i)r[0]=n[v],r[1]=n[v+1],r[2]=n[v+2],t(r,r,c),n[v]=r[0],n[v+1]=r[1],n[v+2]=r[2];return n}})();function E(){var r=new j(4);return j!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0,r[3]=0),r}function U(r,n,i,e){var a=new j(4);return a[0]=r,a[1]=n,a[2]=i,a[3]=e,a}function hr(r,n){return r[0]=n[0],r[1]=n[1],r[2]=n[2],r[3]=n[3],r}function X(r,n){var i=n[0],e=n[1],a=n[2],t=n[3],c=i*i+e*e+a*a+t*t;return c>0&&(c=1/Math.sqrt(c)),r[0]=i*c,r[1]=e*c,r[2]=a*c,r[3]=t*c,r}function Mr(r,n,i,e){var a=n[0],t=n[1],c=n[2],v=n[3];return r[0]=a+e*(i[0]-a),r[1]=t+e*(i[1]-t),r[2]=c+e*(i[2]-c),r[3]=v+e*(i[3]-v),r}(function(){var r=E();return function(n,i,e,a,t,c){var v,s;for(i||(i=4),e||(e=0),a?s=Math.min(a*i+e,n.length):s=n.length,v=e;v<s;v+=i)r[0]=n[v],r[1]=n[v+1],r[2]=n[v+2],r[3]=n[v+3],t(r,r,c),n[v]=r[0],n[v+1]=r[1],n[v+2]=r[2],n[v+3]=r[3];return n}})();function B(){var r=new j(4);return j!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0),r[3]=1,r}function Z(r,n,i){i=i*.5;var e=Math.sin(i);return r[0]=e*n[0],r[1]=e*n[1],r[2]=e*n[2],r[3]=Math.cos(i),r}function R(r,n,i,e){var a=n[0],t=n[1],c=n[2],v=n[3],s=i[0],f=i[1],l=i[2],p=i[3],o,y,z,d,g;return y=a*s+t*f+c*l+v*p,y<0&&(y=-y,s=-s,f=-f,l=-l,p=-p),1-y>D?(o=Math.acos(y),z=Math.sin(o),d=Math.sin((1-e)*o)/z,g=Math.sin(e*o)/z):(d=1-e,g=e),r[0]=d*a+g*s,r[1]=d*t+g*f,r[2]=d*c+g*l,r[3]=d*v+g*p,r}function u(r,n){var i=n[0]+n[4]+n[8],e;if(i>0)e=Math.sqrt(i+1),r[3]=.5*e,e=.5/e,r[0]=(n[5]-n[7])*e,r[1]=(n[6]-n[2])*e,r[2]=(n[1]-n[3])*e;else{var a=0;n[4]>n[0]&&(a=1),n[8]>n[a*3+a]&&(a=2);var t=(a+1)%3,c=(a+2)%3;e=Math.sqrt(n[a*3+a]-n[t*3+t]-n[c*3+c]+1),r[a]=.5*e,e=.5/e,r[3]=(n[t*3+c]-n[c*3+t])*e,r[t]=(n[t*3+a]+n[a*3+t])*e,r[c]=(n[c*3+a]+n[a*3+c])*e}return r}var yr=U,T=X;(function(){var r=P(),n=b(1,0,0),i=b(0,1,0);return function(e,a,t){var c=Y(a,t);return c<-.999999?(N(r,n,a),_(r)<1e-6&&N(r,i,a),W(r,r),Z(e,r,Math.PI),e):c>.999999?(e[0]=0,e[1]=0,e[2]=0,e[3]=1,e):(N(r,a,t),e[0]=r[0],e[1]=r[1],e[2]=r[2],e[3]=1+c,T(e,e))}})();(function(){var r=B(),n=B();return function(i,e,a,t,c,v){return R(r,e,c,v),R(n,a,t,v),R(i,r,n,2*v*(1-v)),i}})();(function(){var r=q();return function(n,i,e,a){return r[0]=e[0],r[3]=e[1],r[6]=e[2],r[1]=a[0],r[4]=a[1],r[7]=a[2],r[2]=-i[0],r[5]=-i[1],r[8]=-i[2],T(n,u(n,r))}})();export{k as A,J as a,K as b,E as c,P as d,fr as e,cr as f,R as g,hr as h,lr as i,Q as j,rr as k,Mr as l,er as m,ar as n,nr as o,vr as p,mr as q,tr as r,H as s,ir as t,b as u,yr as v,sr as w,pr as x,or as y,xr as z};
