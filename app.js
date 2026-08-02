(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false });
  const DPR = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2);
  let W, H, horizon, last = performance.now(), fpsSmooth = 60, frame = 0;
  let selectedType = 'chrysanthemum', selectedColor = 'gold', currentFestival = 'nagaoka', auto = false, soundOn = true;
  let audio, master, showTimer = 0, hasInteracted = false, dragging = false, dragTime = 0, shake = 0, audioLoading = false;
  const realBooms=[],realLaunches=[];
  const rockets = [], particles = [], flashes = [], smoke = [], ripples = [], shockwaves = [];
  const camera={x:0,y:0,tx:0,ty:0,zoom:1,tZoom:1,roll:0,tRoll:0,timer:0,shot:0};
  const camera3d={x:0,y:0,z:0,yaw:0,tx:0,ty:0,tz:0,tYaw:0};
  const palettes = {
    gold: ['#fff3c4','#ffd375','#ff9e3d','#fff8dc'],
    sakura: ['#fff0f7','#ff8fbd','#ff4c8b','#d76dff'],
    azure: ['#e9faff','#74d7ff','#388dff','#a4b8ff'],
    emerald: ['#ecfff8','#76f0bb','#27cfa0','#b8ffe0'],
    rainbow: ['#ff5f83','#ffd76a','#68f6b1','#55bfff','#a97aff','#ff8fcc']
  };
  const festivals={
    nagaoka:{name:'长冈大花火',accent:'#79b9ff'},
    omagari:{name:'大曲竞技花火',accent:'#d6a4ff'},
    sumida:{name:'隅田川花火',accent:'#ff9e78'},
    suwa:{name:'诹访湖上花火',accent:'#7de5d0'},
    custom:{name:'自定义花火',accent:'#ffd479'}
  };

  // Kiosk-style interaction guards: keep the experience fixed, focused and awake.
  let wakeLock = null;
  async function keepAwake(){
    if(!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { /* unsupported or denied */ }
  }
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') keepAwake(); });
  document.addEventListener('selectstart', e => e.preventDefault());
  document.addEventListener('dragstart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault(), { passive:false });
  document.addEventListener('touchmove', e => { if(e.touches.length > 1) e.preventDefault(); }, { passive:false });
  addEventListener('wheel', e => { if(e.ctrlKey) e.preventDefault(); }, { passive:false });
  addEventListener('keydown', e => {
    if((e.ctrlKey || e.metaKey) && ['+','=','-','0'].includes(e.key)) e.preventDefault();
  });

  const rand = (a,b) => Math.random()*(b-a)+a;
  const pick = a => a[(Math.random()*a.length)|0];
  const rgba = (hex,a) => { const n=parseInt(hex.slice(1),16); return `rgba(${n>>16},${n>>8&255},${n&255},${a})`; };
  function projectPoint(x,y,z=0){const dx=x-W/2-camera3d.x,dz=z-camera3d.z,c=Math.cos(camera3d.yaw),s=Math.sin(camera3d.yaw),rx=dx*c-dz*s,depth=900+dx*s+dz*c;if(depth<120)return null;const k=900/depth;return{x:W/2+rx*k,y:horizon+(y-horizon-camera3d.y)*k,k}}

  function resize(){
    W=innerWidth; H=innerHeight; horizon=H*.73;
    canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    if(!camera.x)camera.x=camera.tx=W/2;if(!camera.y)camera.y=camera.ty=H/2;
  }
  addEventListener('resize',resize); resize();

  class Rocket{
    constructor(x,targetY,type=selectedType,color=selectedColor){
      this.x=x; this.y=H+10; this.tx=x+rand(-22,22); this.ty=targetY;
      this.z=rand(-220,260);this.vz=rand(-.12,.12);this.vx=(this.tx-x)*.012; this.vy=-rand(9.5,12.5); this.type=type; this.color=color;
      this.trail=[]; this.dead=false; this.hue=pick(palettes[color]);
      playLaunch((x/W)*2-1);
    }
    update(dt){
      this.trail.push({x:this.x,y:this.y,z:this.z,a:1}); if(this.trail.length>18)this.trail.shift();
      this.trail.forEach(t=>t.a-=.05*dt);
      this.x+=this.vx*dt; this.y+=this.vy*dt;this.z+=this.vz*dt; this.vy+=.075*dt;
      if(this.y<=this.ty || this.vy>-2.2){ this.dead=true; explode(this.x,this.y,this.type,this.color,this.z); }
    }
    draw(){
      const pts=this.trail.map(t=>projectPoint(t.x,t.y,t.z)).filter(Boolean),p=projectPoint(this.x,this.y,this.z);if(!p)return;
      if(pts.length>1){ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(const t of pts)ctx.lineTo(t.x,t.y);ctx.strokeStyle=rgba(this.hue,.28);ctx.lineWidth=1;ctx.stroke()}
      ctx.shadowBlur=18;ctx.shadowColor=this.hue;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,1.7*p.k,0,7);ctx.fill();ctx.shadowBlur=0;
    }
  }

  class Particle{
    constructor(x,y,vx,vy,color,life,size,gravity=.045,drag=.985,twinkle=false,z=0,vz=0){
      Object.assign(this,{x,y,z,vx,vy,vz,color,life,maxLife:life,size,gravity,drag,twinkle});this.prevX=x;this.prevY=y;this.seed=Math.random()*20;this.tail=[];
    }
    update(dt){this.prevX=this.x;this.prevY=this.y;this.tail.push({x:this.x,y:this.y,z:this.z});if(this.tail.length>9)this.tail.shift();this.vx*=Math.pow(this.drag,dt);this.vy*=Math.pow(this.drag,dt);this.vz*=Math.pow(this.drag,dt);this.vy+=this.gravity*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.z+=this.vz*dt;this.life-=dt;}
    draw(){
      let a=Math.max(0,this.life/this.maxLife); a*=a<.18?a/.18:1;
      if(this.twinkle&&Math.sin(this.life*1.7+this.seed)<-.35)a*=.18;
      if(this.tail.length){const pts=this.tail.map(t=>projectPoint(t.x,t.y,t.z)).filter(Boolean),p=projectPoint(this.x,this.y,this.z);if(!p||!pts.length)return;
        ctx.lineCap='round';ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(const t of pts)ctx.lineTo(t.x,t.y);ctx.lineTo(p.x,p.y);
        ctx.strokeStyle=rgba(this.color,a*.12);ctx.lineWidth=this.size*4.2;ctx.stroke();
        ctx.beginPath();ctx.moveTo(pts[Math.max(0,pts.length-3)].x,pts[Math.max(0,pts.length-3)].y);for(let i=Math.max(0,pts.length-2);i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.lineTo(p.x,p.y);
        ctx.strokeStyle=rgba(this.color,a*.98);ctx.lineWidth=this.size*Math.max(.38,a*.72);ctx.stroke();
        ctx.fillStyle=rgba('#ffffff',a*.82);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.45,this.size*.55*p.k),0,7);ctx.fill();
      }
    }
  }

  function explode(x,y,type,colorKey,z=0){
    const cols=palettes[colorKey], mobile=W<700, quality=mobile?.52:1;
    let count=(type==='willow'||type==='kamuro')?220:type==='ring'?150:type==='peony'?220:type==='phoenix'?320:type==='starmine'?280:260; count*=quality;
    shake=Math.max(shake,type==='willow'?4.5:7);
    flashes.push({x,y,z,r:8,life:24,max:24,color:cols[1]});
    ripples.push({x,y:horizon+(horizon-y)*.12,rx:10,life:34,color:cols[1]});
    playBoom((x/W)*2-1, type==='willow'?.72:1);
    for(let i=0;i<count;i++){
      let angle,speed,gravity=.045,drag=.985,life=rand(48,88),size=rand(.7,1.75),twinkle=false;
      if(type==='ring'){angle=(i/count)*Math.PI*2+rand(-.025,.025);speed=rand(4.5,6.4);gravity=.035;life=rand(54,76)}
      else if(type==='willow'||type==='kamuro'){angle=rand(0,Math.PI*2);speed=rand(type==='kamuro'?3.8:2.2,type==='kamuro'?7.2:6.2)*(.85+Math.sin(angle)*.06);gravity=type==='kamuro'?.025:.035;drag=.99;life=rand(95,155);size=rand(.7,1.55);twinkle=true}
      else if(type==='phoenix'){angle=rand(Math.PI*1.08,Math.PI*1.92);speed=rand(3.2,8.3);gravity=.028;drag=.989;life=rand(78,132);size=rand(.7,1.6);twinkle=Math.random()<.5}
      else if(type==='peony'){angle=rand(0,Math.PI*2);speed=Math.sqrt(Math.random())*6.6;gravity=.052;life=rand(44,74)}
      else{angle=rand(0,Math.PI*2);speed=rand(2.5,7.2)*(1-Math.pow(Math.random(),4)*.2);twinkle=Math.random()<.35;life=rand(54,98)}
      if(currentFestival!=='custom')speed*=currentFestival==='nagaoka'?1.42:1.22;
      const col=colorKey==='rainbow'?cols[i%cols.length]:pick(cols);
      particles.push(new Particle(x,y,Math.cos(angle)*speed,Math.sin(angle)*speed,col,life,size,gravity,drag,twinkle,z,rand(-speed*.7,speed*.7)));
    }
    // White-hot inner burst and slow, crackling embers create the layered depth of real shells.
    for(let i=0;i<22*quality;i++){
      const a=rand(0,Math.PI*2),s=rand(1.2,4.2);particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,'#fff8df',rand(15,34),rand(1.2,2.15),.055,.96,false,z,rand(-s*.65,s*.65)));
    }
    for(let i=0;i<42*quality;i++){
      const a=rand(0,Math.PI*2),s=rand(.8,5.4);particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,pick(cols),rand(75,125),rand(.35,.85),.06,.972,true,z,rand(-s*.7,s*.7)));
    }
    const smokeCount=W<700?18:42;
    for(let i=0;i<smokeCount;i++){const life=rand(280,520);smoke.push({x:x+rand(-52,52),y:y+rand(-42,42),z:z+rand(-35,35),vx:rand(-.16,.26),vy:rand(-.18,-.025),vz:rand(-.05,.05),r:rand(7,24),life,max:life,color:pick(cols),seed:rand(0,20)})}if(smoke.length>700)smoke.splice(0,smoke.length-700);
    if(W>700 && (type==='chrysanthemum'||type==='peony'||type==='starmine')){
      const satellites=type==='starmine'?6:type==='peony'?3:2;
      for(let i=0;i<satellites;i++)setTimeout(()=>secondaryBurst(x+rand(-85,85),y+rand(-62,60),colorKey,z+rand(-65,65)),180+i*135);
    }
  }

  function secondaryBurst(x,y,colorKey,z=0){
    const cols=palettes[colorKey];flashes.push({x,y,z,r:5,life:13,max:13,color:cols[1]});shake=Math.max(shake,2.5);
    for(let i=0;i<72;i++){const a=i/72*Math.PI*2+rand(-.035,.035),s=rand(1.6,3.8);particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,pick(cols),rand(38,72),rand(.45,1.05),.045,.978,true,z,rand(-s*.7,s*.7)))}
  }

  function waterMine(x,colorKey='gold'){
    const y=horizon-2,cols=palettes[colorKey];flashes.push({x,y,r:8,life:20,max:20,color:cols[1]});shake=Math.max(shake,5);playBoom((x/W)*2-1,.78);
    for(let i=0;i<(W<700?100:210);i++){const a=rand(Math.PI,Math.PI*2),s=rand(2.2,7.5);particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,pick(cols),rand(65,112),rand(.55,1.45),.052,.985,true))}
  }

  function launch(x=rand(W*.25,W*.85), y=rand(H*.16,H*.5), type=selectedType, color=selectedColor){
    rockets.push(new Rocket(x,y,type,color)); hasInteracted=true; document.getElementById('hint').style.opacity='0';
  }

  function drawBackground(t){
    const accent=festivals[currentFestival].accent,g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#02040a');g.addColorStop(.55,'#08111e');g.addColorStop(.73,rgba(accent,.1));g.addColorStop(1,'#03060a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // distant atmospheric glow
    const a=ctx.createRadialGradient(W*.7,horizon,0,W*.7,horizon,W*.55);a.addColorStop(0,'rgba(42,61,87,.2)');a.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=a;ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='rgba(180,205,235,.55)';for(let i=0;i<90;i++){const x=(i*237.71)%W,y=(i*i*17.13)%(horizon*.72),tw=.25+.5*Math.sin(t*.001+i);ctx.globalAlpha=tw;ctx.fillRect(x,y,i%13===0?1.2:.6,i%13===0?1.2:.6)}ctx.globalAlpha=1;
    // Each festival has its own recognisable viewing environment.
    ctx.fillStyle='#050910';ctx.beginPath();ctx.moveTo(0,horizon);
    if(currentFestival==='sumida'){
      for(let x=0,i=0;x<=W;i++){const n=Math.abs(Math.sin(i*91.713)*43758.5453)%1,w=14+n*25,bh=18+n*58;ctx.lineTo(x,horizon-bh);ctx.lineTo(x+w,horizon-bh);x+=w}
    }else{
      const amp=currentFestival==='suwa'?105:currentFestival==='nagaoka'?62:38;
      for(let x=0;x<=W;x+=28){const y=horizon-12-Math.abs(Math.sin(x*.0047+1.2))*amp-Math.abs(Math.sin(x*.012))*amp*.28;ctx.lineTo(x,y)}
    }
    ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    if(currentFestival==='sumida'){const sx=W*.78;ctx.fillStyle='#04070c';ctx.beginPath();ctx.moveTo(sx-9,horizon);ctx.lineTo(sx-4,horizon-185);ctx.lineTo(sx,horizon-245);ctx.lineTo(sx+4,horizon-185);ctx.lineTo(sx+9,horizon);ctx.fill();ctx.fillRect(sx-18,horizon-167,36,4)}
    // water
    const wg=ctx.createLinearGradient(0,horizon,0,H);wg.addColorStop(0,'rgba(17,31,43,.92)');wg.addColorStop(1,'#020509');ctx.fillStyle=wg;ctx.fillRect(0,horizon,W,H-horizon);
    ctx.strokeStyle='rgba(130,170,200,.06)';ctx.lineWidth=.5;for(let i=0;i<24;i++){const y=horizon+6+i*i*.42;ctx.beginPath();for(let x=0;x<W;x+=30){const yy=y+Math.sin(x*.018+t*.0007+i)*1.2;ctx.moveTo(x,yy);ctx.lineTo(x+rand(12,28),yy)}ctx.stroke()}
    if(currentFestival==='nagaoka'){
      ctx.strokeStyle='rgba(119,145,171,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.05,horizon+14);ctx.lineTo(W*.95,horizon+14);ctx.stroke();for(let x=W*.09;x<W*.95;x+=W*.075){ctx.strokeStyle='rgba(90,111,132,.28)';ctx.beginPath();ctx.moveTo(x,horizon+14);ctx.lineTo(x,horizon+34);ctx.stroke()}
    }else if(currentFestival==='sumida'){
      ctx.fillStyle='rgba(246,191,103,.28)';for(let i=0;i<35;i++){const x=(i*83.7)%W;ctx.fillRect(x,horizon-rand(18,55),1.2,1.2)}
    }else if(currentFestival==='omagari'){
      ctx.fillStyle='#020408';ctx.fillRect(0,horizon-5,W,8);ctx.fillStyle='rgba(255,190,105,.16)';for(let x=7;x<W;x+=16)ctx.fillRect(x,horizon-9,1,1);
    }else if(currentFestival==='suwa'){
      ctx.fillStyle='rgba(255,194,104,.22)';for(let x=8;x<W;x+=rand(9,18))ctx.fillRect(x,horizon-3-rand(0,5),rand(.6,1.5),1);
    }
    if(currentFestival!=='custom'&&camera.shot===1){ctx.fillStyle='#020409';ctx.beginPath();ctx.moveTo(0,H*.88);ctx.lineTo(W*.34,H*.82);ctx.lineTo(W*.6,H);ctx.lineTo(0,H);ctx.fill();ctx.strokeStyle='rgba(130,150,175,.18)';ctx.beginPath();ctx.moveTo(0,H*.88);ctx.lineTo(W*.34,H*.82);ctx.stroke()}
    else if(currentFestival!=='custom'&&camera.shot===2){ctx.fillStyle='#010307';ctx.beginPath();ctx.moveTo(0,H*.9);for(let x=0;x<W;x+=18)ctx.lineTo(x,H*.9-rand(0,14));ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();ctx.strokeStyle='rgba(130,150,170,.14)';ctx.beginPath();ctx.moveTo(0,H*.87);ctx.lineTo(W,H*.92);ctx.stroke()}
    else if(currentFestival!=='custom'&&camera.shot===3){ctx.fillStyle='#010308';ctx.beginPath();ctx.moveTo(W*.22,H);ctx.lineTo(W*.38,H*.86);ctx.lineTo(W*.62,H*.86);ctx.lineTo(W*.78,H);ctx.fill();ctx.strokeStyle='rgba(125,150,170,.2)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.38,H*.86);ctx.lineTo(W*.62,H*.86);ctx.moveTo(W*.4,H*.86);ctx.lineTo(W*.4,H*.78);ctx.moveTo(W*.6,H*.86);ctx.lineTo(W*.6,H*.78);ctx.stroke()}
  }

  function drawReflections(){
    ctx.save();ctx.beginPath();ctx.rect(0,horizon,W,H-horizon);ctx.clip();ctx.globalCompositeOperation='screen';
    for(const p of particles){if(p.y>horizon||p.life<=0)continue;const ry=horizon+(horizon-p.y)*.18;const a=Math.max(0,p.life/p.maxLife)*.11;ctx.strokeStyle=rgba(p.color,a);ctx.lineWidth=rand(1,3);ctx.beginPath();ctx.moveTo(p.x-rand(3,12),ry+rand(-2,2));ctx.lineTo(p.x+rand(3,12),ry+rand(-2,2));ctx.stroke()}
    for(const r of ripples){const a=Math.max(0,r.life/34)*.3;ctx.strokeStyle=rgba(r.color,a);ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(r.x,r.y,r.rx,2.5,0,0,Math.PI*2);ctx.stroke();r.rx+=2.4;r.life--}
    ctx.restore();
  }

  function chooseCameraShot(force=false){
    camera.tx=W/2;camera.ty=H/2;camera.tZoom=1;camera.tRoll=0;
    if(currentFestival==='custom'){camera3d.tx=camera3d.ty=camera3d.tz=camera3d.tYaw=0;camera.timer=9999;return}
    camera.shot=(camera.shot+1)%4;
    if(camera.shot===0){Object.assign(camera3d,{tx:0,ty:0,tz:-180,tYaw:0});document.getElementById('qualityLabel').textContent='RIVERBANK'}
    else if(camera.shot===1){Object.assign(camera3d,{tx:-260,ty:-155,tz:70,tYaw:-.22});document.getElementById('qualityLabel').textContent='ROOFTOP'}
    else if(camera.shot===2){Object.assign(camera3d,{tx:300,ty:90,tz:-90,tYaw:.25});document.getElementById('qualityLabel').textContent='LAUNCH FIELD'}
    else{Object.assign(camera3d,{tx:-110,ty:20,tz:270,tYaw:-.12});document.getElementById('qualityLabel').textContent='RIVER BOAT'}
    camera.timer=force?230:rand(300,500);
  }

  function render(now){
    const dt=Math.min(2.2,(now-last)/16.667);last=now;frame++;
    fpsSmooth=fpsSmooth*.94+(60/dt)*.06;if(frame%30===0)document.getElementById('fps').textContent=Math.round(Math.min(99,fpsSmooth))+' FPS';
    camera.timer-=dt;if(camera.timer<=0)chooseCameraShot();const ease=1-Math.pow(.94,dt),ease3=1-Math.pow(.975,dt);camera.x+=(camera.tx-camera.x)*ease;camera.y+=(camera.ty-camera.y)*ease;camera.zoom+=(camera.tZoom-camera.zoom)*ease;camera.roll+=(camera.tRoll-camera.roll)*ease;camera3d.x+=(camera3d.tx-camera3d.x)*ease3;camera3d.y+=(camera3d.ty-camera3d.y)*ease3;camera3d.z+=(camera3d.tz-camera3d.z)*ease3;camera3d.yaw+=(camera3d.tYaw-camera3d.yaw)*ease3;
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate(camera.roll);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);if(shake>.08){ctx.translate(rand(-shake,shake),rand(-shake*.55,shake*.55));shake*=Math.pow(.82,dt)}
    drawBackground(now);
    if(flashes.length){const f=flashes[flashes.length-1],a=Math.max(0,f.life/f.max);ctx.fillStyle=rgba(f.color,a*.045);ctx.fillRect(0,0,W,H)}
    ctx.globalCompositeOperation='source-over';
    for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.x+=(s.vx+Math.sin(s.seed+s.life*.025)*.045)*dt;s.y+=s.vy*dt;s.z=(s.z||0)+(s.vz||0)*dt;s.r+=.055*dt;s.life-=dt;if(s.life<=0){smoke.splice(i,1);continue}const p=projectPoint(s.x,s.y,s.z||0);if(!p)continue;const rr=s.r*p.k,a=Math.sin(Math.PI*s.life/s.max)*.038,gr=ctx.createRadialGradient(p.x-rr*.22,p.y-rr*.16,rr*.05,p.x,p.y,rr);gr.addColorStop(0,rgba(s.color||'#687385',a));gr.addColorStop(.3,rgba(s.color||'#687385',a*.7));gr.addColorStop(.72,rgba('#667080',a*.26));gr.addColorStop(1,rgba('#667080',0));ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,rr,0,7);ctx.fill()}
    ctx.globalCompositeOperation='lighter';
    for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.update(dt);r.draw();if(r.dead)rockets.splice(i,1)}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.update(dt);p.draw();if(p.life<=0||p.y>H+30)particles.splice(i,1)}
    for(let i=flashes.length-1;i>=0;i--){const f=flashes[i];f.life-=dt;f.r+=10*dt;const p=projectPoint(f.x,f.y,f.z||0);if(!p){if(f.life<=0)flashes.splice(i,1);continue}const a=Math.max(0,f.life/f.max),radius=f.r*1.7*p.k,fx=p.x,fy=p.y;const gr=ctx.createRadialGradient(fx,fy,0,fx,fy,radius);gr.addColorStop(0,rgba('#ffffff',a*.92));gr.addColorStop(.08,rgba(f.color,a*.55));gr.addColorStop(.42,rgba(f.color,a*.13));gr.addColorStop(1,rgba(f.color,0));ctx.fillStyle=gr;ctx.fillRect(fx-radius,fy-radius,radius*2,radius*2);ctx.strokeStyle=rgba('#ffffff',a*.32);ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(fx-radius*.7,fy);ctx.lineTo(fx+radius*.7,fy);ctx.moveTo(fx,fy-radius*.7);ctx.lineTo(fx,fy+radius*.7);ctx.stroke();if(f.life<=0)flashes.splice(i,1)}
    ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';drawReflections();
    for(let i=ripples.length-1;i>=0;i--)if(ripples[i].life<=0)ripples.splice(i,1);
    if(auto){showTimer-=dt;if(showTimer<=0){choreograph();showTimer=rand(62,105)}}
    ctx.restore();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  function initAudio(){
    if(audio)return; audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.68;const limiter=audio.createDynamicsCompressor();limiter.threshold.value=-7;limiter.knee.value=4;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.22;master.connect(limiter).connect(audio.destination);
  }
  function unlockAudio(){
    initAudio();if(audio.state==='suspended')audio.resume();
    loadFieldRecordings();
    // Starting a silent source inside the user gesture unlocks WebAudio on iOS/Safari.
    const o=audio.createOscillator(),g=audio.createGain();g.gain.value=.00001;o.connect(g).connect(master);o.start();o.stop(audio.currentTime+.02);
  }
  async function loadFieldRecordings(){
    if(audioLoading||realBooms.length)return;audioLoading=true;
    await Promise.all([1,2,3,4,5,6].map(async n=>{try{const data=await fetch(`assets/audio/boom-${n}.ogg`).then(r=>r.arrayBuffer());realBooms.push(await audio.decodeAudioData(data))}catch(_){}}));
    await Promise.all([1,2,3,4].map(async n=>{try{const data=await fetch(`assets/audio/launch-${n}.ogg`).then(r=>r.arrayBuffer());realLaunches.push(await audio.decodeAudioData(data))}catch(_){}}));
  }
  function playLaunch(pan=0){
    if(!audio||!soundOn)return;if(audio.state==='suspended')audio.resume();const p=audio.createStereoPanner(),gain=audio.createGain();p.pan.value=pan;gain.gain.value=.38;
    if(realLaunches.length){const src=audio.createBufferSource();src.buffer=pick(realLaunches);src.playbackRate.value=rand(.94,1.08);src.connect(gain).connect(p).connect(master);src.start()}
    else{const dur=.9,buf=audio.createBuffer(1,audio.sampleRate*dur,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.2;const src=audio.createBufferSource(),filter=audio.createBiquadFilter();src.buffer=buf;filter.type='bandpass';filter.frequency.value=1200;src.connect(filter).connect(gain).connect(p).connect(master);src.start()}
  }
  function playBoom(pan=0,scale=1){
    if(!audio||!soundOn)return;if(audio.state==='suspended')audio.resume();const delay=.025,p=audio.createStereoPanner();p.pan.value=pan;
    if(realBooms.length){const src=audio.createBufferSource(),gain=audio.createGain();src.buffer=pick(realBooms);src.playbackRate.value=rand(.93,1.07);gain.gain.value=Math.min(.95,.64*scale);src.connect(gain).connect(p).connect(master);src.start(audio.currentTime+delay)}
    else{const dur=1.8,buf=audio.createBuffer(1,audio.sampleRate*dur,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++){const t=i/audio.sampleRate;d[i]=(Math.random()*2-1)*Math.exp(-t*3)}const src=audio.createBufferSource(),low=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=buf;low.type='lowpass';low.frequency.value=650;gain.gain.setValueAtTime(.45*scale,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);src.connect(low).connect(gain).connect(p).connect(master);src.start()}
    const sub=audio.createOscillator(),sg=audio.createGain();sub.type='sine';sub.frequency.setValueAtTime(52,audio.currentTime+delay);sub.frequency.exponentialRampToValueAtTime(30,audio.currentTime+1);sg.gain.setValueAtTime(.2*scale,audio.currentTime+delay);sg.gain.exponentialRampToValueAtTime(.001,audio.currentTime+1.1);sub.connect(sg).connect(master);sub.start(audio.currentTime+delay);sub.stop(audio.currentTime+1.15);
  }

  function choreograph(grand=false){
    const colors=Object.keys(palettes),types=['chrysanthemum','willow','ring','peony','kamuro','starmine'];
    if(currentFestival==='nagaoka'){
      const n=W<700?5:grand?11:7;for(let i=0;i<n;i++)setTimeout(()=>launch(W*(.08+i*(.84/(n-1))),H*(.38-Math.sin(i/(n-1)*Math.PI)*.22),i%2?'phoenix':'kamuro',i%3?'gold':'azure'),i*115);
    }else if(currentFestival==='omagari'){
      const n=grand?7:4;for(let i=0;i<n;i++)setTimeout(()=>launch(W*(.2+(i%3)*.3),rand(H*.12,H*.4),types[i%types.length],colors[i%colors.length]),i*310);
    }else if(currentFestival==='sumida'){
      const n=grand?10:6;for(let i=0;i<n;i++)setTimeout(()=>{const site=i%2?W*.31:W*.69;launch(site+rand(-W*.08,W*.08),rand(H*.13,H*.43),pick(types),pick(colors))},i*145);
    }else if(currentFestival==='suwa'){
      const n=W<700?3:grand?7:4;for(let i=0;i<n;i++)setTimeout(()=>waterMine(W*(.12+i*(.76/(n-1))),i%2?'azure':'gold'),i*170);for(let i=0;i<(grand?5:3);i++)setTimeout(()=>launch(rand(W*.2,W*.8),rand(H*.1,H*.35),i%2?'kamuro':'starmine',pick(colors)),450+i*250);
    }else{
      const n=grand?6:3;for(let i=0;i<n;i++)setTimeout(()=>launch(rand(W*.18,W*.82),rand(H*.12,H*.44),selectedType,selectedColor),i*220);
    }
  }

  function selectFestival(id,play=false){
    currentFestival=id;document.getElementById('festivalName').textContent=festivals[id].name;
    document.body.classList.toggle('custom-mode',id==='custom');document.getElementById('typeLabel').textContent=id==='custom'?'烟花类型':'大会专属编排';
    document.querySelectorAll('#festivalMenu button').forEach(x=>x.classList.toggle('active',x.dataset.festival===id));
    document.querySelectorAll('#introFestivals button').forEach(x=>x.classList.toggle('active',x.dataset.introFestival===id));
    document.getElementById('festivalMenu').classList.remove('open');
    auto=id!=='custom';showTimer=110;syncAutoButton();
    chooseCameraShot(true);
    if(play){rockets.length=particles.length=flashes.length=smoke.length=ripples.length=shockwaves.length=0;setTimeout(()=>choreograph(true),280)}
  }
  function syncAutoButton(){const b=document.getElementById('autoBtn');b.classList.toggle('active',auto);b.querySelector('.play-icon').textContent=auto?'Ⅱ':'▶'}

  canvas.addEventListener('pointerdown',e=>{unlockAudio();dragging=true;dragTime=0;if(currentFestival==='custom')launch(e.clientX,Math.max(80,Math.min(e.clientY,horizon-70)));else choreograph(false)});
  canvas.addEventListener('pointermove',e=>{if(!dragging||currentFestival!=='custom')return;dragTime++;if(dragTime%7===0)launch(e.clientX,Math.max(80,Math.min(e.clientY,horizon-60)));});
  addEventListener('pointerup',()=>dragging=false);
  document.getElementById('launchBtn').onclick=e=>{e.stopPropagation();currentFestival==='custom'?launch():choreograph(false)};
  document.getElementById('types').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedType=b.dataset.type;document.querySelectorAll('#types button').forEach(x=>x.classList.toggle('active',x===b))};
  document.getElementById('palette').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedColor=b.dataset.color;document.querySelectorAll('.swatch').forEach(x=>x.classList.toggle('active',x===b))};
  document.getElementById('festivalBtn').onclick=e=>{e.stopPropagation();document.getElementById('festivalMenu').classList.toggle('open')};
  document.getElementById('festivalMenu').onclick=e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();selectFestival(b.dataset.festival,true)};
  document.getElementById('introFestivals').onclick=e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();selectFestival(b.dataset.introFestival,false)};
  document.addEventListener('click',()=>document.getElementById('festivalMenu').classList.remove('open'));
  document.getElementById('autoBtn').onclick=e=>{e.stopPropagation();auto=!auto;syncAutoButton();if(auto){showTimer=0;unlockAudio()}};
  document.getElementById('soundBtn').onclick=e=>{e.stopPropagation();soundOn=!soundOn;e.currentTarget.classList.toggle('active',soundOn);document.getElementById('soundIcon').textContent=soundOn?'♪':'×';if(soundOn)unlockAudio()};
  document.getElementById('enterBtn').onclick=()=>{unlockAudio();keepAwake();auto=currentFestival!=='custom';showTimer=120;syncAutoButton();chooseCameraShot(true);document.body.classList.add('running');document.getElementById('startScreen').classList.add('hidden');setTimeout(()=>choreograph(true),520)};
})();

