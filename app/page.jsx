"use client";

import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Download,
  Grid3X3,
  ImagePlus,
  FlipHorizontal2,
  Palette,
  RefreshCw,
  Sticker,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const DEFAULT_OUTPUT = { width: 900, height: 1350 };
const STRIP_OUTPUT = { width: 600, height: 1800 };
const WIDE_OUTPUT = { width: 1350, height: 900 };
const SQUARE_OUTPUT = { width: 1200, height: 1200 };
const BOOMERANG_FRAME_COUNT = 10;
const BOOMERANG_FRAME_DELAY = 80;

const captureModes = [
  { id: "photo", label: "รูปภาพ" },
  { id: "boomerang", label: "บูมเมอร์แรง" },
];

function buildVerticalSlots(count, padding = 0.06, gap = 0.035) {
  const h = (1 - padding * 2 - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    x: padding,
    y: padding + index * (h + gap),
    w: 1 - padding * 2,
    h,
  }));
}

function buildGridSlots(cols, rows, padding = 0.06, gap = 0.04) {
  const w = (1 - padding * 2 - gap * (cols - 1)) / cols;
  const h = (1 - padding * 2 - gap * (rows - 1)) / rows;
  return Array.from({ length: cols * rows }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: padding + col * (w + gap),
      y: padding + row * (h + gap),
      w,
      h,
    };
  });
}

function buildHorizontalSlots(count, padding = 0.06, gap = 0.035) {
  const w = (1 - padding * 2 - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    x: padding + index * (w + gap),
    y: padding,
    w,
    h: 1 - padding * 2,
  }));
}

const layouts = [
  {
    id: "two-wide",
    label: "2 รูป แนวตั้ง",
    count: 2,
    slots: buildVerticalSlots(2),
  },
  {
    id: "three-stack",
    label: "3 รูป สตริป",
    count: 3,
    slots: buildVerticalSlots(3, 0.05, 0.03),
  },
  {
    id: "four-stack",
    label: "4 รูป สตริป",
    count: 4,
    slots: buildVerticalSlots(4, 0.05, 0.025),
  },
  {
    id: "four-grid",
    label: "4 รูป กริด",
    count: 4,
    slots: buildGridSlots(2, 2),
  },
  {
    id: "nine-grid",
    label: "9 รูป กริด",
    count: 9,
    slots: buildGridSlots(3, 3, 0.05, 0.03),
  },
  {
    id: "two-horizontal",
    label: "2 รูป แนวนอน",
    count: 2,
    output: WIDE_OUTPUT,
    slots: buildHorizontalSlots(2),
  },
  {
    id: "three-horizontal",
    label: "3 รูป แนวนอน",
    count: 3,
    output: WIDE_OUTPUT,
    slots: buildHorizontalSlots(3, 0.05, 0.03),
  },
  {
    id: "six-grid",
    label: "6 รูป กริด",
    count: 6,
    slots: buildGridSlots(3, 2, 0.05, 0.03),
  },
  {
    id: "six-strip",
    label: "6 รูป สตริป",
    count: 6,
    output: STRIP_OUTPUT,
    slots: buildVerticalSlots(6, 0.045, 0.018),
  },
  {
    id: "square-four",
    label: "4 รูป จัตุรัส",
    count: 4,
    output: SQUARE_OUTPUT,
    slots: buildGridSlots(2, 2, 0.055, 0.035),
  },
  {
    id: "feature-two",
    label: "1 ใหญ่ + 2 เล็ก",
    count: 3,
    slots: [
      { x: 0.06, y: 0.06, w: 0.88, h: 0.52 },
      { x: 0.06, y: 0.62, w: 0.425, h: 0.32 },
      { x: 0.515, y: 0.62, w: 0.425, h: 0.32 },
    ],
  },
  {
    id: "feature-three",
    label: "1 ใหญ่ + 3 เล็ก",
    count: 4,
    slots: [
      { x: 0.06, y: 0.06, w: 0.88, h: 0.48 },
      { x: 0.06, y: 0.58, w: 0.273, h: 0.36 },
      { x: 0.363, y: 0.58, w: 0.273, h: 0.36 },
      { x: 0.667, y: 0.58, w: 0.273, h: 0.36 },
    ],
  },
  {
    id: "cover-strip",
    label: "ปก + 4 รูป",
    count: 5,
    output: STRIP_OUTPUT,
    slots: [
      { x: 0.05, y: 0.045, w: 0.9, h: 0.28 },
      { x: 0.05, y: 0.35, w: 0.9, h: 0.14 },
      { x: 0.05, y: 0.515, w: 0.9, h: 0.14 },
      { x: 0.05, y: 0.68, w: 0.9, h: 0.14 },
      { x: 0.05, y: 0.845, w: 0.9, h: 0.11 },
    ],
  },
];

