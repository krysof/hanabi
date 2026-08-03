import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const canvas=document.getElementById('scene');
const mobile=innerWidth<700;
const renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));
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
const moon=new THREE.DirectionalLight(0x9dc9ff,.8);moon.position.set(-200,350,150);moon.castShadow=!mobile;if(!mobile){moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-300;moon.shadow.camera.right=300;moon.shadow.camera.top=300;moon.shadow.camera.bottom=-150;moon.shadow.camera.near=10;moon.shadow.camera.far=900;moon.shadow.bias=-.0003}scene.add(moon);

const palettes={
  gold:[0xfff0b5,0xffcc68,0xff8d32],sakura:[0xffe8f3,0xff78af,0xe84890],azure:[0xe7faff,0x6ed6ff,0x357cff],
  emerald:[0xe8fff7,0x68efb4,0x20be8e],rainbow:[0xff547d,0xffd45d,0x58efb0,0x4dafff,0xa86eff]
};
const festivalNames={nagaoka:'长冈大花火',omagari:'大曲竞技花火',sumida:'隅田川花火',suwa:'诹访湖上花火',ryukyu:'琉球海炎祭',custom:'自定义花火'};
const cameraLanguage={
  nagaoka:[['LAKE ESTABLISHING','湖面远景'],['WATERLINE DOLLY','水线滑轨'],['LAUNCH REVEAL','发射揭示'],['FIREWORK MACRO','火花特写'],['SHORELINE TRACK','岸线轨道'],['AERIAL PANORAMA','空中全景']],
  omagari:[['ARENA ESTABLISHING','竞技场远景'],['FIELD DOLLY','草地滑轨'],['LAUNCH LINE','发射阵列'],['PYRO MACRO','焰火特写'],['JUDGES TRACK','会场轨道'],['AERIAL STADIUM','会场航拍']],
  sumida:[['TOKYO ESTABLISHING','东京远景'],['RIVER SKIM','河面掠影'],['BARGE REVEAL','驳船揭示'],['PYRO MACRO','焰火特写'],['QUAY TRACK','堤岸轨道'],['CITY AERIAL','都市航拍']],
  suwa:[['BASIN ESTABLISHING','湖盆远景'],['LAKE SKIM','湖面掠影'],['WATERMINE REVEAL','水上揭示'],['PYRO MACRO','焰火特写'],['SHORE TRACK','湖岸轨道'],['BASIN AERIAL','湖盆航拍']],
  ryukyu:[['OCEAN ESTABLISHING','海岸远景'],['REEF SKIM','珊瑚礁掠影'],['BEACH REVEAL','海滩揭示'],['PYRO MACRO','焰火特写'],['COAST TRACK','海岸轨道'],['ISLAND AERIAL','岛屿航拍']],
  custom:[['FREE WIDE','自由远景'],['FREE DOLLY','自由滑轨'],['LAUNCH VIEW','发射视角'],['PYRO MACRO','焰火特写'],['FREE TRACK','自由轨道'],['FREE AERIAL','自由航拍']]
};
const sceneDescriptions={nagaoka:'信浓川 · 新潟',omagari:'雄物川河畔 · 秋田',sumida:'隅田川 · 东京',suwa:'诹访湖盆 · 长野',ryukyu:'宜野湾热带海滩 · 冲绳',custom:'自由演出空间'};
const translations={
  zhHans:{lang:'zh-CN',brand:'花火',officialProgram:'官方程序',next:'下一个',cameraTitle:'3D 机位',cameraWord:'机位',continuous:'连续运镜',entering:'正在进入',pageTitle:'花火 — 烟花模拟器',description:'沉浸式电影级烟花模拟器',picker:'选择花火大会',menu:'选择花火大会',eyebrow:'互动式烟花体验',title:'点亮，<em>这一刻。</em>',subtitle:'点击夜空发射烟花 · 连续镜头实时演出',palette:'焰色',auto:'演出',sound:'声音',launch:'发射',hint:'点击任意位置',tag:'沉浸式烟花体验',enter:'进入夜空',headphones:'建议佩戴耳机 · 点击开启声音',customType:'烟花类型',presetType:'大会专属编排',types:['菊花','垂柳','星环','牡丹','冠菊','凤凰','星矿'],camera:['远景','水面滑轨','发射揭示','火花特写','岸线轨道','空中全景'],fest:{nagaoka:['长冈大花火','新潟','信浓川 · 凤凰复兴花火','长冈'],omagari:['大曲竞技花火','秋田','雄物川 · 创作花火竞演','大曲'],sumida:['隅田川花火','东京','浅草 · 双会场都市夜景','隅田川'],suwa:['诹访湖上花火','长野','湖上 · 水上大星矿','诹访湖'],ryukyu:['琉球海炎祭','冲绳','宜野湾热带海滩 · 音乐花火','琉球'],custom:['自定义花火','自由','自由选择造型与焰色','自定义']}},
  zhHant:{lang:'zh-TW',brand:'花火',officialProgram:'官方程序',next:'下一個',cameraTitle:'3D 機位',cameraWord:'機位',continuous:'連續運鏡',entering:'正在進入',pageTitle:'花火 — 煙火模擬器',description:'沉浸式電影級煙火模擬器',picker:'選擇花火大會',menu:'選擇花火大會',eyebrow:'互動式煙火體驗',title:'點亮，<em>這一刻。</em>',subtitle:'點擊夜空發射煙火 · 連續鏡頭即時演出',palette:'焰色',auto:'演出',sound:'聲音',launch:'發射',hint:'點擊任意位置',tag:'沉浸式煙火體驗',enter:'進入夜空',headphones:'建議佩戴耳機 · 點擊開啟聲音',customType:'煙火類型',presetType:'大會專屬編排',types:['菊花','垂柳','星環','牡丹','冠菊','鳳凰','星礦'],camera:['遠景','水面滑軌','發射揭示','火花特寫','岸線軌道','空中全景'],fest:{nagaoka:['長岡大花火','新潟','信濃川 · 鳳凰復興花火','長岡'],omagari:['大曲競技花火','秋田','雄物川 · 創作花火競演','大曲'],sumida:['隅田川花火','東京','淺草 · 雙會場都市夜景','隅田川'],suwa:['諏訪湖上花火','長野','湖上 · 水上大星礦','諏訪湖'],ryukyu:['琉球海炎祭','沖繩','宜野灣熱帶海灘 · 音樂花火','琉球'],custom:['自訂花火','自由','自由選擇造型與焰色','自訂']}},
  yue:{lang:'zh-HK',brand:'花火',officialProgram:'官方程序',next:'下一個',cameraTitle:'3D 鏡頭',cameraWord:'鏡頭',continuous:'連續運鏡',entering:'而家進入',pageTitle:'花火 — 花火模擬器',description:'沉浸式電影級花火模擬器',picker:'揀選花火大會',menu:'揀選花火大會',eyebrow:'互動花火體驗',title:'燃亮，<em>呢一刻。</em>',subtitle:'撳夜空發射花火 · 連續鏡頭即時演出',palette:'焰色',auto:'表演',sound:'聲音',launch:'發射',hint:'撳任何位置',tag:'沉浸式花火體驗',enter:'進入夜空',headphones:'建議戴耳機 · 撳一下開聲',customType:'花火種類',presetType:'大會專屬編排',types:['菊花','垂柳','星環','牡丹','冠菊','鳳凰','星礦'],camera:['遠景','水面滑軌','發射揭示','火花大特寫','岸線軌道','空中全景'],fest:{nagaoka:['長岡大花火','新潟','信濃川 · 鳳凰復興花火','長岡'],omagari:['大曲競技花火','秋田','雄物川 · 創作花火競演','大曲'],sumida:['隅田川花火','東京','淺草 · 雙會場都市夜景','隅田川'],suwa:['諏訪湖上花火','長野','湖上 · 水上大星礦','諏訪湖'],ryukyu:['琉球海炎祭','沖繩','宜野灣熱帶海灘 · 音樂花火','琉球'],custom:['自訂花火','自由','自由揀造型同焰色','自訂']}},
  ja:{lang:'ja',brand:'花火',officialProgram:'公式プログラム',next:'次',cameraTitle:'3Dカメラ',cameraWord:'カメラ',continuous:'連続撮影',entering:'会場へ',pageTitle:'花火 — 花火シミュレーター',description:'没入型シネマティック花火シミュレーター',picker:'花火大会を選択',menu:'花火大会を選択',eyebrow:'インタラクティブ花火体験',title:'夜空を、<em>灯す。</em>',subtitle:'夜空をタップして打ち上げ · シネマティック連続演出',palette:'色彩',auto:'演出',sound:'音響',launch:'打上げ',hint:'空をタップ',tag:'没入型花火体験',enter:'夜空へ',headphones:'ヘッドホン推奨 · タップして音声を開始',customType:'花火の種類',presetType:'大会専用プログラム',types:['菊','柳','星環','牡丹','冠菊','鳳凰','スターマイン'],camera:['遠景','水面ドリー','打上げ','火花接写','岸辺トラック','空撮'],fest:{nagaoka:['長岡大花火','新潟','信濃川・復興祈願花火フェニックス','長岡'],omagari:['大曲の花火','秋田','雄物川・全国花火競技大会','大曲'],sumida:['隅田川花火大会','東京','浅草・二会場の都市夜景','隅田川'],suwa:['諏訪湖祭湖上花火大会','長野','湖上・水上スターマイン','諏訪湖'],ryukyu:['琉球海炎祭','沖縄','宜野湾トロピカルビーチ・音楽花火','琉球'],custom:['カスタム花火','自由','種類と色彩を自由に選択','カスタム']}},
  en:{lang:'en',brand:'FIREWORKS',officialProgram:'OFFICIAL PROGRAM',next:'NEXT',cameraTitle:'3D CAMERA',cameraWord:'CAMERA',continuous:'CONTINUOUS CAMERA',entering:'NOW ENTERING',pageTitle:'FIREWORKS — Fireworks Simulator',description:'Immersive cinematic fireworks simulator',picker:'SELECT FESTIVAL',menu:'SELECT FESTIVAL',eyebrow:'INTERACTIVE FIREWORKS EXPERIENCE',title:'Illuminate <em>the moment.</em>',subtitle:'Tap the sky to launch · Continuous cinematic performance',palette:'COLOR',auto:'SHOW',sound:'SOUND',launch:'LAUNCH',hint:'TAP ANYWHERE',tag:'IMMERSIVE FIREWORKS EXPERIENCE',enter:'ENTER THE NIGHT',headphones:'HEADPHONES RECOMMENDED · TAP TO ENABLE AUDIO',customType:'FIREWORK TYPE',presetType:'FESTIVAL PROGRAM',types:['Chrysanthemum','Willow','Ring','Peony','Kamuro','Phoenix','Starmine'],camera:['Establishing','Water Dolly','Launch Reveal','Pyro Macro','Shore Track','Aerial'],fest:{nagaoka:['Nagaoka Fireworks','Niigata','Shinano River · Phoenix of Recovery','Nagaoka'],omagari:['Omagari Fireworks','Akita','Omono River · National Competition','Omagari'],sumida:['Sumida River Fireworks','Tokyo','Asakusa · Two urban venues','Sumida'],suwa:['Lake Suwa Fireworks','Nagano','Lake stage · Water starmine','Lake Suwa'],ryukyu:['Ryukyu Kaiensai','Okinawa','Ginowan Tropical Beach · Music fireworks','Ryukyu'],custom:['Custom Fireworks','Free','Choose form and color freely','Custom']}},
  ko:{lang:'ko',brand:'불꽃',officialProgram:'공식 프로그램',next:'다음',cameraTitle:'3D 카메라',cameraWord:'카메라',continuous:'연속 촬영',entering:'행사장 입장',pageTitle:'불꽃 — 불꽃놀이 시뮬레이터',description:'몰입형 시네마틱 불꽃놀이 시뮬레이터',picker:'불꽃축제 선택',menu:'불꽃축제 선택',eyebrow:'인터랙티브 불꽃놀이 체험',title:'밤하늘을 <em>밝히다.</em>',subtitle:'하늘을 눌러 발사 · 시네마틱 연속 연출',palette:'색상',auto:'연출',sound:'사운드',launch:'발사',hint:'화면을 누르세요',tag:'몰입형 불꽃놀이 체험',enter:'밤하늘로',headphones:'헤드폰 권장 · 눌러서 사운드 시작',customType:'불꽃 종류',presetType:'축제 전용 연출',types:['국화','버드나무','별고리','모란','가무로','불사조','스타마인'],camera:['원경','수면 돌리','발사 공개','불꽃 클로즈업','해안 트랙','항공 촬영'],fest:{nagaoka:['나가오카 불꽃축제','니가타','시나노강 · 부흥의 피닉스','나가오카'],omagari:['오마가리 불꽃대회','아키타','오모노강 · 전국 불꽃 경기','오마가리'],sumida:['스미다강 불꽃축제','도쿄','아사쿠사 · 두 도시 행사장','스미다강'],suwa:['스와호 불꽃축제','나가노','호수 · 수상 스타마인','스와호'],ryukyu:['류큐 카이엔사이','오키나와','기노완 트로피컬 비치 · 음악 불꽃','류큐'],custom:['사용자 불꽃','자유','모양과 색상을 자유롭게 선택','사용자 설정']}}
};
let activeTranslation=translations.zhHans,languageMode='auto';
let currentFestival='nagaoka',selectedType='chrysanthemum',selectedColor='gold',auto=false,soundOn=true,showTimer=3;
let rockets=[],bursts=[],smokes=[],lights=[],audioCtx,master,loadingAudio=false;
const boomBuffers=[],launchBuffers=[];

