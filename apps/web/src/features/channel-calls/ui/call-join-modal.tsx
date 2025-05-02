import type { ActiveCall } from "#/entities/call";

import { Button, Group, LoadingOverlay, Modal } from "@mantine/core";
import { useEffect, useImperativeHandle, useState } from "react";

// Interface for the imperative API of the component
export type CallJoinModalRef = {
    openCall: (call: ActiveCall) => void;
    closeCall: () => void;
};

type CallJoinModalProps = {
    onClose: () => void;
};

// Using forwardRef to expose methods to parent component
export const CallJoinModal = function CallJoinModal({ ref, onClose }: CallJoinModalProps & { ref?: React.RefObject<CallJoinModalRef | null> }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Expose the methods to parent components
    useImperativeHandle(ref, () => ({
        openCall: (call: ActiveCall) => {
            setActiveCall(call);
            setIsOpen(true);
            setIsLoading(true);
        },
        closeCall: () => {
            setIsOpen(false);
        },
    }));

    // Reset loading state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsLoading(false);
        }
    }, [isOpen]);

    return (
        <Modal
            opened={isOpen}
            onClose={() => {
                setIsOpen(false);
                onClose();
            }}
            title={activeCall?.title || "Join Call"}
            size="xl"
            fullScreen
            transitionProps={{ duration: 300 }}
            closeButtonProps={{ size: "lg" }}
        >
            <div style={{ position: "relative", height: "80vh" }}>
                <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
                {activeCall && (
                    <>
                        {/* TODO */}
                    </>
                )}
            </div>
            <Group justify="right" mt="lg">
                <Button color="red" onClick={onClose}>
                    Leave Call
                </Button>
            </Group>
        </Modal>
    );
};
