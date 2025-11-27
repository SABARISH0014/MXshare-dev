const QUEST_POOL = [
    // --- UPLOAD QUESTS ---
    { id: 'upload_1', label: 'The Contributor', description: 'Upload 1 new note', eventTrigger: 'NOTE_UPLOAD', targetCount: 1, xpReward: 50 },
    { id: 'upload_3', label: 'Knowledge Spreader', description: 'Upload 3 new notes', eventTrigger: 'NOTE_UPLOAD', targetCount: 3, xpReward: 150 },
    { id: 'upload_video', label: 'Video Instructor', description: 'Upload a video resource', eventTrigger: 'VIDEO_UPLOAD', targetCount: 1, xpReward: 80 },

    // --- VIEWING/LEARNING QUESTS ---
    { id: 'view_3', label: 'Curious Mind', description: 'View 3 different notes', eventTrigger: 'NOTE_VIEW', targetCount: 3, xpReward: 30 },
    { id: 'view_10', label: 'Research Marathon', description: 'View 10 different notes', eventTrigger: 'NOTE_VIEW', targetCount: 10, xpReward: 100 },
    
    // --- SOCIAL/PROFILE QUESTS ---
    { id: 'profile_update', label: 'Identity Update', description: 'Update your profile bio', eventTrigger: 'PROFILE_UPDATE', targetCount: 1, xpReward: 20 },
    { id: 'download_1', label: 'Offline Learner', description: 'Download 1 note', eventTrigger: 'NOTE_DOWNLOAD', targetCount: 1, xpReward: 40 },
];

// vvv CHANGE THIS LINE FROM module.exports TO export default vvv
export default QUEST_POOL;