import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const canvas=document.getElementById('scene');
const mobile=innerWidth<700;
const renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=!mobile;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x01030a);
scene.fog=new THREE.FogExp2(0x060b15,.00115);
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.5,3000);
camera.position.set(0,18,245);
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),mobile?1.2:1.75,.62,.08);
composer.addPass(bloom);

const clock=new THREE.Clock();
const world=new THREE.Group(),decor=new THREE.Group(),story=new THREE.Group(),effects=new THREE.Group();
scene.add(world,decor,story,effects);
const hemi=new THREE.HemisphereLight(0x49698e,0x020305,.42);scene.add(hemi);
const moon=new THREE.DirectionalLight(0x9dc9ff,.55);moon.position.set(-200,350,150);moon.castShadow=!mobile;scene.add(moon);

const palettes={
  gold:[0xfff0b5,0xffcc68,0xff8d32],sakura:[0xffe8f3,0xff78af,0xe84890],azure:[0xe7faff,0x6ed6ff,0x357cff],
  emerald:[0xe8fff7,0x68efb4,0x20be8e],rainbow:[0xff547d,0xffd45d,0x58efb0,0x4dafff,0xa86eff]
};
const festivalNames={nagaoka:'长冈大花火',omagari:'大曲竞技花火',sumida:'隅田川花火',suwa:'诹访湖上花火',custom:'自定义花火'};
let currentFestival='nagaoka',selectedType='chrysanthemum',selectedColor='gold',auto=false,soundOn=true,showTimer=3;
let rockets=[],bursts=[],smokes=[],lights=[],audioCtx,master,loadingAudio=false;
const boomBuffers=[],launchBuffers=[];

const rand=(a,b)=>Math.random()*(b-a)+a;
const pick=a=>a[(Math.random()*a.length)|0];
const colorFor=(key,i=0)=>new THREE.Color((palettes[key]||palettes.gold)[i%(palettes[key]||palettes.gold).length]);