const colors = [
  "#ffffff",
  "#fff0f6",
  "#ffdce8",
  "#ffc8dd",
  "#bfe3ff",
  "#e8d4ff",
  "#fff4a3",
  "#c8f5e4",
  "#ffe1f4",
  "#f6edff",
  "#ffd4b2",
  "#251006",
];

const photoBorderColors = [
  "#ffffff",
  "#ffc8dd",
  "#ff6b9d",
  "#bfe3ff",
  "#fff4a3",
  "#e8d4ff",
  "#c8f5e4",
  "#251006",
];

const photoFilters = [
  {
    id: "clean",
    label: "ธรรมดา",
    css: "none",
    canvas: "none",
    vignette: 0,
    grain: 0,
  },
  {
    id: "booth-noir",
    label: "ฟิลเตอร์",
    css: "grayscale(1) sepia(0.18) contrast(1.32) brightness(1.08)",
    canvas: "grayscale(1) sepia(18%) contrast(132%) brightness(108%)",
    vignette: 0.42,
    grain: 0.16,
  },
];

const catStickers = Array.from({ length: 15 }, (_, index) => ({
  id: `cat-${index + 1}`,
  name: `Cat ${index + 1}`,
  src: `/stickers/cats/cat-${String(index + 1).padStart(2, "0")}.png`,
}));

const newPackStickers = Array.from({ length: 15 }, (_, index) => ({
  id: `new-pack-${index + 1}`,
  name: `New Pack ${index + 1}`,
  src: `/stickers/new-pack/new-${String(index + 1).padStart(2, "0")}.png`,
}));

const packOneStickers = Array.from({ length: 29 }, (_, index) => ({
  id: `pack-one-${index + 1}`,
  name: `Pack 1 ${index + 1}`,
  src: `/stickers/pack-1/pack-1-${String(index + 1).padStart(2, "0")}.png`,
}));

const packTwoStickers = Array.from({ length: 25 }, (_, index) => {
  const item = index + 1;
  return {
    id: `pack-two-${item}`,
    name: `Pack 2 ${item}`,
    src: `/stickers/pack-2/pack-2-${String(item).padStart(2, "0")}.${item === 14 ? "jpg" : "png"}`,
  };
});

const doodleStickers = [
  { id: "star", name: "Star", src: svgSticker("⭐", "#ff7bb0") },
  { id: "heart", name: "Heart", src: svgSticker("❤", "#ff4b91") },
  { id: "bow", name: "Bow", src: svgSticker("୨୧", "#ff8fc0") },
  { id: "sparkle", name: "Sparkle", src: svgSticker("✦", "#8c7bff") },
  { id: "kiss", name: "Kiss", src: svgSticker("kiss", "#e3345b") },
  { id: "ribbon", name: "Ribbon", src: svgSticker("♡", "#79c7ff") },
];

