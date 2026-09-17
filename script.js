(function(){
"use strict";
var THREE=window.THREE;
var loading=document.getElementById("loading"),loadError=document.getElementById("loadError");
if(!THREE){loadError.textContent="Three.js não carregou. O navegador não recebeu a biblioteca 3D.";return;}

try {
var scene=new THREE.Scene();
scene.background=new THREE.Color(0x9db5a2);
scene.fog=new THREE.Fog(0x9db5a2,18,42);
var camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.05,80);
camera.position.set(-7.8,1.65,5.4); camera.rotation.order="YXZ";
var renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
document.getElementById("app").prepend(renderer.domElement);

var clock=new THREE.Clock(), ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
var root=new THREE.Group();scene.add(root), interactables=[];
var solved=new Set(), target=null, started=false, roof=false, demo=false, sound=true;
var yaw=0,pitch=-.02, moveX=0,moveZ=0, demoIndex=0,demoTimer=0;

function material(c,rough,metal){return new THREE.MeshStandardMaterial({color:c,roughness:rough==null?.75:rough,metalness:metal||0});}
var M={wall:material(0xe8e3d9),floor:material(0xb5a48b),dark:material(0x26322b),wood:material(0x8b6545),green:material(0x6f9b62),white:material(0xf2f3ed),black:material(0x1a211e),blue:material(0x557f9b),red:material(0xb85b50),metal:material(0x727975,.35,.6),water:material(0x4d9dca,.2,.05),solar:material(0x213744,.3,.4),yellow:material(0xffd95e)};
function box(n,x,y,z,sx,sy,sz,m,parent){parent=parent||root;var o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m||M.white);o.name=n;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cyl(n,x,y,z,r,h,m,parent,seg){parent=parent||root;var o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg||16),m||M.metal);o.name=n;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function add(o,type){o.userData.type=type;interactables.push(o);return o;}
function label(t,x,y,z){var c=document.createElement("canvas");c.width=512;c.height=96;var g=c.getContext("2d");g.fillStyle="rgba(245,249,245,.9)";g.roundRect(4,4,504,88,20);g.fill();g.fillStyle="#183b27";g.font="bold 25px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(t,256,48);var tx=new THREE.CanvasTexture(c),s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true}));s.scale.set(2.8,.52,1);s.position.set(x,y,z);root.add(s);}

box("floor",0,0,0,20,.2,14,M.floor);
[[0,2.5,-7,20,.15,5], [0,2.5,7,20,.15,5],[-10,2.5,0,.15,14,5],[10,2.5,0,.15,14,5],[-2,2.5,0,.15,14,5],[3.5,2.5,-3.5,13,.15,5],[3.5,2.5,3.5,13,.15,5],[-6,2.5,3.5,8,.15,5],[-6,2.5,-3.5,8,.15,5]].forEach(function(w,i){box("wall"+i,w[0],w[1],w[2],w[3],w[4],w[5],M.wall)});
box("ceiling",0,5.2,0,20,.15,14,M.wall);
var roofSlab=box("roof",0,5.35,0,21,.35,15,M.dark);
for(var a=-3;a<=3;a++)for(var b=-1;b<=1;b++){var sp=box("solar",a*1.15,5.58,b*1.25,1.02,.08,1.05,M.solar);sp.userData.type="solar";interactables.push(sp);}
var hemi=new THREE.HemisphereLight(0xd9f2ff,0x493b2b,1.65);scene.add(hemi);
var sun=new THREE.DirectionalLight(0xfff5db,2.2);sun.position.set(-8,13,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
var sunBall=new THREE.Mesh(new THREE.SphereGeometry(1.1,16,16),M.yellow);sunBall.position.set(12,12,-10);scene.add(sunBall);

label("SALA • ENERGIA",-6.6,4.45,-5.8);label("COZINHA • ALIMENTOS • RECICLAGEM",4.8,4.45,-5.8);label("BANHEIRO • ÁGUA",-6.5,4.45,5.8);label("QUARTO • ENERGIA",.7,4.45,5.8);label("LAVANDERIA • ÁGUA + ENERGIA",7,4.45,5.8);label("GARAGEM • TRANSPORTE",-4,4.45,.8);

box("sofa",-6.8,.55,-4.7,3.2,1,1.05,M.green);box("sofaBack",-6.8,1.15,-4.25,3.2,1.3,.35,M.green);box("table",-6.8,.8,-2.6,2.3,.15,1.25,M.wood);
var tv=add(box("tv",-6.8,1.7,-6.15,2.8,1.5,.18,M.black),"tv"),tvScreen=add(box("tvScreen",-6.8,1.7,-6.27,2.35,1.05,.04,material(0x2c705d,.25)),"tv");box("tvStand",-6.8,.55,-6,3.1,.25,.65,M.wood);

box("counter",5.2,1,-6,6.8,1.4,1.2,M.white);box("counter2",8.4,1,-3.9,1.2,1.4,3.2,M.white);box("fridge",8.6,1.75,-5.8,1.15,3.5,.9,M.white);box("sink",5.4,1.72,-5.95,1.2,.12,.75,M.metal);
var foodGroup=new THREE.Group();root.add(foodGroup);[[4.2,0x9e6844],[4.8,0x7c994a],[5.9,0x98633e],[6.5,0x687d4a]].forEach(function(q){var f=cyl("food",q[0],1.78,-5.75,.18,.22,material(q[1]),foodGroup);f.rotation.z=Math.PI/2;f.userData.type="food";interactables.push(f);}); 
var water=add(cyl("water",-6.5,1.2,5.25,.06,1.7,M.water),"faucet");var sinkB=add(box("bathSink",-6.5,1,5.3,2.4,1.1,1.1,M.white),"faucet");label("TORNEIRA ABERTA",-6.5,2.55,5.25);

box("bed",1,.6,5.2,3.2,.7,5,M.white);box("mattress",1,.98,5,3,.3,4.5,M.green);
var lamp=add(box("lamp",-1.3,2.25,5,.65,.85,.65,M.yellow),"lamp"),bulb=new THREE.PointLight(0xffe8a8,2.5,5);bulb.position.set(-1.3,2.2,5);scene.add(bulb);
var computer=add(box("computer",1.2,1.5,3.2,1.3,1,.12,M.black),"computer");var monitor=box("monitorGlow",1.2,1.5,3.12,1,.62,.03,material(0x5a927b));computer.add(monitor);
add(box("charger",-1,.8,3.2,.35,.25,.45,M.white),"charger");

box("washer",7.2,1.25,4.9,1.7,2.5,1.7,M.white);box("washerDoor",7.2,1.25,4.02,1.15,.12,1.15,M.black);var clothes=add(box("clothes",7.2,2.75,4.9,1.1,.18,.7,material(0x5b7185)),"laundry");var lwater=add(cyl("laundryWater",8.7,1.25,5.3,.055,1.2,M.water),"laundryTap");add(box("laundryTap",8.7,1.8,5.3,.18,.55,.18,M.metal),"laundryTap");

var car=new THREE.Group();car.position.set(-4,0,1);root.add(car);box("carBody",0,1,0,5.2,1.1,2.5,M.red,car);box("carHood",1.8,1.45,0,1.6,.45,2.3,M.red,car);box("carCabin",-.5,1.75,0,2.2,1.1,2.15,material(0x28383b,.25),car);[-1.7,1.6].forEach(function(x){[-1.15,1.15].forEach(function(z){var w=cyl("wheel",x,.55,z,.5,.35,M.black,car,20);w.rotation.x=Math.PI/2;});});box("exhaust",2.65,.8,.7,.45,.18,.18,M.metal,car);car.userData.type="car";interactables.push(car);label("CARRO A COMBUSTÃO",-4,3.2,1);
var bike=new THREE.Group();bike.position.set(2.8,.1,-.1);root.add(bike);[-.65,.65].forEach(function(z){var w=new THREE.Mesh(new THREE.TorusGeometry(.55,.08,10,20),M.black);w.position.set(0,.7,z);w.rotation.y=Math.PI/2;bike.add(w)});box("frame",0,.85,0,1.2,.12,.12,M.green,bike);bike.userData.type="bike";interactables.push(bike);

var recycle=[["garrafa",3.7,.75,-1.2,0x6b9fbd,"plastic"],["lata",4.7,.72,-1.2,0xbfc6c8,"metal"],["papel",5.7,.73,-1.2,0xe8e1d3,"paper"],["vidro",6.7,.75,-1.2,0x80b89d,"glass"],["casca",7.7,.7,-1.2,0xd28b50,"organic"]];
recycle.forEach(function(q){var o=cyl(q[0],q[1],q[2],q[3],.22,.55,material(q[4]));o.rotation.z=Math.PI/2;o.userData={type:"recycleItem",category:q[5],name:q[0]};interactables.push(o)});
var binX={paper:4.1,plastic:5.1,glass:6.1,metal:7.1,organic:8.1};Object.keys(binX).forEach(function(k){var b=box(k,binX[k],.45,-2.3,.8,.9,M.white);b.userData={type:"bin",category:k};interactables.push(b);label(k.toUpperCase(),binX[k],.98,-2.75)});

function score(){return solved.size*10}
function updateScore(){var n=score();document.getElementById("scoreValue").textContent=n+"%";document.getElementById("progressBar").style.width=n+"%";if(n>=100)setTimeout(function(){document.getElementById("endScreen").style.display="grid"},650)}
function visual(t,on){if(t==="tv"){tvScreen.material.color.set(on?0x111715:0x2c705d)}if(t==="faucet")water.visible=!on;if(t==="lamp"){lamp.material.color.set(on?0x555b55:0xffe58e);bulb.intensity=on?0:2.5}if(t==="computer")monitor.visible=!on;if(t==="charger"){}if(t==="food")foodGroup.visible=!on;if(t==="laundry")clothes.scale.setScalar(on?1.5:1);if(t==="laundryTap")lwater.visible=!on}
function solvedIt(t){if(solved.has(t))return;solved.add(t);visual(t,true);updateScore();var m={tv:"Solução aplicada! Um consumo desnecessário foi evitado.",faucet:"Solução aplicada! A água deixou de correr sem necessidade.",food:"Solução aplicada! Planejar e armazenar corretamente ajuda a reduzir desperdícios.",lamp:"Solução aplicada! A iluminação desnecessária foi desligada.",computer:"Solução aplicada! O computador foi desligado.",charger:"Solução aplicada! O carregador foi desconectado.",laundry:"Solução aplicada! A lavagem foi otimizada.",laundryTap:"Solução aplicada! A torneira foi fechada.",transport:"Alternativa apresentada: diferentes formas de transporte têm diferentes impactos.",solar:"Você conheceu uma fonte renovável de geração de eletricidade.",recycling:"CORRETO! O resíduo foi separado na categoria adequada."};toast(m[t]||"Solução aplicada!")}
function toast(t){var x=document.getElementById("toast");x.textContent=t;x.classList.add("showToast");clearTimeout(window._tt);window._tt=setTimeout(function(){x.classList.remove("showToast")},2100)}
function closeModal(){document.getElementById("modal").classList.remove("open")}
document.getElementById("modalClose").onclick=closeModal;

function show(type,obj){
 var d={icon:"⚠️",tag:"PONTO EDUCATIVO",title:"",body:"",action:""};
 if(type==="tv"){d.tag="DESPERDÍCIO DE ENERGIA";d.title="Televisão ligada sem ninguém utilizando";d.body="<p>Manter aparelhos eletrônicos ligados sem necessidade gera consumo desnecessário de energia.</p><div class='solution'><b>SOLUÇÃO</b><br>Desligar a TV quando ninguém estiver assistindo.</div>";d.action="<button class='action' data-solve='tv'>DESLIGAR TV</button>"}
 if(type==="faucet"){d.icon="💧";d.tag="DESPERDÍCIO DE ÁGUA";d.title="Torneira aberta sem utilização";d.body="<p>Deixar a torneira aberta sem necessidade desperdiça água.</p>";d.action="<button class='action' data-solve='faucet'>FECHAR TORNEIRA</button>"}
 if(type==="food"){d.icon="🥕";d.tag="DESPERDÍCIO DE ALIMENTOS";d.title="Alimentos desperdiçados";d.body="<p>Alimentos desperdiçados representam também desperdício de água, energia, transporte, trabalho e outros recursos usados na produção.</p><div class='solution'><b>SOLUÇÃO</b><br>Planejar compras e armazenar corretamente os alimentos ajuda a reduzir desperdícios.</div>";d.action="<button class='action' data-solve='food'>ORGANIZAR ALIMENTOS</button>"}
 if(type==="lamp"){d.icon="💡";d.tag="DESPERDÍCIO DE ENERGIA";d.title="Luz acesa sem necessidade";d.body="<p>Uma lâmpada ligada em ambiente sem uso representa consumo desnecessário.</p>";d.action="<button class='action' data-solve='lamp'>APAGAR LUZ</button>"}
 if(type==="computer"){d.icon="💻";d.tag="DESPERDÍCIO DE ENERGIA";d.title="Computador ligado sem utilização";d.body="<p>Equipamentos ligados sem necessidade continuam consumindo energia.</p>";d.action="<button class='action' data-solve='computer'>DESLIGAR COMPUTADOR</button>"}
 if(type==="charger"){d.icon="🔌";d.tag="DESPERDÍCIO DE ENERGIA";d.title="Carregador conectado sem necessidade";d.body="<p>Desconectar o carregador quando ele não está sendo utilizado ajuda a evitar consumo desnecessário.</p>";d.action="<button class='action' data-solve='charger'>DESCONECTAR</button>"}
 if(type==="laundry"){d.icon="🧺";d.tag="USO INEFICIENTE";d.title="Máquina com pouca quantidade de roupas";d.body="<p>Utilizar a máquina com pouca quantidade de roupas pode aumentar a necessidade de ciclos de lavagem.</p><div class='solution'><b>SOLUÇÃO</b><br>Quando adequado, reunir roupas compatíveis e planejar a lavagem.</div>";d.action="<button class='action' data-solve='laundry'>OTIMIZAR LAVAGEM</button>"}
 if(type==="laundryTap"){d.icon="💧";d.tag="CONSUMO DE ÁGUA";d.title="Torneira da lavanderia";d.body="<p>Fechar a torneira quando ela não estiver sendo utilizada ajuda a evitar desperdício.</p>";d.action="<button class='action' data-solve='laundryTap'>FECHAR TORNEIRA</button>"}
 if(type==="car"){d.icon="🚗";d.tag="TRANSPORTE E SUSTENTABILIDADE";d.title="Problema identificado";d.body="<p>Este veículo utiliza um motor a combustão.</p><p>Veículos com motores a combustão utilizam combustíveis que liberam gases e outros poluentes durante seu funcionamento. O impacto ambiental depende do combustível, do veículo e de como ele é utilizado.</p><div class='solution'><b>POSSÍVEL SOLUÇÃO</b><br>Utilizar alternativas de menor emissão quando forem adequadas à situação, como veículos elétricos, transporte público, bicicleta, caminhada ou caronas.</div><div class='compare'><div><b>🚗 Combustão</b>Combustível → motor a combustão → gases pelo escapamento</div><div><b>⚡ Elétrico</b>Eletricidade → motor elétrico → sem gases pelo escapamento durante o uso</div></div>";d.action="<button class='action' data-solve='transport'>VER ALTERNATIVA SUSTENTÁVEL</button>"}
 if(type==="bike"){d.icon="🚲";d.tag="MOBILIDADE SUSTENTÁVEL";d.title="Bicicleta";d.body="<p>Para trajetos adequados, caminhar ou utilizar bicicleta pode reduzir o consumo de combustíveis e as emissões associadas ao transporte.</p>";d.action="<button class='secondary' onclick='document.getElementById(\"modal\").classList.remove(\"open\")'>CONTINUAR</button>"}
 if(type==="solar"){d.icon="☀️";d.tag="ENERGIA SOLAR";d.title="Energia solar";d.body="<p>Painéis solares podem transformar a energia da luz do Sol em eletricidade.</p><div class='compare'><div><b>☀️ SOL</b>luz solar</div><div><b>⬇️ PAINÉIS</b>conversão</div><div><b>⚡ ELETRICIDADE</b>energia elétrica</div><div><b>🏠 CASA</b>distribuição</div></div>";d.action="<button class='action' data-solve='solar'>MARCAR COMO CONHECIDO</button>"}
 if(type==="recycleItem"){d.icon="♻️";d.tag="RECICLAGEM";d.title="Para onde vai este objeto?";d.body="<p>Escolha a categoria correspondente a <b>"+obj.userData.name+"</b>.</p>";d.action="<div class='compare'>"+["paper","plastic","glass","metal","organic"].map(function(k){return "<button class='secondary' data-bin='"+k+"'>"+k.toUpperCase()+"</button>"}).join("")+"</div>"}
 document.getElementById("modalIcon").textContent=d.icon;document.getElementById("modalTag").textContent=d.tag;document.getElementById("modalTitle").textContent=d.title;document.getElementById("modalBody").innerHTML=d.body;document.getElementById("modalAction").innerHTML=d.action;document.getElementById("modal").classList.add("open");
 document.querySelectorAll("[data-bin]").forEach(function(b){b.onclick=function(){if(b.dataset.bin===obj.userData.category){obj.visible=false;closeModal();solvedIt("recycling")}else toast("Essa não é a categoria adequada. Tente novamente.")}});
}
document.getElementById("modalAction").addEventListener("click",function(e){var b=e.target.closest("[data-solve]");if(!b)return;var t=b.dataset.solve;if(t==="transport"){car.visible=false;var ecar=car.clone(true);ecar.position.copy(car.position);ecar.traverse(function(o){if(o.isMesh)o.material=o.material.clone();if(o.isMesh&&o.name==="carBody")o.material.color.set(0x4b9b78)});ecar.userData.type="electricCar";root.add(ecar);solvedIt("transport");b.textContent="ALTERNATIVA VISUALIZADA"}else{solvedIt(t)}closeModal()});

document.getElementById("enterBtn").onclick=function(){started=true;document.getElementById("intro").style.display="none";document.getElementById("app").style.opacity=1;toast("Explore a casa e toque nos objetos.")};
document.getElementById("againBtn").onclick=function(){reset();document.getElementById("endScreen").style.display="none"};

function panelsClose(){document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("open")})}
document.getElementById("menuBtn").onclick=function(){document.getElementById("menu").classList.toggle("open");document.getElementById("map").classList.remove("open")};
document.getElementById("mapBtn").onclick=function(){document.getElementById("map").classList.add("open");document.getElementById("menu").classList.remove("open")};
document.querySelectorAll("[data-close]").forEach(function(b){b.onclick=function(){document.getElementById(b.dataset.close).classList.remove("open")}});
var roomPos={sala:[-6.8,1.65,-4.2],cozinha:[5.3,1.65,-4.4],banheiro:[-6.5,1.65,4.1],quarto:[0,1.65,5],lavanderia:[7.1,1.65,4.1],garagem:[-4,1.65,1]};
document.querySelectorAll(".map-room").forEach(function(b){b.onclick=function(){var p=roomPos[b.dataset.room];camera.position.set(p[0],p[1],p[2]);panelsClose()}});
document.getElementById("soundBtn").onclick=function(){sound=!sound;this.textContent=sound?"🔊 SOM: ATIVADO":"🔇 SOM: DESATIVADO"};
document.getElementById("roofBtn").onclick=function(){panelsClose();roof=true;document.getElementById("roofMode").style.display="block";camera.position.set(0,10.5,13);camera.lookAt(0,5.3,0)};
document.getElementById("roofBack").onclick=function(){roof=false;document.getElementById("roofMode").style.display="none";camera.position.set(-7.8,1.65,5.4);camera.rotation.set(pitch,yaw,0)};

var joy=document.getElementById("joystick"),knob=document.getElementById("joyKnob"),joyId=null,jc={x:0,y:0};
function jstart(e){if(joyId!==null)return;var t=e.changedTouches[0],r=joy.getBoundingClientRect();joyId=t.identifier;jc={x:r.left+r.width/2,y:r.top+r.height/2};jmove(e);e.preventDefault()}
function jmove(e){for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier!==joyId)continue;var dx=t.clientX-jc.x,dy=t.clientY-jc.y,L=Math.hypot(dx,dy),max=48;if(L>max){dx=dx/L*max;dy=dy/L*max}knob.style.transform="translate("+dx+"px,"+dy+"px)";moveX=dx/max;moveZ=dy/max;e.preventDefault()}}
function jend(e){for(var i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===joyId){joyId=null;moveX=moveZ=0;knob.style.transform="translate(0,0)"}}
joy.addEventListener("touchstart",jstart,{passive:false});joy.addEventListener("touchmove",jmove,{passive:false});joy.addEventListener("touchend",jend,{passive:false});joy.addEventListener("touchcancel",jend,{passive:false});

