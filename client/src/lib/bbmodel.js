import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────
// Blockbench .bbmodel parsing + three.js building
//
// A .bbmodel is JSON: { resolution, elements[], outliner[], textures[], animations[] }
//   - elements: cuboids with from/to/origin/rotation + per-face UV rects
//   - outliner: the bone hierarchy (nested groups referencing element uuids)
//   - animations: keyframed animators per bone (position/rotation/scale)
//
// ── Blockbench ↔ three.js coordinate semantics ───────────────────────────
// Both systems are right-handed and Y-up, so axes map 1:1 — there is NO
// axis flip anywhere. The only conversions are:
//   • units:  1 Blockbench pixel = 1/16 block = UNIT three.js units
//   • angles: Blockbench stores degrees, three.js wants radians
//
// Origins and the bone hierarchy (this is what the old code got wrong):
//   • Every `origin` in the file — group pivots AND per-cube pivots — is an
//     ABSOLUTE BIND-POSE coordinate: where the pivot sits when every
//     rotation in the file is zero.
//   • Rest `rotation` values are LIVE hierarchical offsets. Rotating a bone
//     in Blockbench carries all descendants around the bone's pivot; the
//     DESCENDANTS' stored origins do not change. (Zero every rotation in
//     Blockbench and every pivot returns exactly to its authored origin.)
//   • Therefore a child bone's local position inside its parent is the RAW
//     delta, with no rotation compensation whatsoever:
//         localPosition = childOrigin − parentOrigin
//     The previous revision "corrected" the delta into the parent's rotated
//     frame via `delta.applyQuaternion(parentWorldQuat.invert())`. That is
//     only valid if origins were world-baked — they are not — so every
//     descendant of a bone with a non-zero rest rotation was displaced:
//     splayed hip rests pulled the legs together, a pitched spine slid the
//     head backwards, etc.
//   • Root bones simply hang off the model root, whose origin is [0,0,0].
//
// Cubes:
//   • `from`/`to` are absolute bind-pose corners. A cube hangs off its bone
//     at (cubeCenter − boneOrigin) so the bone's rest rotation swings it
//     around the bone pivot exactly like Blockbench.
//   • A cube may ALSO carry its own `origin` + `rotation` (a personal pivot
//     + spin inside the bone's frame). We nest one extra group:
//        bone ─ cubePivot(cube.origin − bone.origin, rot = cube.rotation) ─ mesh(center − cube.origin)
//     The old code ignored cube rotation entirely, so any cube rotated in
//     Blockbench rendered frozen in its bind orientation.
//
// Base pose & animation:
//   • Every bone captures basePosition / baseQuaternion / baseScale at
//     build time. Animation channels are OFFSETS layered on top of that
//     base (see applyAnimationFrame), and resetPose() restores the exact
//     Blockbench bind pose at any time.
// ─────────────────────────────────────────────────────────────────────────

const UNIT = 1 / 16; // 1 Minecraft "pixel" = 1/16 block = one three.js unit
const DEG = THREE.MathUtils.degToRad;

function faceUVCorners(rect, resW, resH, rotation = 0) {
  // rect = [x1, y1, x2, y2] in texture-pixel space, y grows downward.
  // Returns 4 corner UVs in the order three.js BoxGeometry expects per face:
  // [top-left, top-right, bottom-left, bottom-right] (v=1 at top).
  const [x1, y1, x2, y2] = rect;
  const u1 = x1 / resW, u2 = x2 / resW;
  const v1 = 1 - y1 / resH, v2 = 1 - y2 / resH; // flip: image y is top-down
  let corners = [[u1, v1], [u2, v1], [u1, v2], [u2, v2]];
  const steps = (((rotation % 360) + 360) % 360) / 90;
  for (let i = 0; i < steps; i++) {
    corners = [corners[2], corners[0], corners[3], corners[1]];
  }
  return corners;
}

const FACE_VERT_RANGES = { east: 0, west: 4, up: 8, down: 12, south: 16, north: 20 };
const FACE_NAMES = ['east', 'west', 'up', 'down', 'south', 'north'];