const categories = [
  { id: "cats", label: "แมวน่ารัก", preview: catStickers[1].src, stickers: catStickers },
  { id: "kawaii", label: "Kawaii", preview: doodleStickers[0].src, stickers: doodleStickers },
  { id: "new-pack", label: "New Pack", preview: newPackStickers[3].src, stickers: newPackStickers },
  { id: "pack-one", label: "Pack 1", preview: packOneStickers[0].src, stickers: packOneStickers },
  { id: "pack-two", label: "Pack 2", preview: packTwoStickers[0].src, stickers: packTwoStickers },
];

function svgSticker(text, color) {
  const isWord = text.length > 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" viewBox="0 0 220 160"><filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity=".16"/></filter><text x="110" y="${isWord ? 94 : 108}" text-anchor="middle" font-size="${isWord ? 54 : 96}" font-family="Arial, sans-serif" font-weight="900" fill="${color}" stroke="#fff" stroke-width="10" paint-order="stroke" filter="url(#s)">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function fitImage(ctx, img, x, y, w, h) {
  const ratio = Math.max(w / img.width, h / img.height);
  const nw = img.width * ratio;
  const nh = img.height * ratio;
  ctx.drawImage(img, x + (w - nw) / 2, y + (h - nh) / 2, nw, nh);
}

