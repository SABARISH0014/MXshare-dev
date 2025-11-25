export const QUEST_DEFINITIONS = {
    DAILY_UPLOAD: {
        id: 'daily_upload',
        label: 'Upload 1 Note',
        description: 'Share a note with the community',
        targetCount: 1,
        xpReward: 50,
        eventTrigger: 'NOTE_UPLOAD'
    },
    DAILY_VIEW: {
        id: 'daily_view',
        label: 'Read 3 Notes',
        description: 'View notes from other students',
        targetCount: 3,
        xpReward: 30,
        eventTrigger: 'NOTE_VIEW'
    },
    PROFILE_COMPLETE: {
        id: 'profile_complete',
        label: 'Complete Profile',
        description: 'Update bio and interests',
        targetCount: 1,
        xpReward: 100,
        eventTrigger: 'PROFILE_UPDATE'
    }
};