// Classic Minecraft "single uv_offset" box unwrap, used as a fallback when an
// element has no per-face `faces` data (older/simplified bbmodel exports).
function standardBoxFaces(size, uvOffset) {
  const [dx, dy, dz] = size;
  const [u, v] = uvOffset;
  const rect = (x, y, w, h) => [x, y, x + w, y + h];
  return {
    down: { uv: rect(u + dz, v, dx, dz) },
    up: { uv: rect(u + dz + dx, v, dx, dz) },
    west: { uv: rect(u, v + dz, dz, dy) },
    north: { uv: rect(u + dz, v + dz, dx, dy) },
    east: { uv: rect(u + dz + dx, v + dz, dz, dy) },
    south: { uv: rect(u + dz + dx + dz, v + dz, dx, dy) },
  };
}

// ── Texture resolution ──────────────────────────────────────────────────
//
// Real-world .bbmodel files vary a lot in how `face.texture` references a
// slot in `model.textures[]`: by uuid, by string `id`, or as a bare array
// index. We resolve as leniently as possible so faces render with *something*
// rather than silently staying blank.
export function resolveTextureKey(model, face, overridesByKey) {
  const textures = model.textures || [];
  const raw = face.texture;
  if (raw === null || raw === undefined) return pickFallbackKey(textures, overridesByKey);

  const key = String(raw);
  let meta = textures.find((t) => t.uuid === key || String(t.id) === key || t.name === key);
  if (!meta && Number.isInteger(raw) && textures[raw]) meta = textures[raw];
  if (!meta && /^\d+$/.test(key) && textures[Number(key)]) meta = textures[Number(key)];

  if (meta) {
    const found = overridesByKey[meta.uuid] ?? overridesByKey[meta.name] ?? overridesByKey[String(meta.id)];
    if (found) return found;
  }
  return pickFallbackKey(textures, overridesByKey);
}

function pickFallbackKey(textures, overridesByKey) {
  const values = Object.values(overridesByKey);
  if (values.length === 1) return values[0]; // only one uploaded texture -> use it everywhere
  if (textures.length === 1) {
    const only = textures[0];
    return overridesByKey[only.uuid] ?? overridesByKey[only.name] ?? overridesByKey[String(only.id)] ?? null;
  }
  return values[0] || null;
}

function buildMaterial(textureKeyToTexture, key, wireframe) {
  const map = key ? textureKeyToTexture[key] : null;
  return new THREE.MeshStandardMaterial({
    map: map || null,
    color: map ? 0xffffff : 0x8a97ad,
    roughness: 0.75,
    metalness: 0.05,
    transparent: true,
    alphaTest: map ? 0.1 : 0,
    wireframe,
    side: THREE.FrontSide,
  });
}

function cubeCenter(el) {
  const f = el.from || [0, 0, 0];
  const t = el.to || f;
  return [(f[0] + t[0]) / 2, (f[1] + t[1]) / 2, (f[2] + t[2]) / 2];
}

function buildCubeMesh(el, resolution, model, overridesByKey, textureKeyToTexture, wireframe) {
  const from = el.from || [0, 0, 0];
  const to = el.to || from;
  const size = [
    Math.max(to[0] - from[0], 0.001),
    Math.max(to[1] - from[1], 0.001),
    Math.max(to[2] - from[2], 0.001),
  ];
  const inflate = el.inflate || 0;

  const geo = new THREE.BoxGeometry(
    (size[0] + inflate * 2) * UNIT,
    (size[1] + inflate * 2) * UNIT,
    (size[2] + inflate * 2) * UNIT
  );

  const faces = el.faces && Object.keys(el.faces).length ? el.faces : standardBoxFaces(size, el.uv_offset || [0, 0]);
  const uvAttr = geo.attributes.uv;

  // Per-face materials (BoxGeometry group order matches FACE_NAMES).
  const materials = FACE_NAMES.map((faceName) => {
    const face = faces[faceName];
    if (!face) return buildMaterial(textureKeyToTexture, null, wireframe);
    const key = resolveTextureKey(model, face, overridesByKey);
    return buildMaterial(textureKeyToTexture, key, wireframe);
  });

  FACE_NAMES.forEach((faceName, fIdx) => {
    const face = faces[faceName];
    if (!face || !face.uv) return;
    const corners = faceUVCorners(face.uv, resolution.width, resolution.height, face.rotation || 0);
    const startVert = FACE_VERT_RANGES[faceName];
    corners.forEach(([u, v], i) => uvAttr.setXY(startVert + i, u, v));
  });
  uvAttr.needsUpdate = true;

  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // The mesh is centered on the cube's center and offset by the cube's own
  // pivot (`origin`). Fall back to the CENTER — never `from` — when a
  // hand-edited file omits `origin`, otherwise the cube shifts by half its
  // own size relative to its bone.
  const center = cubeCenter(el);
  const origin = el.origin || center;
  mesh.position.set(
    (center[0] - origin[0]) * UNIT,
    (center[1] - origin[1]) * UNIT,
    (center[2] - origin[2]) * UNIT
  );
  mesh.userData = { elementId: el.uuid, name: el.name };
  return mesh;
}

