import fs from 'fs';
import { Readable } from 'stream';
import { google } from 'googleapis';
import { robotDrive } from '../utils/robotDrive.js'; // Import robotDrive instance
import { Note } from '../models/Note.js';
import { History } from '../models/History.js';
import { NoteChunk } from '../models/NoteChunk.js'; 

// --- AI Services ---
import { processNoteQueue } from '../services/ContentProcessor.js';
import { generateEmbedding } from '../services/AIService.js';

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
// 1. READ OPERATIONS
// ==========================================

export const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({ moderationStatus: { $ne: 'blocked' } })
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
    const filter = { moderationStatus: { $ne: 'blocked' } };
    
    const topNotes = await Note.find(filter)
      .populate('uploader', 'name')
      .sort({ avgRating: -1 })
      .limit(3);
      
    const latestNotes = await Note.find(filter)
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

// --- A. UPLOAD LOCAL FILE ---
export const uploadLocalFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    
    console.log(`[Upload] Starting local upload: ${req.file.originalname}`);
    const { name, subject, semester, tags } = req.body;

    let parsedTags = [];
    if (tags) {
        try { parsedTags = JSON.parse(tags); } catch (e) { parsedTags = [tags]; }
    }

    // Upload to Drive
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

    // Cleanup
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    // Permission
    await makeFilePublic(response.data.id);

    // Determine Type
    const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';

    // Save DB
    const newNote = new Note({
      title: name || req.file.originalname,
      subject,
      semester,
      uploader: req.user.id,
      googleDriveFileId: response.data.id,
      websiteUrl: response.data.webViewLink,
      thumbnailUrl: response.data.thumbnailLink, 
      tags: parsedTags,
      
      // AI Fields
      fileType: fileType,
      fileUrl: response.data.id, 
      driveFileId: response.data.id, 
      moderationStatus: 'pending' 
    });

    await newNote.save();

    // Trigger AI
    processNoteQueue(newNote._id);

    res.status(201).json({ message: 'Uploaded successfully', note: newNote });

  } catch (error) {
    console.error('Local Upload Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Upload failed', detail: error.message });
  }
};

// --- B. IMPORT FROM DRIVE ---
export const importFromDrive = async (req, res) => {
  try {
    console.log("[Import] Request received");
    const { userFileId, googleToken, name, subject, semester, tags, cleanup } = req.body;

    // 1. Auth as User to read file
    const userAuth = new google.auth.OAuth2();
    userAuth.setCredentials({ access_token: googleToken });
    const userDrive = google.drive({ version: 'v3', auth: userAuth });

    // 2. Get Stream
    let sourceStream;
    try {
      const streamRes = await userDrive.files.get(
        { fileId: userFileId, alt: 'media' },
        { responseType: 'stream' }
      );
      sourceStream = streamRes.data;
    } catch (streamErr) {
      console.error("[Import] Failed to read user file:", streamErr.message);
      return res.status(400).json({ message: 'Could not read file from user drive.', detail: streamErr.message });
    }

    // 3. Upload to Robot Drive
    let robotFile;
    try {
      robotFile = await robotDrive.files.create({
        requestBody: { 
            name: name || "Imported File", 
            parents: [CENTRAL_FOLDER_ID] 
        },
        media: { body: sourceStream },
        fields: "id, webViewLink, thumbnailLink",
      });
    } catch (uploadErr) {
      console.error("[Import] Robot upload failed:", uploadErr.message);
      return res.status(500).json({ message: "Robot drive upload failed", detail: uploadErr.message });
    }

    await makeFilePublic(robotFile.data.id);

    // 4. Save DB
    let newNote = new Note({
        title: name,
        subject,
        semester,
        uploader: req.user.id,
        googleDriveFileId: robotFile.data.id,
        websiteUrl: robotFile.data.webViewLink,
        thumbnailUrl: robotFile.data.thumbnailLink,
        tags: Array.isArray(tags) ? tags : [],
        
        // AI Fields (Default to pdf for imports, AI will verify)
        fileType: 'pdf', 
        fileUrl: robotFile.data.id,
        driveFileId: robotFile.data.id,
        moderationStatus: 'pending'
    });

    await newNote.save();

    // 5. Trigger AI
    console.log(`[Import] Triggering AI for Note: ${newNote._id}`);
    processNoteQueue(newNote._id);

    if (cleanup) {
      try { await userDrive.files.delete({ fileId: userFileId }); } 
      catch (e) { console.warn("Cleanup warning:", e.message); }
    }

    return res.status(201).json({ message: "Imported successfully", note: newNote });

  } catch (err) {
    console.error("Drive Import Global Error:", err);
    return res.status(500).json({ message: "Import failed", detail: err.message });
  }
};

