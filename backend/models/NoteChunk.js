import mongoose from 'mongoose';

const noteChunkSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  
  // The specific segment of text used for this embedding
  chunkText: { type: String, required: true },
  
  // Vector embedding (Dimensions depend on model, Nomic is usually 768)
  embedding: {
    type: [Number],
    required: true,
    // Note: The actual vector index is created in MongoDB Atlas Search definition
  },
  
  chunkIndex: { type: Number, required: true }, // To maintain order

  // ==================================================
  // 🔥 NEW FIELDS FOR PRE-FILTERING (Denormalized)
  // ==================================================
  // We copy these from the parent Note so the Vector Search 
  // can filter by them *inside* the vector query efficiently.
  subject: { type: String, required: true },
  semester: { type: String, required: true }
});

export const NoteChunk = mongoose.model('NoteChunk', noteChunkSchema);