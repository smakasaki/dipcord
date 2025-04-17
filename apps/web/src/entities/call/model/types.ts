export type CallParticipant = {
    id: string;
    name: string;
    avatar?: string;
    isMuted: boolean;
    isSpeaking: boolean;
    isVideoOn: boolean;
};

export type CallType = "audio" | "video";

export type CallStatus = "scheduled" | "active" | "completed";

export type Call = {
    id: string;
    channelId: string;
    title: string;
    type: CallType;
    status: CallStatus;
    startTime: Date;
    endTime?: Date;
    initiatedBy: {
        id: string;
        name: string;
    };
    participants: number;
    recordingUrl?: string;
};

export type ActiveCall = {
    id: string;
    channelId: string;
    title: string;
    type: CallType;
    startTime: Date;
    participants: CallParticipant[];
    roomUrl: string;
};