function drawPhotoOverlay(ctx, x, y, w, h, filter) {
  if (filter.vignette) {
    const gradient = ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      Math.min(w, h) * 0.2,
      x + w / 2,
      y + h / 2,
      Math.max(w, h) * 0.68,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.72, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${filter.vignette})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  }

  if (filter.grain) {
    ctx.globalAlpha = filter.grain;
    ctx.fillStyle = "#ffffff";
    const step = Math.max(4, Math.round(Math.min(w, h) / 48));
    for (let gy = y; gy < y + h; gy += step) {
      for (let gx = x + ((gy / step) % 2) * (step / 2); gx < x + w; gx += step * 2) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isBoomerangPhoto(photo) {
  return photo && typeof photo === "object" && photo.type === "boomerang";
}

function getPhotoPreview(photo) {
  if (isBoomerangPhoto(photo)) return photo.frames[0];
  return photo;
}

function getPhotoFrame(photo, frameIndex) {
  if (isBoomerangPhoto(photo)) return photo.frames[frameIndex % photo.frames.length];
  return photo;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getOutputForLayout(layout) {
  if (layout.output) return layout.output;
  if (layout.id === "three-stack" || layout.id === "four-stack") return STRIP_OUTPUT;
  return DEFAULT_OUTPUT;
}

export default function Home() {
  const [timer, setTimer] = useState(3);
  const [countdown, setCountdown] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [captureMode, setCaptureMode] = useState("photo");
  const [layoutId, setLayoutId] = useState("four-grid");
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [customColor, setCustomColor] = useState("#ffc8dd");
  const [photoBorderColor, setPhotoBorderColor] = useState("#ffffff");
  const [photoFilterId, setPhotoFilterId] = useState("clean");
  const [stickers, setStickers] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [streaming, setStreaming] = useState(false);
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [step, setStep] = useState("capture");
  const [mediaStream, setMediaStream] = useState(null);
  const [isShooting, setIsShooting] = useState(false);
  const [isBoomerangCapturing, setIsBoomerangCapturing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [stageSize, setStageSize] = useState({ width: 390, height: 585 });
  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const fileRef = useRef(null);
  const dragRef = useRef(null);

  const currentLayout = useMemo(
    () => layouts.find((layout) => layout.id === layoutId) ?? layouts[0],
    [layoutId],
  );
  const currentOutput = useMemo(
    () => getOutputForLayout(currentLayout),
    [currentLayout],
  );
  const currentPhotoFilter = useMemo(
    () => photoFilters.find((filter) => filter.id === photoFilterId) ?? photoFilters[0],
    [photoFilterId],
  );

  useEffect(() => {
    const update = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      if (stageRef.current) {
        const box = stageRef.current.getBoundingClientRect();
        setStageSize({ width: box.width, height: box.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("เบราว์เซอร์นี้ไม่รองรับกล้อง");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1600 } },
        audio: false,
      });
      if (!videoRef.current) return false;
      videoRef.current.srcObject = stream;
      setMediaStream(stream);
      setStreaming(true);
      await videoRef.current.play();
      if (!videoRef.current.videoWidth) {
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
      }
      return true;
    } catch (error) {
      setCameraError("เปิดกล้องไม่ได้ กรุณาอนุญาตสิทธิ์กล้องในเบราว์เซอร์");
      return false;
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setMediaStream(null);
    setStreaming(false);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("ยังไม่พบภาพจากกล้อง ลองกดเปิดกล้องอีกครั้ง");
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 1200;
    const ctx = canvas.getContext("2d");
    if (mirrorCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  async function captureBoomerangClip() {
    const frames = [];
    setIsBoomerangCapturing(true);
    try {
      for (let index = 0; index < BOOMERANG_FRAME_COUNT; index += 1) {
        const frame = captureFrame();
        if (!frame) break;
        frames.push(frame);
        await sleep(BOOMERANG_FRAME_DELAY);
      }
    } finally {
      setIsBoomerangCapturing(false);
    }
    if (!frames.length) return null;
    return {
      type: "boomerang",
      frames: [...frames, ...frames.slice(1, -1).reverse()],
    };
  }

  async function runTimedCapture() {
    if (isShooting) return;
    setIsShooting(true);
    setCameraError("");
    if (!streaming) {
      setCameraError("กรุณากดเปิดกล้องก่อนเริ่มถ่าย");
      setIsShooting(false);
      return;
    }
    setPhotos([]);
    const nextPhotos = [];
    for (let index = 0; index < currentLayout.count; index += 1) {
      await runCountdown(timer);
      const photo = captureMode === "boomerang" ? await captureBoomerangClip() : captureFrame();
      if (!photo) break;
      nextPhotos.push(photo);
      setPhotos([...nextPhotos]);
    }
    if (nextPhotos.length === currentLayout.count) {
      stopCamera();
      setStep("edit");
    }
    setIsShooting(false);
  }

  function runCountdown(seconds) {
    return new Promise((resolve) => {
      let remaining = seconds;
      setCountdown(remaining);
      const tick = window.setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          window.clearInterval(tick);
          setCountdown(null);
          resolve();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    });
  }

  function handleUpload(event) {
    const files = Array.from(event.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((current) => {
          const next = [...current, reader.result].slice(-9);
          if (next.length >= currentLayout.count) setStep("edit");
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  function addSticker(sticker) {
    const id = `${sticker.id}-${Date.now()}`;
    setStickers((current) => [
      ...current,
      { id, src: sticker.src, x: 45, y: 45, scale: 1, rotation: -6 },
    ]);
    setSelectedSticker(id);
    setModal(null);
  }

  function updateSticker(id, patch) {
    setStickers((current) =>
      current.map((sticker) => (sticker.id === id ? { ...sticker, ...patch } : sticker)),
    );
  }

  function deleteSelected() {
    if (!selectedSticker) return;
    setStickers((current) => current.filter((sticker) => sticker.id !== selectedSticker));
    setSelectedSticker(null);
  }

  function pointerDown(event, sticker) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedSticker(sticker.id);
    dragRef.current = {
      id: sticker.id,
      sx: event.clientX,
      sy: event.clientY,
      x: sticker.x,
      y: sticker.y,
    };
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
  }

  function pointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = ((event.clientX - drag.sx) / stageSize.width) * 100;
    const dy = ((event.clientY - drag.sy) / stageSize.height) * 100;
    updateSticker(drag.id, { x: drag.x + dx, y: drag.y + dy });
  }

  function pointerUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", pointerMove);
    window.removeEventListener("pointerup", pointerUp);
  }

  async function renderStripFrame(ctx, output, frameIndex = 0) {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, output.width, output.height);

    const loadedPhotos =
      photos.length > 0
        ? await Promise.all(
            currentLayout.slots.map((_, index) => {
              const frame = getPhotoFrame(photos[index], frameIndex);
              return frame ? loadImage(frame) : null;
            }),
          )
        : [];

    currentLayout.slots.forEach((slot, index) => {
      const x = slot.x * output.width;
      const y = slot.y * output.height;
      const w = slot.w * output.width;
      const h = slot.h * output.height;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      if (loadedPhotos[index]) {
        ctx.filter = currentPhotoFilter.canvas;
        fitImage(ctx, loadedPhotos[index], x, y, w, h);
        ctx.filter = "none";
        drawPhotoOverlay(ctx, x, y, w, h, currentPhotoFilter);
      }
      else {
        ctx.fillStyle = "#f5f1f5";
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();
      if (photoBorderColor) {
        ctx.strokeStyle = photoBorderColor;
        ctx.lineWidth = Math.max(0, output.width * 0.012);
        ctx.strokeRect(x, y, w, h);
      }
    });

    for (const sticker of stickers) {
      const img = await loadImage(sticker.src);
      const stickerWidth = output.width * 0.29 * sticker.scale;
      const stickerHeight = stickerWidth * (img.height / img.width);
      const x = (sticker.x / 100) * output.width;
      const y = (sticker.y / 100) * output.height;
      ctx.save();
      ctx.translate(x + stickerWidth / 2, y + stickerHeight / 2);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      ctx.drawImage(img, -stickerWidth / 2, -stickerHeight / 2, stickerWidth, stickerHeight);
      ctx.restore();
    }
  }

  function triggerDownload(url, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
  }

  async function downloadStrip() {
    const output = currentOutput;
    const canvas = document.createElement("canvas");
    canvas.width = output.width;
    canvas.height = output.height;
    const ctx = canvas.getContext("2d");
    const hasBoomerang = photos.some(isBoomerangPhoto);

    if (hasBoomerang) {
      const frameCount = Math.max(
        ...photos.map((photo) => (isBoomerangPhoto(photo) ? photo.frames.length : 1)),
      );
      const gif = GIFEncoder();

      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        await renderStripFrame(ctx, output, frameIndex);
        const { data } = ctx.getImageData(0, 0, output.width, output.height);
        const palette = quantize(data, 256);
        const indexedFrame = applyPalette(data, palette);
        gif.writeFrame(indexedFrame, output.width, output.height, {
          palette,
          delay: BOOMERANG_FRAME_DELAY,
          repeat: 0,
        });
      }

      gif.finish();
      const blob = new Blob([gif.bytes()], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "photobooth-boomerang.gif");
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    await renderStripFrame(ctx, output);

    triggerDownload(canvas.toDataURL("image/png"), "photobooth.png");
  }

  const selected = stickers.find((sticker) => sticker.id === selectedSticker);
  const isEditing = step === "edit";
  const stageRatio = currentOutput.width / currentOutput.height;
  const stageDisplayWidth = Math.max(
    150,
    Math.min(
      viewportSize.width <= 720 ? Math.min(viewportSize.width - 24, 360) : Math.min(viewportSize.width * 0.74, 390),
      viewportSize.height * 0.6 * stageRatio,
    ),
  );

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-badges">
          <span className="hero-badge">Photo Booth</span>
          <span className="hero-badge blue">ออนไลน์</span>
        </div>
        <h1>Photo Booth</h1>
        <p>
          ถ่ายรูปหรืออัปโหลดภาพ เลือกเลย์เอาต์ แต่งสีกรอบ
          แปะสติ๊กเกอร์ แล้วดาวน์โหลดได้เลย
        </p>
      </section>

      <section className={`workbench ${isEditing ? "edit-mode" : "capture-mode"}`}>
        <aside className="toolbar" aria-label="เครื่องมือ">
          <button className="tool-button" onClick={() => setModal("layouts")} title="เลย์เอาต์">
            <Grid3X3 size={22} />
            <span>เลย์เอาต์</span>
          </button>
          {isEditing ? (
            <>
              <button className="tool-button" onClick={() => setModal("filters")} title="ฟิลเตอร์">
                <Palette size={22} />
                <span>ฟิลเตอร์</span>
              </button>
              <button className="tool-button" onClick={() => setModal("categories")} title="สติ๊กเกอร์">
                <Sticker size={22} />
                <span>สติ๊กเกอร์</span>
              </button>
            </>
          ) : (
            <button className="tool-button" onClick={() => setModal("filters")} title="ฟิลเตอร์">
              <Palette size={22} />
              <span>ฟิลเตอร์</span>
            </button>
          )}
        </aside>

        <div className="strip-stage-wrap">
          <div className="capture-panel">
            <div className="mode-row" aria-label="โหมดถ่ายภาพ">
              {captureModes.map((mode) => (
                <button
                  key={mode.id}
                  className={`mode-button ${captureMode === mode.id ? "active" : ""}`}
                  onClick={() => setCaptureMode(mode.id)}
                  disabled={isShooting}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="timer-row">
              {[3, 5, 10].map((item) => (
                <button
                  key={item}
                  className={`timer-button ${timer === item ? "active" : ""}`}
                  onClick={() => setTimer(item)}
                >
                  <Camera size={17} />
                  {item}s
                </button>
              ))}
              <button className="outline-button" onClick={() => fileRef.current?.click()}>
                <Upload size={17} />
                อัปโหลดรูปภาพ
              </button>
            </div>

            {cameraError ? <p className="camera-error">{cameraError}</p> : null}

            <div className="capture-actions">
              <button className="outline-button" onClick={startCamera} disabled={streaming || isShooting}>
                <Camera size={19} />
                {streaming ? "กล้องพร้อมแล้ว" : "เปิดกล้อง"}
              </button>
              <button
                className={`outline-button ${mirrorCamera ? "active" : ""}`}
                onClick={() => setMirrorCamera((value) => !value)}
                disabled={isShooting}
              >
                <FlipHorizontal2 size={18} />
                {mirrorCamera ? "กระจก" : "ไม่กลับรูป"}
              </button>
              <button className="primary-button" onClick={runTimedCapture} disabled={isShooting || !streaming}>
                <Camera size={19} />
                {isShooting
                  ? `กำลังถ่าย ${photos.length}/${currentLayout.count}`
                  : captureMode === "boomerang"
                    ? `เริ่มบูมเมอร์แรง ${currentLayout.count} ช่อง`
                    : `เริ่มถ่าย ${currentLayout.count} รูป`}
              </button>
              <button className="outline-button" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={18} />
                เพิ่มรูป
              </button>
            </div>
            <input
              ref={fileRef}
              className="hidden-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
            />
            <video ref={videoRef} className="capture-source-video" autoPlay playsInline muted />
          </div>

          <div
            ref={stageRef}
            className={`strip-stage ${isBoomerangCapturing ? "boomerang-capturing" : ""}`}
            style={{
              "--frame-color": frameColor,
              "--stage-aspect": `${currentOutput.width} / ${currentOutput.height}`,
              "--stage-ratio": currentOutput.width / currentOutput.height,
              "--photo-border-color": photoBorderColor ?? "transparent",
              "--photo-border-width": photoBorderColor ? "4px" : "0px",
              "--photo-filter": currentPhotoFilter.css,
              "--photo-vignette": currentPhotoFilter.vignette,
              "--photo-grain": currentPhotoFilter.grain,
              width: `${stageDisplayWidth}px`,
            }}
            onPointerDown={() => setSelectedSticker(null)}
          >
            {currentLayout.slots.map((slot, index) => (
              <div
                key={`${currentLayout.id}-${index}`}
                className="slot"
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  width: `${slot.w * 100}%`,
                  height: `${slot.h * 100}%`,
                }}
              >
                {photos[index] ? (
                  <PhotoSlot photo={photos[index]} alt={`photo ${index + 1}`} />
                ) : streaming && mediaStream ? (
                  <LiveSlotVideo stream={mediaStream} mirrored={mirrorCamera} />
                ) : (
                  <div className="slot-placeholder">photo</div>
                )}
              </div>
            ))}
            {countdown ? <div className="countdown">{countdown}</div> : null}
            {isBoomerangCapturing ? <div className="boomerang-capture-flash">กำลังถ่าย</div> : null}
            <div className="sticker-layer">
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className={`sticker-item ${selectedSticker === sticker.id ? "selected" : ""}`}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                  }}
                  onPointerDown={(event) => pointerDown(event, sticker)}
                >
                  <img src={sticker.src} alt="" />
                  {selectedSticker === sticker.id && <span className="resize-dot" />}
                </div>
              ))}
            </div>
          </div>

          <div className="thumbnail-rail">
            {photos.map((photo, index) => (
              <div className="thumbnail-wrap" key={`${getPhotoPreview(photo)}-${index}`}>
                <img className="thumbnail" src={getPhotoPreview(photo)} alt={`thumbnail ${index + 1}`} />
                {isBoomerangPhoto(photo) ? <span>GIF</span> : null}
              </div>
            ))}
          </div>

          <div className="footer-actions">
            {isEditing ? (
              <button className="primary-button" onClick={downloadStrip}>
              <Download size={19} />
              ดาวน์โหลด
              </button>
            ) : null}
            <button
              className="outline-button"
              onClick={() => {
                stopCamera();
                setPhotos([]);
                setStickers([]);
                setSelectedSticker(null);
                setCountdown(null);
                setIsBoomerangCapturing(false);
                setStep("capture");
              }}
            >
              <RefreshCw size={18} />
              {isEditing ? "ถ่ายใหม่" : "ล้างรูป"}
            </button>
          </div>
        </div>

        {isEditing ? <aside className="controls-panel">
          <section className="panel-section">
            <h2>ฟิลเตอร์</h2>
            <div className="filter-grid">
              {photoFilters.map((filter) => (
                <button
                  key={filter.id}
                  className={`filter-card ${photoFilterId === filter.id ? "active" : ""}`}
                  onClick={() => setPhotoFilterId(filter.id)}
                >
                  <span className="filter-preview" style={{ "--preview-filter": filter.css }} />
                  <strong>{filter.label}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h2>สีกรอบ</h2>
            <div className="color-row">
              <input
                className="swatch rainbow"
                type="color"
                value={customColor}
                onChange={(event) => {
                  setCustomColor(event.target.value);
                  setFrameColor(event.target.value);
                }}
                title="เลือกสีเอง"
              />
              {colors.map((color) => (
                <button
                  key={color}
                  className={`swatch ${frameColor === color ? "active" : ""}`}
                  style={{ "--c": color }}
                  onClick={() => {
                    setFrameColor(color);
                  }}
                  title={color}
                />
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h2>ขอบรูป</h2>
            <div className="color-row">
              <button
                className={`no-border-button ${photoBorderColor === null ? "active" : ""}`}
                onClick={() => setPhotoBorderColor(null)}
              >
                ไม่มีขอบ
              </button>
              {photoBorderColors.map((color) => (
                <button
                  key={color}
                  className={`swatch ${photoBorderColor === color ? "active" : ""}`}
                  style={{ "--c": color }}
                  onClick={() => setPhotoBorderColor(color)}
                  title={color}
                />
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h2>หมวดสติ๊กเกอร์</h2>
            <div className="sticker-grid">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="sticker-chip"
                  onClick={() => {
                    setActiveCategory(category);
                    setModal("stickers");
                  }}
                  title={category.label}
                >
                  <img src={category.preview} alt={category.label} />
                </button>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h2>สติ๊กเกอร์ที่เลือก</h2>
            {selected ? (
              <>
                <div className="slider-row">
                  <span>ขนาด</span>
                  <input
                    type="range"
                    min="0.35"
                    max="2.4"
                    step="0.05"
                    value={selected.scale}
                    onChange={(event) =>
                      updateSticker(selected.id, { scale: Number(event.target.value) })
                    }
                  />
                  <strong>{Math.round(selected.scale * 100)}%</strong>
                </div>
                <div className="slider-row">
                  <span>หมุน</span>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selected.rotation}
                    onChange={(event) =>
                      updateSticker(selected.id, { rotation: Number(event.target.value) })
                    }
                  />
                  <strong>{selected.rotation}°</strong>
                </div>
                <button className="outline-button" onClick={deleteSelected}>
                  <Trash2 size={18} />
                  ลบสติ๊กเกอร์
                </button>
              </>
            ) : (
              <p className="panel-label">แตะสติ๊กเกอร์บนรูปเพื่อปรับขนาด หมุน หรือลบ</p>
            )}
          </section>
        </aside> : null}
      </section>

      {modal === "layouts" && (
        <Modal title="เลือกเลย์เอาต์" onClose={() => setModal(null)}>
          <div className="layout-grid">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                className={`layout-card ${layoutId === layout.id ? "active" : ""}`}
                onClick={() => {
                  setLayoutId(layout.id);
                  setModal(null);
                }}
              >
                <MiniLayout layout={layout} />
                <span>{layout.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === "categories" && (
        <Modal title="สติ๊กเกอร์" onClose={() => setModal(null)}>
          <div className="category-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className="category-card"
                onClick={() => {
                  setActiveCategory(category);
                  setModal("stickers");
                }}
              >
                <img src={category.preview} alt={category.label} />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === "stickers" && (
        <Modal title={activeCategory.label} onClose={() => setModal(null)}>
          <div className="modal-sticker-grid">
            {activeCategory.stickers.map((sticker) => (
              <button key={sticker.id} className="modal-sticker" onClick={() => addSticker(sticker)}>
                <img src={sticker.src} alt={sticker.name} />
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === "filters" && (
        <Modal title="ฟิลเตอร์" onClose={() => setModal(null)}>
          <div className="filter-grid modal-filter-grid">
            {photoFilters.map((filter) => (
              <button
                key={filter.id}
                className={`filter-card ${photoFilterId === filter.id ? "active" : ""}`}
                onClick={() => {
                  setPhotoFilterId(filter.id);
                  setModal(null);
                }}
              >
                <span className="filter-preview" style={{ "--preview-filter": filter.css }} />
                <strong>{filter.label}</strong>
              </button>
            ))}
          </div>
        </Modal>
      )}

    </main>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose} title="ปิด">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PhotoSlot({ photo, alt }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isBoomerangPhoto(photo)) {
      setFrameIndex(0);
      return undefined;
    }

    const tick = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % photo.frames.length);
    }, BOOMERANG_FRAME_DELAY);

    return () => window.clearInterval(tick);
  }, [photo]);

  if (isBoomerangPhoto(photo)) {
    return (
      <>
        <img src={photo.frames[frameIndex] ?? photo.frames[0]} alt={alt} />
        <span className="boomerang-badge">บูมเมอร์แรง</span>
      </>
    );
  }

  return <img src={photo} alt={alt} />;
}

function LiveSlotVideo({ stream, mirrored }) {
  return (
    <video
      className={`slot-live-video ${mirrored ? "mirrored" : ""}`}
      autoPlay
      playsInline
      muted
      ref={(node) => {
        if (!node || node.srcObject === stream) return;
        node.srcObject = stream;
        node.play().catch(() => {});
      }}
    />
  );
}

function MiniLayout({ layout }) {
  const output = getOutputForLayout(layout);
  return (
    <div
      className="mini-layout"
      style={{ "--mini-aspect": `${output.width} / ${output.height}` }}
    >
      {layout.slots.map((slot, index) => (
        <span
          key={index}
          className="mini-cell"
          style={{
            left: `${slot.x * 100}%`,
            top: `${slot.y * 100}%`,
            width: `${slot.w * 100}%`,
            height: `${slot.h * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
