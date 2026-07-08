"use client";

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
const layouts = [
  {
    id: "two-wide",
    label: "2 รูปภาพ",
    count: 2,
    slots: [
      { x: 0.08, y: 0.08, w: 0.84, h: 0.39 },
      { x: 0.08, y: 0.51, w: 0.84, h: 0.39 },
    ],
  },
  {
    id: "three-stack",
    label: "3 รูปภาพ",
    count: 3,
    slots: [
      { x: 0.06, y: 0.05, w: 0.88, h: 0.265 },
      { x: 0.06, y: 0.345, w: 0.88, h: 0.265 },
      { x: 0.06, y: 0.64, w: 0.88, h: 0.265 },
    ],
  },
  {
    id: "four-stack",
    label: "4 รูปภาพ",
    count: 4,
    slots: [
      { x: 0.06, y: 0.045, w: 0.88, h: 0.205 },
      { x: 0.06, y: 0.27, w: 0.88, h: 0.205 },
      { x: 0.06, y: 0.495, w: 0.88, h: 0.205 },
      { x: 0.06, y: 0.72, w: 0.88, h: 0.205 },
    ],
  },
  {
    id: "four-grid",
    label: "4 รูปภาพ",
    count: 4,
    slots: [
      { x: 0.055, y: 0.065, w: 0.425, h: 0.39 },
      { x: 0.52, y: 0.065, w: 0.425, h: 0.39 },
      { x: 0.055, y: 0.49, w: 0.425, h: 0.39 },
      { x: 0.52, y: 0.49, w: 0.425, h: 0.39 },
    ],
  },
  {
    id: "nine-grid",
    label: "9 รูปภาพ",
    count: 9,
    slots: Array.from({ length: 9 }, (_, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      return { x: 0.07 + col * 0.3, y: 0.08 + row * 0.28, w: 0.26, h: 0.24 };
    }),
  },
];

const colors = [
  "#ffffff",
  "#000000",
  "#ffdce8",
  "#f6b7c9",
  "#bfe3ff",
  "#a997ff",
  "#fff19b",
  "#ffd4b2",
  "#087d3f",
  "#9da09a",
  "#251006",
  "#0b145a",
  "#8e1717",
  "#ffe1f4",
];

