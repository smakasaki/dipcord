import { create } from "zustand";
import { useChannelMembersStore } from "#/features/channel-members";
import { useAuthStore } from "#/features/auth";

type ChannelPermissions = {
    manage_members: boolean;
    manage_messages: boolean;
    manage_tasks: boolean;
    manage_calls: boolean;
    manage_polls: boolean;
};

type PermissionsState = {
    currentUserPermissions: ChannelPermissions | null;
    
    // Check permissions based on message author and current user
    canEditMessage: (messageAuthorId: string) => boolean;
    canDeleteMessage: (messageAuthorId: string) => boolean;
    
    // Load permissions from channel members
    updatePermissions: () => void;
};

const defaultPermissions: ChannelPermissions = {
    manage_members: false,
    manage_messages: false,
    manage_tasks: false,
    manage_calls: false,
    manage_polls: false,
};

export const useMessagePermissionsStore = create<PermissionsState>((set, get) => ({
    currentUserPermissions: null,
    
    canEditMessage: (messageAuthorId: string) => {
        const currentUser = useAuthStore.getState().user;
        
        // Only message author can edit their own message
        return currentUser?.id === messageAuthorId;
    },
    
    canDeleteMessage: (messageAuthorId: string) => {
        const currentUser = useAuthStore.getState().user;
        const permissions = get().currentUserPermissions;
        
        // User can delete their own message or if they have manage_messages permission
        return currentUser?.id === messageAuthorId || !!permissions?.manage_messages;
    },
    
    updatePermissions: () => {
        const currentUser = useAuthStore.getState().user;
        const members = useChannelMembersStore.getState().members;
        
        if (!currentUser) {
            set({ currentUserPermissions: null });
            return;
        }
        
        // Find current user in channel members
        const currentMember = members.find(member => member.userId === currentUser.id);
        
        if (currentMember?.permissions) {
            set({ currentUserPermissions: currentMember.permissions });
        } else {
            set({ currentUserPermissions: defaultPermissions });
        }
    },
}));