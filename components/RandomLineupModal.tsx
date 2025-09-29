import React, { useState, useMemo, useEffect } from 'react';
import { Player, Position } from '../types';

interface RandomLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (selectedPlayers: Player[]) => void;
  players: Player[];
}

const RandomLineupModal: React.FC<RandomLineupModalProps> = ({ isOpen, onClose, onGenerate, players }) => {
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(() => new Set(players.map(p => p.id)));

    useEffect(() => {
        if(isOpen) {
            setSelectedPlayerIds(new Set(players.map(p => p.id)));
        }
    }, [isOpen, players]);

    const handleCheckboxChange = (playerId: string) => {
        setSelectedPlayerIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playerId)) {
                newSet.delete(playerId);
            } else {
                newSet.add(playerId);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = () => {
        setSelectedPlayerIds(new Set(players.map(p => p.id)));
    };
    const handleDeselectAll = () => {
        setSelectedPlayerIds(new Set());
    };

    const handleSubmit = () => {
        const selectedPlayers = players.filter(p => selectedPlayerIds.has(p.id));
        onGenerate(selectedPlayers);
    };

    const categorizedPlayers = useMemo(() => {
        return {
            [Position.PITCHER]: players.filter(p => p.mainPosition === Position.PITCHER),
            [Position.CATCHER]: players.filter(p => p.mainPosition === Position.CATCHER),
            [Position.INFIELDER]: players.filter(p => p.mainPosition === Position.INFIELDER),
            [Position.OUTFIELDER]: players.filter(p => p.mainPosition === Position.OUTFIELDER),
        };
    }, [players]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">ランダムスタメン生成</h2>
                    <p className="text-sm text-gray-600">スタメンに含める選手を選択してください。</p>
                </div>
                <div className="p-4 overflow-y-auto">
                    <div className="flex justify-end gap-2 mb-4">
                        <button onClick={handleSelectAll} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">すべて選択</button>
                        <button onClick={handleDeselectAll} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">すべて解除</button>
                    </div>
                    {Object.entries(categorizedPlayers).map(([position, playersInCategory]) => (
                        playersInCategory.length > 0 && (
                            <div key={position} className="mb-4">
                                <h3 className="font-semibold text-gray-700 border-b pb-1 mb-2">{position} ({playersInCategory.length}人)</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {playersInCategory.map(player => (
                                    <label key={player.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedPlayerIds.has(player.id)}
                                            onChange={() => handleCheckboxChange(player.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{player.name} (#{player.number || '-'})</span>
                                    </label>
                                ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
                <div className="p-4 border-t flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                        キャンセル
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        生成する
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RandomLineupModal;