const rand=(a,b)=>Math.random()*(b-a)+a;
const pick=a=>a[(Math.random()*a.length)|0];
const colorFor=(key,i=0)=>new THREE.Color((palettes[key]||palettes.gold)[i%(palettes[key]||palettes.gold).length]);
let waterMesh;
const skyUniforms={top:{value:new THREE.Color(0x01030a)},bottom:{value:new THREE.Color(0x122139)}};

function makeSoftTexture(noisy=false){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  if(noisy){x.filter='blur(8px)';for(let i=0;i<34;i++){const px=64+rand(-35,35),py=64+rand(-30,30),r=rand(10,27),g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(255,255,255,.24)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}}
  else{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.12,'rgba(255,255,255,.95)');g.addColorStop(.42,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const glowTexture=makeSoftTexture(),smokeTexture=makeSoftTexture(true);

function makeSky(){
  const geo=new THREE.SphereGeometry(1400,32,18);
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform vec3 top;uniform vec3 bottom;varying vec3 vPos;void main(){float h=smoothstep(-.15,.65,normalize(vPos).y);gl_FragColor=vec4(mix(bottom,top,h),1.);}`});
  world.add(new THREE.Mesh(geo,mat));
  const n=700,pos=new Float32Array(n*3),col=new Float32Array(n*3);
  for(let i=0;i<n;i++){const r=900,th=rand(0,Math.PI*2),u=rand(.05,.95);pos[i*3]=Math.cos(th)*r*Math.sqrt(1-u*u);pos[i*3+1]=u*r;pos[i*3+2]=Math.sin(th)*r*Math.sqrt(1-u*u);const v=rand(.35,1);col.set([v*.65,v*.8,v],i*3)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));world.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.3,vertexColors:true,transparent:true,opacity:.7,depthWrite:false})));
}

const waterUniforms={time:{value:0},accent:{value:new THREE.Color(0x25527b)},ocean:{value:0}};
function makeWater(){
  const geo=new THREE.PlaneGeometry(2400,3000,mobile?110:220,mobile?120:240);geo.rotateX(-Math.PI/2);
  const mat=new THREE.ShaderMaterial({transparent:false,uniforms:waterUniforms,vertexShader:`uniform float time;varying vec3 vWorld;varying float vWave;void main(){vec3 p=position;float a=sin(p.x*.026+p.z*.011+time*.75);float b=sin(p.x*.061-p.z*.034-time*1.12);float c=sin(p.x*.13+p.z*.082+time*1.7);vWave=a*.52+b*.25+c*.08;p.y+=vWave;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`uniform vec3 accent;uniform float time;uniform float ocean;varying vec3 vWorld;varying float vWave;void main(){float depth=smoothstep(-1200.,700.,vWorld.z);vec3 n=normalize(cross(dFdx(vWorld),dFdy(vWorld)));if(n.y<0.)n=-n;vec3 viewDir=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(0.,dot(n,viewDir)),3.);float ripple=sin(vWorld.x*.047+vWorld.z*.021+sin(vWorld.z*.008)*1.7+time*.9)*.54+sin(vWorld.x*.097-vWorld.z*.041-time*1.35)*.25;float glint=pow(max(0.,ripple),24.)*.11;float horizon=pow(1.-depth,3.)*.075;vec3 deep=vec3(.003,.010,.021);vec3 near=accent*.16+vec3(.005,.012,.019);vec3 sky=vec3(.055,.105,.17);vec3 c=mix(mix(deep,near,depth*.55),sky,fresnel*.48)+accent*(vWave*.022)+vec3(.25,.39,.54)*(glint+horizon);float reef=sin(vWorld.x*.012)+sin(vWorld.z*.016)+sin((vWorld.x+vWorld.z)*.007)+sin(vWorld.x*.041-vWorld.z*.029)*.24;reef=smoothstep(-.45,1.55,reef);float channels=smoothstep(.15,.9,abs(sin(vWorld.x*.006-vWorld.z*.004)));float shallow=clamp(reef*(.72+.28*channels)*(1.-smoothstep(-50.,650.,-vWorld.z)),0.,1.);float caustic=pow(max(0.,sin(vWorld.x*.19+sin(vWorld.z*.07)+time*1.6)*sin(vWorld.z*.16-time*1.1)),12.)*shallow;vec3 reefBed=mix(vec3(.035,.075,.068),vec3(.16,.21,.17),shallow);vec3 tropical=mix(vec3(.003,.065,.125),vec3(.01,.255,.285),shallow*.82);tropical=mix(reefBed,tropical,.58+fresnel*.34)+vec3(.08,.22,.19)*caustic*.5;c=mix(c,tropical*.76,ocean);gl_FragColor=vec4(c,1.);}`});
  const m=new THREE.Mesh(geo,mat);m.position.y=-2;m.receiveShadow=true;world.add(m);waterMesh=m;
}

function terrain(seed=1,height=65,distance=-430,layer=0){
  const g=new THREE.PlaneGeometry(1900,430,mobile?90:220,mobile?18:44),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),edge=THREE.MathUtils.smoothstep((y+215)/430,0,1);const ridge=Math.sin(x*.0063+seed)*.58+Math.sin(x*.0147+seed*1.73)*.27+Math.sin(x*.033+seed*3.1)*.11+Math.sin(x*.071+seed*.4)*.04;const valleys=Math.pow(Math.abs(Math.sin(x*.0031+seed)),1.7);p.setZ(i,Math.max(0,(ridge+1.08)*height*(.34+.66*edge)*(1-valleys*.18)))}
  g.computeVertexNormals();g.rotateX(-Math.PI/2);const colors=[0x07101a,0x091421,0x0b1725],m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:colors[Math.min(layer,2)],roughness:1,fog:true,flatShading:false}));m.position.set(0,-5,distance);m.receiveShadow=true;decor.add(m);return m;
}
function box(x,y,z,w,h,d,color=0x050810){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.88}));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;decor.add(m);return m}
function lightDot(x,y,z,color=0xffbf72,size=2){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.scale.setScalar(size);decor.add(s)}
function makeGroundTexture(base='#293126') {const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);for(let i=0;i<18000;i++){const v=(Math.random()*32)|0;x.fillStyle=`rgba(${v+35},${v+42},${v+30},${rand(.04,.16)})`;const s=rand(.4,2.4);x.fillRect(rand(0,512),rand(0,512),s,rand(.5,3.5))}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(24,24);t.anisotropy=renderer.capabilities.getMaxAnisotropy();t.colorSpace=THREE.SRGBColorSpace;return t}
function festivalGround(color='#293126'){const tex=makeGroundTexture(color),mat=new THREE.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:.55,roughness:.98,color:0x899080});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2200,2300,40,40),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=-1.4;mesh.receiveShadow=true;decor.add(mesh);return mesh}
function urbanBanks(){for(const side of[-1,1]){const tex=makeGroundTexture('#17171b'),mat=new THREE.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:.22,roughness:.92,color:0x70737a});const bank=new THREE.Mesh(new THREE.PlaneGeometry(850,2400,24,40),mat);bank.rotation.x=-Math.PI/2;bank.position.set(side*640,-1.25,-180);bank.receiveShadow=true;decor.add(bank)}}

