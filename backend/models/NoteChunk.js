import mongoose from 'mongoose';

const noteChunkSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  
  // The specific segment of text used for this embedding
  chunkText: { type: String, required: true },
  
  // Vector embedding (Dimensions depend on model, Nomic is usually 768)
  embedding: {
    type: [Number],
    required: true,
    index: 'vector' // Requires MongoDB Atlas Vector Search Index
  },
  
  chunkIndex: { type: Number, required: true } // To maintain order
});

export const NoteChunk = mongoose.model('NoteChunk', noteChunkSchema);