const photoBorderColors = [
  "#ffffff",
  "#000000",
  "#ff4b91",
  "#ffdce8",
  "#bfe3ff",
  "#fff19b",
  "#8e1717",
  "#251006",
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

const doodleStickers = [
  { id: "star", name: "Star", src: svgSticker("⭐", "#ff7bb0") },
  { id: "heart", name: "Heart", src: svgSticker("❤", "#ff4b91") },
  { id: "bow", name: "Bow", src: svgSticker("୨୧", "#ff8fc0") },
  { id: "sparkle", name: "Sparkle", src: svgSticker("✦", "#8c7bff") },
  { id: "kiss", name: "Kiss", src: svgSticker("kiss", "#e3345b") },
  { id: "ribbon", name: "Ribbon", src: svgSticker("♡", "#79c7ff") },
];

const categories = [
  { id: "cats", label: "Cute Cats", preview: catStickers[1].src, stickers: catStickers },
  { id: "kawaii", label: "Kawaii", preview: doodleStickers[0].src, stickers: doodleStickers },
  { id: "new-pack", label: "New Pack", preview: newPackStickers[3].src, stickers: newPackStickers },
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
  if (layout.id === "three-stack" || layout.id === "four-stack") return STRIP_OUTPUT;
  return DEFAULT_OUTPUT;
}

export default function Home() {
  const [timer, setTimer] = useState(3);
  const [countdown, setCountdown] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [layoutId, setLayoutId] = useState("four-grid");
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [customColor, setCustomColor] = useState("#ff4b91");
  const [photoBorderColor, setPhotoBorderColor] = useState("#ffffff");
  const [stickers, setStickers] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [streaming, setStreaming] = useState(false);
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [step, setStep] = useState("capture");
  const [mediaStream, setMediaStream] = useState(null);
  const [isShooting, setIsShooting] = useState(false);
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
      const photo = captureFrame();
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

  async function downloadStrip() {
    const output = currentOutput;
    const canvas = document.createElement("canvas");
    canvas.width = output.width;
    canvas.height = output.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, output.width, output.height);

    const loadedPhotos =
      photos.length > 0
        ? await Promise.all(
            currentLayout.slots.map((_, index) => (photos[index] ? loadImage(photos[index]) : null)),
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
      if (loadedPhotos[index]) fitImage(ctx, loadedPhotos[index], x, y, w, h);
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

    const link = document.createElement("a");
    link.download = "cute-photobooth.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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
        <h1>ตู้ถ่ายรูป Photo Booth Web | กล้องออนไลน์และสร้างรูปจากตู้สติ๊กเกอร์</h1>
        <p>
          ถ่ายรูปหรืออัปโหลดภาพ เลือกเส้นกริด ปรับแสงตอนถ่าย สีกรอบ และแปะสติ๊กเกอร์ที่ขยับ
          ปรับขนาด หมุน แล้วดาวน์โหลดได้ทันที
        </p>
      </section>

      <section className={`workbench ${isEditing ? "edit-mode" : "capture-mode"}`}>
        <aside className="toolbar" aria-label="เครื่องมือ">
          <button className="tool-button" onClick={() => setModal("layouts")} title="เส้นกริด">
            <Grid3X3 size={24} />
            <span>เส้นกริด</span>
          </button>
          {isEditing ? (
            <button className="tool-button" onClick={() => setModal("categories")} title="สติ๊กเกอร์">
              <Sticker size={24} />
              <span>สติ๊กเกอร์</span>
            </button>
          ) : (
            <button className="tool-button" onClick={() => setModal("lighting")} title="เรื่องแสง">
              <Palette size={24} />
              <span>เรื่องแสง</span>
            </button>
          )}
        </aside>

        <div className="strip-stage-wrap">
          <div className="capture-panel">
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
            className="strip-stage"
            style={{
              "--frame-color": frameColor,
              "--stage-aspect": `${currentOutput.width} / ${currentOutput.height}`,
              "--stage-ratio": currentOutput.width / currentOutput.height,
              "--photo-border-color": photoBorderColor ?? "transparent",
              "--photo-border-width": photoBorderColor ? "4px" : "0px",
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
                  <img src={photos[index]} alt={`photo ${index + 1}`} />
                ) : streaming && mediaStream ? (
                  <LiveSlotVideo stream={mediaStream} mirrored={mirrorCamera} />
                ) : (
                  <div className="slot-placeholder">PHOTO</div>
                )}
              </div>
            ))}
            {countdown ? <div className="countdown">{countdown}</div> : null}
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
              <img className="thumbnail" key={`${photo}-${index}`} src={photo} alt={`thumbnail ${index + 1}`} />
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
        <Modal title="เส้นกริด" onClose={() => setModal(null)}>
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
        <Modal title="หมวดสติ๊กเกอร์" onClose={() => setModal(null)}>
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

      {modal === "lighting" && (
        <Modal title="เรื่องแสง" onClose={() => setModal(null)}>
          <div className="panel-section">
            <p className="panel-label">เลือกสีพื้นหลังรอบตู้ถ่ายรูป</p>
            <div className="color-row">
              {["#fff9fb", "#fff35a", "#e8f7ff", "#f6edff", "#f4fff0"].map((color) => (
                <button
                  key={color}
                  className="swatch"
                  style={{ "--c": color }}
                  onClick={() => {
                    document.body.style.background = color;
                    setModal(null);
                  }}
                />
              ))}
            </div>
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
  return (
    <div className="mini-layout">
      {layout.slots.map((_, index) => (
        <span key={index} className="mini-cell" />
      ))}
    </div>
  );
}