// A fully modelled foreground tableau. It gives the fireworks scale, narrative and
// real foreground/midground/background parallax instead of treating the sky as wallpaper.
const silhouetteMat=new THREE.MeshStandardMaterial({color:0x161d28,roughness:.86,metalness:.06});
const clothMat=new THREE.MeshStandardMaterial({color:0x263149,roughness:.91});
const coatMat=new THREE.MeshStandardMaterial({color:0x343b49,roughness:.88});
const skinMat=new THREE.MeshStandardMaterial({color:0x9a756b,roughness:.76});
const hairMat=new THREE.MeshStandardMaterial({color:0x17131b,roughness:.96});
const metalMat=new THREE.MeshStandardMaterial({color:0x293847,roughness:.3,metalness:.78});
function limb(a,b,r,mat=silhouetteMat){const d=new THREE.Vector3().subVectors(b,a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.88,d.length(),8),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());m.castShadow=true;return m}
function makePerson(x,scale=1,pose='center'){
  const g=new THREE.Group(), hip=new THREE.Vector3(0,16*scale,0), shoulder=new THREE.Vector3(0,28*scale,0),bodyMat=pose==='embrace'?coatMat:clothMat;
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(5.2*scale,10*scale,7,10),bodyMat);torso.position.set(0,23*scale,0);torso.scale.set(1,1,pose==='coat'?1.18:1);g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(4.25*scale,18,14),skinMat);head.position.set(0,37*scale,0);head.scale.set(1,.95,.92);g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(4.5*scale,14,10,0,Math.PI*2,0,Math.PI*.68),hairMat);hair.position.set(-.2*scale,38*scale,-.25*scale);hair.rotation.z=.12;g.add(hair);
  const leftFoot=new THREE.Vector3(-3.4*scale,0,pose==='lean'?1.5:0),rightFoot=new THREE.Vector3(3.4*scale,0,0);
  g.add(limb(hip.clone().add(new THREE.Vector3(-2.5*scale,0,0)),leftFoot,2.15*scale),limb(hip.clone().add(new THREE.Vector3(2.5*scale,0,0)),rightFoot,2.15*scale));
  const lHand=pose==='lean'?new THREE.Vector3(-13*scale,25*scale,1):new THREE.Vector3(-7*scale,14*scale,0);
  const rHand=pose==='embrace'?new THREE.Vector3(-13*scale,28*scale,2):new THREE.Vector3(7*scale,15*scale,0);
  g.add(limb(shoulder.clone().add(new THREE.Vector3(-4.4*scale,0,0)),lHand,1.55*scale,bodyMat),limb(shoulder.clone().add(new THREE.Vector3(4.4*scale,0,0)),rHand,1.55*scale,bodyMat));
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
  const heroine=makePerson(0,.94,'lean');heroine.name='proxyHeroine';heroine.position.z=101;heroine.rotation.z=-.04;story.add(heroine);
  const companion=makePerson(20,1.12,'embrace');companion.name='proxyCompanion';companion.position.z=104;companion.rotation.y=-.12;story.add(companion);
  // Companion's arm crosses the frame to the heroine: a readable, original story beat.
  const proxyArm=limb(new THREE.Vector3(15,31,104),new THREE.Vector3(2,29,101),1.75,clothMat);proxyArm.name='proxyArm';story.add(proxyArm);
  const cyan=new THREE.PointLight(0x55bfff,380,125,1.7);cyan.position.set(-42,45,76);const magenta=new THREE.PointLight(0xff5a9d,260,115,1.7);magenta.position.set(38,38,75);const fill=new THREE.PointLight(0xffd1ad,950,230,1.5);fill.position.set(-8,54,176);const top=new THREE.PointLight(0x8abfff,420,165,1.7);top.position.set(42,85,128);story.add(cyan,magenta,fill,top);story.userData.rim=[cyan,magenta];
}

