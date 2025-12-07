// AI Interviewer Avatar Configuration
export interface InterviewerAvatar {
    id: string;
    name: string;
    voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
    gender: 'male' | 'female';
    description: string;
    personality: string;
    avatar: string; // Emoji or image
    color: string; // Theme color for the avatar card
}

export const INTERVIEWER_AVATARS: InterviewerAvatar[] = [
    {
        id: 'kirti',
        name: 'Kirti',
        voice: 'Kore', // Female voice
        gender: 'female',
        description: 'Empathetic and encouraging interviewer',
        personality: 'Warm, supportive, and detail-oriented. Focuses on bringing out the best in candidates.',
        avatar: '👩‍💼',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'partha',
        name: 'Partha',
        voice: 'Charon', // Male voice
        gender: 'male',
        description: 'Strategic and analytical interviewer',
        personality: 'Methodical, insightful, and focused on problem-solving abilities.',
        avatar: '👨‍💼',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'drona',
        name: 'Drona',
        voice: 'Fenrir', // Male voice (currently used)
        gender: 'male',
        description: 'Experienced mentor and technical expert',
        personality: 'Wise, patient, and thorough. Emphasizes deep technical understanding.',
        avatar: '🧑‍🏫',
        color: 'from-orange-500 to-red-500'
    },
    {
        id: 'kunti',
        name: 'Kunti',
        voice: 'Aoede', // Female voice
        gender: 'female',
        description: 'Practical and results-oriented interviewer',
        personality: 'Direct, efficient, and focused on real-world application of skills.',
        avatar: '👩‍🔬',
        color: 'from-green-500 to-emerald-500'
    }
];

export const getAvatarById = (id: string): InterviewerAvatar | undefined => {
    return INTERVIEWER_AVATARS.find(avatar => avatar.id === id);
};

export const getDefaultAvatar = (): InterviewerAvatar => {
    return INTERVIEWER_AVATARS[2]; // Drona (current default)
};
