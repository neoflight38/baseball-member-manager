import React from 'react';
import { Player, Position } from '../types';
import { POSITION_RAW_COLORS } from '../constants';

interface PlayerListItemProps {
  player: Player;
  requestDeletePlayer: (player: Player) => void;
  onEdit: (player: Player) => void;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({ player, requestDeletePlayer, onEdit }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent li's onClick from firing
    requestDeletePlayer(player);
  };

  const borderColor = POSITION_RAW_COLORS[player.mainPosition] || POSITION_RAW_COLORS[Position.NONE];

  return (
    <li 
      className="flex items-center justify-between p-4 mb-2 bg-white rounded-lg shadow-sm border-l-8 border-solid cursor-pointer hover:bg-gray-50 transition-colors" 
      style={{ borderLeftColor: borderColor }}
      onClick={() => onEdit(player)}
    >
        <div className="flex items-center">
            <span className="text-xl font-bold text-gray-700 w-12 text-center">{player.number || '-'}</span>
            <span className="text-lg font-medium text-gray-800 ml-4">{player.name}</span>
        </div>
        <div className="flex items-center">
            <div className="text-sm text-gray-600 mr-4">
                <p>メイン: {player.mainPosition}</p>
                <p>サブ: {player.subPosition1 !== Position.NONE ? player.subPosition1 : '-'} / {player.subPosition2 !== Position.NONE ? player.subPosition2 : '-'}</p>
            </div>
            <button onClick={handleDeleteClick} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors">削除</button>
        </div>
    </li>
  );
};

export default PlayerListItem;