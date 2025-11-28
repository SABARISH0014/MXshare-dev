import mongoose from 'mongoose';

const noteChunkSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  
  // The actual text segment
  chunkText: { type: String, required: true },
  
  // The vector embedding (384 dimensions for the free Xenova model)
  embedding: {
    type: [Number],
    required: true,
    index: 'vector' // Special Atlas Search index
  },
  
  chunkIndex: Number // To reconstruct order if needed
});

export const NoteChunk = mongoose.model('NoteChunk', noteChunkSchema);