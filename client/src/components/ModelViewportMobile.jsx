import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { parseBBModel, applyAnimationFrame, resetPose } from '../lib/bbmodel';

/**
 * Mobile‑optimized viewport for a BBModel.
 * - Canvas fills its container (responsive width/height).
 * - Handles resize/orientation changes.
 * - Supports rotate (single‑finger drag), pinch‑to‑zoom, and wheel zoom.
 * - Automatically fits the model using its bounding box.
 * - Limits devicePixelRatio to avoid excessive load on phones.
 */
export default function ModelViewportMobile({
  bbmodel,
  textureOverrides,
  animationName,
  playing,
  animationSpeed = 1,
  wireframe = false,
  autoRotate = false,
  bgColor = null,
  ambientIntensity = 1.1,
  directionalIntensity = 1.6,
  onSelectElement,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [isPinching, setIsPinching] = useState(false);
  const pinchData = useRef({ startDist: 0, startRadius: 0 });

  // Initial scene setup
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Lights
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

    const rig = new THREE.Group();
    scene.add(rig);

    // Camera parameters – will be tuned after model load
    let radius = 5;
    let theta = Math.PI;
    let phi = 1.35;
    const targetY = 0.55;
    const positionCamera = () => {
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi) + targetY,
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, targetY, 0);
    };
    positionCamera();

    // Interaction helpers
    let dragging = false;
    let lastX = 0;
    const onDown = (e) => {
      if (e.pointerType === 'touch' && e.touches && e.touches.length === 2) {
        // pinch start – handled in separate listeners
        return;
      }
      dragging = true;
      lastX = e.clientX;
    };
    const onUp = (e) => {
      dragging = false;
    };
    const onMove = (e) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        theta -= dx * 0.008;
        positionCamera();
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.min(Math.max(radius + e.deltaY * 0.002, 1.4), 8);
      positionCamera();
    };

    // Pinch handling (touch only)
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        setIsPinching(true);
        const [p1, p2] = e.touches;
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        pinchData.current.startDist = Math.hypot(dx, dy);
        pinchData.current.startRadius = radius;
      }
    };
    const onTouchMove = (e) => {
      if (isPinching && e.touches.length === 2) {
        const [p1, p2] = e.touches;
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        const curDist = Math.hypot(dx, dy);
        const factor = pinchData.current.startDist / curDist;
        radius = Math.min(Math.max(pinchData.current.startRadius * factor, 1.4), 8);
        positionCamera();
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        setIsPinching(false);
      }
    };

    // Click handling – same as desktop version
    const raycaster = new THREE.Raycaster();
    const handleClick = (e) => {
      if (!stateRef.current.model || !onSelectElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const meshes = Object.values(stateRef.current.model.elementMeshes);
      const hits = raycaster.intersectObjects(meshes);
      onSelectElement(hits.length ? hits[0].object.userData.elementId : null);
    };

    // Register listeners
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // Animation loop
    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
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
        resetPose(s.model);
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling – uses ResizeObserver on container
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // Store references
    stateRef.current = { scene, rig, renderer, radius, theta, phi, autoRotate, playing, animationSpeed };

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // Rebuild model when source changes – same as desktop version but also fit camera
  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene || !bbmodel) return;
    if (s.model) s.rig.remove(s.model.root);
    const model = parseBBModel(bbmodel, textureOverrides, { wireframe });
    // Compute bounding box to adjust radius and position
    const box = new THREE.Box3().setFromObject(model.root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    // Set radius so model fits comfortably
    s.radius = Math.max(maxDim * 1.5, 4);
    // Center model
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.root.position.sub(center);
    s.rig.add(model.root);
    s.model = model;
    s.time = 0;
  }, [bbmodel, textureOverrides, wireframe]);

  // Prop sync effects (same as desktop)
  useEffect(() => {
    const s = stateRef.current;
    if (!s.model) return;
    s.currentAnim = s.model.animations.find((a) => a.name === animationName) || null;
    s.time = 0;
    resetPose(s.model);
  }, [animationName, bbmodel]);

  useEffect(() => {
    stateRef.current.playing = playing;
  }, [playing]);
  useEffect(() => {
    stateRef.current.animationSpeed = animationSpeed;
  }, [animationSpeed]);
  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;
    s.scene.background = bgColor ? new THREE.Color(bgColor) : null;
  }, [bgColor]);

  return <div ref={mountRef} className="model-viewport" />;
}