var lookId=null,lastX=0,lastY=0,downX=0,downY=0,moved=false;
renderer.domElement.addEventListener("touchstart",function(e){if(lookId!==null)return;var t=e.changedTouches[0];lookId=t.identifier;lastX=downX=t.clientX;lastY=downY=t.clientY;moved=false},{passive:false});
renderer.domElement.addEventListener("touchmove",function(e){if(lookId===null)return;for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier!==lookId)continue;var dx=t.clientX-lastX,dy=t.clientY-lastY;if(Math.abs(t.clientX-downX)+Math.abs(t.clientY-downY)>8)moved=true;lastX=t.clientX;lastY=t.clientY;yaw-=dx*.004;pitch-=dy*.003;pitch=Math.max(-1.05,Math.min(.75,pitch));camera.rotation.set(pitch,yaw,0)}},{passive:false});
renderer.domElement.addEventListener("touchend",function(e){if(lookId===null)return;for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier===lookId){if(!moved)tap(t.clientX,t.clientY);lookId=null}}},{passive:false});

function tap(x,y){pointer.x=x/innerWidth*2-1;pointer.y=-(y/innerHeight)*2+1;ray.setFromCamera(pointer,camera);var hits=ray.intersectObjects(interactables,true);if(hits.length){var o=hits[0].object;while(o.parent&&!o.userData.type)o=o.parent;if(o.userData.type&&o.userData.type!=="solar"&&o.userData.type!=="bin")show(o.userData.type,o)}}
document.getElementById("interactBtn").onclick=function(){if(target)show(target.userData.type,target)};
function nearest(){var best=null,bd=2.5;for(var i=0;i<interactables.length;i++){var o=interactables[i];if(!o.visible||!o.userData.type||o.userData.type==="solar"||o.userData.type==="bin")continue;var p=new THREE.Vector3();o.getWorldPosition(p);var d=p.distanceTo(camera.position);if(d<bd){bd=d;best=o}}target=best;document.getElementById("interactBtn").classList.toggle("show",!!best);document.getElementById("hint").classList.toggle("show",!!best);if(best)document.getElementById("hint").textContent=best.userData.type==="recycleItem"?"TOQUE PARA SEPARAR O RESÍDUO":"TOQUE PARA INTERAGIR"}

