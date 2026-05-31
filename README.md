# WebM to MP4 Converter

A full-stack web application for converting WebM videos to MP4 format with a beautiful React TypeScript frontend and Node.js backend.

## Features

✅ **Easy WebM to MP4 Conversion** - Simply upload and convert
✅ **Gallery View** - See all uploaded and converted videos
✅ **File Management** - Separate folders for uploads and converted files
✅ **Download Support** - Download original and converted files
✅ **Session Persistence** - All files are persisted for future reference
✅ **Real-time Updates** - Gallery refreshes automatically
✅ **Beautiful UI** - Modern, responsive design with gradient backgrounds

## Project Structure

```
Webm to mp4/
├── server/              # Node.js backend
│   ├── index.js        # Express server
│   ├── package.json    # Server dependencies
│   ├── uploads/        # Uploaded WebM files
│   └── converted/      # Converted MP4 files
│
└── client/             # React TypeScript frontend
    ├── src/
    │   ├── main.tsx    # Entry point
    │   ├── App.tsx     # Main component
    │   └── styles.css  # Styling
    ├── package.json    # Client dependencies
    ├── tsconfig.json   # TypeScript config
    ├── vite.config.ts  # Vite config
    └── index.html      # HTML template
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

### Backend Setup

```bash
cd server
npm install
```

### Frontend Setup

```bash
cd client
npm install
```

## Usage

### Start the Backend Server

```bash
cd server
npm start
```

The server will run on `http://localhost:5000`

### Start the Frontend Development Server

In a new terminal:

```bash
cd client
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Convert Video

**POST** `/api/convert`

- Upload a WebM file
- Returns: Conversion status and download link

### Get Files

**GET** `/api/files`

- Returns: List of uploaded and converted files

### Download File

**GET** `/api/download/:folder/:file`

- Download a specific file
- Folder can be: `uploads` or `converted`

### Health Check

**GET** `/api/health`

- Returns: Server status

## How to Use

1. Open the application at `http://localhost:3000`
2. Go to the **Converter** tab
3. Click on the upload area or select a WebM file
4. Click **Convert to MP4** button
5. Wait for conversion to complete
6. Download the converted MP4 file
7. View all files in the **Gallery** tab

## File Storage

- **Uploaded Files**: `/server/uploads/` - Original WebM files
- **Converted Files**: `/server/converted/` - MP4 files after conversion
- All files are persisted and can be downloaded anytime

## Dependencies

### Backend

- **express** - Web framework
- **cors** - Cross-origin requests
- **multer** - File upload handling
- **webm-to-mp4** - WebM to MP4 conversion

### Frontend

- **react** - UI library
- **typescript** - Type safety
- **axios** - HTTP client
- **vite** - Build tool

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- Only WebM files are accepted for conversion
- Converted files are stored on the server for persistence
- Files are organized by upload and conversion date
- The application supports viewing file size and timestamps

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

- Frontend: Modify `vite.config.ts` and change the port
- Backend: Modify `index.js` and change the PORT variable

### Conversion Fails

- Ensure the file is a valid WebM format
- Check if the server has write permissions in `uploads/` and `converted/` directories
- Check server console for detailed error messages

## License

MIT
# webm-to-mp4-convter
# webm-to-mp4-convter