function textureMetaForFace(model, face) {
  const textures = model.textures || [];
  const raw = face.texture;
  if (raw === null || raw === undefined) return null;
  const key = String(raw);
  return textures.find((texture) => texture.uuid === key || String(texture.id) === key || texture.name === key)
    || (Number.isInteger(raw) ? textures[raw] : null)
    || (/^\d+$/.test(key) ? textures[Number(key)] : null)
    || null;
}

function buildMeshMesh(el, resolution, model, overridesByKey, textureKeyToTexture, wireframe) {
  const vertices = el.vertices || {};
  const faces = Object.values(el.faces || {});
  const positions = [];
  const uvs = [];
  const materials = [];
  const geometry = new THREE.BufferGeometry();
  const origin = el.origin || [0, 0, 0];

  faces.forEach((face) => {
    const faceVertices = face.vertices || [];
    if (faceVertices.length < 3) return;

    const texture = textureMetaForFace(model, face);
    const textureWidth = texture?.uv_width || texture?.width || resolution.width;
    const textureHeight = texture?.uv_height || texture?.height || resolution.height;
    const materialKey = resolveTextureKey(model, face, overridesByKey);
    materials.push(buildMaterial(textureKeyToTexture, materialKey, wireframe));
    const materialIndex = materials.length - 1;
    for (let i = 1; i < faceVertices.length - 1; i++) {
      const triangle = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];
      const triangleStart = positions.length / 3;
      triangle.forEach((vertexId) => {
        const vertex = vertices[vertexId] || [0, 0, 0];
        positions.push(
          (vertex[0] - origin[0]) * UNIT,
          (vertex[1] - origin[1]) * UNIT,
          (vertex[2] - origin[2]) * UNIT
        );
        const uv = face.uv?.[vertexId] || [0, 0];
        uvs.push(uv[0] / textureWidth, 1 - uv[1] / textureHeight);
      });
      geometry.addGroup(triangleStart, 3, materialIndex);
    }
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { elementId: el.uuid, name: el.name };
  return mesh;
}

function buildElementMesh(el, resolution, model, overridesByKey, textureKeyToTexture, wireframe) {
  return el.type === 'mesh'
    ? buildMeshMesh(el, resolution, model, overridesByKey, textureKeyToTexture, wireframe)
    : buildCubeMesh(el, resolution, model, overridesByKey, textureKeyToTexture, wireframe);
}

// ── Node/bone construction helpers ──────────────────────────────────────

function eulerFromDegrees(r) {
  // Blockbench group/cube rotations are XYZ-order Euler angles in degrees
  // (Blockbench itself is three.js-based and uses the same default order).
  return new THREE.Euler(DEG(r[0] || 0), DEG(r[1] || 0), DEG(r[2] || 0), 'XYZ');
}

// Capture the bind pose so animations can layer on top of it and so the
// model can always be returned to the exact Blockbench rest pose.
function captureBasePose(bone) {
  bone.userData.basePosition = bone.position.clone();
  bone.userData.baseQuaternion = bone.quaternion.clone();
  bone.userData.baseScale = bone.scale.clone();
}

// A cube that lives INSIDE a group: carried by the bone, with its own
// optional pivot (origin + rotation) nested between the bone and the mesh.
// Composition: boneWorld ∘ T(cube.origin − bone.origin) ∘ R(cube.rotation) ∘ T(center − cube.origin)
// — exactly how Blockbench renders a rotated cube inside a rotated bone.
function attachElement(el, host, hostOrigin, ctx) {
    const mesh = buildElementMesh(
        el,
        ctx.resolution,
        ctx.model,
        ctx.overridesByKey,
        ctx.textureKeyToTexture,
        ctx.wireframe
    );

    const pivotOrigin = el.origin || cubeCenter(el);
    const rotation = el.rotation || [0, 0, 0];

    const pivot = new THREE.Group();
    pivot.name = (el.name || 'element') + '_pivot';

    // Позиція pivot відносно кістки
    pivot.position.set(
        (pivotOrigin[0] - hostOrigin[0]) * UNIT,
        (pivotOrigin[1] - hostOrigin[1]) * UNIT,
        (pivotOrigin[2] - hostOrigin[2]) * UNIT
    );

    // Власний rotation елемента
    pivot.quaternion.setFromEuler(
        eulerFromDegrees(rotation)
    );

    // Геометрія відносно власного pivot
    const center = cubeCenter(el);

    mesh.position.set(
        (center[0] - pivotOrigin[0]) * UNIT,
        (center[1] - pivotOrigin[1]) * UNIT,
        (center[2] - pivotOrigin[2]) * UNIT
    );

    pivot.add(mesh);

    // ВАЖЛИВО:
    // додаємо pivot саме до відповідної кістки
    host.add(pivot);

  ctx.elementMeshes[el.uuid] = mesh;
  console.log(
    'ATTACH:',
    el.name,
    '→',
    host.name,
    'hostOrigin:',
    hostOrigin
);
}
// A bare element sitting directly in the outliner (no parent group). It acts
// as its own little bone so it can still be animated and hit-tested.
function addElementAsBone(el, parent, parentOrigin, ctx) {
  const origin = el.origin || cubeCenter(el);
  const pivot = new THREE.Group();
  pivot.name = el.name || 'element';
  // RAW bind-pose delta from the parent pivot — no rotation compensation.
  pivot.position.set(
    (origin[0] - parentOrigin[0]) * UNIT,
    (origin[1] - parentOrigin[1]) * UNIT,
    (origin[2] - parentOrigin[2]) * UNIT
  );
  pivot.quaternion.setFromEuler(eulerFromDegrees(el.rotation || [0, 0, 0]));
  captureBasePose(pivot);

  const mesh = buildElementMesh(el, ctx.resolution, ctx.model, ctx.overridesByKey, ctx.textureKeyToTexture, ctx.wireframe);
  pivot.add(mesh);
  parent.add(pivot);

  ctx.bonesByKey[el.uuid] = pivot;
  if (el.name) ctx.bonesByKey[el.name] = pivot;
  ctx.elementMeshes[el.uuid] = mesh;
}

// Recursively builds the outliner tree into a THREE.Group hierarchy.
function buildOutliner(nodes, ctx, groupsByUuid) {
  const root = new THREE.Group();
  root.name = '__root__';
  root.userData.isModelRoot = true;

  function addNode(node, parent, parentOrigin) {
    // Outliner leaf: an element uuid string.
    if (typeof node === 'string') {
      const el = ctx.elementsByUuid[node];
      if (!el) return;
      if (parent.userData.isModelRoot) addElementAsBone(el, parent, parentOrigin, ctx);
      else attachElement(el, parent, parentOrigin, ctx);
      return;
    }

    // Blockbench has shipped two outliner shapes over the years:
    //   (a) "classic": the node itself carries {name, origin, rotation, uuid, children}
    //   (b) "newer": nodes are just {uuid, children}; name/origin/rotation
    //       live in a top-level `groups` array keyed by uuid.
    // Inline fields win; otherwise fall back to the `groups` table. Skipping
    // this lookup silently defaults every group's pivot to [0,0,0], which
    // collapses whole limbs onto the model origin.
    const meta = groupsByUuid[node.uuid] || {};
    const name = node.name || meta.name || node.uuid || 'group';
    const origin = node.origin || meta.origin || [0, 0, 0];
    const rotation = node.rotation || meta.rotation || [0, 0, 0];

    const group = new THREE.Group();
    group.name = name;

    // RAW bind-pose delta — see the header comment. Deliberately NO
    // inverse-rotation compensation: Blockbench rest rotations are live
    // hierarchical offsets and descendants' origins are not world-baked.
    group.position.set(
      (origin[0] - parentOrigin[0]) * UNIT,
      (origin[1] - parentOrigin[1]) * UNIT,
      (origin[2] - parentOrigin[2]) * UNIT
    );
    group.quaternion.setFromEuler(eulerFromDegrees(rotation));
    captureBasePose(group);

    parent.add(group);
    ctx.bonesByKey[node.uuid] = group;
    ctx.bonesByKey[name] = group;

    (node.children || []).forEach((child) => addNode(child, group, origin));
  }

  const zeroOrigin = [0, 0, 0];
  (nodes || []).forEach((node) => addNode(node, root, zeroOrigin));
  return root;
}

export function parseBBModel(json, overrides, { wireframe = false } = {}) {
  const resolution = json.resolution || { width: 64, height: 64 };
  const elementsByUuid = {};
  (json.elements || []).forEach((el) => (elementsByUuid[el.uuid] = el));
  const groupsByUuid = {};
  (json.groups || []).forEach((g) => (groupsByUuid[g.uuid] = g));

  const overridesByKey = overrides || {};
  const textureKeyToTexture = {};
  Object.values(overridesByKey).forEach((dataUrl) => {
    if (!dataUrl) return;
    textureKeyToTexture[dataUrl] = textureKeyToTexture[dataUrl] || loadTextureSync(dataUrl);
  });
  // overridesByKey maps texture-slot-key -> dataUrl; resolveTextureKey returns
  // a dataUrl, which we then look up in textureKeyToTexture for the actual
  // THREE.Texture instance (dataUrl doubles as the cache key).

  const bonesByKey = {};
  const elementMeshes = {};
  const ctx = {
    resolution,
    model: json,
    overridesByKey,
    textureKeyToTexture,
    wireframe,
    bonesByKey,
    elementMeshes,
    elementsByUuid,
  };

  const root = buildOutliner(json.outliner, ctx, groupsByUuid);

  // Loose elements not referenced anywhere in the outliner (rare, but seen
  // in hand-edited files) — attach them at the root so nothing goes missing.
  const referenced = new Set();
  const mark = (node) => {
    if (typeof node === 'string') referenced.add(node);
    else (node.children || []).forEach(mark);
  };
  (json.outliner || []).forEach(mark);
  (json.elements || []).forEach((el) => {
    if (!referenced.has(el.uuid)) addElementAsBone(el, root, [0, 0, 0], ctx);
  });

  const animations = (json.animations || []).map((anim) => ({
    name: anim.name,
    loop: anim.loop === true ? 'loop' : anim.loop || 'loop',
    length: anim.length || 1,
    animators: Object.entries(anim.animators || {}).map(([key, a]) => ({
      key,
      name: a.name,
      keyframes: (a.keyframes || []).map((kf) => ({
        channel: kf.channel,
        time: kf.time || 0,
        interpolation: kf.interpolation || 'linear',
        value:
          (kf.data_points && kf.data_points[0]) ||
          (Array.isArray(kf.values) && kf.values[0]) || // legacy files
          { x: 0, y: 0, z: 0 },
      })),
    })),
  }));

  // Debug: log group information
  const groupNames = ['group', 'group2', 'group3'];
  groupNames.forEach(name => {
    const bone = bonesByKey[name];
    if (bone) {
      console.log(`✓ Found bone '${name}':`, {
        position: bone.position,
        scale: bone.scale,
        hasBasePosition: !!bone.userData?.basePosition,
        baseScale: bone.userData?.baseScale,
      });
    } else {
      console.warn(`✗ Bone '${name}' NOT found in bonesByKey`);
    }
  });

  return { root, bonesByKey, elementMeshes, animations, textures: json.textures || [] };
}

// ── Animation sampling & application ────────────────────────────────────

function toNum(v) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

// Scale channels default to 1 (a missing/NaN component must not flatten the
// bone), unlike position/rotation which default to 0.
function scaleNum(v) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 1;
}

