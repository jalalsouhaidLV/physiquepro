// EXEMPLE HISTORIQUE : ce test vérifie un ancien avertissement d'inactivité (#inactAvert) avec déconnexion automatique,
// refusé par Jalal. Le site actuel ne le contient plus : ne pas s'attendre à ce que ce test passe. À garder seulement comme modèle.
const { chromium } = require('playwright'); const fs=require('fs');
const page=async(b,stubFile,override,hash,w=1366)=>{ const pg=await b.newPage({viewport:{width:w,height:820}}); const errs=[];pg.on('pageerror',e=>errs.push(e.message)); const nav=[];
 const body=fs.readFileSync(stubFile,'utf8').replace("rpc:async n=>", `rpc:async (n,a)=>{ const o=(${override})(n,a); if(o) return o; return (${'__orig'})(n,a); }, __x:async n=>`).replace("__orig","async (n)=>this&&0");
 return {pg,errs,nav}; };
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const mk=async(stub,ov,hash,pre)=>{ const pg=await b.newPage({viewport:{width:1366,height:820}}); const errs=[],nav=[]; pg.on('pageerror',e=>errs.push(e.message));
  let src=fs.readFileSync(stub,'utf8'); src=src.replace("rpc:async n=>", "rpc:async function(n,a){ window.__rpc=(window.__rpc||[]).concat([[n,a]]); const o=("+ov+")(n,a); if(o!==undefined) return o; return this.__o(n,a); }, __o:async n=>");
  await pg.route('**/*',r=>{const u=r.request().url(); if(u.includes('login.microsoftonline')){nav.push('MSLOGOUT');return r.fulfill({body:'<html>ms</html>',contentType:'text/html'});} if(u.includes('/site/index.html'))return r.fulfill({body:fs.readFileSync('/home/claude/github/site/index.html','utf8').replace(/ integrity="[^"]*"/g,''),contentType:'text/html'}); if(u.startsWith('file:'))return r.continue(); if(u.includes('cdn.jsdelivr'))return r.fulfill({body:src,contentType:'application/javascript'}); return r.fulfill({body:'',status:404});});
  if(pre) await pg.addInitScript(pre);
  await pg.goto('file:///home/claude/github/site/index.html'+hash); return {pg,errs,nav}; };
 // 1) élève au lycée, limite 70 s : avertissement puis "je suis là"
 let {pg,errs,nav}=await mk('W_stubE.js',"(n)=> n==='pp_presence2'?{data:{kick:false,lycee:true,limite:70},error:null}:undefined",'#/');
 await pg.waitForTimeout(16000); console.log('avert affiché ?', !!(await pg.$('#inactAvert')), await pg.$eval('#inactN',x=>x.innerText).catch(()=>'-'));
 await pg.screenshot({path:'shots/inact.png'});
 await pg.click('#inactOk'); await pg.waitForTimeout(1000); console.log('après je suis là :', !!(await pg.$('#inactAvert')));
 await pg.waitForTimeout(62000); console.log('re-avert ?', !!(await pg.$('#inactAvert'))); await pg.waitForTimeout(12000); console.log('logout MS ?', nav, errs); await pg.close();
 // 2) Chrome rouvert 2 h après au lycée
 ({pg,errs,nav}=await mk('W_stubE.js',"(n)=> n==='pp_presence2'?{data:{kick:false,lycee:true,limite:900},error:null}:undefined",'#/',"try{localStorage.setItem('pp_act_s', String(Date.now()-7200e3))}catch(e){}"));
 await pg.waitForTimeout(4000); console.log('réouverture -> logout ?', nav, (await pg.evaluate(()=>(window.__rpc||[]).map(x=>x[0]).join(','))), errs); await pg.close();
 // 3) à la maison : pas de limite
 ({pg,errs,nav}=await mk('W_stubE.js',"(n)=> n==='pp_presence2'?{data:{kick:false,lycee:false,limite:null},error:null}:undefined",'#/',"try{localStorage.setItem('pp_act_s', String(Date.now()-7200e3))}catch(e){}"));
 await pg.waitForTimeout(4000); console.log('maison -> logout ?', nav, !!(await pg.$('#inactAvert')), errs); await pg.close();
 // 4) prof : panneau
 ({pg,errs,nav}=await mk('W_stub2.js',`(n)=> n==='pp_sessions'?{data:[{id:'a',appareil:'Windows · Chrome',debut:new Date(Date.now()-3e6).toISOString(),vu_le:new Date().toISOString(),actif_le:new Date().toISOString(),visible:true,lycee:true,statut:'actif',en_ligne:true,role:'eleve',email:'lv.sara.k@x',nom:'Sara K',classes:'SNT'},{id:'b',appareil:'Android · Chrome',debut:new Date(Date.now()-5e6).toISOString(),vu_le:new Date(Date.now()-6e5).toISOString(),actif_le:new Date(Date.now()-9e5).toISOString(),visible:false,lycee:false,statut:'inactif',role:'eleve',email:'lv.ali.m@x',nom:'Ali M',classes:'Tle'},{id:'c',appareil:'Windows · Edge',debut:new Date(Date.now()-9e6).toISOString(),vu_le:new Date(Date.now()-3e6).toISOString(),actif_le:new Date(Date.now()-4e6).toISOString(),visible:false,lycee:true,statut:'expiree',role:'eleve',email:'lv.nour.h@x',nom:'Nour H',classes:'1re'}],error:null}: n==='pp_reseau_lycee'?{data:{ici:false,nb:0,detecte:true},error:null}: n==='pp_stats_visites'?{data:{comptes:3,visites:9,aujourdhui:3,enligne:1,inactifs:1},error:null}: n==='pp_presence2'?{data:{kick:false,lycee:false},error:null}:undefined`,'#/'));
 await pg.waitForTimeout(2500); console.log('compteur', await pg.$eval('.compteur',x=>x.innerText.replace(/\n/g,' ')).catch(e=>'?'));
 await pg.click('[data-act="enligne"]'); await pg.waitForTimeout(1200); await pg.screenshot({path:'shots/sesp.png'}); console.log(errs); await pg.close();
 await b.close();})();
