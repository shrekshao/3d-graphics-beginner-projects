var f=(h,t,s)=>{if(!t.has(h))throw TypeError("Cannot "+s)};var i=(h,t,s)=>(f(h,t,"read from private field"),s?s.call(h):t.get(h)),o=(h,t,s)=>{if(t.has(h))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(h):t.set(h,s)},a=(h,t,s,p)=>(f(h,t,"write to private field"),p?p.call(h,s):t.set(h,s),s);var u=(h,t,s)=>(f(h,t,"access private method"),s);import{d as g,j as L,k as C,t as k,r as v,n as y,o as S,i as j,q}from"./quat.eb419a7f.js";var b,n,M,m,l,c,e,d,Y,P;class A{constructor(t){o(this,Y);o(this,b,void 0);o(this,n,void 0);o(this,M,void 0);o(this,m,void 0);o(this,l,void 0);o(this,c,void 0);o(this,e,void 0);o(this,d,void 0);this.orbitX=0,this.orbitY=0,this.maxOrbitX=Math.PI*.5,this.minOrbitX=-Math.PI*.5,this.maxOrbitY=Math.PI,this.minOrbitY=-Math.PI,this.constrainXOrbit=!0,this.constrainYOrbit=!1,this.maxDistance=10,this.minDistance=1,this.distanceStep=.005,this.constrainDistance=!0,a(this,b,g()),a(this,n,g()),a(this,M,L()),a(this,m,L()),a(this,l,g()),a(this,c,!0);let s=!1,p,X;const w=r=>{r.isPrimary&&(s=!0),p=r.pageX,X=r.pageY},O=r=>{let E,D;s&&(E=r.pageX-p,D=r.pageY-X,p=r.pageX,X=r.pageY,this.orbit(E*.025,D*.025))},I=r=>{r.isPrimary&&(s=!1)},x=r=>{this.distance=i(this,b)[2]+-r.wheelDeltaY*this.distanceStep,r.preventDefault()};a(this,d,r=>{i(this,e)&&i(this,e)!=r&&(i(this,e).removeEventListener("pointerdown",w),i(this,e).removeEventListener("pointermove",O),i(this,e).removeEventListener("pointerup",I),i(this,e).removeEventListener("mousewheel",x)),a(this,e,r),i(this,e)&&(i(this,e).addEventListener("pointerdown",w),i(this,e).addEventListener("pointermove",O),i(this,e).addEventListener("pointerup",I),i(this,e).addEventListener("mousewheel",x))}),a(this,e,t),i(this,d).call(this,t)}set element(t){i(this,d).call(this,t)}get element(){return i(this,e)}orbit(t,s){if(t||s){if(this.orbitY+=t,this.constrainYOrbit)this.orbitY=Math.min(Math.max(this.orbitY,this.minOrbitY),this.maxOrbitY);else{for(;this.orbitY<-Math.PI;)this.orbitY+=Math.PI*2;for(;this.orbitY>=Math.PI;)this.orbitY-=Math.PI*2}if(this.orbitX+=s,this.constrainXOrbit)this.orbitX=Math.min(Math.max(this.orbitX,this.minOrbitX),this.maxOrbitX);else{for(;this.orbitX<-Math.PI;)this.orbitX+=Math.PI*2;for(;this.orbitX>=Math.PI;)this.orbitX-=Math.PI*2}a(this,c,!0)}}get target(){return[i(this,n)[0],i(this,n)[1],i(this,n)[2]]}set target(t){i(this,n)[0]=t[0],i(this,n)[1]=t[1],i(this,n)[2]=t[2],a(this,c,!0)}get distance(){return-i(this,b)[2]}set distance(t){i(this,b)[2]=t,this.constrainDistance&&(i(this,b)[2]=Math.min(Math.max(i(this,b)[2],this.minDistance),this.maxDistance)),a(this,c,!0)}get position(){return u(this,Y,P).call(this),j(i(this,l),0,0,0),q(i(this,l),i(this,l),i(this,m)),i(this,l)}get viewMatrix(){return u(this,Y,P).call(this),i(this,M)}}b=new WeakMap,n=new WeakMap,M=new WeakMap,m=new WeakMap,l=new WeakMap,c=new WeakMap,e=new WeakMap,d=new WeakMap,Y=new WeakSet,P=function(){if(i(this,c)){var t=i(this,m);C(t),k(t,t,i(this,n)),v(t,t,-this.orbitY),y(t,t,-this.orbitX),k(t,t,i(this,b)),S(i(this,M),i(this,m)),a(this,c,!1)}};export{A as default};
