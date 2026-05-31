import express from "express";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(join(__dirname, "uploads")));
app.use("/converted", express.static(join(__dirname, "converted")));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only WebM files are allowed"));
    }
  },
});

// Get video duration and metadata
app.post("/api/video-info", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    return new Promise((resolve) => {
      ffmpeg.ffprobe(req.file.path, (err, metadata) => {
        if (err) {
          res.status(500).json({ error: "Could not read video metadata" });
          resolve(null);
          return;
        }

        const duration = metadata.format.duration || 0;
        res.json({
          success: true,
          duration: Math.floor(duration),
          metadata: {
            format: metadata.format.format_name,
            size: metadata.format.size,
          },
        });
        resolve(null);
      });
    });
  } catch (error) {
    console.error("Error reading video info:", error);
    res.status(500).json({ error: error.message });
  }
});

// Convert video with optional trimming and audio extraction
app.post("/api/convert", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadPath = req.file.path;
    const fileName = path.basename(uploadPath, ".webm");
    const timestamp = Date.now();
    const convertedPath = join(
      __dirname,
      "converted",
      `${fileName}-${timestamp}.mp4`,
    );
    const convertedDir = join(__dirname, "converted");

    // Get parameters from request body
    const startTime = req.body.startTime ? parseFloat(req.body.startTime) : 0;
    const endTime = req.body.endTime ? parseFloat(req.body.endTime) : null;
    const extractAudio = req.body.extractAudio === "true";

    if (!fs.existsSync(convertedDir)) {
      fs.mkdirSync(convertedDir, { recursive: true });
    }

    // Build FFmpeg command
    return new Promise((resolve, reject) => {
      let command = ffmpeg(uploadPath);

      // Set start time if specified
      if (startTime > 0) {
        command = command.seekInput(startTime);
      }

      // Set duration if endTime is specified
      if (endTime && endTime > startTime) {
        const duration = endTime - startTime;
        command = command.duration(duration);
      }

      // Extract audio only or convert video
      if (extractAudio) {
        command = command
          .output(convertedPath)
          .audioCodec("aac")
          .noVideo()
          .audioFrequency(44100)
          .audioChannels(2);
      } else {
        command = command
          .output(convertedPath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions(["-crf 23", "-preset fast", "-movflags +faststart"]);
      }

      command
        .on("error", (error) => {
          console.error("FFmpeg error:", error);
          reject(error);
        })
        .on("end", () => {
          try {
            const stats = fs.statSync(convertedPath);
            const baseName = path.basename(convertedPath);

            res.json({
              success: true,
              message: extractAudio
                ? "Audio extraction successful"
                : "Conversion successful",
              originalFile: req.file.filename,
              convertedFile: baseName,
              originalSize: req.file.size,
              convertedSize: stats.size,
              downloadUrl: `/converted/${baseName}`,
              uploadedAt: new Date(Date.now()).toISOString(),
              trimmed: startTime > 0 || (endTime && endTime > startTime),
              trimInfo: extractAudio
                ? null
                : `Trimmed ${startTime}s - ${endTime || "end"}s`,
            });
            resolve(null);
          } catch (err) {
            reject(err);
          }
        })
        .run();
    });
  } catch (error) {
    console.error("Conversion error:", error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
    res.status(500).json({ error: error.message || "Conversion failed" });
  }
});

// Get uploaded files
app.get("/api/files", (req, res) => {
  try {
    const uploadPath = join(__dirname, "uploads");
    let uploadedFiles = [];

    if (fs.existsSync(uploadPath)) {
      uploadedFiles = fs.readdirSync(uploadPath).map((file) => {
        const filePath = join(uploadPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          uploadedAt: (
            stats.birthtime ||
            stats.mtime ||
            new Date()
          ).toISOString(),
          url: `/uploads/${file}`,
        };
      });
    }

    const convertedPath = join(__dirname, "converted");
    let convertedFiles = [];

    if (fs.existsSync(convertedPath)) {
      convertedFiles = fs.readdirSync(convertedPath).map((file) => {
        const filePath = join(convertedPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          convertedAt: (
            stats.birthtime ||
            stats.mtime ||
            new Date()
          ).toISOString(),
          url: `/converted/${file}`,
        };
      });
    }

    res.json({
      uploaded: uploadedFiles.sort((a, b) => {
        const dateA = new Date(a.uploadedAt).getTime();
        const dateB = new Date(b.uploadedAt).getTime();
        return dateB - dateA;
      }),
      converted: convertedFiles.sort((a, b) => {
        const dateA = new Date(a.convertedAt).getTime();
        const dateB = new Date(b.convertedAt).getTime();
        return dateB - dateA;
      }),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download file
app.get("/api/download/:folder/:file", (req, res) => {
  try {
    const { folder, file } = req.params;
    const filePath = join(__dirname, folder, decodeURIComponent(file));

    // Security check - ensure the file is within the intended folder
    const folderPath = join(__dirname, folder);
    if (!filePath.startsWith(folderPath) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete("/api/delete/:folder/:file", (req, res) => {
  try {
    const { folder, file } = req.params;
    if (folder !== "uploads" && folder !== "converted") {
      return res.status(400).json({ error: "Invalid folder" });
    }
    const folderPath = join(__dirname, folder);
    const filePath = join(folderPath, decodeURIComponent(file));
    if (!filePath.startsWith(folderPath)) {
      return res.status(400).json({ error: "Invalid file path" });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true, message: "File deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
