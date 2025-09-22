// ================== TYPEWRITER ==================
const quote = "“Phụ nữ không sinh ra là phụ nữ, họ trở thành phụ nữ.”";
const tw = document.getElementById("typewriter");
let i = 0;
(function type() {
  if (!tw) return;
  if (i < quote.length) {
    tw.textContent += quote.charAt(i++);
    setTimeout(type, 36);
  }
})();

// ================== GSAP SETUP ==================
gsap.registerPlugin(ScrollTrigger);

// Reveal on scroll
gsap.utils.toArray(".reveal").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
  });
});

// Grid overlay lines animation (intro dark grid)
const gridColumns = document.querySelectorAll(".grid-column");
if (gridColumns.length) {
  gsap.set(gridColumns, { opacity: 0, scaleY: 0, transformOrigin: "top" });
  gsap.to(gridColumns, {
    opacity: 1,
    scaleY: 1,
    duration: 1.2,
    stagger: 0.08,
    ease: "power2.out",
  });
}

// Parallax for images
gsap.utils.toArray(".parallax img").forEach((img) => {
  gsap.to(img, {
    yPercent: 12,
    ease: "none",
    scrollTrigger: {
      trigger: img,
      scrub: 0.4,
    },
  });
});

// ================== QUIZ HANDLER ==================
const submitBtn = document.getElementById("submitQuiz");
if (submitBtn) {
  submitBtn.addEventListener("click", () => {
    let score = 0;
    const pick = (n) =>
      (document.querySelector(`input[name="${n}"]:checked`) || {}).value;
    const picks = (n) =>
      [...document.querySelectorAll(`input[name="${n}"]:checked`)]
        .map((i) => i.value)
        .sort()
        .join("");
    if (pick("q1") === "B") score++;
    if (pick("q2") === "S") score++;
    if (picks("q3") === "ABD") score++;
    if (pick("q4") === "B") score++;
    if (picks("q5") === "AB") score++;
    if (pick("q6") === "D") score++;
    if (pick("q7") === "B") score++;
    if (picks("q8") === "ABD") score++;
    if (pick("q9") === "A") score++;
    if (pick("q10") === "B") score++;
    const msg =
      score >= 9
        ? "Xuất sắc!"
        : score >= 7
        ? "Rất tốt!"
        : score >= 5
        ? "Khá ổn!"
        : "Cần đọc thêm nhé!";
    const res = document.getElementById("quizResult");
    if (res) res.textContent = `Điểm của bạn: ${score}/10 — ${msg}`;
  });
}

// ================== TILT 3D ==================
function addTilt(el, max = 10) {
  let rect = null;
  const updateRect = () => (rect = el.getBoundingClientRect());
  updateRect();
  window.addEventListener("resize", updateRect);

  let raf = null;
  const onMove = (e) => {
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = (y / rect.height - 0.5) * -2 * max;
    const ry = (x / rect.width - 0.5) * 2 * max;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    });
  };
  const onLeave = () => {
    if (raf) cancelAnimationFrame(raf);
    el.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
  };

  el.addEventListener("mousemove", onMove, { passive: true });
  el.addEventListener("mouseleave", onLeave);
}

// Thêm tilt3d cho toàn bộ ảnh
document.querySelectorAll("img").forEach((img) => {
  img.classList.add("tilt3d");
  addTilt(img, 10);
});

gsap.utils.toArray(".tilt3d").forEach((el) => addTilt(el, 8));

// ================== INVERSION LENS (Three.js shader) ==================
import * as THREE from "https://esm.sh/three@0.175.0";