function makeSoftTexture(noisy=false){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  if(noisy){x.filter='blur(8px)';for(let i=0;i<34;i++){const px=64+rand(-35,35),py=64+rand(-30,30),r=rand(10,27),g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(255,255,255,.24)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}}
  else{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.12,'rgba(255,255,255,.95)');g.addColorStop(.42,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const glowTexture=makeSoftTexture(),smokeTexture=makeSoftTexture(true);

function makeSky(){
  const geo=new THREE.SphereGeometry(1400,32,18);
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x01030a)},bottom:{value:new THREE.Color(0x122139)}},vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform vec3 top;uniform vec3 bottom;varying vec3 vPos;void main(){float h=smoothstep(-.15,.65,normalize(vPos).y);gl_FragColor=vec4(mix(bottom,top,h),1.);}`});
  world.add(new THREE.Mesh(geo,mat));
  const n=700,pos=new Float32Array(n*3),col=new Float32Array(n*3);
  for(let i=0;i<n;i++){const r=900,th=rand(0,Math.PI*2),u=rand(.05,.95);pos[i*3]=Math.cos(th)*r*Math.sqrt(1-u*u);pos[i*3+1]=u*r;pos[i*3+2]=Math.sin(th)*r*Math.sqrt(1-u*u);const v=rand(.35,1);col.set([v*.65,v*.8,v],i*3)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));world.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.3,vertexColors:true,transparent:true,opacity:.7,depthWrite:false})));
}

const waterUniforms={time:{value:0},accent:{value:new THREE.Color(0x25527b)}};
function makeWater(){
  const geo=new THREE.PlaneGeometry(1800,1600,100,80);geo.rotateX(-Math.PI/2);
  const mat=new THREE.ShaderMaterial({transparent:false,uniforms:waterUniforms,vertexShader:`uniform float time;varying vec3 vWorld;void main(){vec3 p=position;p.y+=sin(p.x*.035+time*1.2)*.65+sin(p.z*.027-time*.8)*.55;vWorld=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform vec3 accent;uniform float time;varying vec3 vWorld;void main(){float w=sin(vWorld.x*.09+vWorld.z*.04+time)*.5+.5;vec3 c=mix(vec3(.008,.018,.032),accent*.16,w*.24);gl_FragColor=vec4(c,1.);}`});
  const m=new THREE.Mesh(geo,mat);m.position.y=-2;m.receiveShadow=true;world.add(m);
}

function terrain(seed=1,height=65,distance=-430){
  const g=new THREE.PlaneGeometry(1200,260,70,14);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);const edge=(y+130)/260;const h=(Math.sin(x*.011+seed)+Math.sin(x*.027+seed*2)*.38+1.3)*height*edge;p.setZ(i,h)}
  g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x050911,roughness:1}));m.position.set(0,-3,distance);m.receiveShadow=true;decor.add(m);return m;
}
function box(x,y,z,w,h,d,color=0x050810){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.88}));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;decor.add(m);return m}
function lightDot(x,y,z,color=0xffbf72,size=2){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.scale.setScalar(size);decor.add(s)}

// A fully modelled foreground tableau. It gives the fireworks scale, narrative and
// real foreground/midground/background parallax instead of treating the sky as wallpaper.
const silhouetteMat=new THREE.MeshStandardMaterial({color:0x070a10,roughness:.86,metalness:.08});
const clothMat=new THREE.MeshStandardMaterial({color:0x0c111a,roughness:.95});
const metalMat=new THREE.MeshStandardMaterial({color:0x111923,roughness:.32,metalness:.82});
function limb(a,b,r,mat=silhouetteMat){const d=new THREE.Vector3().subVectors(b,a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.88,d.length(),8),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());m.castShadow=true;return m}
function makePerson(x,scale=1,pose='center'){
  const g=new THREE.Group(), hip=new THREE.Vector3(0,16*scale,0), shoulder=new THREE.Vector3(0,28*scale,0);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(5.2*scale,10*scale,7,10),clothMat);torso.position.set(0,23*scale,0);torso.scale.set(1,1,pose==='coat'?1.18:1);g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(4.25*scale,18,14),silhouetteMat);head.position.set(0,37*scale,0);head.scale.set(1,.95,.92);g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(4.5*scale,14,10,0,Math.PI*2,0,Math.PI*.68),new THREE.MeshStandardMaterial({color:0x030407,roughness:1}));hair.position.set(-.2*scale,38*scale,-.25*scale);hair.rotation.z=.12;g.add(hair);
  const leftFoot=new THREE.Vector3(-3.4*scale,0,pose==='lean'?1.5:0),rightFoot=new THREE.Vector3(3.4*scale,0,0);
  g.add(limb(hip.clone().add(new THREE.Vector3(-2.5*scale,0,0)),leftFoot,2.15*scale),limb(hip.clone().add(new THREE.Vector3(2.5*scale,0,0)),rightFoot,2.15*scale));
  const lHand=pose==='lean'?new THREE.Vector3(-13*scale,25*scale,1):new THREE.Vector3(-7*scale,14*scale,0);
  const rHand=pose==='embrace'?new THREE.Vector3(-13*scale,28*scale,2):new THREE.Vector3(7*scale,15*scale,0);
  g.add(limb(shoulder.clone().add(new THREE.Vector3(-4.4*scale,0,0)),lHand,1.55*scale,clothMat),limb(shoulder.clone().add(new THREE.Vector3(4.4*scale,0,0)),rHand,1.55*scale,clothMat));
  g.position.x=x;g.children.forEach(o=>{if(o.isMesh)o.castShadow=true});return g;
}
function makeObserver(x){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(9,18,7),metalMat);body.position.y=20;body.rotation.z=.12;g.add(body);
  const head=new THREE.Mesh(new THREE.CylinderGeometry(4.5,5.2,7,10),metalMat);head.position.set(0,33,0);head.rotation.z=Math.PI/2;g.add(head);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(2.15,2.15,2.6,16),new THREE.MeshStandardMaterial({color:0x162637,emissive:0x71d7ff,emissiveIntensity:2.2,metalness:.7}));lens.position.set(4.8,33,0);lens.rotation.z=Math.PI/2;g.add(lens);
  g.add(limb(new THREE.Vector3(-3,12,0),new THREE.Vector3(-5,0,1),2,metalMat),limb(new THREE.Vector3(3,12,0),new THREE.Vector3(5,0,-1),2,metalMat));
  g.add(limb(new THREE.Vector3(-4,25,0),new THREE.Vector3(-11,18,4),1.5,metalMat),limb(new THREE.Vector3(4,25,0),new THREE.Vector3(11,29,3),1.5,metalMat));g.position.x=x;return g
}
function buildStory(){
  const deck=new THREE.Mesh(new THREE.BoxGeometry(170,7,54),new THREE.MeshStandardMaterial({color:0x05070a,roughness:.9,metalness:.25}));deck.position.set(0,-3,104);deck.receiveShadow=true;story.add(deck);
  const railMat=new THREE.MeshStandardMaterial({color:0x111821,roughness:.4,metalness:.8});
  story.add(limb(new THREE.Vector3(-86,14,82),new THREE.Vector3(86,14,82),1.1,railMat));for(let x=-82;x<88;x+=18)story.add(limb(new THREE.Vector3(x,0,82),new THREE.Vector3(x,15,82),.55,railMat));
  const observer=makeObserver(-28);observer.position.z=103;observer.rotation.y=-.13;story.add(observer);
  const heroine=makePerson(0,.94,'lean');heroine.position.z=101;heroine.rotation.z=-.04;story.add(heroine);
  const companion=makePerson(20,1.12,'embrace');companion.position.z=104;companion.rotation.y=-.12;story.add(companion);
  // Companion's arm crosses the frame to the heroine: a readable, original story beat.
  story.add(limb(new THREE.Vector3(15,31,104),new THREE.Vector3(2,29,101),1.75,clothMat));
  const cyan=new THREE.PointLight(0x55bfff,7,90,2);cyan.position.set(-42,45,76);const magenta=new THREE.PointLight(0xff5a9d,5,80,2);magenta.position.set(38,38,75);story.add(cyan,magenta);story.userData.rim=[cyan,magenta];
}
buildStory();

function buildFestival(id){
  while(decor.children.length){const o=decor.children.pop();o.geometry?.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}}
  scene.fog.density=id==='sumida'?.00135:.00105;
  waterUniforms.accent.value.set(id==='suwa'?0x205d67:id==='sumida'?0x4b2931:id==='omagari'?0x382853:0x244c70);
  if(id==='sumida'){
    for(let x=-540;x<540;x+=rand(18,42)){const h=rand(22,110),z=rand(-420,-300);box(x,0,z,rand(16,36),h,rand(18,40),0x05070d);if(Math.random()<.7)for(let y=14;y<h;y+=15)lightDot(x+rand(-7,7),y,z+21,0xffb66a,1.5)}
    const tower=new THREE.Group();const mast=new THREE.Mesh(new THREE.CylinderGeometry(2,9,250,8),new THREE.MeshStandardMaterial({color:0x111722,metalness:.55}));mast.position.y=125;tower.add(mast);const deck=new THREE.Mesh(new THREE.CylinderGeometry(21,26,7,16),new THREE.MeshStandardMaterial({color:0x1e2937,emissive:0x315c7c,emissiveIntensity:.5}));deck.position.y=178;tower.add(deck);tower.position.set(250,0,-340);decor.add(tower);
  }else{
    terrain(id==='suwa'?5:id==='omagari'?3:1,id==='suwa'?105:id==='nagaoka'?72:44,id==='suwa'?-520:-440);
    for(let x=-520;x<520;x+=rand(20,38)){box(x,0,rand(-390,-320),rand(14,30),rand(7,25),20);if(Math.random()<.75)lightDot(x,rand(7,20),-305,0xffbd73,1.2)}
    if(id==='nagaoka'){const bridge=new THREE.Group();const deck=box(0,0,0,1,1,1);decor.remove(deck);const beam=new THREE.Mesh(new THREE.BoxGeometry(900,4,10),new THREE.MeshStandardMaterial({color:0x121b26,metalness:.5}));beam.position.y=18;bridge.add(beam);for(let x=-430;x<=430;x+=70){const p=new THREE.Mesh(new THREE.BoxGeometry(3,22,3),beam.material);p.position.set(x,7,0);bridge.add(p);const lamp=new THREE.PointLight(0xffc16e,.25,25);lamp.position.set(x,22,0);bridge.add(lamp)}bridge.position.z=-215;decor.add(bridge)}
    if(id==='omagari'){for(let x=-400;x<400;x+=12)lightDot(x,5,-210,0xff925f,.9)}
  }
  // Foreground reeds and viewing silhouettes create genuine parallax during camera moves.
  for(let i=0;i<80;i++){const h=rand(5,22),m=new THREE.Mesh(new THREE.CylinderGeometry(.08,.18,h,4),new THREE.MeshBasicMaterial({color:0x020407}));m.position.set(rand(-500,500),h/2,rand(80,260));decor.add(m)}
}

makeSky();makeWater();buildFestival(currentFestival);

const particleVertex=`attribute float aSize;varying vec3 vColor;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*(320./-mv.z);gl_Position=projectionMatrix*mv;}`;
const particleFragment=`varying vec3 vColor;uniform float opacity;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*opacity;gl_FragColor=vec4(vColor,a);}`;

class Rocket{
  constructor(x,targetY,type,color,z=rand(-100,120)){this.pos=new THREE.Vector3(x,2,z);this.vel=new THREE.Vector3(rand(-2,2),rand(50,65),rand(-2,2));this.target=targetY;this.type=type;this.color=color;this.dead=false;this.trail=[];const mat=new THREE.SpriteMaterial({map:glowTexture,color:colorFor(color),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});this.sprite=new THREE.Sprite(mat);this.sprite.scale.setScalar(3);this.sprite.position.copy(this.pos);effects.add(this.sprite);this.line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:colorFor(color),transparent:true,opacity:.55,blending:THREE.AdditiveBlending}));effects.add(this.line);playLaunch(x/260)}
  update(dt){this.trail.push(this.pos.clone());if(this.trail.length>30)this.trail.shift();this.vel.y-=9.8*dt;this.pos.addScaledVector(this.vel,dt);this.sprite.position.copy(this.pos);this.line.geometry.dispose();this.line.geometry=new THREE.BufferGeometry().setFromPoints(this.trail);if(this.pos.y>=this.target||this.vel.y<5){this.dead=true;this.dispose();explode(this.pos,this.type,this.color)}}
  dispose(){effects.remove(this.sprite,this.line);this.sprite.material.dispose();this.line.geometry.dispose();this.line.material.dispose()}
}

class Burst{
  constructor(origin,type,colorKey,countScale=1){this.origin=origin.clone();this.type=type;this.age=0;this.life=type==='willow'||type==='kamuro'?6.8:4.5;const count=Math.floor((mobile?120:260)*countScale*(type==='starmine'?1.25:1));this.count=count;this.pos=new Float32Array(count*3);this.prev=new Float32Array(count*3);this.vel=new Float32Array(count*3);this.colors=new Float32Array(count*3);this.sizes=new Float32Array(count);const pal=palettes[colorKey]||palettes.gold;
    for(let i=0;i<count;i++){const j=i*3;this.pos[j]=this.prev[j]=origin.x;this.pos[j+1]=this.prev[j+1]=origin.y;this.pos[j+2]=this.prev[j+2]=origin.z;let v;
      if(type==='ring'){const a=i/count*Math.PI*2+rand(-.035,.035),tilt=.42;v=new THREE.Vector3(Math.cos(a),Math.sin(a)*Math.cos(tilt),Math.sin(a)*Math.sin(tilt)).multiplyScalar(rand(25,42))}
      else if(type==='phoenix'){const a=rand(-1.25,1.25);v=new THREE.Vector3(Math.sin(a)*rand(35,60),Math.cos(a)*rand(15,45),rand(-18,18))}
      else{v=new THREE.Vector3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize().multiplyScalar(type==='kamuro'?rand(28,50):rand(22,48));if(type==='willow')v.y*=.72}
      this.vel[j]=v.x;this.vel[j+1]=v.y;this.vel[j+2]=v.z;const c=new THREE.Color(pal[i%pal.length]);this.colors.set([c.r,c.g,c.b],j);this.sizes[i]=rand(type==='kamuro'?3.2:2,type==='kamuro'?6:4.8)}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.pos,3));geo.setAttribute('color',new THREE.BufferAttribute(this.colors,3));geo.setAttribute('aSize',new THREE.BufferAttribute(this.sizes,1));
    this.mat=new THREE.ShaderMaterial({uniforms:{opacity:{value:1}},vertexShader:particleVertex,fragmentShader:particleFragment,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});this.points=new THREE.Points(geo,this.mat);effects.add(this.points);
    const linePos=new Float32Array(count*6),lineCol=new Float32Array(count*6);for(let i=0;i<count;i++){lineCol.set(this.colors.slice(i*3,i*3+3),i*6);lineCol.set(this.colors.slice(i*3,i*3+3),i*6+3)}const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(linePos,3));lg.setAttribute('color',new THREE.BufferAttribute(lineCol,3));this.lineMat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});this.lines=new THREE.LineSegments(lg,this.lineMat);effects.add(this.lines)}
  update(dt){this.age+=dt;const drag=Math.pow((this.type==='willow'||this.type==='kamuro') ? .987 : .978,dt*60),g=(this.type==='willow'||this.type==='kamuro') ? 7.2 : 10.5,lp=this.lines.geometry.attributes.position.array;
    for(let i=0;i<this.count;i++){const j=i*3,k=i*6;this.prev[j]=this.pos[j];this.prev[j+1]=this.pos[j+1];this.prev[j+2]=this.pos[j+2];this.vel[j]*=drag;this.vel[j+1]=this.vel[j+1]*drag-g*dt;this.vel[j+2]*=drag;this.pos[j]+=this.vel[j]*dt;this.pos[j+1]+=this.vel[j+1]*dt;this.pos[j+2]+=this.vel[j+2]*dt;const trail=(this.type==='willow'||this.type==='kamuro') ? .2 : .12;lp[k]=this.pos[j]-this.vel[j]*trail;lp[k+1]=this.pos[j+1]-this.vel[j+1]*trail;lp[k+2]=this.pos[j+2]-this.vel[j+2]*trail;lp[k+3]=this.pos[j];lp[k+4]=this.pos[j+1];lp[k+5]=this.pos[j+2]}
    this.points.geometry.attributes.position.needsUpdate=true;this.lines.geometry.attributes.position.needsUpdate=true;const fade=Math.max(0,1-this.age/this.life);this.mat.uniforms.opacity.value=fade<.2?fade/.2:1;this.lineMat.opacity=Math.pow(fade,1.4);return this.age>=this.life}
  dispose(){effects.remove(this.points,this.lines);this.points.geometry.dispose();this.mat.dispose();this.lines.geometry.dispose();this.lineMat.dispose()}
}

class Smoke{
  constructor(pos,color){this.age=0;this.life=rand(6,12);this.vel=new THREE.Vector3(rand(-2,3),rand(.5,2.2),rand(-1.5,1.5));const mat=new THREE.SpriteMaterial({map:smokeTexture,color:new THREE.Color(color).lerp(new THREE.Color(0x59616d),.72),transparent:true,opacity:.16,depthWrite:false});this.sprite=new THREE.Sprite(mat);this.sprite.position.copy(pos).add(new THREE.Vector3(rand(-8,8),rand(-5,7),rand(-8,8)));const s=rand(12,28);this.sprite.scale.set(s,s,s);effects.add(this.sprite)}
  update(dt){this.age+=dt;this.sprite.position.addScaledVector(this.vel,dt);this.sprite.scale.multiplyScalar(1+dt*.075);this.sprite.material.opacity=Math.sin(Math.min(1,this.age/this.life)*Math.PI)*.13;return this.age>=this.life}dispose(){effects.remove(this.sprite);this.sprite.material.dispose()}
}

function explode(pos,type,colorKey){
  const scale=currentFestival==='nagaoka'?1.35:1;bursts.push(new Burst(pos,type,colorKey,scale));
  if(type==='starmine')for(let i=0;i<4;i++)setTimeout(()=>{const p=pos.clone().add(new THREE.Vector3(rand(-35,35),rand(-18,25),rand(-30,30)));bursts.push(new Burst(p,pick(['ring','peony','chrysanthemum']),colorKey,.45));flash(p,colorFor(colorKey,i))},150+i*125);
  for(let i=0;i<(mobile?5:12);i++)smokes.push(new Smoke(pos,colorFor(colorKey,i)));
  flash(pos,colorFor(colorKey,1));playBoom(pos.x/260);cameraDirector.focus.copy(pos);
}
function flash(pos,color){const light=new THREE.PointLight(color,mobile?18:42,340,2);light.position.copy(pos);scene.add(light);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.copy(pos);s.scale.setScalar(18);effects.add(s);story.userData.rim?.forEach(r=>r.intensity+=8);lights.push({light,s,age:0,life:.55})}
function launch(x=rand(-220,220),target=rand(95,205),type=selectedType,color=selectedColor,z=rand(-190,-35)){rockets.push(new Rocket(x,target,type,color,z))}
function waterMine(x,color='gold'){const p=new THREE.Vector3(x,6,rand(-80,70));bursts.push(new Burst(p,'phoenix',color,.8));flash(p,colorFor(color));playBoom(x/260)}

const cameraDirector={index:-1,shotTime:0,focus:new THREE.Vector3(0,100,0),lookNow:new THREE.Vector3(),shots:[
  {name:'ESTABLISHING',a:new THREE.Vector3(0,24,224),b:new THREE.Vector3(-10,28,204),la:new THREE.Vector3(0,76,-42),lb:new THREE.Vector3(0,96,-70),fov:49,duration:12},
  {name:'OVER SHOULDER',a:new THREE.Vector3(-56,36,151),b:new THREE.Vector3(-42,39,134),la:new THREE.Vector3(28,89,-65),lb:new THREE.Vector3(42,108,-90),fov:55,duration:10},
  {name:'LOW REVEAL',a:new THREE.Vector3(76,8,166),b:new THREE.Vector3(54,16,142),la:new THREE.Vector3(-16,102,-86),lb:new THREE.Vector3(-8,125,-120),fov:62,duration:8},
  {name:'PROFILE TRACK',a:new THREE.Vector3(-118,31,130),b:new THREE.Vector3(-98,35,119),la:new THREE.Vector3(15,78,-70),lb:new THREE.Vector3(28,103,-98),fov:50,duration:11},
  {name:'AERIAL ORBIT',a:new THREE.Vector3(168,104,236),b:new THREE.Vector3(104,126,190),la:new THREE.Vector3(0,82,-34),lb:new THREE.Vector3(-8,108,-75),fov:46,duration:13}
],next(force=false,manualIndex=null){if(currentFestival==='custom'&&manualIndex===null)return;this.index=manualIndex!==null?manualIndex:(this.index+1)%this.shots.length;this.shotTime=0;const s=this.shots[this.index];camera.position.copy(s.a);camera.fov=s.fov;camera.updateProjectionMatrix();camera.lookAt(s.la);document.getElementById('qualityLabel').textContent=s.name;document.querySelectorAll('#cameraRail button').forEach((b,i)=>b.classList.toggle('active',i===this.index));const cut=document.getElementById('cameraCut');cut.querySelector('small').textContent=`CAMERA 0${this.index+1}`;cut.querySelector('b').textContent=s.name;cut.classList.remove('show');requestAnimationFrame(()=>cut.classList.add('show'));clearTimeout(this.cutTimer);this.cutTimer=setTimeout(()=>cut.classList.remove('show'),1050)},update(dt){if(currentFestival==='custom')return;const s=this.shots[this.index];this.shotTime+=dt;if(this.shotTime>=s.duration){this.next();return}const p=this.shotTime/s.duration,t=p*p*(3-2*p);camera.position.lerpVectors(s.a,s.b,t);this.lookNow.lerpVectors(s.la,s.lb,t);camera.lookAt(this.lookNow)}};
cameraDirector.next(true);

function choreograph(grand=false){const colors=Object.keys(palettes);
  if(currentFestival==='nagaoka'){const n=mobile?5:grand?11:7;for(let i=0;i<n;i++)setTimeout(()=>launch(-250+i*(500/(n-1)),rand(125,215),i%2?'kamuro':'phoenix',i%3?'gold':'azure',rand(-185,-45)),i*120)}
  else if(currentFestival==='omagari'){const ts=['ring','peony','chrysanthemum','willow','starmine'];for(let i=0;i<(grand?8:5);i++)setTimeout(()=>launch(rand(-180,180),rand(90,180),ts[i%ts.length],colors[i%colors.length]),i*330)}
  else if(currentFestival==='sumida'){for(let i=0;i<(grand?10:6);i++)setTimeout(()=>launch((i%2?-130:130)+rand(-45,45),rand(90,170),pick(['peony','ring','starmine']),pick(colors),rand(-80,80)),i*165)}
  else if(currentFestival==='suwa'){const n=mobile?3:grand?7:4;for(let i=0;i<n;i++)setTimeout(()=>waterMine(-220+i*(440/(n-1)),i%2?'azure':'gold'),i*175);for(let i=0;i<4;i++)setTimeout(()=>launch(rand(-180,180),rand(110,185),i%2?'kamuro':'starmine',pick(colors)),500+i*280)}
  else for(let i=0;i<(grand?6:3);i++)setTimeout(()=>launch(rand(-180,180),rand(85,175),selectedType,selectedColor),i*230)
}

function selectFestival(id,play=false){currentFestival=id;document.getElementById('festivalName').textContent=festivalNames[id];document.body.classList.toggle('custom-mode',id==='custom');document.getElementById('typeLabel').textContent=id==='custom'?'烟花类型':'大会专属编排';document.querySelectorAll('#festivalMenu button').forEach(x=>x.classList.toggle('active',x.dataset.festival===id));document.querySelectorAll('#introFestivals button').forEach(x=>x.classList.toggle('active',x.dataset.introFestival===id));document.getElementById('festivalMenu').classList.remove('open');buildFestival(id);auto=id!=='custom';showTimer=3;syncAuto();if(id!=='custom'){cameraDirector.index=-1;cameraDirector.next(true)}else{camera.position.set(0,22,245);camera.lookAt(0,105,0);document.getElementById('qualityLabel').textContent='FREE CAMERA'}if(play){clearEffects();setTimeout(()=>choreograph(true),280)}}
function clearEffects(){rockets.forEach(r=>r.dispose());bursts.forEach(b=>b.dispose());smokes.forEach(s=>s.dispose());lights.forEach(l=>{scene.remove(l.light);effects.remove(l.s);l.light.dispose();l.s.material.dispose()});rockets=[];bursts=[];smokes=[];lights=[]}
function syncAuto(){const b=document.getElementById('autoBtn');b.classList.toggle('active',auto);b.querySelector('.play-icon').textContent=auto?'Ⅱ':'▶'}

function initAudio(){if(audioCtx)return;audioCtx=new(window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=.72;const comp=audioCtx.createDynamicsCompressor();comp.threshold.value=-8;comp.ratio.value=12;master.connect(comp).connect(audioCtx.destination)}
async function unlockAudio(){initAudio();if(audioCtx.state==='suspended')await audioCtx.resume();const silent=audioCtx.createBufferSource();silent.buffer=audioCtx.createBuffer(1,1,22050);silent.connect(master);silent.start();if(!loadingAudio){loadingAudio=true;const base=`${import.meta.env.BASE_URL}assets/audio/`;await Promise.all([1,2,3,4,5,6].map(async n=>{try{const r=await fetch(`${base}boom-${n}.ogg`);if(!r.ok)throw Error(r.status);boomBuffers.push(await audioCtx.decodeAudioData(await r.arrayBuffer()))}catch(e){console.warn('boom audio',e)}}));await Promise.all([1,2,3,4].map(async n=>{try{const r=await fetch(`${base}launch-${n}.ogg`);if(!r.ok)throw Error(r.status);launchBuffers.push(await audioCtx.decodeAudioData(await r.arrayBuffer()))}catch(e){console.warn('launch audio',e)}}))}if(audioCtx.state==='suspended')await audioCtx.resume()}
function playBuffer(buffers,pan,volume,rate=1){if(!soundOn||!audioCtx||!buffers.length)return;const src=audioCtx.createBufferSource(),p=audioCtx.createStereoPanner(),g=audioCtx.createGain();src.buffer=pick(buffers);src.playbackRate.value=rate;p.pan.value=THREE.MathUtils.clamp(pan,-1,1);g.gain.value=volume;src.connect(g).connect(p).connect(master);src.start()}
function playLaunch(pan){playBuffer(launchBuffers,pan,.38,rand(.94,1.07))}function playBoom(pan){playBuffer(boomBuffers,pan,.72,rand(.95,1.05))}

// Interaction and kiosk guards
document.addEventListener('selectstart',e=>e.preventDefault());document.addEventListener('dragstart',e=>e.preventDefault());document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault()},{passive:false});
let wakeLock;async function keepAwake(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch{}}document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')keepAwake()});
canvas.addEventListener('pointerdown',e=>{unlockAudio();if(currentFestival==='custom'){const x=(e.clientX/innerWidth-.5)*440,target=60+(1-e.clientY/innerHeight)*130;launch(x,target)}else choreograph(false)});
document.getElementById('launchBtn').onclick=e=>{e.stopPropagation();currentFestival==='custom'?launch():choreograph(false)};
document.getElementById('types').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedType=b.dataset.type;document.querySelectorAll('#types button').forEach(x=>x.classList.toggle('active',x===b))};
document.getElementById('palette').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedColor=b.dataset.color;document.querySelectorAll('.swatch').forEach(x=>x.classList.toggle('active',x===b))};
document.getElementById('festivalBtn').onclick=e=>{e.stopPropagation();document.getElementById('festivalMenu').classList.toggle('open')};
document.getElementById('festivalMenu').onclick=e=>{const b=e.target.closest('button');if(b){e.stopPropagation();selectFestival(b.dataset.festival,true)}};
document.getElementById('introFestivals').onclick=e=>{const b=e.target.closest('button');if(b){e.stopPropagation();selectFestival(b.dataset.introFestival,false)}};
document.addEventListener('click',()=>document.getElementById('festivalMenu').classList.remove('open'));
document.getElementById('autoBtn').onclick=e=>{e.stopPropagation();auto=!auto;syncAuto();if(auto){showTimer=0;unlockAudio()}};
document.getElementById('soundBtn').onclick=e=>{e.stopPropagation();soundOn=!soundOn;e.currentTarget.classList.toggle('active',soundOn);document.getElementById('soundIcon').textContent=soundOn?'♪':'×';if(soundOn)unlockAudio()};
document.getElementById('cameraRail').onclick=e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();cameraDirector.next(false,Number(b.dataset.camera));unlockAudio()};
document.getElementById('enterBtn').onclick=async()=>{keepAwake();auto=currentFestival!=='custom';showTimer=3;syncAuto();document.body.classList.add('running');document.getElementById('startScreen').classList.add('hidden');await unlockAudio();choreograph(true)};

let fps=60,frames=0;
function updateScene(dt){waterUniforms.time.value+=dt;cameraDirector.update(dt);
  if(story.userData.rim){story.userData.rim[0].intensity=THREE.MathUtils.lerp(story.userData.rim[0].intensity,7,dt*2.5);story.userData.rim[1].intensity=THREE.MathUtils.lerp(story.userData.rim[1].intensity,5,dt*2.5)}
  for(let i=rockets.length-1;i>=0;i--){rockets[i].update(dt);if(rockets[i].dead)rockets.splice(i,1)}
  for(let i=bursts.length-1;i>=0;i--)if(bursts[i].update(dt)){bursts[i].dispose();bursts.splice(i,1)}
  for(let i=smokes.length-1;i>=0;i--)if(smokes[i].update(dt)){smokes[i].dispose();smokes.splice(i,1)}
  for(let i=lights.length-1;i>=0;i--){const l=lights[i];l.age+=dt;const f=Math.max(0,1-l.age/l.life);l.light.intensity=(mobile?14:30)*f;l.s.material.opacity=f;l.s.scale.setScalar(18+(1-f)*55);if(l.age>=l.life){scene.remove(l.light);effects.remove(l.s);l.light.dispose();l.s.material.dispose();lights.splice(i,1)}}
  if(auto){showTimer-=dt;if(showTimer<=0){choreograph(false);showTimer=rand(4.2,7.2)}}
  fps=fps*.94+(1/Math.max(dt,.001))*.06;if(++frames%40===0)document.getElementById('fps').textContent=Math.round(Math.min(99,fps))+' FPS';
}
function animate(){requestAnimationFrame(animate);updateScene(Math.min(.035,clock.getDelta()));composer.render()}
animate();
if(import.meta.env.DEV){window.__hanabiStep=(frames=1)=>{for(let i=0;i<frames;i++)updateScene(1/60);composer.render()};window.__hanabiState=()=>({booms:boomBuffers.length,launches:launchBuffers.length,audio:audioCtx?.state,camera:cameraDirector.shots[cameraDirector.index]?.name})}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.35:1.8))});