function sampleChannel(keyframes, channel, t) {
  const kfs = keyframes.filter((k) => k.channel === channel).sort((a, b) => a.time - b.time);
  if (kfs.length === 0) return null;
  if (t <= kfs[0].time) return kfs[0].value;
  if (t >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (t >= a.time && t <= b.time) {
      if (a.interpolation === 'step') return a.value; // hold until the next key
      const f = b.time === a.time ? 0 : (t - a.time) / (b.time - a.time);
      return {
        x: toNum(a.value.x) + (toNum(b.value.x) - toNum(a.value.x)) * f,
        y: toNum(a.value.y) + (toNum(b.value.y) - toNum(a.value.y)) * f,
        z: toNum(a.value.z) + (toNum(b.value.z) - toNum(a.value.z)) * f,
      };
    }
  }
  return kfs[kfs.length - 1].value;
}

function isArmAnimator(animator, bone) {
  return /\b(left|right)\s+(arm|hand)\b/i.test(`${animator.name || ''} ${bone.name || ''}`);
}

// Scratch objects — reused every frame to avoid GC churn.
const _animEuler = new THREE.Euler(0, 0, 0, 'XYZ');
const _armAnimEuler = new THREE.Euler(0, 0, 0, 'ZYX');
const _animQuat = new THREE.Quaternion();

