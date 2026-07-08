import * as THREE from 'three';

(function() {
  'use strict';

  const container = document.getElementById('hero-3d-container');
  if (!container) return;

  const isMobile = window.innerWidth < 768;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scene, camera, renderer;
  let bowl, particles = [];
  let mouseX = 0, mouseY = 0;
  let animationId;

  function init() {
    try {
      scene = new THREE.Scene();

      const w = container.clientWidth;
      const h = container.clientHeight;

      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, isMobile ? 1.5 : 2, isMobile ? 5 : 6);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance'
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      createLighting();
      createBowl();
      if (!prefersReduced) {
        createParticles();
      }

      if (!prefersReduced) {
        container.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', onResize);
        animate();
      } else {
        renderer.render(scene, camera);
      }
    } catch (e) {
      console.warn('3D init failed, showing fallback', e);
      container.innerHTML = '<div class="hero-fallback"><div class="hero-fallback-bowl">🧆</div><p class="hero-fallback-text">TipTop Namkeen</p></div>';
    }
  }

  function createLighting() {
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.5);
    scene.add(ambient);
    const main = new THREE.DirectionalLight(0xffeedd, 1.2);
    main.position.set(2, 4, 3);
    scene.add(main);
    const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
    fill.position.set(-2, 1, -2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffaa66, 0.6);
    rim.position.set(-1, 0.5, 4);
    scene.add(rim);
    const point = new THREE.PointLight(0xff7744, 0.4, 10);
    point.position.set(0, 3, 2);
    scene.add(point);
  }

  function createBowl() {
    const geo = new THREE.TorusKnotGeometry(1.2, 0.45, isMobile ? 64 : 100, isMobile ? 16 : 20);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xff5227,
      metalness: 0.1,
      roughness: 0.3,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      emissive: 0xff5227,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.92,
    });
    bowl = new THREE.Mesh(geo, mat);
    bowl.position.y = 0.2;
    scene.add(bowl);
    const ringGeo = new THREE.TorusGeometry(1.4, 0.06, 16, 48);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0x3d280d,
      metalness: 0.5,
      roughness: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.1;
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
  }

  function createParticles() {
    const colors = [0xff5227, 0xf5a623, 0x2ecc71, 0x3d280d, 0xff7a55, 0xfefaef];
    const geos = [
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.TorusGeometry(0.06, 0.03, 6, 8),
      new THREE.OctahedronGeometry(0.07),
    ];
    for (let i = 0; i < (isMobile ? 30 : 60); i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const geo = geos[Math.floor(Math.random() * geos.length)];
      const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, metalness: 0.1 });
      const mesh = new THREE.Mesh(geo, mat);
      const radius = 1.6 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;
      mesh.position.set(
        Math.cos(theta) * Math.cos(phi) * radius,
        Math.sin(phi) * radius + 0.3,
        Math.sin(theta) * Math.cos(phi) * radius
      );
      mesh.userData = {
        speed: 0.1 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
        radius, theta, phi,
      };
      scene.add(mesh);
      particles.push(mesh);
    }
  }

  function onMouseMove(e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX = (x - 0.5) * 2;
    mouseY = (y - 0.5) * 2;
  }

  function onResize() {
    if (!container || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (bowl) {
      bowl.rotation.x += 0.003;
      bowl.rotation.y += 0.005;
      bowl.rotation.x += mouseY * 0.01;
      bowl.rotation.y += mouseX * 0.015;
    }
    const time = Date.now() * 0.001;
    for (const p of particles) {
      const ud = p.userData;
      ud.theta += ud.speed * 0.005;
      ud.phi = Math.sin(time * ud.speed * 0.3 + ud.offset) * 0.4;
      const r = ud.radius;
      p.position.x = Math.cos(ud.theta) * Math.cos(ud.phi) * r;
      p.position.y = Math.sin(ud.phi) * r + 0.3 + Math.sin(time * ud.speed + ud.offset) * 0.1;
      p.position.z = Math.sin(ud.theta) * Math.cos(ud.phi) * r;
      p.rotation.x += 0.01;
      p.rotation.y += 0.02;
    }
    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