// Vertex & fragment shaders
const vertexShader = `
  varying vec2 v_uv;
  void main(){ v_uv = uv; gl_Position = vec4(position, 1.0); }
`;
const fragmentShader = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_radius;
  uniform float u_speed;
  uniform float u_imageAspect;
  uniform float u_turbulenceIntensity;
  uniform int u_effectType;
  uniform vec3 u_effectColor1;
  uniform vec3 u_effectColor2;
  uniform float u_effectIntensity;
  uniform bool u_invertMask;
  varying vec2 v_uv;

  vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.zxy, p.yxz + 19.27);
    return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z));
  }
  float simplex_noise(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K2 * 2.0);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);
    vec3 x0 = d0; vec3 x1 = d1; vec3 x2 = d2; vec3 x3 = d3;
    vec4 h = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    vec4 n = h*h*h*h*vec4(
      dot(x0, hash33(i) * 2.0 - 1.0),
      dot(x1, hash33(i + i1) * 2.0 - 1.0),
      dot(x2, hash33(i + i2) * 2.0 - 1.0),
      dot(x3, hash33(i + 1.0) * 2.0 - 1.0)
    );
    return 0.5 + 0.5 * 31.0 * dot(n, vec4(1.0));
  }
  vec2 curl(vec2 p, float time) {
    const float e = 0.001;
    float n1 = simplex_noise(vec3(p.x, p.y + e, time));
    float n2 = simplex_noise(vec3(p.x, p.y - e, time));
    float n3 = simplex_noise(vec3(p.x + e, p.y, time));
    float n4 = simplex_noise(vec3(p.x - e, p.y, time));
    float x = (n2 - n1) / (2.0 * e);
    float y = (n4 - n3) / (2.0 * e);
    return vec2(x, y);
  }
  float inkMarbling(vec2 p, float time, float intensity) {
    float result = 0.0;
    vec2 flow = curl(p * 1.5, time * 0.1) * intensity * 2.0;
    vec2 p1 = p + flow * 0.3;
    result += simplex_noise(vec3(p1 * 2.0, time * 0.15)) * 0.5;
    vec2 flow2 = curl(p * 3.0 + vec2(sin(time * 0.2), cos(time * 0.15)), time * 0.2) * intensity;
    vec2 p2 = p + flow2 * 0.2;
    result += simplex_noise(vec3(p2 * 4.0, time * 0.25)) * 0.3;
    vec2 flow3 = curl(p * 6.0 + vec2(cos(time * 0.3), sin(time * 0.25)), time * 0.3) * intensity * 0.5;
    vec2 p3 = p + flow3 * 0.1;
    result += simplex_noise(vec3(p3 * 8.0, time * 0.4)) * 0.2;
    float dist = length(p - vec2(0.5));
    float angle = atan(p.y - 0.5, p.x - 0.5);
    float spiral = sin(dist * 15.0 - angle * 2.0 + time * 0.3) * 0.5 + 0.5;
    result = mix(result, spiral, 0.3);
    return result * 0.5 + 0.5;
  }
  vec3 applySepia(vec3 c){return vec3(
    c.r*0.393 + c.g*0.769 + c.b*0.189,
    c.r*0.349 + c.g*0.686 + c.b*0.168,
    c.r*0.272 + c.g*0.534 + c.b*0.131
  );}
  vec3 applyDuotone(vec3 color, vec3 c1, vec3 c2){
    float g = dot(color, vec3(0.299,0.587,0.114));
    return mix(c1, c2, g);
  }
  vec3 applyPixelate(sampler2D t, vec2 uv, float px){
    float dx = px / u_resolution.x;
    float dy = px / u_resolution.y;
    vec2 p = vec2(dx*floor(uv.x/dx), dy*floor(uv.y/dy));
    return texture2D(t, p).rgb;
  }
  vec3 applyBlur(sampler2D t, vec2 uv, float b){
    float dx = b / u_resolution.x;
    float dy = b / u_resolution.y;
    vec3 s = vec3(0.0);
    s += texture2D(t, uv + vec2(-dx, -dy)).rgb * 0.0625;
    s += texture2D(t, uv + vec2( 0.0,-dy)).rgb * 0.125;
    s += texture2D(t, uv + vec2( dx, -dy)).rgb * 0.0625;
    s += texture2D(t, uv + vec2(-dx,  0.0)).rgb * 0.125;
    s += texture2D(t, uv).rgb * 0.25;
    s += texture2D(t, uv + vec2( dx,  0.0)).rgb * 0.125;
    s += texture2D(t, uv + vec2(-dx,  dy)).rgb * 0.0625;
    s += texture2D(t, uv + vec2( 0.0, dy)).rgb * 0.125;
    s += texture2D(t, uv + vec2( dx,  dy)).rgb * 0.0625;
    return s;
  }
  void main(){
    vec2 uv = v_uv;
    float screenAspect = u_resolution.x / u_resolution.y;
    float ratio = u_imageAspect / screenAspect;
    vec2 texCoord = vec2(mix(0.5 - 0.5/ratio, 0.5 + 0.5/ratio, uv.x), uv.y);
    vec3 original = texture2D(u_texture, texCoord).rgb;
    vec3 effect = original;

    if (u_effectType == 1) {
      float g = dot(original, vec3(0.299,0.587,0.114)); effect = vec3(g);
    } else if (u_effectType == 2) {
      effect = applySepia(original);
    } else if (u_effectType == 3) {
      effect = applyDuotone(original, u_effectColor1, u_effectColor2);
    } else if (u_effectType == 4) {
      effect = applyPixelate(u_texture, texCoord, u_effectIntensity * 20.0);
    } else if (u_effectType == 5) {
      effect = applyBlur(u_texture, texCoord, u_effectIntensity * 5.0);
    }

    vec2 cUV = uv; cUV.x *= screenAspect;
    vec2 cMouse = u_mouse; cMouse.x *= screenAspect;
    float dist = distance(cUV, cMouse);
    float marble = inkMarbling(uv * 2.0 + u_time * u_speed * 0.1, u_time, u_turbulenceIntensity * 2.0);
    float jagged = dist + (marble - 0.5) * u_turbulenceIntensity * 2.0;
    float mask = step(jagged, u_radius);

    vec3 inverted;
    if (u_effectType == 0){
      float g = dot(original, vec3(0.299,0.587,0.114));
      inverted = vec3(1.0 - g);
    } else {
      inverted = original;
    }

    vec3 finalColor = u_invertMask ? mix(inverted, effect, mask) : mix(effect, inverted, mask);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Config
const config = {
  maskRadius: 0.35,
  maskSpeed: 0.75,
  animationSpeed: 1.0,
  appearDuration: 0.4,
  disappearDuration: 0.3,
  turbulenceIntensity: 0.22,
  effectType: 0, // 0: invert/mono in lens, 1: B&W, 2: Sepia, 3: Duotone, 4: Pixelate, 5: Blur
  effectIntensity: 0.5,
  invertMask: false,
  duotoneColor1: [51, 102, 204],
  duotoneColor2: [230, 51, 51],
};

// Shared animation driver
let frameCount = 0;
let lastTime = 0;
const activeContainers = new Set();

function globalAnimate(ts) {
  requestAnimationFrame(globalAnimate);
  const delta = ts - lastTime;
  lastTime = ts;
  frameCount++;

  activeContainers.forEach((c) => {
    if (!c.uniforms) return;
    // Smooth mouse
    c.lerpedMouse.lerp(c.targetMouse, 0.1);
    c.uniforms.u_mouse.value.copy(c.lerpedMouse);
    // Only animate time when hovered
    if (c.isMouseInsideContainer) {
      c.uniforms.u_time.value += 0.01 * config.animationSpeed * (delta / 16.67);
    }
    c.renderer && c.renderer.render(c.scene, c.camera);
  });
}
requestAnimationFrame(globalAnimate);

// Init effect for each .inversion-lens
document.querySelectorAll(".inversion-lens").forEach((container) => {
  initHoverEffect(container);
});

function initHoverEffect(container) {
  container.scene = null;
  container.camera = null;
  container.renderer = null;
  container.uniforms = null;
  container.isMouseInsideContainer = false;
  container.targetMouse = new THREE.Vector2(0.5, 0.5);
  container.lerpedMouse = new THREE.Vector2(0.5, 0.5);
  container.radiusTween = null;

  activeContainers.add(container);
  const img = container.querySelector("img");
  const loader = new THREE.TextureLoader();
  loader.load(img.src, (texture) => {
    setupScene(texture);
    setupEvents();
  });

  function setupScene(texture) {
    const imageAspect = texture.image.width / texture.image.height;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const width = container.clientWidth;
    const height = container.clientHeight;

    container.scene = new THREE.Scene();
    container.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    container.uniforms = {
      u_texture: { value: texture },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_radius: { value: 0.0 },
      u_speed: { value: config.maskSpeed },
      u_imageAspect: { value: imageAspect },
      u_turbulenceIntensity: { value: config.turbulenceIntensity },
      u_effectType: { value: config.effectType },
      u_effectIntensity: { value: config.effectIntensity },
      u_invertMask: { value: config.invertMask },
      u_effectColor1: {
        value: new THREE.Color(
          config.duotoneColor1[0] / 255,
          config.duotoneColor1[1] / 255,
          config.duotoneColor1[2] / 255
        ),
      },
      u_effectColor2: {
        value: new THREE.Color(
          config.duotoneColor2[0] / 255,
          config.duotoneColor2[1] / 255,
          config.duotoneColor2[2] / 255
        ),
      },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: container.uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    container.scene.add(new THREE.Mesh(geometry, material));

    container.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    container.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );
    container.renderer.setSize(width, height);
    container.appendChild(container.renderer.domElement);

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      container.renderer.setSize(w, h);
      container.uniforms.u_resolution.value.set(w, h);
    });
    ro.observe(container);

    container.renderer.render(container.scene, container.camera);
  }

  function setupEvents() {
    document.addEventListener("mousemove", handleMouse, { passive: true });

    function handleMouse(e) {
      const rect = container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (container.isMouseInsideContainer !== inside) {
        container.isMouseInsideContainer = inside;
        if (container.radiusTween) container.radiusTween.kill?.();

        if (inside) {
          container.targetMouse.x = (e.clientX - rect.left) / rect.width;
          container.targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
          gsap.to(container.uniforms.u_radius, {
            value: config.maskRadius,
            duration: config.appearDuration,
            ease: "power2.out",
          });
        } else {
          gsap.to(container.uniforms.u_radius, {
            value: 0,
            duration: config.disappearDuration,
            ease: "power2.in",
          });
        }
      }
      if (inside) {
        container.targetMouse.x = (e.clientX - rect.left) / rect.width;
        container.targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      }
    }
  }
}

// ================== BACKGROUND PARTICLES (global) ==================
(function initParticles() {
  const host = document.getElementById("particles-layer");
  if (!host) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  host.appendChild(renderer.domElement);

  const count = 600;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    speeds[i] = 0.002 + Math.random() * 0.006;
  }
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.015,
    transparent: true,
    opacity: 0.55,
    color: 0x6256ca,
  });
  const points = new THREE.Points(geom, mat);
  scene.add(points);

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", onResize);

  let mx = 0,
    my = 0;
  window.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    },
    { passive: true }
  );

  function animate() {
    requestAnimationFrame(animate);
    const pos = geom.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += Math.sin(performance.now() * 0.0005 + i) * 0.0005;
      pos[i * 3 + 1] += Math.cos(performance.now() * 0.0006 + i) * speeds[i];
      if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4;
    }
    geom.attributes.position.needsUpdate = true;

    camera.position.x += (mx * 0.8 - camera.position.x) * 0.03;
    camera.position.y += (-my * 0.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();
