import { onMount, onCleanup, createSignal } from "solid-js";
import { SkinViewer } from "skinview3d";

/**
 * MinecraftAvatar — 使用 skinview3d 渲染 Minecraft 皮肤
 *
 * 特性：
 * - 头部跟随鼠标 (LookAt) + 平滑插值
 * - 禁用默认拖拽/缩放控制
 * - 轻微 Idle 呼吸浮动
 * - 透明背景，完美融入深色 UI
 * - 多皮肤切换按钮
 */

interface SkinEntry {
  url: string;
  label: string;
}

interface Props {
  skins?: SkinEntry[];
  width?: number;
  height?: number;
}

const DEFAULT_SKINS: SkinEntry[] = [
  { url: "/skin_school.png", label: "School" },
  { url: "/skin_leisure.png", label: "Leisure" },
  { url: "/skin_winter.png", label: "Winter" },
];

export default function MinecraftAvatar(props: Props) {
  let canvasRef: HTMLCanvasElement | undefined;
  let viewer: SkinViewer | undefined;
  let animationId: number | undefined;

  const [activeSkin, setActiveSkin] = createSignal(0);
  const skins = props.skins || DEFAULT_SKINS;

  // 鼠标位置 (归一化 -1 ~ 1)
  const mouseX = { current: 0, target: 0 };
  const mouseY = { current: 0, target: 0 };
  // Idle 呼吸浮动
  let idleTime = 0;

  // 切换皮肤
  function switchSkin(index: number) {
    if (!viewer || index < 0 || index >= skins.length) return;
    setActiveSkin(index);
    viewer.loadSkin(skins[index].url);
  }

  onMount(() => {
    if (!canvasRef) return;

    // 初始化 Viewer
    viewer = new SkinViewer({
      canvas: canvasRef,
      width: props.width || 180,
      height: props.height || 220,
      skin: skins[0].url,
      background: null as any,
    });

    // 透明背景
    if (viewer.renderer) {
      viewer.renderer.setClearColor(0x000000, 0);
    }
    canvasRef.style.background = "transparent";

    // === 禁用默认控制 ===
    viewer.controls.enableRotate = false;
    viewer.controls.enableZoom = false;
    viewer.controls.enablePan = false;
    viewer.controls.enabled = false;

    // === 全身像: 适配卡片高度, 角色居中 ===
    viewer.camera.position.set(0, 5, 24);
    viewer.camera.fov = 50;
    viewer.camera.updateProjectionMatrix();
    viewer.camera.lookAt(0, 4, 0);

    // 缩放玩家模型
    viewer.playerWrapper.scale.set(0.6, 0.6, 0.6);

    // === 鼠标追踪 (增大幅度) ===
    function onMouseMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.target = Math.max(-0.8, Math.min(0.8, nx * 0.6));
      mouseY.target = Math.max(-0.4, Math.min(0.4, ny * 0.3));
    }
    window.addEventListener("mousemove", onMouseMove);

    // === 渲染循环 (头部+身体联动) ===
    let lastTime = performance.now();

    function animate(time: number) {
      if (!viewer || viewer["_disposed"]) return;

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      idleTime += dt;

      const lerpSpeed = 5.0 * dt;
      mouseX.current += (mouseX.target - mouseX.current) * lerpSpeed;
      mouseY.current += (mouseY.target - mouseY.current) * lerpSpeed;

      // 头部 — 大幅度转动
      const head = viewer.playerObject.skin.head;
      if (head) {
        head.rotation.y = mouseX.current;
        head.rotation.x = mouseY.current;
      }

      // 身体 — 明显跟随头部旋转
      const body = viewer.playerObject.skin.body;
      if (body) {
        body.rotation.y = mouseX.current * 0.5;
      }

      // 手臂 — 自然摆动 (Idle)
      const leftArm = viewer.playerObject.skin.leftArm;
      const rightArm = viewer.playerObject.skin.rightArm;
      if (leftArm && rightArm) {
        const armSwing = Math.sin(idleTime * 2.0) * 0.06;
        leftArm.rotation.x = armSwing;
        rightArm.rotation.x = -armSwing;
      }

      // Idle 呼吸浮动 (增大幅度)
      const breathY = Math.sin(idleTime * 1.2) * 0.15;
      viewer.playerObject.position.y = breathY;

      viewer.render();
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    // === 窗口 resize 自适应 ===
    function onResize() {
      if (!viewer || !canvasRef) return;
      const rect = canvasRef.parentElement?.getBoundingClientRect();
      if (rect) {
        const w = Math.min(rect.width, props.width || 180);
        const h = Math.min(rect.height, props.height || 220);
        viewer.setSize(w, h);
      }
    }
    window.addEventListener("resize", onResize);

    // Cleanup
    onCleanup(() => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (viewer) {
        viewer.dispose();
        viewer = undefined;
      }
    });
  });

  return (
    <div class="flex flex-col items-center w-full h-full pt-2 md:pt-4">
      <canvas
        ref={canvasRef!}
        id="mc-avatar-canvas"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "transparent",
          "image-rendering": "auto",
        }}
      />
      {/* 皮肤切换按钮 — School | Leisure | Winter */}
      <div class="flex items-center justify-center mt-1.5 text-[10px] tracking-wider">
        <button
          onClick={() => switchSkin(0)}
          class={`transition-all duration-300 cursor-pointer ${
            activeSkin() === 0 ? "text-primary-300 font-medium" : "text-darkslate-400 hover:text-darkslate-300"
          }`}
        >
          School
        </button>
        <span class="text-darkslate-400 mx-2 select-none">|</span>
        <button
          onClick={() => switchSkin(1)}
          class={`transition-all duration-300 cursor-pointer ${
            activeSkin() === 1 ? "text-primary-300 font-medium" : "text-darkslate-400 hover:text-darkslate-300"
          }`}
        >
          Leisure
        </button>
        <span class="text-darkslate-400 mx-2 select-none">|</span>
        <button
          onClick={() => switchSkin(2)}
          class={`transition-all duration-300 cursor-pointer ${
            activeSkin() === 2 ? "text-primary-300 font-medium" : "text-darkslate-400 hover:text-darkslate-300"
          }`}
        >
          Winter
        </button>
      </div>
    </div>
  );
}
