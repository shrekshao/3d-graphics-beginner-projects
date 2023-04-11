const H=`struct Camera {
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
  // @location(\${ShaderLocations.POSITION}) position : vec3<f32>,
  // @location(\${ShaderLocations.NORMAL}) normal : vec3<f32>,
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
}`,J=`struct Camera {
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
  // @location(\${ShaderLocations.POSITION}) position : vec3<f32>,
  // @location(\${ShaderLocations.NORMAL}) normal : vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) texcoord : vec2<f32>,
};

@vertex
fn vertexMain(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  
  let skinMatrix = 
    input.weights0.x * joints[input.joints0.x] * inverseBindMatrices[input.joints0.x] +
    input.weights0.y * joints[input.joints0.y] * inverseBindMatrices[input.joints0.y] +
    input.weights0.z * joints[input.joints0.z] * inverseBindMatrices[input.joints0.z] +
    input.weights0.w * joints[input.joints0.w] * inverseBindMatrices[input.joints0.w];
  // let modelMatrix = model[input.instance];
  // let modelMatrix = skinMatrix * model[input.instance];
  let modelMatrix = skinMatrix;
  output.position = camera.projection * camera.view * modelMatrix * vec4(input.position, 1.0);
  output.normal = normalize((camera.view * modelMatrix * vec4(input.normal, 0.0)).xyz);
  output.texcoord = input.texcoord;

  return output;
}
`,K=`struct FragmentInput {
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
}`;var D=1e-6,j=typeof Float32Array<"u"?Float32Array:Array;Math.hypot||(Math.hypot=function(){for(var n=0,r=arguments.length;r--;)n+=arguments[r]*arguments[r];return Math.sqrt(n)});function q(){var n=new j(9);return j!=Float32Array&&(n[1]=0,n[2]=0,n[3]=0,n[5]=0,n[6]=0,n[7]=0),n[0]=1,n[4]=1,n[8]=1,n}function Q(){var n=new j(16);return j!=Float32Array&&(n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0),n[0]=1,n[5]=1,n[10]=1,n[15]=1,n}function k(n){var r=new j(16);return r[0]=n[0],r[1]=n[1],r[2]=n[2],r[3]=n[3],r[4]=n[4],r[5]=n[5],r[6]=n[6],r[7]=n[7],r[8]=n[8],r[9]=n[9],r[10]=n[10],r[11]=n[11],r[12]=n[12],r[13]=n[13],r[14]=n[14],r[15]=n[15],r}function nn(n){return n[0]=1,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=1,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=1,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function rn(n,r){var i=r[0],e=r[1],a=r[2],t=r[3],c=r[4],v=r[5],s=r[6],f=r[7],l=r[8],p=r[9],o=r[10],y=r[11],z=r[12],d=r[13],g=r[14],V=r[15],A=i*v-e*c,M=i*s-a*c,x=i*f-t*c,m=e*s-a*v,h=e*f-t*v,L=a*f-t*s,O=l*d-p*z,$=l*g-o*z,I=l*V-y*z,S=p*g-o*d,C=p*V-y*d,F=o*V-y*g,w=A*F-M*C+x*S+m*I-h*$+L*O;return w?(w=1/w,n[0]=(v*F-s*C+f*S)*w,n[1]=(a*C-e*F-t*S)*w,n[2]=(d*L-g*h+V*m)*w,n[3]=(o*h-p*L-y*m)*w,n[4]=(s*I-c*F-f*$)*w,n[5]=(i*F-a*I+t*$)*w,n[6]=(g*x-z*L-V*M)*w,n[7]=(l*L-o*x+y*M)*w,n[8]=(c*C-v*I+f*O)*w,n[9]=(e*I-i*C-t*O)*w,n[10]=(z*h-d*x+V*A)*w,n[11]=(p*x-l*h-y*A)*w,n[12]=(v*$-c*S-s*O)*w,n[13]=(i*S-e*$+a*O)*w,n[14]=(d*M-z*m-g*A)*w,n[15]=(l*m-p*M+o*A)*w,n):null}function en(n,r,i){var e=r[0],a=r[1],t=r[2],c=r[3],v=r[4],s=r[5],f=r[6],l=r[7],p=r[8],o=r[9],y=r[10],z=r[11],d=r[12],g=r[13],V=r[14],A=r[15],M=i[0],x=i[1],m=i[2],h=i[3];return n[0]=M*e+x*v+m*p+h*d,n[1]=M*a+x*s+m*o+h*g,n[2]=M*t+x*f+m*y+h*V,n[3]=M*c+x*l+m*z+h*A,M=i[4],x=i[5],m=i[6],h=i[7],n[4]=M*e+x*v+m*p+h*d,n[5]=M*a+x*s+m*o+h*g,n[6]=M*t+x*f+m*y+h*V,n[7]=M*c+x*l+m*z+h*A,M=i[8],x=i[9],m=i[10],h=i[11],n[8]=M*e+x*v+m*p+h*d,n[9]=M*a+x*s+m*o+h*g,n[10]=M*t+x*f+m*y+h*V,n[11]=M*c+x*l+m*z+h*A,M=i[12],x=i[13],m=i[14],h=i[15],n[12]=M*e+x*v+m*p+h*d,n[13]=M*a+x*s+m*o+h*g,n[14]=M*t+x*f+m*y+h*V,n[15]=M*c+x*l+m*z+h*A,n}function an(n,r,i){var e=i[0],a=i[1],t=i[2],c,v,s,f,l,p,o,y,z,d,g,V;return r===n?(n[12]=r[0]*e+r[4]*a+r[8]*t+r[12],n[13]=r[1]*e+r[5]*a+r[9]*t+r[13],n[14]=r[2]*e+r[6]*a+r[10]*t+r[14],n[15]=r[3]*e+r[7]*a+r[11]*t+r[15]):(c=r[0],v=r[1],s=r[2],f=r[3],l=r[4],p=r[5],o=r[6],y=r[7],z=r[8],d=r[9],g=r[10],V=r[11],n[0]=c,n[1]=v,n[2]=s,n[3]=f,n[4]=l,n[5]=p,n[6]=o,n[7]=y,n[8]=z,n[9]=d,n[10]=g,n[11]=V,n[12]=c*e+l*a+z*t+r[12],n[13]=v*e+p*a+d*t+r[13],n[14]=s*e+o*a+g*t+r[14],n[15]=f*e+y*a+V*t+r[15]),n}function tn(n,r,i){var e=Math.sin(i),a=Math.cos(i),t=r[4],c=r[5],v=r[6],s=r[7],f=r[8],l=r[9],p=r[10],o=r[11];return r!==n&&(n[0]=r[0],n[1]=r[1],n[2]=r[2],n[3]=r[3],n[12]=r[12],n[13]=r[13],n[14]=r[14],n[15]=r[15]),n[4]=t*a+f*e,n[5]=c*a+l*e,n[6]=v*a+p*e,n[7]=s*a+o*e,n[8]=f*a-t*e,n[9]=l*a-c*e,n[10]=p*a-v*e,n[11]=o*a-s*e,n}function cn(n,r,i){var e=Math.sin(i),a=Math.cos(i),t=r[0],c=r[1],v=r[2],s=r[3],f=r[8],l=r[9],p=r[10],o=r[11];return r!==n&&(n[4]=r[4],n[5]=r[5],n[6]=r[6],n[7]=r[7],n[12]=r[12],n[13]=r[13],n[14]=r[14],n[15]=r[15]),n[0]=t*a-f*e,n[1]=c*a-l*e,n[2]=v*a-p*e,n[3]=s*a-o*e,n[8]=t*e+f*a,n[9]=c*e+l*a,n[10]=v*e+p*a,n[11]=s*e+o*a,n}function vn(n,r,i,e){var a=r[0],t=r[1],c=r[2],v=r[3],s=a+a,f=t+t,l=c+c,p=a*s,o=a*f,y=a*l,z=t*f,d=t*l,g=c*l,V=v*s,A=v*f,M=v*l,x=e[0],m=e[1],h=e[2];return n[0]=(1-(z+g))*x,n[1]=(o+M)*x,n[2]=(y-A)*x,n[3]=0,n[4]=(o-M)*m,n[5]=(1-(p+g))*m,n[6]=(d+V)*m,n[7]=0,n[8]=(y+A)*h,n[9]=(d-V)*h,n[10]=(1-(p+z))*h,n[11]=0,n[12]=i[0],n[13]=i[1],n[14]=i[2],n[15]=1,n}function sn(n,r,i,e,a){var t=1/Math.tan(r/2),c;return n[0]=t/i,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=t,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=-1,n[12]=0,n[13]=0,n[15]=0,a!=null&&a!==1/0?(c=1/(e-a),n[10]=a*c,n[14]=a*e*c):(n[10]=-1,n[14]=-e),n}function P(){var n=new j(3);return j!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n}function G(n){var r=n[0],i=n[1],e=n[2];return Math.hypot(r,i,e)}function b(n,r,i){var e=new j(3);return e[0]=n,e[1]=r,e[2]=i,e}function ln(n,r){return n[0]=r[0],n[1]=r[1],n[2]=r[2],n}function fn(n,r,i,e){return n[0]=r,n[1]=i,n[2]=e,n}function pn(n,r,i){return n[0]=r[0]-i[0],n[1]=r[1]-i[1],n[2]=r[2]-i[2],n}function on(n,r,i){return n[0]=Math.min(r[0],i[0]),n[1]=Math.min(r[1],i[1]),n[2]=Math.min(r[2],i[2]),n}function xn(n,r,i){return n[0]=Math.max(r[0],i[0]),n[1]=Math.max(r[1],i[1]),n[2]=Math.max(r[2],i[2]),n}function mn(n,r){var i=r[0]-n[0],e=r[1]-n[1],a=r[2]-n[2];return Math.hypot(i,e,a)}function W(n,r){var i=r[0],e=r[1],a=r[2],t=i*i+e*e+a*a;return t>0&&(t=1/Math.sqrt(t)),n[0]=r[0]*t,n[1]=r[1]*t,n[2]=r[2]*t,n}function Y(n,r){return n[0]*r[0]+n[1]*r[1]+n[2]*r[2]}function N(n,r,i){var e=r[0],a=r[1],t=r[2],c=i[0],v=i[1],s=i[2];return n[0]=a*s-t*v,n[1]=t*c-e*s,n[2]=e*v-a*c,n}function hn(n,r,i){var e=r[0],a=r[1],t=r[2],c=i[3]*e+i[7]*a+i[11]*t+i[15];return c=c||1,n[0]=(i[0]*e+i[4]*a+i[8]*t+i[12])/c,n[1]=(i[1]*e+i[5]*a+i[9]*t+i[13])/c,n[2]=(i[2]*e+i[6]*a+i[10]*t+i[14])/c,n}var _=G;(function(){var n=P();return function(r,i,e,a,t,c){var v,s;for(i||(i=3),e||(e=0),a?s=Math.min(a*i+e,r.length):s=r.length,v=e;v<s;v+=i)n[0]=r[v],n[1]=r[v+1],n[2]=r[v+2],t(n,n,c),r[v]=n[0],r[v+1]=n[1],r[v+2]=n[2];return r}})();function E(){var n=new j(4);return j!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0,n[3]=0),n}function U(n,r,i,e){var a=new j(4);return a[0]=n,a[1]=r,a[2]=i,a[3]=e,a}function Mn(n,r){return n[0]=r[0],n[1]=r[1],n[2]=r[2],n[3]=r[3],n}function X(n,r){var i=r[0],e=r[1],a=r[2],t=r[3],c=i*i+e*e+a*a+t*t;return c>0&&(c=1/Math.sqrt(c)),n[0]=i*c,n[1]=e*c,n[2]=a*c,n[3]=t*c,n}function yn(n,r,i,e){var a=r[0],t=r[1],c=r[2],v=r[3];return n[0]=a+e*(i[0]-a),n[1]=t+e*(i[1]-t),n[2]=c+e*(i[2]-c),n[3]=v+e*(i[3]-v),n}(function(){var n=E();return function(r,i,e,a,t,c){var v,s;for(i||(i=4),e||(e=0),a?s=Math.min(a*i+e,r.length):s=r.length,v=e;v<s;v+=i)n[0]=r[v],n[1]=r[v+1],n[2]=r[v+2],n[3]=r[v+3],t(n,n,c),r[v]=n[0],r[v+1]=n[1],r[v+2]=n[2],r[v+3]=n[3];return r}})();function B(){var n=new j(4);return j!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n[3]=1,n}function Z(n,r,i){i=i*.5;var e=Math.sin(i);return n[0]=e*r[0],n[1]=e*r[1],n[2]=e*r[2],n[3]=Math.cos(i),n}function R(n,r,i,e){var a=r[0],t=r[1],c=r[2],v=r[3],s=i[0],f=i[1],l=i[2],p=i[3],o,y,z,d,g;return y=a*s+t*f+c*l+v*p,y<0&&(y=-y,s=-s,f=-f,l=-l,p=-p),1-y>D?(o=Math.acos(y),z=Math.sin(o),d=Math.sin((1-e)*o)/z,g=Math.sin(e*o)/z):(d=1-e,g=e),n[0]=d*a+g*s,n[1]=d*t+g*f,n[2]=d*c+g*l,n[3]=d*v+g*p,n}function u(n,r){var i=r[0]+r[4]+r[8],e;if(i>0)e=Math.sqrt(i+1),n[3]=.5*e,e=.5/e,n[0]=(r[5]-r[7])*e,n[1]=(r[6]-r[2])*e,n[2]=(r[1]-r[3])*e;else{var a=0;r[4]>r[0]&&(a=1),r[8]>r[a*3+a]&&(a=2);var t=(a+1)%3,c=(a+2)%3;e=Math.sqrt(r[a*3+a]-r[t*3+t]-r[c*3+c]+1),n[a]=.5*e,e=.5/e,n[3]=(r[t*3+c]-r[c*3+t])*e,n[t]=(r[t*3+a]+r[a*3+t])*e,n[c]=(r[c*3+a]+r[a*3+c])*e}return n}var dn=U,T=X;(function(){var n=P(),r=b(1,0,0),i=b(0,1,0);return function(e,a,t){var c=Y(a,t);return c<-.999999?(N(n,r,a),_(n)<1e-6&&N(n,i,a),W(n,n),Z(e,n,Math.PI),e):c>.999999?(e[0]=0,e[1]=0,e[2]=0,e[3]=1,e):(N(n,a,t),e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=1+c,T(e,e))}})();(function(){var n=B(),r=B();return function(i,e,a,t,c,v){return R(n,e,c,v),R(r,a,t,v),R(i,n,r,2*v*(1-v)),i}})();(function(){var n=q();return function(r,i,e,a){return n[0]=e[0],n[3]=e[1],n[6]=e[2],n[1]=a[0],n[4]=a[1],n[7]=a[2],n[2]=-i[0],n[5]=-i[1],n[8]=-i[2],T(r,u(r,n))}})();export{k as A,J as a,K as b,E as c,P as d,pn as e,vn as f,R as g,Mn as h,fn as i,Q as j,nn as k,yn as l,en as m,tn as n,rn as o,sn as p,hn as q,cn as r,H as s,an as t,b as u,dn as v,ln as w,on as x,xn as y,mn as z};
