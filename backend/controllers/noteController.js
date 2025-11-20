import fs from 'fs';
import { google } from 'googleapis';
import { robotDrive } from '../utils/robotDrive.js';
import { Note } from '../models/Note.js';

const CENTRAL_FOLDER_ID = process.env.CENTRAL_FOLDER_ID;

// --- HELPER: Permissions ---
// This ensures students can actually view/download the file after it's stored.
const makeFilePublic = async (fileId) => {
  try {
    await robotDrive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  } catch (err) {
    console.warn(`Warning: Could not make file ${fileId} public.`, err.message);
  }
};

// ==========================================
// 1. READ OPERATIONS (Get Notes)
// ==========================================

export const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('uploader', 'name')
      .sort({ createdAt: -1 });
    return res.status(200).json(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    return res.status(500).json({ message: 'Failed to fetch notes.' });
  }
};

export const getHomepageNotes = async (req, res) => {
  try {
    const topNotes = await Note.find()
      .populate('uploader', 'name')
      .sort({ avgRating: -1 })
      .limit(3);
    const latestNotes = await Note.find()
      .populate('uploader', 'name')
      .sort({ createdAt: -1 })
      .limit(3);
    return res.status(200).json({ topNotes, latestNotes });
  } catch (err) {
    console.error('Homepage notes error:', err);
    return res.status(500).json({ message: 'Failed to fetch homepage notes.' });
  }
};

// ==========================================
// 2. WRITE OPERATIONS (Uploads)
// ==========================================

// --- A. UPLOAD LOCAL FILE (Computer -> Server -> Robot Drive) ---
// This is used when the user selects "Computer" in the UI.
export const uploadLocalFile = async (req, res) => {
  try {
    // 1. Check if Multer received the file
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    
    const { name, subject, semester, tags } = req.body;

    // 2. Upload Stream to Robot Drive (Central Storage)
    const response = await robotDrive.files.create({
      requestBody: {
        name: name || req.file.originalname,
        parents: [CENTRAL_FOLDER_ID],
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      },
      // We request 'webViewLink' (for users to click) and 'thumbnailLink' (for previews)
      fields: 'id, webViewLink, thumbnailLink', 
    });

    // 3. Cleanup local temp file (Important!)
    if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    // 4. Set Public Permissions
    await makeFilePublic(response.data.id);

    // 5. Save Metadata to MongoDB
    const newNote = new Note({
      title: name || req.file.originalname,
      subject,
      semester,
      uploader: req.user.id,
      googleDriveFileId: response.data.id,
      websiteUrl: response.data.webViewLink,
      // If your Note schema supports thumbnails, save it here:
      // thumbnailUrl: response.data.thumbnailLink, 
      tags: tags ? JSON.parse(tags) : [], // Tags come as string from FormData
    });

    await newNote.save();

    // 6. Notify via Socket.IO (Optional)
    if (req.io) {
        req.io.emit('fileUploaded', { 
            message: `New material: ${newNote.title}`, 
            note: newNote 
        });
    }

    res.status(201).json({ message: 'Uploaded successfully', note: newNote });

  } catch (error) {
    console.error('Local Upload Error:', error);
    // Cleanup temp file if upload crashed
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Upload failed', detail: error.message });
  }
};

// --- B. IMPORT FROM DRIVE (User Drive -> Robot Drive) ---
// This is used when the user selects "Google Drive" Picker in the UI.
export const importFromDrive = async (req, res) => {
  try {
    const { userFileId, googleToken, name, subject, semester, tags } = req.body;

    // 1. Authenticate as the USER to read the file
    const userAuth = new google.auth.OAuth2();
    userAuth.setCredentials({ access_token: googleToken });
    const userDrive = google.drive({ version: 'v3', auth: userAuth });

    // 2. Get the file stream
    const sourceStream = await userDrive.files.get(
      { fileId: userFileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // 3. Pipe Stream to Robot Drive (Cloning)
    const response = await robotDrive.files.create({
      requestBody: {
        name: name || 'Imported File',
        parents: [CENTRAL_FOLDER_ID],
      },
      media: {
        body: sourceStream.data,
      },
      fields: 'id, webViewLink, thumbnailLink',
    });

    // 4. Set Public Permissions
    await makeFilePublic(response.data.id);

    // 5. Save Metadata to MongoDB
    const newNote = new Note({
      title: name,
      subject,
      semester,
      uploader: req.user.id,
      googleDriveFileId: response.data.id,
      websiteUrl: response.data.webViewLink,
      tags: tags || [], // Tags come as JSON array from body
    });

    await newNote.save();

    if (req.io) {
        req.io.emit('fileUploaded', { 
            message: `Imported material: ${newNote.title}`, 
            note: newNote 
        });
    }

    res.status(201).json({ message: 'Imported successfully', note: newNote });

  } catch (error) {
    console.error('Drive Import Error:', error);
    res.status(500).json({ message: 'Import failed', detail: error.message });
  }
};

// --- C. SAVE VIDEO REFERENCE (Link Only) ---
export const saveDriveReference = async (req, res) => {
    try {
      const { videoUrl, name, subject, semester, tags } = req.body;
  
      const newNote = new Note({
        title: name || 'Video Resource',
        subject,
        semester,
        uploader: req.user.id,
        videoUrl: videoUrl,
        websiteUrl: videoUrl, // For videos, the "website" is the video itself
        tags: tags || [],
      });
  
      await newNote.save();

      if (req.io) {
        req.io.emit('fileUploaded', { 
            message: `New video: ${newNote.title}`, 
            note: newNote 
        });
      }

      return res.status(201).json({ message: 'Video saved successfully.', note: newNote });
  
    } catch (err) {
      console.error('Save Video Error:', err);
      return res.status(500).json({ message: 'Server error saving video.', detail: err.message });
    }
};