import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Mic, 
    MicOff, 
    Video, 
    VideoOff, 
    MoreVertical, 
    Crown, 
    UserMinus, 
    Shield,
    Volume2,
    VolumeX,
    Search,
    X,
    UserPlus,
    Settings,
    Ban,
    MessageSquare,
    Award,
    Copy
} from 'lucide-react';
import { useState } from 'react';

const ParticipantItem = ({ participant, isHost, isCoHost, onMute, onRemove, onMakeCoHost }) => {
    const [showMenu, setShowMenu] = useState(false);
    const canModerate = isHost || isCoHost;
    const isCurrentUserHost = participant.role === 'host';
    const isCurrentUserCoHost = participant.role === 'co-host';

    const getAvatarColor = (name) => {
        const colors = [
            'from-blue-500 to-blue-600',
            'from-purple-500 to-purple-600',
            'from-green-500 to-green-600',
            'from-red-500 to-red-600',
            'from-yellow-500 to-yellow-600',
            'from-indigo-500 to-indigo-600',
            'from-pink-500 to-pink-600',
            'from-teal-500 to-teal-600'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="group relative px-4 py-3 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="relative">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(participant.name)} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
                            {participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        
                        {/* Status Indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                            participant.isConnected ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        
                        {/* Role Badge */}
                        {isCurrentUserHost && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                                <Crown size={10} className="text-white" />
                            </div>
                        )}
                        {isCurrentUserCoHost && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                <Shield size={10} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* Participant Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 truncate">
                                {participant.name}
                            </h4>
                            {participant.isYou && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    You
                                </span>
                            )}
                            {isCurrentUserHost && (
                                <span className="text-xs bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium border border-yellow-200">
                                    Host
                                </span>
                            )}
                            {isCurrentUserCoHost && (
                                <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                                    Co-host
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-1 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${
                                participant.isConnected ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-xs text-gray-500">
                                {participant.isConnected ? 'Connected' : 'Connecting...'}
                            </span>
                            
                            {participant.isSpeaking && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="flex items-center space-x-1 text-green-600"
                                >
                                    <div className="w-1 h-1 bg-green-500 rounded-full" />
                                    <span className="text-xs font-medium">Speaking</span>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Audio/Video Status */}
                    <div className="flex items-center space-x-2">
                        <motion.div
                            animate={{ 
                                scale: participant.isSpeaking ? [1, 1.1, 1] : 1,
                                backgroundColor: participant.isSpeaking ? '#10b981' : undefined
                            }}
                            transition={{ repeat: participant.isSpeaking ? Infinity : 0, duration: 0.8 }}
                            className={`p-2 rounded-full transition-all duration-200 ${
                                participant.isAudioMuted 
                                    ? 'bg-red-100 text-red-600' 
                                    : participant.isSpeaking 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {participant.isAudioMuted ? 
                                <MicOff size={14} /> : 
                                <Mic size={14} />
                            }
                        </motion.div>
                        
                        <div className={`p-2 rounded-full transition-all duration-200 ${
                            participant.isVideoOff 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {participant.isVideoOff ? 
                                <VideoOff size={14} /> : 
                                <Video size={14} />
                            }
                        </div>
                    </div>
                </div>

                {/* Actions Menu */}
                {canModerate && !participant.isYou && (
                    <div className="relative ml-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical size={16} />
                        </motion.button>
                        
                        <AnimatePresence>
                            {showMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                                    >
                                        <div className="px-3 py-2 border-b border-gray-100">
                                            <p className="font-medium text-gray-900 text-sm">{participant.name}</p>
                                            <p className="text-xs text-gray-500">Participant actions</p>
                                        </div>
                                        
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    onMute(participant);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 group text-sm"
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    participant.isAudioMuted 
                                                        ? 'bg-green-100 text-green-600 group-hover:bg-green-200' 
                                                        : 'bg-red-100 text-red-600 group-hover:bg-red-200'
                                                }`}>
                                                    {participant.isAudioMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                                </div>
                                                <span className="font-medium">
                                                    {participant.isAudioMuted ? 'Unmute' : 'Mute'}
                                                </span>
                                            </button>
                                            
                                            <button
                                                onClick={() => setShowMenu(false)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 group text-sm"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 flex items-center justify-center">
                                                    <MessageSquare size={16} />
                                                </div>
                                                <span className="font-medium">Send private message</span>
                                            </button>
                                            
                                            {isHost && !isCurrentUserCoHost && (
                                                <button
                                                    onClick={() => {
                                                        onMakeCoHost(participant);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 group text-sm"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 flex items-center justify-center">
                                                        <Award size={16} />
                                                    </div>
                                                    <span className="font-medium">Make co-host</span>
                                                </button>
                                            )}
                                            
                                            <div className="border-t border-gray-100 my-1" />
                                            
                                            <button
                                                onClick={() => {
                                                    onRemove(participant);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 group text-sm"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200 flex items-center justify-center">
                                                    <UserMinus size={16} />
                                                </div>
                                                <span className="font-medium text-red-600">Remove from meeting</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const ParticipantsPanel = ({ 
    participants = [], 
    currentUser, 
    isHost, 
    isCoHost,
    onMuteParticipant,
    onRemoveParticipant,
    onPromoteToCoHost,
    isOpen,
    onClose 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showInviteMenu, setShowInviteMenu] = useState(false);
    
    const filteredParticipants = participants.filter(participant =>
        participant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMute = (participant) => {
        onMuteParticipant(participant.socketId);
    };

    const handleRemove = (participant) => {
        if (window.confirm(`Remove ${participant.name} from the meeting?`)) {
            onRemoveParticipant(participant.socketId);
        }
    };

    const handleMakeCoHost = (participant) => {
        if (window.confirm(`Make ${participant.name} a co-host?`)) {
            onPromoteToCoHost(participant.socketId);
        }
    };

    const copyMeetingLink = () => {
        const meetingLink = window.location.href;
        navigator.clipboard.writeText(meetingLink);
    };

    const copyMeetingId = () => {
        const meetingId = window.location.pathname.split('/').pop();
        navigator.clipboard.writeText(meetingId);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" 
                onClick={onClose}
            />
            
            <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Users className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Participants</h3>
                                <p className="text-blue-100 text-sm">{participants.length} people in meeting</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                        >
                            <X size={20} />
                        </motion.button>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search participants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 pl-10 pr-4 py-3 rounded-xl border border-white/20 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                {(isHost || isCoHost) && (
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setShowInviteMenu(!showInviteMenu)}
                                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <UserPlus size={16} />
                                <span>Invite</span>
                            </button>
                            <button className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                                <Ban size={16} />
                                <span>Mute All</span>
                            </button>
                        </div>
                        
                        {/* Invite Menu */}
                        <AnimatePresence>
                            {showInviteMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-3 bg-white rounded-xl shadow-lg border border-gray-200 p-4"
                                >
                                    <h4 className="font-medium text-gray-900 mb-3">Invite people</h4>
                                    <div className="space-y-2">
                                        <button 
                                            onClick={copyMeetingLink}
                                            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                                <Copy size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Copy meeting link</p>
                                                <p className="text-xs text-gray-500">Share the full meeting URL</p>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={copyMeetingId}
                                            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                                <Copy size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Copy meeting ID</p>
                                                <p className="text-xs text-gray-500">Share just the meeting ID</p>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Participants List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredParticipants.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {filteredParticipants.map((participant) => (
                                <ParticipantItem
                                    key={participant.socketId}
                                    participant={{
                                        ...participant,
                                        isYou: participant.socketId === currentUser?.socketId
                                    }}
                                    isHost={isHost}
                                    isCoHost={isCoHost}
                                    onMute={handleMute}
                                    onRemove={handleRemove}
                                    onMakeCoHost={handleMakeCoHost}
                                />
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                            <Users className="text-gray-300 mb-3" size={32} />
                            <p className="text-gray-900 font-medium">No participants found</p>
                            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or invite others to join.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Total Participants</p>
                            <p className="text-xs text-gray-500">{participants.length} members</p>
                        </div>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Settings size={14} />
                            <span>Settings</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default ParticipantsPanel;
