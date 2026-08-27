import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { parseBBModel, applyAnimationFrame, resetPose } from '../lib/bbmodel';

export function ModelViewport({
  bbmodel,
  textureOverrides,
  animationName,
  playing,
  animationSpeed = 1,
  wireframe = false,
  grid = false,
  helpers = false,
  autoRotate = false,
  bgColor = null, // null = transparent
  ambientIntensity = 1.1,
  directionalIntensity = 1.6,
  onSelectElement,
}) {

  const mountRef = useRef(null);
  const stateRef = useRef({});

  // One-time scene setup.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
    ambient.name = 'ambient-light';
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    key.name = 'key-light';
    key.position.set(2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, directionalIntensity * 0.35);
    rim.name = 'rim-light';
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    const gridHelper = new THREE.GridHelper(6, 24, 0x64748b, 0x334155);
    gridHelper.visible = grid;
    gridHelper.name = 'grid-helper';
    scene.add(gridHelper);

    const rig = new THREE.Group();
    scene.add(rig);

    let radius = 6.2;
    let theta = Math.PI;
    let phi = 1.35;
    const targetY = 0.55;

    function positionCamera() {
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi) + targetY,
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, targetY, 0);
    }
    positionCamera();

    let dragging = false;
    let lastX = 0, lastY = 0;
    const onDown = (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onUp = (e) => {
      const moved = Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      dragging = false;
      if (moved < 4) handleClick(e);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      theta -= dx * 0.008;
      positionCamera();
    };
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.min(Math.max(radius + e.deltaY * 0.002, 1.4), 8);
      positionCamera();
    };
    const raycaster = new THREE.Raycaster();
    function handleClick(e) {
      const s = stateRef.current;
      if (!s.model || !s.onSelectElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const meshes = Object.values(s.model.elementMeshes);
      const hits = raycaster.intersectObjects(meshes);
      s.onSelectElement(hits.length ? hits[0].object.userData.elementId : null);
    }
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    let frameId;
    const clock = new THREE.Clock();
    function animate() {
      frameId = requestAnimationFrame(animate);
      const s = stateRef.current;
      const dt = clock.getDelta();
      if (s.autoRotate && s.rig) s.rig.rotation.y += dt * 0.6;
      if (s.playing && s.model && s.currentAnim) {
        s.time = (s.time || 0) + dt * (s.animationSpeed ?? 1);
        const len = s.currentAnim.length || 1;
        const t = s.currentAnim.loop === 'once' ? Math.min(s.time, len) : s.time % len;
        applyAnimationFrame(s.model, s.currentAnim, t);
      } else if (s.model) {
        // Not playing (paused, no animation selected, or a finished 'once'
        // clip): guarantee the exact Blockbench bind pose instead of
        // freezing on the last animated frame.
        resetPose(s.model);
      }
      renderer.render(scene, camera);
    }
    animate();

    function resize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    stateRef.current.scene = scene;
    stateRef.current.rig = rig;
    stateRef.current.renderer = renderer;
    stateRef.current.time = 0;

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild the model whenever the bbmodel, texture overrides, or wireframe change.
  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene || !bbmodel) return;

    if (s.model) s.rig.remove(s.model.root);
    const model = parseBBModel(bbmodel, textureOverrides, { wireframe });

    // Debug: check if groups are properly in bonesByKey
    console.log('Parsed model bonesByKey keys:', Object.keys(model.bonesByKey).filter(k => k.includes('group')));
    console.log('Model animations:', model.animations.map(a => a.name));
    if (model.bonesByKey.group) {
      console.log('group bone visible:', model.bonesByKey.group.visible);
      console.log('group bone scale:', model.bonesByKey.group.scale);
      console.log('group bone children:', model.bonesByKey.group.children.length);
    }

    const box = new THREE.Box3().setFromObject(model.root);
    const center = new THREE.Vector3();
    const height = box.max.y - box.min.y;
    box.getCenter(center);
    model.root.position.x -= center.x;
    model.root.position.z -= center.z;
    model.root.position.y -= box.min.y;
    model.root.position.y -= height * 0.2;

    const shadowRadius = Math.max((box.max.x - box.min.x) * 0.52, (box.max.z - box.min.z) * 0.52, 0.38);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(shadowRadius, 18),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    shadow.renderOrder = 1;
    model.root.add(shadow);

    s.rig.add(model.root);
    s.model = model;
    s.time = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bbmodel, textureOverrides, wireframe]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.model) return;
    s.currentAnim = s.model.animations.find((a) => a.name === animationName) || null;
    s.time = 0;
    // Switching/clearing an animation must not leave bones stranded in the
    // previous clip's pose — snap back to the bind pose immediately.
    resetPose(s.model);
  }, [animationName, bbmodel]);

  useEffect(() => { stateRef.current.playing = playing; }, [playing]);
  useEffect(() => { stateRef.current.animationSpeed = animationSpeed; }, [animationSpeed]);
  useEffect(() => { stateRef.current.autoRotate = autoRotate; }, [autoRotate]);
  useEffect(() => { stateRef.current.onSelectElement = onSelectElement; }, [onSelectElement]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;
    s.scene.background = bgColor ? new THREE.Color(bgColor) : null;
  }, [bgColor]);

  useEffect(() => {
    const s = stateRef.current;
    const g = s.scene?.getObjectByName('grid-helper');
    if (g) g.visible = grid;
  }, [grid]);

  useEffect(() => {
    const s = stateRef.current;
    const ambient = s.scene?.getObjectByName('ambient-light');
    if (ambient) ambient.intensity = ambientIntensity;
    const dir1 = s.scene?.getObjectByName('key-light');
    if (dir1) dir1.intensity = directionalIntensity;
    const dir2 = s.scene?.getObjectByName('rim-light');
    if (dir2) dir2.intensity = directionalIntensity * 0.35;
  }, [ambientIntensity, directionalIntensity]);

  // `helpers` (pivot markers) are cheap enough to just toggle by re-adding
  // small sphere markers at each bone's world position on demand.
  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;
    let group = s.scene.getObjectByName('pivot-helpers');
    if (group) {
      s.scene.remove(group);
      group.traverse((o) => o.geometry?.dispose?.());
    }
    if (!helpers || !s.model) return;
    group = new THREE.Group();
    group.name = 'pivot-helpers';
    const geo = new THREE.SphereGeometry(0.02, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false });
    Object.values(s.model.bonesByKey).forEach((bone) => {
      const worldPos = new THREE.Vector3();
      bone.getWorldPosition(worldPos);
      const marker = new THREE.Mesh(geo, mat);
      marker.position.copy(worldPos);
      group.add(marker);
    });
    s.scene.add(group);
  }, [helpers, bbmodel, textureOverrides]);

  return <div ref={mountRef} className="model-viewport" />;
}