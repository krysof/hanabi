(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false });
  const DPR = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2);
  let W, H, horizon, last = performance.now(), fpsSmooth = 60, frame = 0;
  let selectedType = 'chrysanthemum', selectedColor = 'gold', auto = false, soundOn = true;
  let audio, master, showTimer = 0, hasInteracted = false, dragging = false, dragTime = 0;
  const rockets = [], particles = [], flashes = [], smoke = [], ripples = [], shockwaves = [];
  const palettes = {
    gold: ['#fff3c4','#ffd375','#ff9e3d','#fff8dc'],
    sakura: ['#fff0f7','#ff8fbd','#ff4c8b','#d76dff'],
    azure: ['#e9faff','#74d7ff','#388dff','#a4b8ff'],
    emerald: ['#ecfff8','#76f0bb','#27cfa0','#b8ffe0'],
    rainbow: ['#ff5f83','#ffd76a','#68f6b1','#55bfff','#a97aff','#ff8fcc']
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

  function resize(){
    W=innerWidth; H=innerHeight; horizon=H*.73;
    canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  addEventListener('resize',resize); resize();

  class Rocket{
    constructor(x,targetY,type=selectedType,color=selectedColor){
      this.x=x; this.y=H+10; this.tx=x+rand(-22,22); this.ty=targetY;
      this.vx=(this.tx-x)*.012; this.vy=-rand(9.5,12.5); this.type=type; this.color=color;
      this.trail=[]; this.dead=false; this.hue=pick(palettes[color]);
      playLaunch((x/W)*2-1);
    }
    update(dt){
      this.trail.push({x:this.x,y:this.y,a:1}); if(this.trail.length>18)this.trail.shift();
      this.trail.forEach(t=>t.a-=.05*dt);
      this.x+=this.vx*dt; this.y+=this.vy*dt; this.vy+=.075*dt;
      if(this.y<=this.ty || this.vy>-2.2){ this.dead=true; explode(this.x,this.y,this.type,this.color); }
    }
    draw(){
      if(this.trail.length>1){ctx.beginPath();ctx.moveTo(this.trail[0].x,this.trail[0].y);for(const t of this.trail)ctx.lineTo(t.x,t.y);ctx.strokeStyle=rgba(this.hue,.28);ctx.lineWidth=1;ctx.stroke()}
      ctx.shadowBlur=18;ctx.shadowColor=this.hue;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(this.x,this.y,1.7,0,7);ctx.fill();ctx.shadowBlur=0;
    }
  }

  class Particle{
    constructor(x,y,vx,vy,color,life,size,gravity=.045,drag=.985,twinkle=false){
      Object.assign(this,{x,y,vx,vy,color,life,maxLife:life,size,gravity,drag,twinkle});this.prevX=x;this.prevY=y;this.seed=Math.random()*20;this.tail=[];
    }
    update(dt){this.prevX=this.x;this.prevY=this.y;this.tail.push({x:this.x,y:this.y});if(this.tail.length>5)this.tail.shift();this.vx*=Math.pow(this.drag,dt);this.vy*=Math.pow(this.drag,dt);this.vy+=this.gravity*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.life-=dt;}
    draw(){
      let a=Math.max(0,this.life/this.maxLife); a*=a<.18?a/.18:1;
      if(this.twinkle&&Math.sin(this.life*1.7+this.seed)<-.35)a*=.18;
      if(this.tail.length){
        ctx.lineCap='round';ctx.beginPath();ctx.moveTo(this.tail[0].x,this.tail[0].y);for(const t of this.tail)ctx.lineTo(t.x,t.y);ctx.lineTo(this.x,this.y);
        ctx.strokeStyle=rgba(this.color,a*.13);ctx.lineWidth=this.size*7;ctx.stroke();
        ctx.beginPath();ctx.moveTo(this.tail[Math.max(0,this.tail.length-3)].x,this.tail[Math.max(0,this.tail.length-3)].y);for(let i=Math.max(0,this.tail.length-2);i<this.tail.length;i++)ctx.lineTo(this.tail[i].x,this.tail[i].y);ctx.lineTo(this.x,this.y);
        ctx.strokeStyle=rgba(this.color,a*.96);ctx.lineWidth=this.size*Math.max(.5,a);ctx.stroke();
        ctx.fillStyle=rgba('#ffffff',a*.82);ctx.beginPath();ctx.arc(this.x,this.y,Math.max(.45,this.size*.55),0,7);ctx.fill();
      }
    }
  }

  function explode(x,y,type,colorKey){
    const cols=palettes[colorKey], mobile=W<700, quality=mobile?.52:1;
    let count=type==='willow'?190:type==='ring'?150:type==='peony'?220:260; count*=quality;
    flashes.push({x,y,r:8,life:24,max:24,color:cols[1]});
    shockwaves.push({x,y,r:8,life:22,max:22,color:cols[1]});
    ripples.push({x,y:horizon+(horizon-y)*.12,rx:10,life:34,color:cols[1]});
    playBoom((x/W)*2-1, type==='willow'?.72:1);
    for(let i=0;i<count;i++){
      let angle,speed,gravity=.045,drag=.985,life=rand(48,88),size=rand(.7,1.75),twinkle=false;
      if(type==='ring'){angle=(i/count)*Math.PI*2+rand(-.025,.025);speed=rand(4.5,6.4);gravity=.035;life=rand(54,76)}
      else if(type==='willow'){angle=rand(0,Math.PI*2);speed=rand(2.2,6.2)*(.85+Math.sin(angle)*.06);gravity=.035;drag=.988;life=rand(82,130);size=rand(.6,1.35);twinkle=true}
      else if(type==='peony'){angle=rand(0,Math.PI*2);speed=Math.sqrt(Math.random())*6.6;gravity=.052;life=rand(44,74)}
      else{angle=rand(0,Math.PI*2);speed=rand(2.5,7.2)*(1-Math.pow(Math.random(),4)*.2);twinkle=Math.random()<.35;life=rand(54,98)}
      const col=colorKey==='rainbow'?cols[i%cols.length]:pick(cols);
      particles.push(new Particle(x,y,Math.cos(angle)*speed,Math.sin(angle)*speed,col,life,size,gravity,drag,twinkle));
    }
    // White-hot inner burst and slow, crackling embers create the layered depth of real shells.
    for(let i=0;i<22*quality;i++){
      const a=rand(0,Math.PI*2),s=rand(1.2,4.2);particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,'#fff8df',rand(15,34),rand(1.2,2.15),.055,.96,false));
    }
    for(let i=0;i<42*quality;i++){
      const a=rand(0,Math.PI*2),s=rand(.8,5.4);particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,pick(cols),rand(75,125),rand(.35,.85),.06,.972,true));
    }
    for(let i=0;i<rand(5,10);i++) smoke.push({x:x+rand(-12,12),y:y+rand(-8,8),vx:rand(-.08,.08),vy:rand(-.2,-.05),r:rand(12,28),life:rand(80,150),max:150});
  }

  function launch(x=rand(W*.25,W*.85), y=rand(H*.16,H*.5), type=selectedType, color=selectedColor){
    rockets.push(new Rocket(x,y,type,color)); hasInteracted=true; document.getElementById('hint').style.opacity='0';
  }

  function drawBackground(t){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#02040a');g.addColorStop(.55,'#08111e');g.addColorStop(.73,'#111929');g.addColorStop(1,'#03060a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // distant atmospheric glow
    const a=ctx.createRadialGradient(W*.7,horizon,0,W*.7,horizon,W*.55);a.addColorStop(0,'rgba(42,61,87,.2)');a.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=a;ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='rgba(180,205,235,.55)';for(let i=0;i<90;i++){const x=(i*237.71)%W,y=(i*i*17.13)%(horizon*.72),tw=.25+.5*Math.sin(t*.001+i);ctx.globalAlpha=tw;ctx.fillRect(x,y,i%13===0?1.2:.6,i%13===0?1.2:.6)}ctx.globalAlpha=1;
    // skyline
    ctx.fillStyle='#050910';ctx.beginPath();ctx.moveTo(0,horizon);for(let x=0,i=0;x<=W;i++){const n=Math.abs(Math.sin(i*91.713)*43758.5453)%1,w=12+n*18,bh=6+(Math.abs(Math.sin(i*47.17))*18)+(i%17===0?28+n*32:0);ctx.lineTo(x,horizon-bh);ctx.lineTo(x+w,horizon-bh);x+=w}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    // water
    const wg=ctx.createLinearGradient(0,horizon,0,H);wg.addColorStop(0,'rgba(17,31,43,.92)');wg.addColorStop(1,'#020509');ctx.fillStyle=wg;ctx.fillRect(0,horizon,W,H-horizon);
    ctx.strokeStyle='rgba(130,170,200,.06)';ctx.lineWidth=.5;for(let i=0;i<24;i++){const y=horizon+6+i*i*.42;ctx.beginPath();for(let x=0;x<W;x+=30){const yy=y+Math.sin(x*.018+t*.0007+i)*1.2;ctx.moveTo(x,yy);ctx.lineTo(x+rand(12,28),yy)}ctx.stroke()}
  }

  function drawReflections(){
    ctx.save();ctx.beginPath();ctx.rect(0,horizon,W,H-horizon);ctx.clip();ctx.globalCompositeOperation='screen';
    for(const p of particles){if(p.y>horizon||p.life<=0)continue;const ry=horizon+(horizon-p.y)*.18;const a=Math.max(0,p.life/p.maxLife)*.11;ctx.strokeStyle=rgba(p.color,a);ctx.lineWidth=rand(1,3);ctx.beginPath();ctx.moveTo(p.x-rand(3,12),ry+rand(-2,2));ctx.lineTo(p.x+rand(3,12),ry+rand(-2,2));ctx.stroke()}
    for(const r of ripples){const a=Math.max(0,r.life/34)*.3;ctx.strokeStyle=rgba(r.color,a);ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(r.x,r.y,r.rx,2.5,0,0,Math.PI*2);ctx.stroke();r.rx+=2.4;r.life--}
    ctx.restore();
  }

  function render(now){
    const dt=Math.min(2.2,(now-last)/16.667);last=now;frame++;
    fpsSmooth=fpsSmooth*.94+(60/dt)*.06;if(frame%30===0)document.getElementById('fps').textContent=Math.round(Math.min(99,fpsSmooth))+' FPS';
    drawBackground(now);
    ctx.globalCompositeOperation='source-over';
    for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=.055*dt;s.life-=dt;if(s.life<=0){smoke.splice(i,1);continue}ctx.fillStyle=`rgba(75,82,96,${Math.sin(Math.PI*s.life/s.max)*.025})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}
    ctx.globalCompositeOperation='lighter';
    for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.update(dt);r.draw();if(r.dead)rockets.splice(i,1)}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.update(dt);p.draw();if(p.life<=0||p.y>H+30)particles.splice(i,1)}
    for(let i=flashes.length-1;i>=0;i--){const f=flashes[i];f.life-=dt;f.r+=10*dt;const a=Math.max(0,f.life/f.max),radius=f.r*1.7;const gr=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,radius);gr.addColorStop(0,rgba('#ffffff',a*.92));gr.addColorStop(.08,rgba(f.color,a*.55));gr.addColorStop(.42,rgba(f.color,a*.13));gr.addColorStop(1,rgba(f.color,0));ctx.fillStyle=gr;ctx.fillRect(f.x-radius,f.y-radius,radius*2,radius*2);ctx.strokeStyle=rgba('#ffffff',a*.32);ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(f.x-radius*.7,f.y);ctx.lineTo(f.x+radius*.7,f.y);ctx.moveTo(f.x,f.y-radius*.7);ctx.lineTo(f.x,f.y+radius*.7);ctx.stroke();if(f.life<=0)flashes.splice(i,1)}
    for(let i=shockwaves.length-1;i>=0;i--){const s=shockwaves[i];s.life-=dt;s.r+=8.5*dt;const a=Math.max(0,s.life/s.max);ctx.strokeStyle=rgba(s.color,a*.25);ctx.lineWidth=1.4*a;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.stroke();if(s.life<=0)shockwaves.splice(i,1)}
    ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';drawReflections();
    for(let i=ripples.length-1;i>=0;i--)if(ripples[i].life<=0)ripples.splice(i,1);
    if(auto){showTimer-=dt;if(showTimer<=0){const burst=Math.random()<.22?3:1;for(let i=0;i<burst;i++)setTimeout(()=>launch(rand(W*.18,W*.9),rand(H*.12,H*.48),pick(['chrysanthemum','willow','ring','peony']),pick(Object.keys(palettes))),i*180);showTimer=rand(28,62)}}
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  function initAudio(){
    if(audio)return; audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.44;master.connect(audio.destination);
  }
  function playLaunch(pan=0){if(!audio||!soundOn)return;const dur=.85,buf=audio.createBuffer(1,audio.sampleRate*dur,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.28;const src=audio.createBufferSource();src.buffer=buf;const filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(480,audio.currentTime);filter.frequency.exponentialRampToValueAtTime(1500,audio.currentTime+dur);const gain=audio.createGain();gain.gain.setValueAtTime(.18,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);const p=audio.createStereoPanner();p.pan.value=pan;src.connect(filter).connect(gain).connect(p).connect(master);src.start()}
  function playBoom(pan=0,scale=1){if(!audio||!soundOn)return;const delay=.035,dur=1.8,buf=audio.createBuffer(1,audio.sampleRate*dur,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++){const t=i/audio.sampleRate;d[i]=(Math.random()*2-1)*Math.exp(-t*3.2)*(1+Math.sin(t*82)*.4)}const src=audio.createBufferSource();src.buffer=buf;const low=audio.createBiquadFilter();low.type='lowpass';low.frequency.value=650;const gain=audio.createGain();gain.gain.setValueAtTime(.65*scale,audio.currentTime+delay);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);const p=audio.createStereoPanner();p.pan.value=pan;src.connect(low).connect(gain).connect(p).connect(master);src.start(audio.currentTime+delay)}

  canvas.addEventListener('pointerdown',e=>{dragging=true;dragTime=0;launch(e.clientX,Math.max(80,Math.min(e.clientY,horizon-70)));});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;dragTime++;if(dragTime%7===0)launch(e.clientX,Math.max(80,Math.min(e.clientY,horizon-60)));});
  addEventListener('pointerup',()=>dragging=false);
  document.getElementById('launchBtn').onclick=e=>{e.stopPropagation();launch()};
  document.getElementById('types').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedType=b.dataset.type;document.querySelectorAll('#types button').forEach(x=>x.classList.toggle('active',x===b))};
  document.getElementById('palette').onclick=e=>{const b=e.target.closest('button');if(!b)return;selectedColor=b.dataset.color;document.querySelectorAll('.swatch').forEach(x=>x.classList.toggle('active',x===b))};
  document.getElementById('autoBtn').onclick=e=>{e.stopPropagation();auto=!auto;e.currentTarget.classList.toggle('active',auto);e.currentTarget.querySelector('.play-icon').textContent=auto?'Ⅱ':'▶';if(auto){showTimer=0;initAudio()}};
  document.getElementById('soundBtn').onclick=e=>{e.stopPropagation();soundOn=!soundOn;e.currentTarget.classList.toggle('active',soundOn);document.getElementById('soundIcon').textContent=soundOn?'♪':'×';if(soundOn)initAudio()};
  document.getElementById('enterBtn').onclick=()=>{initAudio();keepAwake();if(audio.state==='suspended')audio.resume();document.getElementById('startScreen').classList.add('hidden');setTimeout(()=>{launch(W*.64,H*.3,'chrysanthemum','gold');setTimeout(()=>launch(W*.76,H*.22,'willow','sakura'),650)},600)};
})();
