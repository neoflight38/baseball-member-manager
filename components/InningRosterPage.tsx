import React, { useRef, useMemo } from 'react';
import { Player, Position, MatchDetails } from '../types';
import { POSITION_RAW_COLORS, LINEUP_POSITION_COLORS, INNING_POSITION_OPTIONS, LINEUP_POSITIONS } from '../constants';

declare var html2canvas: any;

interface InningRosterPageProps {
  lineupPlayers: Player[];
  inningRoster: Record<string, string[]>;
  setInningRoster: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  matchDetails: MatchDetails;
}

// This gradient is for the player name cell, based on their registered positions
const getPlayerGradient = (p: Player) => {
  const colors = [p.mainPosition, p.subPosition1, p.subPosition2]
    .filter(pos => pos !== Position.NONE)
    .map(pos => POSITION_RAW_COLORS[pos]);

  if (colors.length === 0) {
      return `linear-gradient(to right, ${POSITION_RAW_COLORS[Position.NONE]}, ${POSITION_RAW_COLORS[Position.NONE]})`;
  }
  if (colors.length === 1) {
    return `linear-gradient(to right, ${colors[0]}, ${colors[0]})`;
  }
  if (colors.length === 2) {
    return `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`;
  }
  if (colors.length === 3) {
    return `linear-gradient(to right, ${colors[0]} 33.33%, ${colors[1]} 33.33% 66.66%, ${colors[2]} 66.66%)`;
  }
  return `linear-gradient(to right, ${colors[0]}, ${colors[0]})`;
};


const InningRosterPage: React.FC<InningRosterPageProps> = ({ lineupPlayers, inningRoster, setInningRoster, matchDetails }) => {
  const innings = Array.from({ length: 9 }, (_, i) => i + 1);
  const rosterRef = useRef<HTMLDivElement>(null);

  const positionCountsByInning = useMemo(() => {
    const countsByInning: Record<string, number>[] = Array(9).fill(0).map(() => ({}));
    const positionsToCheck = LINEUP_POSITIONS;

    // Initialize counts for all positions to 0 for each inning
    for (let i = 0; i < 9; i++) {
        for (const pos of positionsToCheck) {
            countsByInning[i][pos] = 0;
        }
    }

    // Tally the counts
    for (const player of lineupPlayers) {
        const playerPositions = inningRoster[player.id] || [];
        for (let i = 0; i < 9; i++) {
            const position = playerPositions[i];
            if (position && positionsToCheck.includes(position)) {
                countsByInning[i][position]++;
            }
        }
    }
    return countsByInning;
  }, [lineupPlayers, inningRoster]);


  const handlePositionChange = (playerId: string, inningIndex: number, newPosition: string) => {
    setInningRoster(prev => {
        const playerInnings = prev[playerId] || Array(9).fill('-');
        const updatedInnings = playerInnings.map((pos, i) => i === inningIndex ? newPosition : pos);
        return {
            ...prev,
            [playerId]: updatedInnings
        };
    });
  };
  
  const handleDownloadImage = () => {
    if (rosterRef.current) {
      html2canvas(rosterRef.current, { 
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then((canvas: HTMLCanvasElement) => {
        const image = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = 'inning-roster.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };


  if (lineupPlayers.length === 0) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">イニング別メンバー表</h2>
            <p className="text-gray-500">スタメン作成ページでメンバーを登録してください。</p>
        </div>
      );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
        <div ref={rosterRef} className="p-2 sm:p-4 bg-white">
            {(matchDetails.date || matchDetails.time || matchDetails.venue || matchDetails.opponent) && (
              <div className="mb-4 p-2 border-b text-sm text-gray-700">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p><span className="font-semibold">日時:</span> {matchDetails.date || ''} {matchDetails.time || ''}</p>
                  <p><span className="font-semibold">会場:</span> {matchDetails.venue || ''}</p>
                  <p><span className="font-semibold">相手:</span> {matchDetails.opponent || ''}</p>
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">イニング別メンバー表</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                    <th className="p-2 border border-gray-300 text-center align-top w-12">打順</th>
                    <th className="p-2 border border-gray-300 text-center align-top w-48">選手名</th>
                    {innings.map((inning) => (
                        <th key={inning} className="p-2 border border-gray-300 text-center w-24 align-top font-semibold">
                            {inning}回
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {lineupPlayers.map((player, playerIndex) => (
                    <tr key={player.id}>
                        <td className="p-2 border border-gray-300 text-center text-gray-600 font-semibold">
                            {playerIndex + 1}
                        </td>
                        <td 
                            className="p-2 border border-gray-300 text-gray-800"
                            style={{ background: getPlayerGradient(player) }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="flex-shrink-0 bg-white bg-opacity-70 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold text-gray-800 shadow-sm">
                                    {player.number || '-'}
                                </span>
                                <span className="truncate font-semibold">{player.name}</span>
                            </div>
                        </td>
                        {innings.map((_, index) => {
                        const currentPosition = inningRoster[player.id]?.[index] ?? '-';
                        return (
                            <td key={index} className="p-0 border border-gray-300">
                            <select
                                value={currentPosition}
                                onChange={(e) => handlePositionChange(player.id, index, e.target.value)}
                                className="w-full h-full p-2 border-0 focus:ring-0 appearance-none text-center font-semibold cursor-pointer"
                                style={{ 
                                backgroundColor: LINEUP_POSITION_COLORS[currentPosition] || '#f3f4f6', // gray-100 for '-'
                                color: '#1f2937' // gray-800
                                }}
                            >
                                {INNING_POSITION_OPTIONS.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                            </td>
                        );
                        })}
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
        
        <div className="p-2 sm:p-4">
            <div className="mt-6 pt-4 border-t">
                <h3 className="text-xl font-bold text-gray-700 mb-3 text-center">ポジション人数チェック</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                        <th className="p-2 border border-gray-300 text-center w-48">ポジション</th>
                        {innings.map(inning => (
                            <th key={inning} className="p-2 border border-gray-300 text-center w-24">{inning}回</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {LINEUP_POSITIONS.map(pos => (
                        <tr key={pos}>
                            <td 
                                className="p-2 border border-gray-300 font-semibold text-center" 
                                style={{ backgroundColor: LINEUP_POSITION_COLORS[pos] || '#e5e7eb' }}
                            >
                            {pos}
                            </td>
                            {innings.map((_, index) => {
                            const count = positionCountsByInning[index][pos] ?? 0;
                            const isAbnormal = count !== 1;
                            return (
                                <td 
                                key={index} 
                                className={`p-2 border border-gray-300 text-center font-mono ${isAbnormal ? 'bg-red-100 text-red-700 font-bold' : ''}`}
                                >
                                {count}
                                </td>
                            );
                            })}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
            <button
                onClick={handleDownloadImage}
                className="w-full mt-6 bg-teal-500 text-white font-bold py-2 px-4 rounded hover:bg-teal-600 transition-colors"
            >
                画像としてダウンロード (JPG)
            </button>
        </div>
    </div>
  );
};

export default InningRosterPage;