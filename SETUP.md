# 🎬 WebM to MP4 Converter - Setup Guide

## ✅ Project Setup Complete!

Your WebM to MP4 converter application is ready to use. Here's everything you need to know:

---

## 📁 Project Structure

```
Webm to mp4/
├── server/                 # Node.js + Express Backend
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   ├── uploads/           # Uploaded WebM files storage
│   └── converted/         # Converted MP4 files storage
│
├── client/                # React + TypeScript Frontend
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── main.tsx       # Entry point
│   │   └── styles.css     # All styling
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── index.html         # HTML template
│
├── start.sh               # Quick start script (runs both servers)
├── README.md              # Full documentation
└── SETUP.md               # This file
```

---

## 🚀 Quick Start (Recommended)

### Option 1: Using the Start Script

```bash
cd /Users/jitendrajahagirdar/Desktop/Webm\ to\ mp4
chmod +x start.sh
./start.sh
```

Then open your browser to: **http://localhost:3000**

### Option 2: Manual Start

**Terminal 1 - Start Backend:**

```bash
cd /Users/jitendrajahagirdar/Desktop/Webm\ to\ mp4/server
npm start
```

**Terminal 2 - Start Frontend:**

```bash
cd /Users/jitendrajahagirdar/Desktop/Webm\ to\ mp4/client
npm run dev
```

Then open: **http://localhost:3000**

---

## 📊 System Requirements

✅ **Node.js**: v14 or higher
✅ **FFmpeg**: Required for video conversion (already installed: /opt/homebrew/bin/ffmpeg)
✅ **npm**: Included with Node.js
✅ **Browser**: Any modern browser (Chrome, Firefox, Safari, Edge)

---

## 🎯 Features

### Converter Tab

- Upload WebM videos
- One-click conversion to MP4
- Real-time progress indicator
- Download converted files
- File size information

### Gallery Tab

- View all uploaded WebM files
- View all converted MP4 files
- See file sizes and timestamps
- Download any previous file
- Auto-refresh every 5 seconds

---

## 📝 How to Use

1. **Open Application**: Visit http://localhost:3000
2. **Upload Video**:
   - Click the upload area or select a WebM file
   - Only WebM format is accepted
3. **Convert**:
   - Click "🚀 Convert to MP4" button
   - Wait for conversion (progress bar shows status)
4. **Download**:
   - Click download in success message OR
   - Go to Gallery tab and download from there
5. **View History**:
   - Check Gallery tab to see all past uploads and conversions

---

## 🔧 API Endpoints

All endpoints are available at `http://localhost:5000/api/`

### POST /convert

- **Purpose**: Convert WebM to MP4
- **Input**: Form data with video file
- **Output**: Conversion status and download link

### GET /files

- **Purpose**: List all uploaded and converted files
- **Output**: Arrays of uploaded and converted files with metadata

### GET /download/:folder/:file

- **Purpose**: Download a specific file
- **Parameters**:
  - folder: `uploads` or `converted`
  - file: filename to download

### GET /health

- **Purpose**: Check server status
- **Output**: Server status

---

## 💾 File Storage

- **Uploads**: `/Users/jitendrajahagirdar/Desktop/Webm\ to\ mp4/server/uploads/`
- **Converted**: `/Users/jitendrajahagirdar/Desktop/Webm\ to\ mp4/server/converted/`

All files are persisted and organized by date. You can browse these folders to find your files.

---

## 🐛 Troubleshooting

### Problem: Port 3000 or 5000 already in use

**Solution**:

- Kill existing process:

```bash
# Find process
lsof -i :3000  # for frontend
lsof -i :5000  # for backend

# Kill process (replace PID with the number shown)
kill -9 PID
```

### Problem: "Cannot find ffmpeg"

**Solution**: FFmpeg is already installed at `/opt/homebrew/bin/ffmpeg`
If issue persists:

```bash
# Check installation
which ffmpeg

# Install if needed (macOS)
brew install ffmpeg
```

### Problem: Conversion fails

**Check**:

1. File is valid WebM format
2. Server has write permissions in uploads/ and converted/ directories
3. Check server console for error messages
4. Ensure FFmpeg is working: `ffmpeg -version`

### Problem: Frontend won't load

**Solution**:

1. Check if backend is running on port 5000
2. Check browser console for errors
3. Clear browser cache
4. Try different browser

---

## 🔐 Security Notes

- Only WebM files are accepted on upload
- File uploads are validated server-side
- Converted files are stored safely in separate folder
- No external uploads to internet
- All processing is local

---

## 📚 Technology Stack

### Backend

- **Express.js** - Web server framework
- **Node.js** - JavaScript runtime
- **Multer** - File upload handler
- **FFmpeg** - Video conversion engine
- **CORS** - Cross-origin support

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Vite** - Build tool
- **CSS3** - Modern styling

---

## 🎨 UI Features

- Modern gradient design
- Responsive layout (works on mobile, tablet, desktop)
- Smooth animations and transitions
- Real-time progress updates
- Clean file gallery
- Tab-based navigation

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server console for error messages
3. Ensure all prerequisites are installed
4. Try clearing browser cache
5. Restart both servers

---

## 🎉 Ready to Use!

Your application is fully set up and ready to convert WebM videos to MP4!

**Start the servers:**

```bash
cd /Users/jitendrajahagirdar/Desktop/Webm\ to\ mp4
./start.sh
```

**Open your browser:**

```
http://localhost:3000
```

Happy converting! 🎬✨
