import React, { useState, useMemo, useRef } from 'react';
import { Player, SortType, Position } from '../types';
import PlayerListItem from './PlayerListItem';
import { POSITION_ORDER } from '../constants';
import ConfirmationModal from './ConfirmationModal';

interface PlayerListProps {
  players: Player[];
  deletePlayer: (id: string) => void;
  onEditPlayer: (player: Player) => void;
  addMultiplePlayers: (players: Omit<Player, 'id'>[]) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, deletePlayer, onEditPlayer, addMultiplePlayers }) => {
  const [sortType, setSortType] = useState<SortType>('default');
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedPlayers = useMemo(() => {
    const playersCopy = [...players];
    switch (sortType) {
      case 'number':
        return playersCopy.sort((a, b) => {
            const numA = a.number ? parseInt(a.number, 10) : Infinity;
            const numB = b.number ? parseInt(b.number, 10) : Infinity;
            if (numA === Infinity && numB === Infinity) return 0;
            return numA - numB;
        });
      case 'position':
        const positionOrderMap = new Map<Position, number>(POSITION_ORDER.map((pos, i) => [pos, i]));
        return playersCopy.sort((a, b) => {
            const posA = positionOrderMap.get(a.mainPosition) ?? 99;
            const posB = positionOrderMap.get(b.mainPosition) ?? 99;
            if (posA === posB) {
                const numA = a.number ? parseInt(a.number, 10) : Infinity;
                const numB = b.number ? parseInt(b.number, 10) : Infinity;
                return numA - numB;
            }
            return posA - posB;
        });
      case 'default':
      default:
        return players; // Original registration order
    }
  }, [players, sortType]);

  const handleRequestDelete = (player: Player) => {
    setPlayerToDelete(player);
  };

  const handleConfirmDelete = () => {
    if (playerToDelete) {
      deletePlayer(playerToDelete.id);
      setPlayerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setPlayerToDelete(null);
  };

  const handleExport = () => {
    const header = "name,number,mainPosition,subPosition1,subPosition2\n";
    const rows = players.map(p => `"${p.name}","${p.number || ''}","${p.mainPosition}","${p.subPosition1}","${p.subPosition2}"`).join("\n");
    const csvContent = header + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "members.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportTemplate = () => {
    const header = "name,number,mainPosition,subPosition1,subPosition2\n";
    const csvContent = header;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "import_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const isPosition = (value: string): value is Position => {
    return Object.values(Position).includes(value as Position);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
          throw new Error("CSVファイルにデータがありません。");
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        if (headers[0] !== 'name' || headers[2] !== 'mainPosition') {
            throw new Error('ヘッダーが正しくありません。(name,number,mainPosition,subPosition1,subPosition2)');
        }

        const newPlayers: Omit<Player, 'id'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length < 5) continue;
          
          const [name, number, mainPositionStr, subPosition1Str, subPosition2Str] = values;

          if (!name) continue;

          const mainPosition = isPosition(mainPositionStr) ? mainPositionStr : Position.PITCHER;
          const subPosition1 = isPosition(subPosition1Str) ? subPosition1Str : Position.NONE;
          const subPosition2 = isPosition(subPosition2Str) ? subPosition2Str : Position.NONE;
          
          newPlayers.push({ name, number, mainPosition, subPosition1, subPosition2 });
        }
        
        if (newPlayers.length > 0) {
            addMultiplePlayers(newPlayers);
            alert(`${newPlayers.length}人の選手をインポートしました。`);
        } else {
            alert('インポートできる有効な選手データが見つかりませんでした。');
        }

      } catch (error) {
        if (error instanceof Error) {
            alert(`インポートに失敗しました: ${error.message}`);
        } else {
            alert('インポート中に不明なエラーが発生しました。');
        }
      } finally {
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-700">選手一覧 ({players.length}人)</h2>
        <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center">
                <label htmlFor="sort" className="mr-2 font-semibold text-gray-600">並び順:</label>
                <select
                    id="sort"
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value as SortType)}
                    className="p-2 border rounded-md bg-white"
                >
                    <option value="default">登録順</option>
                    <option value="number">背番号順</option>
                    <option value="position">ポジション順</option>
                </select>
            </div>
            <button onClick={handleImportClick} className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-semibold">
                インポート (CSV)
            </button>
            <button onClick={handleExport} className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold">
                エクスポート (全選手)
            </button>
            <button onClick={handleExportTemplate} className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-semibold">
                テンプレート (CSV)
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv"
                className="hidden" 
            />
        </div>
      </div>
      {players.length === 0 ? (
        <p className="text-gray-500 text-center py-4">まだ選手が登録されていません。</p>
      ) : (
        <ul>
          {sortedPlayers.map(player => (
            <PlayerListItem 
              key={player.id} 
              player={player} 
              requestDeletePlayer={handleRequestDelete} 
              onEdit={onEditPlayer}
            />
          ))}
        </ul>
      )}

      <ConfirmationModal
        isOpen={!!playerToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="選手の削除"
        message={`本当に「${playerToDelete?.name}」を削除しますか？この操作は取り消せません。`}
      />
    </div>
  );
};

export default PlayerList;