function buildFestival(id){
  while(decor.children.length){const o=decor.children.pop();o.geometry?.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.map?.dispose();m.bumpMap?.dispose();m.normalMap?.dispose();m.dispose()})}}
  scene.fog.density=id==='sumida'?.00135:.00105;
  waterUniforms.accent.value.set(id==='ryukyu'?0x087f91:id==='suwa'?0x205d67:id==='sumida'?0x4b2931:id==='omagari'?0x382853:0x244c70);waterUniforms.ocean.value=id==='ryukyu'?1:0;
  waterMesh.visible=id!=='omagari';waterMesh.scale.set(id==='sumida'?.42:id==='suwa'?1.28:id==='ryukyu'?1.35:1,1,id==='sumida'?1.15:id==='suwa'||id==='ryukyu'?1.2:1);
  skyUniforms.top.value.set(id==='ryukyu'?0x020612:id==='sumida'?0x03030b:id==='omagari'?0x080313:id==='suwa'?0x01080d:0x01030a);skyUniforms.bottom.value.set(id==='ryukyu'?0x143a52:id==='sumida'?0x281021:id==='omagari'?0x231239:id==='suwa'?0x0c2c35:0x122139);scene.fog.color.set(id==='ryukyu'?0x071b28:id==='sumida'?0x160912:id==='omagari'?0x130b20:id==='suwa'?0x071a20:0x060b15);
  if(id==='sumida'){
    urbanBanks();
    for(let x=-540;x<540;x+=rand(18,42)){const h=rand(22,110),z=rand(-420,-300);box(x,0,z,rand(16,36),h,rand(18,40),0x05070d);if(Math.random()<.7)for(let y=14;y<h;y+=15)lightDot(x+rand(-7,7),y,z+21,0xffb66a,1.5)}
    const tower=new THREE.Group();const mast=new THREE.Mesh(new THREE.CylinderGeometry(2,9,250,8),new THREE.MeshStandardMaterial({color:0x111722,metalness:.55}));mast.position.y=125;tower.add(mast);const deck=new THREE.Mesh(new THREE.CylinderGeometry(21,26,7,16),new THREE.MeshStandardMaterial({color:0x1e2937,emissive:0x315c7c,emissiveIntensity:.5}));deck.position.y=178;tower.add(deck);tower.position.set(250,0,-340);decor.add(tower);
  }else{
    const seed=id==='ryukyu'?7:id==='suwa'?5:id==='omagari'?3:1,base=id==='ryukyu'?24:id==='suwa'?42:id==='nagaoka'?32:29;
    terrain(seed,base,-720,0);terrain(seed+9,base*1.32,-1030,1);terrain(seed+21,base*1.7,-1370,2);
    // Rural festival horizons are defined by distant light scatter, not crude box buildings.
    for(let i=0;i<(mobile?70:150);i++){const x=rand(-850,850),z=rand(-610,-470);lightDot(x,rand(1.2,5.5),z,Math.random()<.18?0xff8058:0xffc37a,rand(.35,1.05))}
    if(id==='nagaoka'){for(let x=-620;x<620;x+=18)if(Math.random()>.24)lightDot(x,rand(2,4),-505,0xffd19a,rand(.35,.75))}
    if(id==='omagari'){festivalGround('#25251d');for(let x=-520;x<520;x+=10)lightDot(x,3,-470,0xff925f,.55);for(let i=0;i<90;i++)lightDot(rand(-700,700),rand(.2,1.3),rand(-430,120),Math.random()>.7?0xffa46e:0x6f784d,rand(.18,.5))}
    if(id==='suwa'){for(let i=0;i<55;i++)lightDot(rand(-820,820),rand(2,7),rand(-680,-520),0xffc479,rand(.3,.8))}
    if(id==='ryukyu'){for(let i=0;i<70;i++)lightDot(rand(-850,850),rand(1,4),rand(-720,-540),Math.random()>.25?0xffd08a:0x64dfff,rand(.25,.7))}
  }
}

makeSky();makeWater();buildFestival(currentFestival);

const particleVertex=`attribute float aSize;varying vec3 vColor;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*(320./-mv.z);gl_Position=projectionMatrix*mv;}`;
const particleFragment=`varying vec3 vColor;uniform float opacity;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*opacity;gl_FragColor=vec4(vColor,a);}`;
const ascentVertex=`attribute float aSize;attribute float aAlpha;varying vec3 vColor;varying float vAlpha;void main(){vColor=color;vAlpha=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*(360./max(1.,-mv.z));gl_Position=projectionMatrix*mv;}`;
const ascentFragment=`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float core=smoothstep(.5,.06,d);gl_FragColor=vec4(vColor,core*vAlpha);}`;

class Rocket{
  constructor(x,targetY,type,color,z=rand(-100,120)){this.pos=new THREE.Vector3(x,1.5,z);const speed=Math.sqrt(2*9.81*(targetY+rand(8,22)));this.vel=new THREE.Vector3(rand(-3.4,3.4),speed,rand(-2.5,2.5));this.fuse=speed/9.81*rand(.92,.99);this.type=type;this.color=color;this.dead=false;this.age=0;this.smokeClock=0;this.wind=rand(-.65,.65);this.history=[];const mat=new THREE.SpriteMaterial({map:glowTexture,color:colorFor(color),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});this.sprite=new THREE.Sprite(mat);this.sprite.scale.setScalar(3.4);this.sprite.position.copy(this.pos);effects.add(this.sprite);
    const n=mobile?32:58;this.trailCount=n;const p=new Float32Array(n*3),c=new Float32Array(n*3),a=new Float32Array(n),s=new Float32Array(n);for(let i=0;i<n;i++){const warm=new THREE.Color().lerpColors(colorFor(color),new THREE.Color(i/n>.55?0xff7a22:0xffe5a0),i/n);c.set([warm.r,warm.g,warm.b],i*3);s[i]=rand(2.2,5.2)*(1-i/n*.72)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));g.setAttribute('aAlpha',new THREE.BufferAttribute(a,1));g.setAttribute('aSize',new THREE.BufferAttribute(s,1));this.trailMat=new THREE.ShaderMaterial({vertexShader:ascentVertex,fragmentShader:ascentFragment,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});this.trailPoints=new THREE.Points(g,this.trailMat);effects.add(this.trailPoints);playLaunch(x/260)}
  update(dt){this.age+=dt;const thrust=this.age<.34?24*(1-this.age/.34):0;this.vel.y+=(thrust-9.81)*dt;this.vel.x+=(this.wind+Math.sin(this.age*13.7)*.16)*dt;this.vel.z+=Math.sin(this.age*9.3)*.08*dt;this.pos.addScaledVector(this.vel,dt);this.sprite.position.copy(this.pos);this.sprite.scale.setScalar(3.1+Math.sin(this.age*47)*.55);this.history.unshift(this.pos.clone());if(this.history.length>this.trailCount)this.history.pop();const pa=this.trailPoints.geometry.attributes.position.array,aa=this.trailPoints.geometry.attributes.aAlpha.array;for(let i=0;i<this.trailCount;i++){const h=this.history[Math.min(i,this.history.length-1)]||this.pos,j=i*3,fade=Math.max(0,1-i/Math.max(2,this.history.length));pa[j]=h.x+Math.sin(i*12.31+this.age*18)*i*.012;pa[j+1]=h.y;pa[j+2]=h.z+Math.cos(i*7.17+this.age*13)*i*.012;aa[i]=fade*fade*(.72+Math.sin(i*2.7+this.age*35)*.18)}this.trailPoints.geometry.attributes.position.needsUpdate=true;this.trailPoints.geometry.attributes.aAlpha.needsUpdate=true;this.smokeClock-=dt;if(this.smokeClock<=0&&this.age<this.fuse-.35){this.smokeClock=mobile?.3:.19;smokes.push(new Smoke(this.pos.clone().addScaledVector(this.vel,-.045),colorFor(this.color),true))}if(this.age>=this.fuse){this.dead=true;this.dispose();explode(this.pos,this.type,this.color)}}
  dispose(){effects.remove(this.sprite,this.trailPoints);this.sprite.material.dispose();this.trailPoints.geometry.dispose();this.trailMat.dispose()}
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
  constructor(pos,color,small=false){this.age=0;this.small=small;this.life=small?rand(2.8,4.8):rand(6,12);this.vel=small?new THREE.Vector3(rand(-.6,.8),rand(.05,.5),rand(-.5,.5)):new THREE.Vector3(rand(-2,3),rand(.5,2.2),rand(-1.5,1.5));const mat=new THREE.SpriteMaterial({map:smokeTexture,color:new THREE.Color(color).lerp(new THREE.Color(small?0x89909a:0x59616d),small?.82:.72),transparent:true,opacity:small?.08:.16,depthWrite:false});this.sprite=new THREE.Sprite(mat);this.sprite.position.copy(pos).add(new THREE.Vector3(rand(small?-1.2:-8,small?1.2:8),rand(small?-.8:-5,small?1:7),rand(small?-1.2:-8,small?1.2:8)));const s=small?rand(2.2,5.5):rand(12,28);this.sprite.scale.set(s,s,s);effects.add(this.sprite)}
  update(dt){this.age+=dt;this.sprite.position.addScaledVector(this.vel,dt);this.sprite.scale.multiplyScalar(1+dt*(this.small?.16:.075));this.sprite.material.opacity=Math.sin(Math.min(1,this.age/this.life)*Math.PI)*(this.small?.07:.13);return this.age>=this.life}dispose(){effects.remove(this.sprite);this.sprite.material.dispose()}
}

