import gamificationEngine from '../services/GamificationEngine.js';

export const rerollQuest = async (req, res) => {
    try {
        const userId = req.user.id; // From middleware
        const { questId } = req.body;

        if (!questId) {
            return res.status(400).json({ message: "Quest ID is required" });
        }

        // Call the Engine
        const newQuests = await gamificationEngine.rerollQuest(userId, questId);

        return res.status(200).json({ 
            message: "Quest rerolled successfully", 
            newQuests 
        });

    } catch (error) {
        console.error("Reroll Error:", error.message);
        return res.status(400).json({ message: error.message || "Failed to reroll quest" });
    }
};