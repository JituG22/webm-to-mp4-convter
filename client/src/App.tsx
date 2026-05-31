import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles.css";

interface UploadedFile {
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface ConvertedFile {
  name: string;
  size: number;
  convertedAt: string;
  url: string;
}

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [activeTab, setActiveTab] = useState<"converter" | "gallery">(
    "converter",
  );

  // Last converted result
  const [lastConverted, setLastConverted] = useState<{
    name: string;
    downloadName: string;
    url: string;
    size: number;
  } | null>(null);

  // Delete confirm dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    folder: string;
    filename: string;
  } | null>(null);

  // Video editing state
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [extractAudio, setExtractAudio] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Raw text for the trim number inputs so users can freely clear/retype
  // without the field snapping back to a clamped value mid-edit.
  const [startInput, setStartInput] = useState("0");
  const [endInput, setEndInput] = useState("0");

  // Keep the text fields in sync when start/end change elsewhere (e.g. sliders),
  // but don't clobber an in-progress edit that already parses to the same number.
  useEffect(() => {
    if (parseFloat(startInput) !== startTime) setStartInput(String(startTime));
  }, [startTime]);
  useEffect(() => {
    if (parseFloat(endInput) !== endTime) setEndInput(String(endTime));
  }, [endTime]);

  // Position (0–100%) of a time value along the duration, for slider fills.
  const pct = (v: number) =>
    videoDuration > 0 ? Math.max(0, Math.min(100, (v / videoDuration) * 100)) : 0;

  // Load files on mount
  useEffect(() => {
    loadFiles();
    const interval = setInterval(loadFiles, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadFiles = async () => {
    try {
      const response = await axios.get("/api/files");
      setUploadedFiles(response.data.uploaded);
      setConvertedFiles(response.data.converted);
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "video/webm") {
        setFile(selectedFile);
        setMessage("");
        setMessageType("");
        setVideoDuration(0);
        setStartTime(0);
        setEndTime(0);
        setPreviewMode(false);
        getVideoInfo(selectedFile);
      } else {
        setMessage("Please select a WebM file");
        setMessageType("error");
        setFile(null);
      }
    }
  };

  const getVideoInfo = async (videoFile: File) => {
    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await axios.post("/api/video-info", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const duration = Number(response.data.duration) || 0;
        setVideoDuration(duration);
        setEndTime(duration);
        setPreviewMode(true);
      }
    } catch (error) {
      console.error("Error getting video info:", error);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a WebM file");
      setMessageType("error");
      return;
    }

    setConverting(true);
    setUploading(true);
    setConversionProgress(0);
    setMessage("");
    setLastConverted(null);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("startTime", (startTime ?? 0).toString());
      formData.append("endTime", (endTime ?? videoDuration).toString());
      formData.append("extractAudio", extractAudio.toString());

      const progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 89) return 89;
          return Math.min(prev + Math.random() * 10, 89);
        });
      }, 600);

      const response = await axios.post("/api/convert", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setConversionProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setLastConverted({
        name: response.data.convertedFile,
        downloadName: response.data.downloadName || response.data.convertedFile,
        url: response.data.downloadUrl,
        size: response.data.convertedSize,
      });
      setMessage(`✓ ${response.data.message}!`);
      setMessageType("success");
      setFile(null);

      const fileInput = document.getElementById(
        "fileInput",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      await loadFiles();

      setTimeout(() => {
        setConverting(false);
        setUploading(false);
        setConversionProgress(0);
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Conversion failed";
      setMessage(errorMessage);
      setMessageType("error");
      setConverting(false);
      setUploading(false);
      setConversionProgress(0);
    }
  };

  const formatTime = (seconds: number | null | undefined): string => {
    if (!seconds || seconds < 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes < 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const deleteFile = async (folder: string, filename: string) => {
    setConfirmDelete({ folder, filename });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await axios.delete(
        `/api/delete/${confirmDelete.folder}/${encodeURIComponent(confirmDelete.filename)}`,
      );
      await loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setConfirmDelete(null);
    }
  };

  // Disk filenames carry a unique timestamp to avoid collisions — uploads as a
  // leading "<timestamp>-" prefix ("1748699123-myvideo.webm") and converted
  // files as a trailing "-<timestamp>" suffix ("myvideo-1748699123.mp4"). Strip
  // either so the saved file matches what the user uploaded.
  const friendlyName = (diskName: string): string =>
    diskName
      .replace(/^\d{10,}-/, "")
      .replace(/-\d{10,}(\.[^.]+)$/, "$1");

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🎬 WebM to MP4 Converter</h1>
        <p>Convert WebM videos to MP4 with trimming & audio extraction</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "converter" ? "active" : ""}`}
          onClick={() => setActiveTab("converter")}
        >
          Converter
        </button>
        <button
          className={`tab-button ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          Gallery ({uploadedFiles.length + convertedFiles.length})
        </button>
      </nav>

      {activeTab === "converter" && (
        <main className="converter-section">
          <div className="converter-container">
            {/* ── Step 1 : Upload ── */}
            <div className="cv-step">
              <div className="cv-step-label">
                <span className="cv-step-num">1</span>
                <span>Select your WebM file</span>
              </div>
              <input
                id="fileInput"
                type="file"
                accept=".webm,video/webm"
                onChange={handleFileChange}
                disabled={converting}
                className="file-input"
              />
              <label
                htmlFor="fileInput"
                className={`cv-drop-zone ${file ? "cv-drop-zone--selected" : ""}`}
              >
                {file ? (
                  <div className="cv-file-preview">
                    <div className="cv-file-icon">🎥</div>
                    <div className="cv-file-meta">
                      <span className="cv-file-name" title={file.name}>
                        {file.name}
                      </span>
                      <div className="cv-file-chips">
                        <span className="cv-chip cv-chip--blue">
                          ⏱ {formatTime(videoDuration)}
                        </span>
                        <span className="cv-chip cv-chip--purple">
                          💾 {formatFileSize(file.size)}
                        </span>
                        <span className="cv-chip cv-chip--green">WebM</span>
                      </div>
                    </div>
                    <span className="cv-change-hint">click to change</span>
                  </div>
                ) : (
                  <div className="cv-drop-empty">
                    <div className="cv-drop-icon">📁</div>
                    <p className="cv-drop-title">Click to select WebM file</p>
                    <p className="cv-drop-sub">
                      or drag and drop · supports .webm only
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* ── Steps 2 & 3 : Trim + Options (side by side) ── */}
            {file && previewMode && (
              <div className="cv-editor-grid">
                <div className="cv-step">
                  <div className="cv-step-label">
                    <span className="cv-step-num">2</span>
                    <span>Trim (optional)</span>
                  </div>

                <div className="cv-editor-card">
                  <div className="cv-sliders">
                    {/* Start */}
                    <div className="cv-slider-row">
                      <span className="cv-slider-label">Start</span>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={startTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setStartTime(Math.max(0, Math.min(val, endTime)));
                        }}
                        className="cv-slider cv-slider--start"
                        style={{
                          background: `linear-gradient(to right, #667eea 0%, #667eea ${pct(startTime)}%, #d8dcf0 ${pct(startTime)}%, #d8dcf0 100%)`,
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={startInput}
                        onChange={(e) => {
                          setStartInput(e.target.value);
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val))
                            setStartTime(Math.max(0, Math.min(val, endTime)));
                        }}
                        onBlur={() => {
                          const val = parseFloat(startInput);
                          const clamped = isNaN(val)
                            ? 0
                            : Math.max(0, Math.min(val, endTime));
                          setStartTime(clamped);
                          setStartInput(String(clamped));
                        }}
                        className="cv-time-num"
                      />
                      <span className="cv-time-badge">
                        {formatTime(startTime)}
                      </span>
                    </div>

                    {/* End */}
                    <div className="cv-slider-row">
                      <span className="cv-slider-label">End</span>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={endTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEndTime(
                            Math.max(startTime, Math.min(val, videoDuration)),
                          );
                        }}
                        className="cv-slider cv-slider--end"
                        style={{
                          background: `linear-gradient(to right, #d8dcf0 0%, #d8dcf0 ${pct(startTime)}%, #764ba2 ${pct(startTime)}%, #764ba2 ${pct(endTime)}%, #d8dcf0 ${pct(endTime)}%, #d8dcf0 100%)`,
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={endInput}
                        onChange={(e) => {
                          setEndInput(e.target.value);
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val))
                            setEndTime(
                              Math.max(startTime, Math.min(val, videoDuration)),
                            );
                        }}
                        onBlur={() => {
                          const val = parseFloat(endInput);
                          const clamped = isNaN(val)
                            ? videoDuration
                            : Math.max(startTime, Math.min(val, videoDuration));
                          setEndTime(clamped);
                          setEndInput(String(clamped));
                        }}
                        className="cv-time-num"
                      />
                      <span className="cv-time-badge">
                        {formatTime(endTime)}
                      </span>
                    </div>
                  </div>

                  <div className="cv-trim-summary">
                    <div className="cv-summary-item">
                      <span className="cv-summary-icon">✂️</span>
                      <span className="cv-summary-val">
                        {formatTime(endTime - startTime)}
                      </span>
                      <span className="cv-summary-key">duration</span>
                    </div>
                    <div className="cv-summary-divider" />
                    <div className="cv-summary-item">
                      <span className="cv-summary-icon">💾</span>
                      <span className="cv-summary-val">
                        {formatFileSize(
                          Math.floor(
                            (file.size * (endTime - startTime)) / videoDuration,
                          ),
                        )}
                      </span>
                      <span className="cv-summary-key">approx. size</span>
                    </div>
                  </div>
                  </div>
                </div>

                {/* ── Step 3 : Options ── */}
                <div className="cv-step">
                  <div className="cv-step-label">
                    <span className="cv-step-num">3</span>
                    <span>Output options</span>
                  </div>
                <div className="cv-options-card">
                  <label className="cv-toggle-row">
                    <div className="cv-toggle-info">
                      <span className="cv-toggle-title">
                        🔊 Extract Audio Only
                      </span>
                      <span className="cv-toggle-desc">
                        Save just the audio track as an MP4 file
                      </span>
                    </div>
                    <div
                      className={`cv-toggle-switch ${extractAudio ? "cv-toggle-switch--on" : ""}`}
                      onClick={() =>
                        !converting && setExtractAudio(!extractAudio)
                      }
                      role="switch"
                      aria-checked={extractAudio}
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === " " &&
                        !converting &&
                        setExtractAudio(!extractAudio)
                      }
                    >
                      <span className="cv-toggle-knob" />
                    </div>
                  </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── Convert Button ── */}
            <form onSubmit={handleConvert}>
              <button
                type="submit"
                className={`cv-convert-btn ${converting ? "cv-convert-btn--active" : ""}`}
                disabled={!file || converting || !previewMode}
              >
                {converting ? (
                  <>
                    <span className="cv-spinner" />
                    Converting…
                  </>
                ) : extractAudio ? (
                  <>🔊 Extract Audio</>
                ) : (
                  <>🚀 Convert to MP4</>
                )}
              </button>
            </form>

            {/* ── Progress ── */}
            {uploading && (
              <div className="cv-progress-wrap">
                <div className="cv-progress-header">
                  <span>
                    {conversionProgress >= 100 ? "✅ Done!" : "⏳ Converting…"}
                  </span>
                  <span className="cv-progress-pct">
                    {conversionProgress >= 100
                      ? "100%"
                      : `${Math.min(Math.round(conversionProgress), 99)}%`}
                  </span>
                </div>
                <div className="cv-progress-track">
                  <div
                    className="cv-progress-fill"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── Status message ── */}
            {message && (
              <div className={`message ${messageType}`}>{message}</div>
            )}

            {/* ── Result card ── */}
            {lastConverted && (
              <div className="cv-result-card">
                <div className="cv-result-left">
                  <div className="cv-result-icon">🎬</div>
                  <div className="cv-result-info">
                    <span className="cv-result-name" title={lastConverted.name}>
                      {lastConverted.name}
                    </span>
                    <span className="cv-result-size">
                      {formatFileSize(lastConverted.size)}
                    </span>
                  </div>
                </div>
                <div className="cv-result-actions">
                  <button
                    className="cv-result-btn cv-result-btn--play"
                    onClick={() => window.open(lastConverted.url, "_blank")}
                  >
                    ▶ Play
                  </button>
                  <button
                    className="cv-result-btn cv-result-btn--dl"
                    onClick={() =>
                      downloadFile(lastConverted.url, lastConverted.downloadName)
                    }
                  >
                    ⬇ Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {activeTab === "gallery" && (
        <main className="gallery-section">
          <div className="gallery-container">
            {/* Uploaded WebM */}
            <section className="gallery-part">
              <div className="gallery-part-header">
                <span className="gallery-part-title">
                  📤 Uploaded WebM Files
                </span>
                <span className="gallery-count webm-count">
                  {uploadedFiles.length}
                </span>
              </div>
              {uploadedFiles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📂</div>
                  <p>No uploaded files yet</p>
                  <small>Upload a WebM file to get started</small>
                </div>
              ) : (
                <div className="file-list">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="file-row webm-row">
                      <div className="file-row-badge webm-badge">WebM</div>
                      <div className="file-row-icon">🎥</div>
                      <div className="file-row-info">
                        <span className="file-row-name" title={file.name}>
                          {file.name}
                        </span>
                        <div className="file-row-meta">
                          <span className="meta-chip size-chip">
                            💾 {formatFileSize(file.size)}
                          </span>
                          <span className="meta-chip date-chip">
                            🕒 {formatDate(file.uploadedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="file-row-actions">
                        <button
                          className="action-btn download-action"
                          onClick={() =>
                            downloadFile(file.url, friendlyName(file.name))
                          }
                          title="Download"
                        >
                          ⬇ Download
                        </button>
                        <button
                          className="action-btn delete-action"
                          onClick={() => deleteFile("uploads", file.name)}
                          title="Delete"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Converted MP4 */}
            <section className="gallery-part">
              <div className="gallery-part-header">
                <span className="gallery-part-title">
                  📥 Converted MP4 Files
                </span>
                <span className="gallery-count mp4-count">
                  {convertedFiles.length}
                </span>
              </div>
              {convertedFiles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎬</div>
                  <p>No converted files yet</p>
                  <small>Convert a WebM file to see it here</small>
                </div>
              ) : (
                <div className="file-list">
                  {convertedFiles.map((file, index) => (
                    <div key={index} className="file-row mp4-row">
                      <div className="file-row-badge mp4-badge">MP4</div>
                      <div className="file-row-icon">🎬</div>
                      <div className="file-row-info">
                        <span className="file-row-name" title={file.name}>
                          {file.name}
                        </span>
                        <div className="file-row-meta">
                          <span className="meta-chip size-chip">
                            💾 {formatFileSize(file.size)}
                          </span>
                          <span className="meta-chip date-chip">
                            🕒 {formatDate(file.convertedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="file-row-actions">
                        <button
                          className="action-btn play-action"
                          onClick={() => window.open(file.url, "_blank")}
                          title="Play"
                        >
                          ▶ Play
                        </button>
                        <button
                          className="action-btn download-action"
                          onClick={() =>
                            downloadFile(file.url, friendlyName(file.name))
                          }
                          title="Download"
                        >
                          ⬇ Download
                        </button>
                        <button
                          className="action-btn delete-action"
                          onClick={() => deleteFile("converted", file.name)}
                          title="Delete"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      <footer className="footer">
        <p>© 2024 WebM to MP4 Converter | Powered by FFmpeg</p>
      </footer>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete File?</h3>
            <p className="confirm-filename" title={confirmDelete.filename}>
              {confirmDelete.filename}
            </p>
            <p className="confirm-warning">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button className="confirm-delete" onClick={confirmDeleteAction}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