export function applyAnimationFrame(model, animation, t) {
  if (!model || !animation) return;
  
  // Debug: log animation application for groups
  const debugGroups = ['group', 'group2', 'group3'];
  let groupsAnimatedCount = 0;
  
  animation.animators.forEach((animator) => {
    const bone = model.bonesByKey[animator.key] || model.bonesByKey[animator.name];
    if (!bone || !bone.userData || !bone.userData.basePosition) return;
    
    // Count group animations
    if (debugGroups.includes(animator.name)) {
      groupsAnimatedCount++;
      const scl = sampleChannel(animator.keyframes, 'scale', t);
      if (scl) {
        console.debug(`Animation '${animation.name}' @ t=${t.toFixed(2)}: ${animator.name} scale=`, scl);
      }
    }
    
    const base = bone.userData;

    // ROTATION — arms use Blockbench's fixed-axis animation order and replace
    // their rest rotation. Other bones retain the existing offset behavior.
    const armAnimator = isArmAnimator(animator, bone);
    // ROTATION — an offset ON TOP of the bind rotation, composed in the
    // bone's LOCAL frame: q = q_base ⊗ q_anim. In three.js, `multiply`
    // appends the animation quaternion on the inner/local side, so the
    // animation rotates the bone around its own rest-oriented axes — which
    // is how Blockbench layers local rotation onto a rig. The reverse order
    // (q_anim ⊗ q_base) would rotate around the PARENT's axes and misalign
    // every swing on a bone that has a non-zero rest rotation.
    const rot = sampleChannel(animator.keyframes, 'rotation', t);
    if (rot) {
      const euler = armAnimator ? _armAnimEuler : _animEuler;
      euler.set(DEG(toNum(rot.x)), DEG(toNum(rot.y)), DEG(toNum(rot.z)), euler.order);
      _animQuat.setFromEuler(euler);
      if (armAnimator) bone.quaternion.copy(_animQuat);
      else bone.quaternion.copy(base.baseQuaternion).multiply(_animQuat);
    }

    // POSITION — an offset in model units on top of the bind position.
    const pos = sampleChannel(animator.keyframes, 'position', t);
    if (pos) {
      bone.position.set(
        base.basePosition.x + toNum(pos.x) * UNIT,
        base.basePosition.y + toNum(pos.y) * UNIT,
        base.basePosition.z + toNum(pos.z) * UNIT
      );
    }

    // SCALE — multiplicative on top of the bind scale.
    const scl = sampleChannel(animator.keyframes, 'scale', t);
    if (scl) {
      bone.scale.set(
        base.baseScale.x * scaleNum(scl.x),
        base.baseScale.y * scaleNum(scl.y),
        base.baseScale.z * scaleNum(scl.z)
      );
    }
    // Channels with no keyframes for this bone are deliberately left
    // untouched, so those bones simply keep their base pose.
  });

}

// Restore every bone to the exact bind pose parsed from the file. Called
// whenever playback stops or switches, so a stopped model never stays frozen
// in the last animated frame.
export function resetPose(model) {
  if (!model || !model.bonesByKey) return;
  const seen = new Set();
  for (const bone of Object.values(model.bonesByKey)) {
    if (seen.has(bone)) continue; // bones are registered by uuid AND name
    seen.add(bone);
    const base = bone.userData;
    if (!base || !base.basePosition) continue;
    bone.position.copy(base.basePosition);
    bone.quaternion.copy(base.baseQuaternion);
    bone.scale.copy(base.baseScale);
  }
}

const textureCache = {};
function loadTextureSync(dataUrl) {
  if (textureCache[dataUrl]) return textureCache[dataUrl];
  const img = new window.Image();
  const tex = new THREE.Texture(img);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  img.onload = () => {
    tex.needsUpdate = true;
  };
  img.src = dataUrl;
  textureCache[dataUrl] = tex;
  return tex;
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}