function move(dt){var f=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),r=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),v=new THREE.Vector3().addScaledVector(r,moveX).addScaledVector(f,-moveZ);if(v.lengthSq()>1)v.normalize();var n=camera.position.clone().addScaledVector(v,3.2*dt);n.x=THREE.MathUtils.clamp(n.x,-9.2,9.2);n.z=THREE.MathUtils.clamp(n.z,-6.2,6.2);camera.position.set(n.x,1.65,n.z)}
function reset(){solved.clear();car.visible=true;root.traverse(function(o){if(o.userData&&o.userData.type==="electricCar")o.visible=false});["tv","faucet","food","lamp","computer","charger","laundry","laundryTap"].forEach(function(t){visual(t,false)});interactables.forEach(function(o){if(o.userData.type==="recycleItem")o.visible=true});updateScore()}
document.getElementById("resetBtn").onclick=function(){panelsClose();reset();toast("Casa reiniciada.")};

var stops=[{p:roomPos.sala,t:"Sala: observe a TV ligada.",type:"tv"},{p:roomPos.banheiro,t:"Banheiro: observe o desperdício de água.",type:"faucet"},{p:roomPos.cozinha,t:"Cozinha: observe os alimentos desperdiçados.",type:"food"},{p:roomPos.quarto,t:"Quarto: observe o consumo de energia.",type:"lamp"},{p:roomPos.lavanderia,t:"Lavanderia: observe a máquina.",type:"laundry"},{p:roomPos.garagem,t:"Garagem: compare formas de transporte.",type:"car"},{p:[0,10.5,13],t:"Telhado: conheça a energia solar.",type:"solar"}];
document.getElementById("demoBtn").onclick=function(){panelsClose();demo=true;demoIndex=0;demoTimer=0;document.getElementById("demoBar").style.display="flex";toast("Modo demonstração iniciado.")};
document.getElementById("demoStop").onclick=function(){demo=false;document.getElementById("demoBar").style.display="none"};
function demoRun(dt){if(!demo)return;var s=stops[demoIndex],p=new THREE.Vector3(s.p[0],s.p[1],s.p[2]);camera.position.lerp(p,Math.min(1,dt*1.7));document.getElementById("demoText").textContent=s.t;demoTimer+=dt;if(demoTimer>2.5){demoTimer=0;if(s.type==="solar"){roof=true;document.getElementById("roofMode").style.display="block";show("solar")}else{var o=interactables.find(function(x){return x.userData.type===s.type});if(o)show(s.type,o)}demoIndex=(demoIndex+1)%stops.length}} 

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5))}
addEventListener("resize",resize);addEventListener("orientationchange",function(){setTimeout(resize,200)});
reset(); loading.style.display="none"; started=false; 
function loop(){requestAnimationFrame(loop);var dt=Math.min(clock.getDelta(),.05);if(started&&!roof&&!demo)move(dt);if(started&&demo)demoRun(dt);if(started&&!roof&&!demo)nearest();renderer.render(scene,camera)}
loop();
}catch(err){
  console.error("Casa Sustentável 3D:", err);
  if(loadError){
    loadError.textContent = "Erro ao iniciar o 3D: " + (err && err.message ? err.message : err);
  }
}
})();