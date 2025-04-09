export type User = {
    id: string;
    username: string;
    avatar: string;
    role?: string;
};

export type Attachment = {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
};

export type Reaction = {
    emoji: string;
    count: number;
    users: string[];
};

export type Message = {
    id: string;
    content: string;
    author: User;
    timestamp: string;
    isEdited: boolean;
    attachments?: Attachment[];
    reactions?: Reaction[];
    replyTo?: Message;
    mentions?: User[];
};
