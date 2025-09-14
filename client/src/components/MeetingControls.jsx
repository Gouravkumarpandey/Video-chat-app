import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from '@headlessui/react';
import { 
    Mic, 
    MicOff, 
    Video, 
    VideoOff, 
    MonitorSpeaker, 
    PhoneOff, 
    Settings,
    MoreHorizontal,
    Circle,
    Users,
    MessageSquare,
    Share,
    Layout,
    ChevronUp,
    Shield,
    UserPlus,
    Copy,
    Clock
} from 'lucide-react';

const MeetingControls = ({ 
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    participantCount,
    onToggleAudio,
    onToggleVideo,
    onScreenShare,
    onEndCall,
    onToggleChat,
    onToggleParticipants,
    onStartRecording,
    onStopRecording,
    onOpenSettings,
    isHost,
    isCoHost
}) => {
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const canModerate = isHost || isCoHost;

    const copyMeetingInfo = () => {
        const meetingLink = window.location.href;
        const meetingId = window.location.pathname.split('/').pop();
        const meetingInfo = `Join my meeting:\n\nMeeting ID: ${meetingId}\nMeeting Link: ${meetingLink}`;
        navigator.clipboard.writeText(meetingInfo);
    };

    // Define control button arrays
    const controlButtons = [
        {
            id: 'audio',
            icon: isAudioMuted ? MicOff : Mic,
            onClick: onToggleAudio,
            active: isAudioMuted,
            variant: isAudioMuted ? 'danger' : 'default',
            label: isAudioMuted ? 'Unmute' : 'Mute',
            hotkey: 'Ctrl+D'
        },
        {
            id: 'video',
            icon: isVideoOff ? VideoOff : Video,
            onClick: onToggleVideo,
            active: isVideoOff,
            variant: isVideoOff ? 'danger' : 'default',
            label: isVideoOff ? 'Turn on camera' : 'Turn off camera',
            hotkey: 'Ctrl+E'
        },
        {
            id: 'screen',
            icon: MonitorSpeaker,
            onClick: onScreenShare,
            active: isScreenSharing,
            variant: 'default',
            label: isScreenSharing ? 'Stop sharing' : 'Share screen',
            hotkey: 'Ctrl+Shift+S'
        }
    ];

    const secondaryButtons = [
        {
            id: 'participants',
            icon: Users,
            onClick: onToggleParticipants,
            active: false,
            variant: 'default',
            label: 'Participants',
            badge: participantCount,
            tooltip: 'Show participants'
        },
        {
            id: 'chat',
            icon: MessageSquare,
            onClick: onToggleChat,
            active: false,
            variant: 'default',
            label: 'Chat',
            tooltip: 'Show chat'
        }
    ];

    const moreOptions = [
        {
            id: 'settings',
            icon: Settings,
            label: 'Settings',
            onClick: onOpenSettings,
            available: true
        },
        {
            id: 'share',
            icon: Share,
            label: 'Share meeting',
            onClick: copyMeetingInfo,
            available: true
        }
    ];

    return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-6 py-4 z-40"
        >
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Meeting Info */}
                <div className="flex items-center space-x-4 text-white">
                    <div className="text-sm">
                        <div className="font-medium">Meeting in progress</div>
                        <div className="text-gray-400">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    {isRecording && (
                        <motion.div 
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full text-sm font-medium"
                        >
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            REC
                        </motion.div>
                    )}
                </div>

                {/* Main Controls */}
                <div className="flex items-center space-x-3">
                    {controlButtons.map((button) => {
                        const Icon = button.icon;
                        return (
                            <motion.button
                                key={button.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={button.onClick}
                                title={`${button.label} (${button.hotkey})`}
                                className={`relative p-4 rounded-full transition-all duration-200 ${
                                    button.active
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : button.variant === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                            >
                                <Icon size={20} />
                                {button.id === 'screen' && isScreenSharing && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"
                                    />
                                )}
                            </motion.button>
                        );
                    })}

                    {/* End Call */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onEndCall}
                        className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                        title="End call"
                    >
                        <PhoneOff size={20} />
                    </motion.button>
                </div>

                {/* Secondary Controls */}
                <div className="flex items-center space-x-3">
                    {secondaryButtons.map((button) => {
                        const Icon = button.icon;
                        return (
                            <motion.button
                                key={button.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={button.onClick}
                                title={button.tooltip}
                                className="relative p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                <Icon size={18} />
                                {button.badge && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                        {button.badge}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}

                    {/* More Options */}
                    <Menu as="div" className="relative">
                        <Menu.Button
                            className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            title="More options"
                        >
                            <MoreHorizontal size={18} />
                        </Menu.Button>

                        <Menu.Items className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                            <div className="py-1">
                                {moreOptions.filter(option => option.available).map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <Menu.Item key={option.id}>
                                            {({ active }) => (
                                                <button
                                                    onClick={option.onClick}
                                                    className={`${
                                                        active ? 'bg-gray-700' : ''
                                                    } ${
                                                        option.destructive ? 'text-red-400' : 'text-white'
                                                    } flex items-center w-full px-4 py-2 text-sm`}
                                                >
                                                    <Icon size={16} className="mr-3" />
                                                    {option.label}
                                                </button>
                                            )}
                                        </Menu.Item>
                                    );
                                })}
                            </div>
                        </Menu.Items>
                    </Menu>
                </div>
            </div>
        </motion.div>
    );
};

export default MeetingControls;