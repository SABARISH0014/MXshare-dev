import fs from 'fs';
import { google } from 'googleapis';
import { Readable } from 'stream'; // <--- THIS IS THE FIX
import { robotDrive } from '../utils/robotDrive.js';
import { Note } from '../models/Note.js';

const CENTRAL_FOLDER_ID = process.env.CENTRAL_FOLDER_ID;

// --- HELPER: Permissions ---
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
export const uploadLocalFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    
    const { name, subject, semester, tags } = req.body;

    // Robust Tag Parsing
    let parsedTags = [];
    if (tags) {
        try {
            parsedTags = JSON.parse(tags);
        } catch (e) {
            parsedTags = [tags]; // Fallback if it's just a string
        }
    }

    // Upload Stream to Robot Drive
    const response = await robotDrive.files.create({
      requestBody: {
        name: name || req.file.originalname,
        parents: [CENTRAL_FOLDER_ID],
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      },
      fields: 'id, webViewLink, thumbnailLink', 
    });

    // Cleanup local temp file
    if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    // Set Permissions
    await makeFilePublic(response.data.id);

    // Save Metadata to MongoDB
    const newNote = new Note({
      title: name || req.file.originalname,
      subject,
      semester,
      uploader: req.user.id,
      googleDriveFileId: response.data.id,
      websiteUrl: response.data.webViewLink,
      thumbnailUrl: response.data.thumbnailLink, 
      tags: parsedTags,
    });

    await newNote.save();

    if (req.io) {
        req.io.emit('fileUploaded', { 
            message: `New material: ${newNote.title}`, 
            note: newNote 
        });
    }

    res.status(201).json({ message: 'Uploaded successfully', note: newNote });

  } catch (error) {
    console.error('Local Upload Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Upload failed', detail: error.message });
  }
};

// --- B. IMPORT FROM DRIVE (User Drive -> Robot Drive) ---
export const importFromDrive = async (req, res) => {
  try {
    // Note: 'cleanup' flag is extracted if passed from frontend
    const { userFileId, googleToken, name, subject, semester, tags, cleanup } = req.body;

    // Authenticate as USER to read
    const userAuth = new google.auth.OAuth2();
    userAuth.setCredentials({ access_token: googleToken });
    const userDrive = google.drive({ version: 'v3', auth: userAuth });

    // Get stream
    const sourceStream = await userDrive.files.get(
      { fileId: userFileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Write stream to Robot Drive
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

    await makeFilePublic(response.data.id);

    const newNote = new Note({
      title: name,
      subject,
      semester,
      uploader: req.user.id,
      googleDriveFileId: response.data.id,
      websiteUrl: response.data.webViewLink,
      thumbnailUrl: response.data.thumbnailLink,
      tags: tags || [], 
    });

    await newNote.save();

    // CLEANUP: Delete from User Drive if requested
    if (cleanup) {
        try {
            await userDrive.files.delete({ fileId: userFileId });
            console.log(`Cleaned up file from user drive: ${userFileId}`);
        } catch (e) {
            console.warn("Cleanup warning (User might lack 'drive.file' scope):", e.message);
        }
    }

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

// --- C. SAVE VIDEO REFERENCE ---
export const saveDriveReference = async (req, res) => {
    try {
      const { videoUrl, name, subject, semester, tags } = req.body;
      
      console.log("Creating .url file for:", videoUrl);

      // 1. Create the content of an Internet Shortcut file
      // This format is recognized by Windows/Mac/Drive as a link
      const fileContent = `[InternetShortcut]\nURL=${videoUrl}`;
      
      // 2. Convert that string into a Stream (like a real file)
      const mediaStream = Readable.from([fileContent]);

      // 3. Upload the Stream to Robot Drive
      const response = await robotDrive.files.create({
        requestBody: {
          name: `${name || 'Video Link'}.url`, // Must end in .url
          parents: [CENTRAL_FOLDER_ID],
          mimeType: 'text/plain', // Plain text allows previewing the link content
          description: `Video Link: ${videoUrl}`
        },
        media: {
          mimeType: 'text/plain',
          body: mediaStream
        },
        fields: 'id, webViewLink, thumbnailLink', 
      });

      // 4. Set Permissions (Public Read)
      try {
        await robotDrive.permissions.create({
          fileId: response.data.id,
          requestBody: { role: 'reader', type: 'anyone' },
        });
      } catch (pErr) {
          console.warn("Perms warning:", pErr.message);
      }
  
      // 5. Save to MongoDB
      const newNote = new Note({
        title: name || 'Video Resource',
        subject,
        semester,
        uploader: req.user.id,
        
        // Save BOTH the original link AND the Drive File ID
        videoUrl: videoUrl,
        googleDriveFileId: response.data.id,
        websiteUrl: response.data.webViewLink, // This opens the file in Drive
        thumbnailUrl: response.data.thumbnailLink,
        
        tags: tags ? JSON.parse(tags) : [],
      });
  
      await newNote.save();

      if (req.io) {
        req.io.emit('fileUploaded', { 
            message: `New video: ${newNote.title}`, 
            note: newNote 
        });
      }

      return res.status(201).json({ message: 'Video saved as file in Drive & DB.', note: newNote });
  
    } catch (err) {
      console.error('Save Video Error:', err);
      return res.status(500).json({ message: 'Server error saving video.', detail: err.message });
    }
};