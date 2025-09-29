import React, { useState, useEffect, useMemo } from 'react';
import { Player, Position } from '../types';
import { MAIN_POSITION_OPTIONS, SUB_POSITION_OPTIONS } from '../constants';

interface PlayerRegistrationFormProps {
  addPlayer: (player: Omit<Player, 'id'>) => void;
  playerToEdit: Player | null;
  updatePlayer: (player: Player) => void;
  cancelEdit: () => void;
}

const PlayerRegistrationForm: React.FC<PlayerRegistrationFormProps> = ({ addPlayer, playerToEdit, updatePlayer, cancelEdit }) => {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [mainPosition, setMainPosition] = useState<Position>(Position.PITCHER);
  const [subPosition1, setSubPosition1] = useState<Position>(Position.NONE);
  const [subPosition2, setSubPosition2] = useState<Position>(Position.NONE);
  const [error, setError] = useState('');

  const isEditing = !!playerToEdit;

  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name);
      setNumber(playerToEdit.number);
      setMainPosition(playerToEdit.mainPosition);
      setSubPosition1(playerToEdit.subPosition1);
      setSubPosition2(playerToEdit.subPosition2);
      setError('');
    } else {
      resetForm();
    }
  }, [playerToEdit]);

  const resetForm = () => {
    setName('');
    setNumber('');
    setMainPosition(Position.PITCHER);
    setSubPosition1(Position.NONE);
    setSubPosition2(Position.NONE);
    setError('');
  };

  const subPosition1Options = useMemo(() => {
    return SUB_POSITION_OPTIONS.filter(pos => pos !== mainPosition);
  }, [mainPosition]);

  const subPosition2Options = useMemo(() => {
    // Filter out main position, and subPosition1 if it's a real position (not 'NONE')
    return SUB_POSITION_OPTIONS.filter(pos => {
      if (pos === mainPosition) return false;
      if (subPosition1 !== Position.NONE && pos === subPosition1) return false;
      return true;
    });
  }, [mainPosition, subPosition1]);

  useEffect(() => {
    // This effect ensures that if a selected position becomes invalid due to another selection changing,
    // it gets reset to 'NONE', preventing the browser from defaulting to the first available option.

    // If subPosition1's value is no longer valid (e.g., it's the same as the new mainPosition), reset it.
    if (subPosition1 !== Position.NONE && !subPosition1Options.includes(subPosition1)) {
      setSubPosition1(Position.NONE);
    }
    // If subPosition2's value is no longer valid, reset it.
    if (subPosition2 !== Position.NONE && !subPosition2Options.includes(subPosition2)) {
      setSubPosition2(Position.NONE);
    }
    // Also, if subPosition1 is reset to NONE, subPosition2 must also be NONE.
    if (subPosition1 === Position.NONE && subPosition2 !== Position.NONE) {
        setSubPosition2(Position.NONE);
    }
  }, [mainPosition, subPosition1, subPosition2, subPosition1Options, subPosition2Options]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('名前を入力してください。');
      return;
    }
    if (number.trim() && isNaN(parseInt(number, 10))) {
        setError('背番号は数字で入力してください。');
        return;
    }

    if (isEditing) {
      updatePlayer({
        ...playerToEdit,
        name,
        number,
        mainPosition,
        subPosition1,
        subPosition2,
      });
    } else {
      addPlayer({ name, number, mainPosition, subPosition1, subPosition2 });
      resetForm();
    }
  };

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">{isEditing ? '選手編集' : '選手登録'}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col">
          <label htmlFor="name" className="mb-1 font-semibold text-gray-600">名前 (必須)</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border rounded-md"
            placeholder="山田 太郎"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="number" className="mb-1 font-semibold text-gray-600">背番号 (任意)</label>
          <input
            id="number"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="p-2 border rounded-md"
            placeholder="18"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="mainPosition" className="mb-1 font-semibold text-gray-600">メインポジション</label>
          <select
            id="mainPosition"
            value={mainPosition}
            onChange={(e) => setMainPosition(e.target.value as Position)}
            className="p-2 border rounded-md bg-white"
          >
            {MAIN_POSITION_OPTIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="subPosition1" className="mb-1 font-semibold text-gray-600">サブポジション1</label>
          <select
            id="subPosition1"
            value={subPosition1}
            onChange={(e) => setSubPosition1(e.target.value as Position)}
            className="p-2 border rounded-md bg-white"
          >
            {subPosition1Options.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="subPosition2" className="mb-1 font-semibold text-gray-600">サブポジション2</label>
          <select
            id="subPosition2"
            value={subPosition2}
            onChange={(e) => setSubPosition2(e.target.value as Position)}
            disabled={subPosition1 === Position.NONE}
            className="p-2 border rounded-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {subPosition2Options.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors h-10">
                {isEditing ? '更新' : '登録'}
            </button>
            {isEditing && (
                <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition-colors h-10">
                    キャンセル
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default PlayerRegistrationForm;