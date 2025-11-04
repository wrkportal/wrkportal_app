# Video Upload Feature - Complete Guide

## Overview

You can now **upload videos directly** to your server instead of only using YouTube URLs!

---

## Two Ways to Add Videos

### Option 1: YouTube URL (Recommended for large videos)
- Use YouTube embed URL format
- No file size limits
- Faster for users (uses YouTube's CDN)
- Better for mobile devices

### Option 2: Direct Upload (New!)
- Upload video files directly to your server
- Supported formats: MP4, WebM, OGG, MOV
- Maximum file size: 100MB
- Videos stored on your server

---

## How to Upload a Video

### Step-by-Step:

1. Navigate to **Admin** → **Tutorials**
2. Click **"Add Tutorial"**
3. Fill in the tutorial details
4. For **Type**, select **"Video"**
5. You'll see **TWO options**:

#### **Option A: YouTube URL**
```
Video URL (YouTube embed)
[Enter: https://www.youtube.com/embed/VIDEO_ID]
```

#### **Option B: Upload Video File**
```
--------- OR ---------

Upload Video File
[Choose File button]

Upload MP4, WebM, OGG, or MOV (Max 100MB)
```

6. Choose **one option** (YouTube URL OR upload file)
7. Click **"Create Tutorial"**

---

## Detailed: Uploading a Video File

### 1. Click "Choose File"
- Opens file browser
- Navigate to your video file

### 2. Select Video
- Choose your MP4, WebM, OGG, or MOV file
- Must be under 100MB

### 3. Upload Process
- Shows "Uploading video..." with spinner
- Wait for upload to complete

### 4. Confirmation
- Green checkmark appears: "✓ Uploaded: your-video.mp4"
- Video URL automatically filled in

### 5. Complete Form
- Fill in remaining tutorial details
- Click "Create Tutorial"

✅ **Done!** Video is now available to all users!

---

## Supported Video Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| MP4 | `.mp4` | ✅ Most compatible, recommended |
| WebM | `.webm` | ✅ Good for modern browsers |
| OGG | `.ogg` | ✅ Open source format |
| MOV | `.mov` | ✅ QuickTime format |

---

## File Size Limits

- **Maximum**: 100MB per video
- **Recommended**: 20-50MB for best performance

### Tips to Reduce File Size:
1. Compress video before uploading
2. Use 720p instead of 1080p
3. Reduce bitrate (1-2 Mbps is usually fine)
4. Use MP4 with H.264 codec

### Recommended Tools:
- **HandBrake** (free, cross-platform)
- **FFmpeg** (command-line)
- **Online**: CloudConvert, FreeConvert

---

## Where Videos Are Stored

Uploaded videos are saved to:
```
/public/uploads/videos/
```

### File Naming:
Videos are automatically renamed to prevent conflicts:
```
video-1234567890-abc123.mp4
```

Format: `video-[timestamp]-[random].ext`

---

## YouTube vs. Direct Upload

### Use YouTube When:
✅ Video is larger than 100MB  
✅ You want global CDN delivery  
✅ You already have videos on YouTube  
✅ You want YouTube's video player features  
✅ You want automatic transcoding  

### Use Direct Upload When:
✅ Video is under 100MB  
✅ You want full control over content  
✅ You have privacy concerns  
✅ You don't have YouTube account  
✅ Video contains proprietary content  

---

## Example: Complete Workflow

### Creating a Tutorial with Uploaded Video:

**Step 1: Prepare Your Video**
- Record your tutorial
- Edit if needed
- Export as MP4, 720p, under 100MB
- Example: "project-setup-tutorial.mp4" (45MB)

**Step 2: Navigate to Tutorial Management**
```
Sidebar → Admin → Tutorials → Add Tutorial
```

**Step 3: Fill Form**
```
Title: Creating Your First Project
Description: Learn how to set up a project
Type: Video
Duration: 8 min
Level: Beginner
Section: Project Management
Category: Getting Started
```

**Step 4: Upload Video**
- Click "Choose File" under "Upload Video File"
- Select "project-setup-tutorial.mp4"
- Wait for upload (shows progress)
- See confirmation: "✓ Uploaded: project-setup-tutorial.mp4"

**Step 5: Finish**
```
Order: 1
Published: ✓
```
- Click "Create Tutorial"

✅ **Result**: Users can now watch your video in the Academy!

---

## Video Player

Uploaded videos use HTML5 video player with:
- ▶️ Play/Pause
- 🔊 Volume control
- ⏩ Seek bar
- ⛶ Fullscreen
- 📱 Mobile-friendly

---

## Troubleshooting

### "File too large"
- ✓ Video must be under 100MB
- Compress your video
- Or use YouTube instead

### "Invalid file type"
- ✓ Must be MP4, WebM, OGG, or MOV
- Convert your video format
- Or use YouTube

### "Upload failed"
- ✓ Check internet connection
- ✓ Verify file isn't corrupted
- ✓ Try smaller file size
- ✓ Contact admin if persistent

### "Video not playing"
- ✓ Check file format compatibility
- ✓ Try different browser
- ✓ Clear browser cache
- ✓ Verify file uploaded successfully

---

## Advanced: Command-Line Upload

You can also upload videos via API:

```bash
curl -X POST http://your-domain.com/api/upload/video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@your-video.mp4"
```

Response:
```json
{
  "success": true,
  "fileUrl": "/uploads/videos/video-1234567890-abc123.mp4",
  "fileName": "your-video.mp4",
  "fileSize": 45678901
}
```

---

## Storage Management

### Disk Space Considerations:

**10 videos × 50MB = 500MB**
**100 videos × 50MB = 5GB**

### Best Practices:
1. Monitor disk usage regularly
2. Delete old/unused tutorials
3. Use YouTube for large videos
4. Implement backup strategy
5. Consider CDN for scaling

### Check Disk Usage:
```bash
# Linux/Mac
du -sh public/uploads/videos/

# Windows PowerShell
Get-ChildItem public\uploads\videos | Measure-Object -Property Length -Sum
```

---

## Security Features

✅ Only super admins can upload  
✅ File type validation  
✅ File size limits  
✅ Unique filenames prevent overwriting  
✅ Stored in public directory (read-only for users)  

---

## Future Enhancements

Possible improvements:
- [ ] Larger file size support
- [ ] Progress bar during upload
- [ ] Video thumbnail generation
- [ ] Cloud storage integration (S3, Azure)
- [ ] Video transcoding
- [ ] Multiple quality options
- [ ] Subtitle/caption support
- [ ] Video analytics

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| Max file size | 100MB |
| Supported formats | MP4, WebM, OGG, MOV |
| Storage location | `/public/uploads/videos/` |
| Access level | TENANT_SUPER_ADMIN only |
| Naming | Auto-generated unique names |
| Player | HTML5 native video player |

---

## FAQ

**Q: Can I upload videos larger than 100MB?**  
A: No, use YouTube for larger videos. You can compress videos to reduce size.

**Q: Can I replace an uploaded video?**  
A: Yes, edit the tutorial and upload a new video file.

**Q: Are uploaded videos backed up?**  
A: You need to backup the `/public/uploads/videos/` directory separately.

**Q: Can I delete uploaded videos?**  
A: When you delete a tutorial, the video file remains on disk. Manual cleanup needed.

**Q: Does this work with Vimeo?**  
A: Yes, use Vimeo embed URLs in the "Video URL" field instead of uploading.

**Q: Can users download videos?**  
A: Yes, uploaded videos can be downloaded by right-clicking. YouTube videos cannot.

---

**Happy uploading!** 🎥✨