function explode(pos,type,colorKey){
  const scale=currentFestival==='nagaoka'?1.35:1;bursts.push(new Burst(pos,type,colorKey,scale));
  if(type==='starmine')for(let i=0;i<4;i++)setTimeout(()=>{const p=pos.clone().add(new THREE.Vector3(rand(-35,35),rand(-18,25),rand(-30,30)));bursts.push(new Burst(p,pick(['ring','peony','chrysanthemum']),colorKey,.45));flash(p,colorFor(colorKey,i))},150+i*125);
  for(let i=0;i<(mobile?5:12);i++)smokes.push(new Smoke(pos,colorFor(colorKey,i)));
  flash(pos,colorFor(colorKey,1));playBoom(pos.x/260);cameraDirector.focus.copy(pos);
}
function flash(pos,color){const light=new THREE.PointLight(color,mobile?900:1800,420,1.7);light.position.copy(pos);scene.add(light);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.copy(pos);s.scale.setScalar(18);effects.add(s);const reflection=new THREE.Mesh(new THREE.PlaneGeometry(38,210),new THREE.MeshBasicMaterial({map:glowTexture,color,transparent:true,opacity:.34,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));reflection.rotation.x=-Math.PI/2;reflection.rotation.z=rand(-.08,.08);reflection.position.set(pos.x,-1.15,THREE.MathUtils.clamp(pos.z+90,-160,120));effects.add(reflection);lights.push({light,s,reflection,age:0,life:.75})}
function launch(x=rand(-220,220),target=rand(95,205),type=selectedType,color=selectedColor,z=rand(-190,-35)){rockets.push(new Rocket(x,target,type,color,z))}
function waterMine(x,color='gold'){const p=new THREE.Vector3(x,6,rand(-80,70));bursts.push(new Burst(p,'phoenix',color,.8));flash(p,colorFor(color));playBoom(x/260)}


// Official-program driven show data. "real" is the announced shell count; render is a GPU-safe visual sample.
const T=(zh,ja,en)=>({zh,ja,en}),A=(title,count,pattern='standard',render=6,interval=7,extra={})=>({title,count,pattern,render,interval,...extra});
const nagaokaProgram=[
 A(T('白菊','白菊','White Chrysanthemum'),T('10号玉 · 3发','10号玉 · 3発','No.10 shells · 3'),'salute',3,6,{type:'chrysanthemum',color:'gold'}),
 A(T('尼亚加拉＋超大型星矿','ナイアガラ＋超大型スターマイン','Niagara + Super Starmine'),T('河岸全宽同步演出','河岸ワイド同時打上げ','Full-width synchronized barrage'),'wide',10,9,{type:'starmine',color:'gold'}),
 A(T('大型／超大型星矿组曲','大型・超大型スターマイン','Large / Super Starmine Suite'),T('赞助节目群','スポンサー花火群','Sponsor program blocks'),'wide',9,8,{type:'starmine',color:'rainbow'}),
 A(T('尺玉连发','尺玉連発','Shakudama Salvo'),T('10号玉 · 28发','10号玉 · 28発','No.10 shells · 28'),'salvo',7,7,{type:'chrysanthemum',color:'sakura'}),
 A(T('复兴祈愿花火「凤凰」','復興祈願花火フェニックス','Phoenix of Recovery'),T('约2 km · 9处发射 · 约5分钟','約2km・9箇所・約5分','~2 km · 9 launch sites · ~5 min'),'phoenix',12,11,{type:'phoenix',color:'gold'}),
 A(T('尺玉连发','尺玉連発','Shakudama Salvo'),T('10号玉 · 80发','10号玉 · 80発','No.10 shells · 80'),'salvo',10,8,{type:'kamuro',color:'azure'}),
 A(T('尺玉60连发＋大型星矿','尺玉60連発＋大型スターマイン','60 Shakudama + Large Starmine'),T('10号玉 · 60发','10号玉 · 60発','No.10 shells · 60'),'wide',11,9,{type:'starmine',color:'rainbow'}),
 A(T('正三尺玉三连发','正三尺玉3連発','Three 30-go Shells'),T('30号玉 · 3发','30号玉 · 3発','No.30 shells · 3'),'giant',3,9,{type:'chrysanthemum',color:'gold',height:225}),
 A(T('正三尺玉','正三尺玉','30-go Giant Shell'),T('30号玉 · 1发','30号玉 · 1発','No.30 shell · 1'),'giant',1,8,{type:'kamuro',color:'sakura',height:235}),
 A(T('尺玉组合','尺玉コンビネーション','Shakudama Combination'),T('7号12发＋10号12发','7号12発＋10号12発','12 No.7 + 12 No.10'),'salvo',8,8,{type:'peony',color:'azure'}),
 A(T('米百俵花火 · 压轴','米百俵花火・フィナーレ','Kome Hyappyo Finale'),T('尺玉 · 100连发','尺玉 · 100連発','Shakudama · 100-shot salvo'),'finale',14,12,{type:'starmine',color:'gold'})
];
const sumidaCounts=[
 ['开场信号雷','開幕信号雷','Opening Salutes',80],['第一会场开幕','第一会場オープニング','Venue 1 Opening',1188],['第一会场节目 02','第一会場プログラム 02','Venue 1 Program 02',884],['第一会场节目 03','第一会場プログラム 03','Venue 1 Program 03',844],['第一会场节目 04','第一会場プログラム 04','Venue 1 Program 04',1156],['花火竞技 · 前半','花火コンクール・前半','Competition · First Half',100],['幕间花火','コンクール中休み','Competition Interlude',226],['花火竞技 · 后半','花火コンクール・後半','Competition · Second Half',100],['宝可梦特别节目','ポケモン特別プログラム','Pokémon Special Program',157],['第一会场节目 08','第一会場プログラム 08','Venue 1 Program 08',1376],['第一会场节目 09','第一会場プログラム 09','Venue 1 Program 09',1236],['第一会场压轴','第一会場フィナーレ','Venue 1 Finale',2100]
];
const sumidaProgram=sumidaCounts.map((x,i)=>A(T(x[0],x[1],x[2]),T(`${x[3].toLocaleString()}发`,`${x[3].toLocaleString()}発`,`${x[3].toLocaleString()} shots`),i===0?'salute':i===11?'finale':'dual',Math.min(14,Math.max(4,Math.ceil(x[3]/180))),i===11?11:7,{type:i===11?'starmine':i%3===0?'peony':'ring',color:i%3===0?'gold':i%3===1?'sakura':'azure',venues:true}));
sumidaProgram.splice(5,0,A(T('第二会场组曲','第二会場プログラム','Venue 2 Suite'),T('官方总数 · 10,650发','公式総数 · 10,650発','Official total · 10,650 shots'),'dual',10,8,{type:'starmine',color:'emerald',venues:true}));
const omagariMakers=['菅野煙火店','紅屋青木煙火店','齊木煙火本店','若松煙火製造所','響屋大曲煙火','片貝煙火工業','和火屋','ホソヤエンタープライズ','丸玉屋小勝煙火店','伊那火工 堀内煙火店','小松煙火工業','アルプス煙火工業','阿部煙火工業','三遠煙火','筑北火工 堀米煙火店','菊屋小幡花火店','髙田花火工業','太陽堂 田村煙火店','磯谷煙火店','山内煙火店','信州煙火工業','北日本花火興業','野村花火工業','新潟煙火工業','篠原煙火店','芳賀火工','山﨑煙火製造所','マルゴー'];
const omagariProgram=omagariMakers.map((maker,i)=>A(T(`夜花火竞技 ${String(i+1).padStart(2,'0')} · ${maker}`,`夜花火競技 ${String(i+1).padStart(2,'0')} · ${maker}`,`Night Competition ${String(i+1).padStart(2,'0')} · ${maker}`),T('芯入割物1＋自由玉1＋创作花火1组','芯入割物1＋自由玉1＋創造花火1組','1 core shell + 1 free shell + 1 creative set'),'competitor',5,8,{type:i%4===0?'chrysanthemum':i%4===1?'ring':i%4===2?'peony':'starmine',color:['gold','azure','sakura','emerald'][i%4]}));
omagariProgram.push(A(T('大会提供花火「交响诗 芬兰颂」','大会提供花火「交響詩フィンランディア」','Competition Sponsor Fireworks “Finlandia”'),T('2025大会压轴节目','2025大会提供プログラム','2025 sponsor finale'),'finale',14,12,{type:'starmine',color:'rainbow'}));
const suwaProgram=[
 A(T('欢迎来到诹访','Welcome to Suwa','Welcome to Suwa'),T('追悼花火＋开幕','追悼花火＋オープニング','Memorial + opening'),'salute',4,6,{type:'chrysanthemum',color:'gold'}),
 A(T('Music Gradation','Music Gradation','Music Gradation'),T('开幕大型星矿','オープニング大スターマイン','Opening large starmine'),'wide',10,9,{type:'starmine',color:'rainbow'}),
 A(T('标准星矿／讲解花火','スターマイン／レクチャー花火','Starmine / Lecture Fireworks'),T('大会程序前半','大会プログラム前半','First program section'),'standard',6,7,{type:'peony',color:'azure'}),
 ...['蛍','Sparkle','空に描く光の帆','Eden','Hanabi Revolution','ここにしか咲かない花','さくら','宇宙戦艦ヤマト','鳴り響く雷鳴'].map((name,i)=>A(T(`竞技作品 ${i+1} · ${name}`,`競技作品 ${i+1}・${name}`,`Competition ${i+1} · ${name}`),T(i===8?'尺玉大型星矿':'音乐／创作星矿',i===8?'尺玉大スターマイン':'音楽・創作スターマイン',i===8?'Shakudama large starmine':'Music / creative starmine'),i===8?'finale':'standard',i===8?11:6,7,{type:i%3===0?'willow':i%3===1?'starmine':'peony',color:['emerald','sakura','azure','gold'][i%4]})),
 A(T('湖上水上大型星矿','湖上水上大スターマイン','Lake Water Starmine'),T('半圆水上爆破','半円状の水上開花','Hemispherical water bursts'),'water',10,10,{color:'azure'}),
 A(T('Kiss of Fire','Kiss of Fire','Kiss of Fire'),T('大会终幕','大会フィナーレ','Festival finale'),'waterFinale',14,12,{color:'gold'})
];
const ryukyuProgram=[
 A(T('开幕 · シルエット／IRIS OUT','オープニング・シルエット／IRIS OUT','Opening · Silhouette / IRIS OUT'),T('全篇约10,000发 · 约1小时','全編約10,000発・約1時間','~10,000 shots total · ~1 hour'),'music',8,8,{type:'starmine',color:'azure'}),
 A(T('DJ yori 混音组曲','DJ yori メドレー','DJ yori Medley'),T('电脑同步 · 1/30秒精度','コンピューター同期・1/30秒','Computer sync · 1/30 sec'),'music',8,8,{type:'ring',color:'rainbow'}),
 A(T('北斋 · 万赞歌','北斎・万讃歌','Hokusai · Bansanka'),T('波浪与富士视觉段落','波と富士の造形演出','Wave and Mt. Fuji sequence'),'wide',10,9,{type:'willow',color:'azure'}),
 A(T('小筱顺子设计花火','コシノジュンコ デザイン花火','Junko Koshino Design Fireworks'),T('贝多芬 · 第五交响曲','ベートーヴェン・交響曲第5番','Beethoven · Symphony No. 5'),'music',9,9,{type:'ring',color:'sakura'}),
 ...['イケナイ太陽','ダイナミック琉球','島唄','花・童神','366日','時の流れに身をまかせ'].map((name,i)=>A(T(`冲绳与亚洲 · ${name}`,`沖縄＆アジア・${name}`,`Okinawa & Asia · ${name}`),T('音乐同步花火','音楽シンクロ花火','Music-synchronized fireworks'),'music',7,7,{type:i%2?'peony':'starmine',color:['gold','emerald','sakura','azure'][i%4]})),
 A(T('终章 · Imagine／My Way','エンディング・Imagine／My Way','Ending · Imagine / My Way'),T('音乐花火终章','音楽花火エンディング','Music fireworks ending'),'wide',11,10,{type:'kamuro',color:'gold'}),
 A(T('大终幕 · 唐船ドーイ','グランドフィナーレ・唐船ドーイ','Grand Finale · Tōshin Dōi'),T('全篇约10,000发','全編約10,000発','~10,000 shots total'),'finale',15,13,{type:'starmine',color:'rainbow'})
];
const festivalPrograms={nagaoka:nagaokaProgram,omagari:omagariProgram,sumida:sumidaProgram,suwa:suwaProgram,ryukyu:ryukyuProgram};
const programYears={nagaoka:'2025',omagari:'2025',sumida:'2025',suwa:'2025',ryukyu:'2026'};
let programIndex=0,activeProgramIndex=0,showGeneration=0;
function localProgramText(v){const lang=resolveLanguage(languageMode);return lang==='ja'?v.ja:lang==='en'||lang==='ko'?v.en:v.zh}
function updateProgramCard(act,index=programIndex){const list=festivalPrograms[currentFestival];const card=document.getElementById('programCard');if(!list||!act){card.style.display='none';return}card.style.display='block';document.getElementById('programSource').textContent=`${activeTranslation.officialProgram} · ${programYears[currentFestival]}`;document.getElementById('programStep').textContent=`${String(index+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;document.getElementById('programTitle').textContent=localProgramText(act.title);document.getElementById('programCount').textContent=localProgramText(act.count);document.getElementById('programNext').textContent=`${activeTranslation.next} · ${localProgramText(list[(index+1)%list.length].title)}`}
function previewProgram(){programIndex=0;activeProgramIndex=0;const list=festivalPrograms[currentFestival];updateProgramCard(list?.[0],0)}
function timed(gen,fn,ms){setTimeout(()=>{if(gen===showGeneration)fn()},ms)}
function performProgramAct(act){
 const gen=showGeneration,colors=Object.keys(palettes),n=Math.max(1,Math.round(act.render*(mobile?.68:1))),type=act.type||'starmine',color=act.color||pick(colors),height=act.height||rand(120,190);
 const fire=(i,x,z=-90,t=type,c=color,h=height)=>timed(gen,()=>launch(x,h+rand(-14,14),t,c,z+rand(-35,35)),i*(act.pattern==='giant'?1050:act.pattern==='competitor'?430:170));
 if(act.pattern==='water'||act.pattern==='waterFinale'){const m=act.pattern==='waterFinale'?n:Math.ceil(n*.65);for(let i=0;i<m;i++)timed(gen,()=>waterMine(-235+i*(470/Math.max(1,m-1)),i%2?color:'azure'),i*135);for(let i=0;i<Math.ceil(n*.55);i++)fire(i,-185+i*(370/Math.max(1,Math.ceil(n*.55)-1)),-120,i%2?'kamuro':'starmine',i%2?color:'gold',145);return}
 if(act.pattern==='phoenix'){const sites=mobile?6:9;for(let wave=0;wave<(mobile?2:3);wave++)for(let i=0;i<sites;i++)timed(gen,()=>launch(-245+i*(490/(sites-1)),135+wave*23+(i%2)*9,'phoenix',wave===1?'azure':'gold',-150+rand(-20,20)),wave*1050+i*75);return}
 if(act.pattern==='dual'||act.venues){for(let i=0;i<n;i++){const site=i%2?-135:135;fire(i,site+rand(-48,48),i%2?-75:-145,type,color,i%2?105:155)}return}
 if(act.pattern==='competitor'){fire(0,-42,-115,'chrysanthemum',color,185);fire(1,42,-115,type,color,195);for(let i=2;i<n;i++)fire(i,-120+(i-2)*(240/Math.max(1,n-3)),-95,'starmine',i%2?color:'gold',135);return}
 if(act.pattern==='giant'){for(let i=0;i<n;i++)fire(i,-90+i*(180/Math.max(1,n-1)),-150,type,color,act.height||225);return}
 const spread=act.pattern==='salute'?160:act.pattern==='salvo'?350:460;for(let i=0;i<n;i++)fire(i,-spread/2+i*(spread/Math.max(1,n-1)),-110,type,i%3===2&&act.pattern!=='salute'?pick(colors):color,height);
}

const cameraDirector={index:-1,shotTime:0,phase:'shot',transitionTime:0,transitionDuration:4.6,focus:new THREE.Vector3(0,100,0),lookNow:new THREE.Vector3(),fromPos:new THREE.Vector3(),fromLook:new THREE.Vector3(),c1:new THREE.Vector3(),c2:new THREE.Vector3(),targetIndex:0,fromFov:49,shots:[
  {name:'LAKE ESTABLISHING',a:new THREE.Vector3(0,13,286),b:new THREE.Vector3(-18,17,246),la:new THREE.Vector3(0,92,-170),lb:new THREE.Vector3(0,116,-230),fov:50,duration:13},
  {name:'WATERLINE DOLLY',a:new THREE.Vector3(-155,6,196),b:new THREE.Vector3(-72,8,156),la:new THREE.Vector3(35,96,-205),lb:new THREE.Vector3(75,126,-250),fov:56,duration:11},
  {name:'LAUNCH REVEAL',a:new THREE.Vector3(112,4,112),b:new THREE.Vector3(74,12,145),la:new THREE.Vector3(-35,138,-220),lb:new THREE.Vector3(-12,168,-280),fov:64,duration:9},
  {name:'FIREWORK MACRO',a:new THREE.Vector3(-18,112,12),b:new THREE.Vector3(28,132,-24),la:new THREE.Vector3(0,138,-112),lb:new THREE.Vector3(18,152,-155),fov:34,duration:8},
  {name:'SHORELINE TRACK',a:new THREE.Vector3(-205,25,250),b:new THREE.Vector3(-115,28,205),la:new THREE.Vector3(30,105,-190),lb:new THREE.Vector3(90,138,-270),fov:51,duration:12},
  {name:'AERIAL PANORAMA',a:new THREE.Vector3(280,150,330),b:new THREE.Vector3(120,185,245),la:new THREE.Vector3(0,90,-260),lb:new THREE.Vector3(-45,142,-330),fov:47,duration:14}
],announce(i,moving=false){const s=this.shots[i];document.getElementById('qualityLabel').textContent=moving?`${activeTranslation.continuous} → ${s.name}`:s.name;document.querySelectorAll('#cameraRail button').forEach((b,n)=>b.classList.toggle('active',n===i));const cut=document.getElementById('cameraCut');cut.querySelector('small').textContent=moving?activeTranslation.continuous:`${activeTranslation.cameraWord} 0${i+1}`;cut.querySelector('b').textContent=s.name;cut.classList.remove('show');requestAnimationFrame(()=>cut.classList.add('show'));clearTimeout(this.cutTimer);this.cutTimer=setTimeout(()=>cut.classList.remove('show'),1050);if(!moving&&i===3&&currentFestival!=='custom'){launch(rand(-35,35),rand(132,162),pick(['kamuro','chrysanthemum','willow']),pick(Object.keys(palettes)),rand(-145,-85));setTimeout(()=>launch(rand(-30,30),rand(138,170),'starmine',pick(Object.keys(palettes)),rand(-150,-95)),650)}},next(force=false,manualIndex=null){if(currentFestival==='custom'&&manualIndex===null)return;const i=manualIndex!==null?manualIndex:(this.index+1)%this.shots.length,s=this.shots[i];if(force||this.index<0){this.index=i;this.phase='shot';this.shotTime=0;camera.position.copy(s.a);this.lookNow.copy(s.la);camera.fov=s.fov;camera.updateProjectionMatrix();camera.lookAt(this.lookNow);this.announce(i);return}this.phase='transition';this.targetIndex=i;this.transitionTime=0;this.fromPos.copy(camera.position);this.fromLook.copy(this.lookNow);this.fromFov=camera.fov;const distance=this.fromPos.distanceTo(s.a);this.transitionDuration=THREE.MathUtils.clamp(distance/34,3.6,6.2);const travel=s.a.clone().sub(this.fromPos);this.c1.copy(this.fromPos).addScaledVector(travel,.3).add(new THREE.Vector3(0,Math.min(38,distance*.16),0));this.c2.copy(this.fromPos).addScaledVector(travel,.72).add(new THREE.Vector3(0,Math.min(24,distance*.1),0));this.announce(i,true)},update(dt){if(currentFestival==='custom'&&this.phase!=='transition')return;if(this.phase==='transition'){this.transitionTime+=dt;const raw=Math.min(1,this.transitionTime/this.transitionDuration),t=raw*raw*(3-2*raw),u=1-t,s=this.shots[this.targetIndex];camera.position.copy(this.fromPos).multiplyScalar(u*u*u).addScaledVector(this.c1,3*u*u*t).addScaledVector(this.c2,3*u*t*t).addScaledVector(s.a,t*t*t);this.lookNow.lerpVectors(this.fromLook,s.la,t);camera.fov=THREE.MathUtils.lerp(this.fromFov,s.fov,t);camera.updateProjectionMatrix();camera.lookAt(this.lookNow);if(raw>=1){this.index=this.targetIndex;this.phase='shot';this.shotTime=0;this.announce(this.index)}return}const s=this.shots[this.index];this.shotTime+=dt;if(this.shotTime>=s.duration){this.next();return}const p=this.shotTime/s.duration,t=p*p*(3-2*p);camera.position.lerpVectors(s.a,s.b,t);this.lookNow.lerpVectors(s.la,s.lb,t);camera.lookAt(this.lookNow)}};
cameraDirector.next(true);

function choreograph(grand=false){
  if(currentFestival==='custom'){for(let i=0;i<(grand?6:3);i++)timed(showGeneration,()=>launch(rand(-180,180),rand(85,175),selectedType,selectedColor),i*230);return grand?8:6}
  const list=festivalPrograms[currentFestival];if(!list?.length)return 7;const index=programIndex%list.length,act=list[index];activeProgramIndex=index;updateProgramCard(act,index);performProgramAct(act);programIndex=(index+1)%list.length;return act.interval||7
}

function resolveLanguage(mode){if(mode!=='auto')return mode;const l=(navigator.languages?.[0]||navigator.language||'en').toLowerCase();if(l.startsWith('ja'))return'ja';if(l.startsWith('ko'))return'ko';if(l.startsWith('yue')||l.includes('zh-hk')||l.includes('zh-mo'))return'yue';if(l.includes('zh-tw')||l.includes('hant'))return'zhHant';if(l.startsWith('zh'))return'zhHans';return'en'}
function applyLanguage(mode='auto'){languageMode=mode;const key=resolveLanguage(mode),t=translations[key]||translations.en;activeTranslation=t;document.documentElement.lang=t.lang;document.title=t.pageTitle;document.querySelector('meta[name=description]').content=t.description;document.getElementById('brandLabel').textContent=t.brand;document.getElementById('introBrandLabel').textContent=t.brand;document.getElementById('cameraRailLabel').textContent=t.cameraTitle;document.getElementById('enteringLabel').textContent=t.entering;document.getElementById('languageBtn').ariaLabel=t.menu;canvas.ariaLabel=t.description;document.getElementById('festivalPickerLabel').textContent=t.picker;document.getElementById('festivalMenuTitle').textContent=t.menu;document.getElementById('eyebrowText').textContent=t.eyebrow;document.getElementById('heroTitle').innerHTML=t.title;document.getElementById('subtitleText').textContent=t.subtitle;document.getElementById('paletteLabel').textContent=t.palette;document.getElementById('autoLabel').textContent=t.auto;document.getElementById('autoBtn').title=t.auto;document.getElementById('autoBtn').ariaLabel=t.auto;document.getElementById('soundLabel').textContent=t.sound;document.getElementById('soundBtn').title=t.sound;document.getElementById('soundBtn').ariaLabel=t.sound;document.getElementById('launchLabel').textContent=t.launch;document.getElementById('hintLabel').textContent=t.hint;document.getElementById('introTagline').textContent=t.tag;document.getElementById('enterLabel').textContent=t.enter;document.getElementById('headphoneLabel').textContent=t.headphones;document.querySelectorAll('#types button').forEach((b,i)=>b.textContent=t.types[i]);Object.entries(t.fest).forEach(([id,v])=>{festivalNames[id]=v[0];sceneDescriptions[id]=v[2];const menu=document.querySelector(`#festivalMenu [data-festival="${id}"]`);if(menu){menu.querySelector('span').textContent=v[1];menu.querySelector('b').textContent=v[0];menu.querySelector('small').textContent=v[2]}const intro=document.querySelector(`#introFestivals [data-intro-festival="${id}"]`);if(intro){intro.querySelector('b').textContent=v[3];intro.querySelector('small').textContent=v[1]}});document.getElementById('festivalName').textContent=festivalNames[currentFestival];document.getElementById('typeLabel').textContent=currentFestival==='custom'?t.customType:t.presetType;syncCameraLanguage(currentFestival);document.getElementById('qualityLabel').textContent=cameraDirector.shots[cameraDirector.index]?.name||t.cameraTitle;document.querySelectorAll('#languageMenu button').forEach(b=>b.classList.toggle('active',b.dataset.lang===mode));updateProgramCard(festivalPrograms[currentFestival]?.[activeProgramIndex%Math.max(1,festivalPrograms[currentFestival]?.length||1)],activeProgramIndex%Math.max(1,festivalPrograms[currentFestival]?.length||1));try{localStorage.setItem('hanabi-language',mode)}catch{}}
function syncCameraLanguage(id){cameraLanguage[id].forEach((entry,i)=>{cameraDirector.shots[i].name=activeTranslation.camera[i];const b=document.querySelector(`#cameraRail button[data-camera="${i}"]`);if(b)b.innerHTML=`<i>0${i+1}</i>${activeTranslation.camera[i]}`})}
function showSceneTransition(id){const el=document.getElementById('sceneTransition');el.querySelector('b').textContent=festivalNames[id];el.querySelector('span').textContent=sceneDescriptions[id];el.classList.remove('show');requestAnimationFrame(()=>el.classList.add('show'));clearTimeout(showSceneTransition.timer);showSceneTransition.timer=setTimeout(()=>el.classList.remove('show'),1450)}
function selectFestival(id,play=false){showGeneration++;programIndex=0;activeProgramIndex=0;if(play)showSceneTransition(id);currentFestival=id;syncCameraLanguage(id);document.getElementById('festivalName').textContent=festivalNames[id];document.body.classList.toggle('custom-mode',id==='custom');document.getElementById('typeLabel').textContent=id==='custom'?activeTranslation.customType:activeTranslation.presetType;document.querySelectorAll('#festivalMenu button').forEach(x=>x.classList.toggle('active',x.dataset.festival===id));document.querySelectorAll('#introFestivals button').forEach(x=>x.classList.toggle('active',x.dataset.introFestival===id));document.getElementById('festivalMenu').classList.remove('open');buildFestival(id);previewProgram();auto=id!=='custom';showTimer=3;syncAuto();if(id!=='custom'){cameraDirector.index=-1;cameraDirector.next(true)}else{camera.position.set(0,22,245);camera.lookAt(0,105,0);document.getElementById('qualityLabel').textContent=activeTranslation.camera[0]}if(play){clearEffects();setTimeout(()=>choreograph(true),520)}}
function clearEffects(){rockets.forEach(r=>r.dispose());bursts.forEach(b=>b.dispose());smokes.forEach(s=>s.dispose());lights.forEach(l=>{scene.remove(l.light);effects.remove(l.s,l.reflection);l.light.dispose();l.s.material.dispose();l.reflection?.geometry.dispose();l.reflection?.material.dispose()});rockets=[];bursts=[];smokes=[];lights=[]}
function syncAuto(){const b=document.getElementById('autoBtn');b.classList.toggle('active',auto);b.querySelector('.play-icon').textContent=auto?'Ⅱ':'▶'}

function initAudio(){if(audioCtx)return;audioCtx=new(window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=.72;const comp=audioCtx.createDynamicsCompressor();comp.threshold.value=-8;comp.ratio.value=12;master.connect(comp).connect(audioCtx.destination)}
async function unlockAudio(){initAudio();if(audioCtx.state==='suspended')await audioCtx.resume();const silent=audioCtx.createBufferSource();silent.buffer=audioCtx.createBuffer(1,1,22050);silent.connect(master);silent.start();if(!loadingAudio){loadingAudio=true;const base=`${import.meta.env.BASE_URL}assets/audio/`;await Promise.all([1,2,3,4,5,6].map(async n=>{try{const r=await fetch(`${base}boom-${n}.ogg`);if(!r.ok)throw Error(r.status);boomBuffers.push(await audioCtx.decodeAudioData(await r.arrayBuffer()))}catch(e){console.warn('boom audio',e)}}));await Promise.all([1,2,3,4].map(async n=>{try{const r=await fetch(`${base}launch-${n}.ogg`);if(!r.ok)throw Error(r.status);launchBuffers.push(await audioCtx.decodeAudioData(await r.arrayBuffer()))}catch(e){console.warn('launch audio',e)}}))}if(audioCtx.state==='suspended')await audioCtx.resume()}
function playBuffer(buffers,pan,volume,rate=1){if(!soundOn||!audioCtx||!buffers.length)return;const src=audioCtx.createBufferSource(),p=audioCtx.createStereoPanner(),g=audioCtx.createGain();src.buffer=pick(buffers);src.playbackRate.value=rate;p.pan.value=THREE.MathUtils.clamp(pan,-1,1);g.gain.value=volume;src.connect(g).connect(p).connect(master);src.start()}
function playLaunch(pan){playBuffer(launchBuffers,pan,.38,rand(.94,1.07))}function playBoom(pan){playBuffer(boomBuffers,pan,.72,rand(.95,1.05))}

// Interaction and kiosk guards
document.addEventListener('selectstart',e=>e.preventDefault());document.addEventListener('dragstart',e=>e.preventDefault());document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault()},{passive:false});
let wakeLock;async function keepAwake(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch{}}document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')keepAwake()});
document.getElementById('languageBtn').onclick=e=>{e.stopPropagation();document.getElementById('languageMenu').classList.toggle('open')};
document.getElementById('languageMenu').onclick=e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();applyLanguage(b.dataset.lang);document.getElementById('languageMenu').classList.remove('open')};
canvas.addEventListener('pointerdown',e=>{unlockAudio();if(currentFestival==='custom'){const x=(e.clientX/innerWidth-.5)*440,target=60+(1-e.clientY/innerHeight)*130;launch(x,target)}else choreograph(false)});
document.getElementById('launchBtn').onclick=e=>{e.stopPropagation();currentFestival==='custom'?launch():choreograph(false)};
document.getElementById('types').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedType=b.dataset.type;document.querySelectorAll('#types button').forEach(x=>x.classList.toggle('active',x===b))};
document.getElementById('palette').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedColor=b.dataset.color;document.querySelectorAll('.swatch').forEach(x=>x.classList.toggle('active',x===b))};
document.getElementById('festivalBtn').onclick=e=>{e.stopPropagation();document.getElementById('festivalMenu').classList.toggle('open')};
document.getElementById('festivalMenu').onclick=e=>{const b=e.target.closest('button');if(b){e.stopPropagation();selectFestival(b.dataset.festival,true)}};
document.getElementById('introFestivals').onclick=e=>{const b=e.target.closest('button');if(b){e.stopPropagation();selectFestival(b.dataset.introFestival,false)}};
document.addEventListener('click',()=>{document.getElementById('festivalMenu').classList.remove('open');document.getElementById('languageMenu').classList.remove('open')});
document.getElementById('autoBtn').onclick=e=>{e.stopPropagation();auto=!auto;syncAuto();if(auto){showTimer=0;unlockAudio()}};
document.getElementById('soundBtn').onclick=e=>{e.stopPropagation();soundOn=!soundOn;e.currentTarget.classList.toggle('active',soundOn);document.getElementById('soundIcon').textContent=soundOn?'♪':'×';if(soundOn)unlockAudio()};
document.getElementById('cameraRail').onclick=e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();cameraDirector.next(false,Number(b.dataset.camera));unlockAudio()};
document.getElementById('enterBtn').onclick=async()=>{keepAwake();auto=currentFestival!=='custom';showTimer=3;syncAuto();document.body.classList.add('running');document.getElementById('startScreen').classList.add('hidden');await unlockAudio();choreograph(true)};
let storedLanguage='auto';try{storedLanguage=localStorage.getItem('hanabi-language')||'auto'}catch{}applyLanguage(storedLanguage);previewProgram();

