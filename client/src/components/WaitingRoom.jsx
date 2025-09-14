import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X } from 'lucide-react';

const WaitingRoomPanel = ({ waitingParticipants = [], onApprove, onDeny, isHost }) => {
    if (!isHost || waitingParticipants.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 right-4 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
        >
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <Clock className="text-yellow-400" size={20} />
                    <h3 className="text-white font-medium">
                        Waiting Room ({waitingParticipants.length})
                    </h3>
                </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
                <AnimatePresence>
                    {waitingParticipants.map((participant) => (
                        <motion.div
                            key={participant.socketId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-3 border-b border-gray-700 last:border-b-0"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                        {participant.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">
                                            {participant.name}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            Waiting to join
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => onApprove(participant)}
                                        className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
                                        title="Admit"
                                    >
                                        <Check size={12} />
                                    </button>
                                    <button
                                        onClick={() => onDeny(participant)}
                                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                                        title="Deny"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="p-3 border-t border-gray-700 flex space-x-2">
                <button
                    onClick={() => waitingParticipants.forEach(onApprove)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                    Admit All
                </button>
                <button
                    onClick={() => waitingParticipants.forEach(onDeny)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                    Deny All
                </button>
            </div>
        </motion.div>
    );
};

const WaitingRoomMessage = ({ isWaiting, roomId }) => {
    if (!isWaiting) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-lg p-8 max-w-md mx-4 text-center"
            >
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="text-yellow-600" size={32} />
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Waiting for host approval
                </h2>
                
                <p className="text-gray-600 mb-4">
                    The host will let you in soon. Please wait while we notify them.
                </p>
                
                <div className="text-sm text-gray-500">
                    Meeting ID: <span className="font-mono font-medium">{roomId}</span>
                </div>

                <div className="mt-6 flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </motion.div>
        </div>
    );
};

export { WaitingRoomPanel, WaitingRoomMessage };