/* Meny-toggle, delt av alle blogg-sider (samme oppførsel som forsiden). */
(function(){
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('scrim');
  const drawerClose = document.getElementById('drawerClose');
  function openMenu(){drawer.classList.add('open');scrim.classList.add('open');menuBtn.setAttribute('aria-expanded','true');}
  function closeMenu(){drawer.classList.remove('open');scrim.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}
  menuBtn.addEventListener('click',openMenu);
  drawerClose.addEventListener('click',closeMenu);
  scrim.addEventListener('click',closeMenu);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
})();