let fps=60,frames=0;
function updateScene(dt){waterUniforms.time.value+=dt;cameraDirector.update(dt);
  for(let i=rockets.length-1;i>=0;i--){rockets[i].update(dt);if(rockets[i].dead)rockets.splice(i,1)}
  for(let i=bursts.length-1;i>=0;i--)if(bursts[i].update(dt)){bursts[i].dispose();bursts.splice(i,1)}
  for(let i=smokes.length-1;i>=0;i--)if(smokes[i].update(dt)){smokes[i].dispose();smokes.splice(i,1)}
  for(let i=lights.length-1;i>=0;i--){const l=lights[i];l.age+=dt;const f=Math.max(0,1-l.age/l.life);l.light.intensity=(mobile?900:1800)*f;l.s.material.opacity=f;l.s.scale.setScalar(18+(1-f)*55);if(l.reflection){l.reflection.material.opacity=f*.34;l.reflection.scale.y=1+(1-f)*.8}if(l.age>=l.life){scene.remove(l.light);effects.remove(l.s,l.reflection);l.light.dispose();l.s.material.dispose();l.reflection?.geometry.dispose();l.reflection?.material.dispose();lights.splice(i,1)}}
  if(auto){showTimer-=dt;if(showTimer<=0){showTimer=choreograph(false)}}
  fps=fps*.94+(1/Math.max(dt,.001))*.06;if(++frames%40===0)document.getElementById('fps').textContent=Math.round(Math.min(99,fps))+' FPS';
}
function animate(){requestAnimationFrame(animate);updateScene(Math.min(.035,clock.getDelta()));composer.render()}
animate();
if(import.meta.env.DEV){window.__hanabiStep=(frames=1)=>{for(let i=0;i<frames;i++)updateScene(1/60);composer.render()};window.__hanabiState=()=>({booms:boomBuffers.length,launches:launchBuffers.length,audio:audioCtx?.state,camera:cameraDirector.shots[cameraDirector.index]?.name,phase:cameraDirector.phase,position:camera.position.toArray(),festival:currentFestival,water:waterMesh.visible})}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:2))});