// --- C. SAVE VIDEO REFERENCE ---
export const saveDriveReference = async (req, res) => {
  try {
    const { videoUrl, name, subject, semester, tags } = req.body;

    console.log("Creating .url file for:", videoUrl);

    let parsedTags = [];
    try { parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags; } catch { parsedTags = [tags]; }

    const fileContent = `[InternetShortcut]\nURL=${videoUrl}`;
    const mediaStream = Readable.from([fileContent]);

    const response = await robotDrive.files.create({
      requestBody: {
        name: `${name || 'Video Link'}.url`,
        parents: [CENTRAL_FOLDER_ID],
        mimeType: 'text/plain',
        description: `Video Link: ${videoUrl}`
      },
      media: { mimeType: 'text/plain', body: mediaStream },
      fields: 'id, webViewLink, thumbnailLink',
    });

    await makeFilePublic(response.data.id);

    const newNote = new Note({
      title: name || 'Video Resource',
      subject,
      semester,
      uploader: req.user.id,
      videoUrl,
      googleDriveFileId: response.data.id,
      websiteUrl: response.data.webViewLink,
      thumbnailUrl: response.data.thumbnailLink,
      tags: parsedTags,

      fileType: 'video_link',
      fileUrl: videoUrl,
      driveFileId: response.data.id,
      moderationStatus: 'pending'
    });

    await newNote.save();

    processNoteQueue(newNote._id);

    return res.status(201).json({ message: 'Video saved.', note: newNote });

  } catch (err) {
    console.error('Save Video Error:', err);
    return res.status(500).json({ message: 'Server error saving video.', detail: err.message });
  }
};

// ==========================================
// 3. SEARCH OPERATIONS
// ==========================================

export const searchNotes = async (req, res) => {
  const { q, type } = req.query; 

  if (!q) return res.status(400).json({ message: "Query required" });

  try {
    // SEMANTIC SEARCH
    if (type === 'semantic') {
       console.log(`[Search] Running semantic search for: "${q}"`);
       
       const queryVector = await generateEmbedding(q);
       if (!queryVector) return res.status(500).json({ message: "AI Embedding failed" });

       // Atlas Vector Search
       const results = await NoteChunk.aggregate([
         {
           "$vectorSearch": {
             "index": "vector_index", 
             "path": "embedding",
             "queryVector": queryVector,
             "numCandidates": 100,
             "limit": 10
           }
         },
         {
           "$project": {
             "_id": 0,
             "noteId": 1,
             "chunkText": 1,
             "score": { "$meta": "vectorSearchScore" }
           }
         },
         {
           "$lookup": {
             "from": "notes",
             "localField": "noteId",
             "foreignField": "_id",
             "as": "note"
           }
         },
         { "$unwind": "$note" },
         { "$match": { "note.moderationStatus": { "$ne": "blocked" } } }
       ]);

       return res.status(200).json(results);
    } 
    
    // BASIC KEYWORD SEARCH
    else {
      const regex = new RegExp(q, 'i');
      const results = await Note.find({
        $or: [{ title: regex }, { subject: regex }, { tags: regex }],
        moderationStatus: { $ne: 'blocked' }
      }).populate('uploader', 'name');
      
      return res.status(200).json(results);
    }

  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};

// ==========================================
// 4. DETAIL & INTERACTION
// ==========================================

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('uploader', 'name');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    if (note.moderationStatus === 'blocked' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'This content has been blocked by moderation.' });
    }

    return res.status(200).json(note);
  } catch (err) {
    console.error('Get Note Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Note.aggregate([
      { $match: { moderationStatus: { $ne: 'blocked' } } },
      {
        $group: {
          _id: "$uploader",
          totalNotes: { $sum: 1 },
          avgRating: { $avg: "$avgRating" },
          totalDownloads: { $sum: "$downloads" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          name: "$userInfo.name",
          department: "MCA",
          notes: "$totalNotes",
          downloads: "$totalDownloads",
          rating: { $ifNull: [{ $round: ["$avgRating", 1] }, 0] },
          score: { 
            $add: [
                { $multiply: ["$totalNotes", 10] }, 
                "$totalDownloads", 
                { $multiply: [{ $ifNull: ["$avgRating", 0] }, 5] }
            ] 
          } 
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 }
    ]);

    return res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Leaderboard Error:', err);
    return res.status(500).json({ message: 'Failed to fetch leaderboard.' });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .populate({
        path: 'note',
        populate: { path: 'uploader', select: 'name' }
      })
      .sort({ lastAccessed: -1 });

    const validHistory = history.filter(item => 
        item.note !== null && item.note.moderationStatus !== 'blocked'
    );

    return res.status(200).json(validHistory);
  } catch (err) {
    console.error('Get History Error:', err);
    return res.status(500).json({ message: 'Failed to fetch history' });
  }
};

export const trackDownload = async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findByIdAndUpdate(
      noteId, 
      { $inc: { downloads: 1 } }, 
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Note not found" });

    if (req.user && req.user.id) {
        try {
            await History.findOneAndUpdate(
                { user: req.user.id, note: noteId },
                { lastAccessed: new Date() },
                { upsert: true, new: true } 
            );
        } catch (dbErr) {
            console.error(`Database Save Error:`, dbErr);
        }
    }

    return res.status(200).json({ downloads: note.downloads });
  } catch (err) {
    console.error('Track Download Error:', err);
    return res.status(500).json({ message: 'Error tracking download' });
  }
};

export const cleanupDriveFile = async (req, res) => {
    try {
        const { fileId, googleToken } = req.body;
        if (!fileId || !googleToken) return res.status(400).json({ message: "Missing parameters" });

        await google.drive('v3').files.delete({
            fileId,
            auth: new google.auth.OAuth2().setCredentials({ access_token: googleToken })
        }); // Use client side token indirectly if needed, or better use client to delete.
        // Actually, for cleanup, it's safer to just return 200 and let client handle or ignore.
        // Backend deletion requires user token passed correctly.
        
        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        // console.error("[Cleanup] Error:", error.message);
        res.status(200).json({ message: "Cleanup failed but ignored" });
    }
};