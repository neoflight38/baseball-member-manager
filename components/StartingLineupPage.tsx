import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Player, Position, SortType, MatchDetails } from '../types';
import { POSITION_RAW_COLORS, LINEUP_POSITION_COLORS, POSITION_ORDER } from '../constants';
import RandomLineupModal from './RandomLineupModal';

declare var html2canvas: any;

interface StartingLineupPageProps {
  players: Player[];
  lineup: (Player | null)[];
  setLineup: React.Dispatch<React.SetStateAction<(Player | null)[]>>;
  positions: string[];
  setPositions: React.Dispatch<React.SetStateAction<string[]>>;
  matchDetails: MatchDetails;
  setMatchDetails: React.Dispatch<React.SetStateAction<MatchDetails>>;
}

type DraggedItem =
  | { type: 'lineup-slot'; index: number }
  | { type: 'unassigned-player'; player: Player };

type Selection =
  | { type: 'lineup-player'; index: number }
  | { type: 'lineup-position'; index: number }
  | { type: 'available-player'; player: Player }
  | { type: 'lineup-order'; index: number };

const getGradient = (p: Player) => {
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
  // Fallback for > 3 colors, though not possible with current UI
  return `linear-gradient(to right, ${colors[0]}, ${colors[0]})`;
};


const StartingLineupPage: React.FC<StartingLineupPageProps> = ({
  players,
  lineup,
  setLineup,
  positions,
  setPositions,
  matchDetails,
  setMatchDetails,
}) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingOverReturn, setIsDraggingOverReturn] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [sortType, setSortType] = useState<SortType>('default');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const touchStartRef = useRef<{x: number, y: number, item: DraggedItem, isDrag: boolean} | null>(null);
  const lineupRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint
    };
    
    checkIsMobile(); // Set initial value
    
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
        window.removeEventListener('resize', checkIsMobile);
    };
  }, []);


  const availablePlayers = useMemo(() => {
    const lineupPlayerIds = new Set(lineup.filter(p => p).map(p => p!.id));
    const unassignedPlayers = players.filter(p => !lineupPlayerIds.has(p.id));

    // Sorting logic
    switch (sortType) {
      case 'number':
        return unassignedPlayers.sort((a, b) => {
            const numA = a.number ? parseInt(a.number, 10) : Infinity;
            const numB = b.number ? parseInt(b.number, 10) : Infinity;
            if (numA === Infinity && numB === Infinity) return 0;
            return numA - numB;
        });
      case 'position':
        const positionOrderMap = new Map<Position, number>(POSITION_ORDER.map((pos, i) => [pos, i]));
        return unassignedPlayers.sort((a, b) => {
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
        return unassignedPlayers; // Original registration order
    }
  }, [players, lineup, sortType]);
  
  const handleDragStart = (item: DraggedItem) => {
    setDraggedItem(item);
    setSelection(null);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDraggingOverReturn(false);
  };
  
  const handleDropOnLineup = (targetIndex: number) => {
    if (!draggedItem) return;

    if (draggedItem.type === 'lineup-slot') {
      const sourceIndex = draggedItem.index;
      if (sourceIndex === targetIndex) return;

      const newPositions = [...positions];
      [newPositions[sourceIndex], newPositions[targetIndex]] = [newPositions[targetIndex], newPositions[sourceIndex]];
      
      const newLineup = [...lineup];
      [newLineup[sourceIndex], newLineup[targetIndex]] = [newLineup[targetIndex], newLineup[sourceIndex]];
      
      setPositions(newPositions);
      setLineup(newLineup);

    } else if (draggedItem.type === 'unassigned-player') {
      const newLineup = [...lineup];
      newLineup[targetIndex] = draggedItem.player;
      setLineup(newLineup);
    }
    
    handleDragEnd();
  };
  
  const handleDropOnAvailableArea = () => {
     if (draggedItem && draggedItem.type === 'lineup-slot') {
         const newLineup = [...lineup];
         newLineup[draggedItem.index] = null;
         setLineup(newLineup);
     }
     handleDragEnd();
  };
  
  const handleTouchStart = (e: React.TouchEvent, item: DraggedItem) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, item, isDrag: false };
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStartRef.current && !touchStartRef.current.isDrag) {
          const { x, y } = touchStartRef.current;
          const touch = e.touches[0];
          const dx = Math.abs(touch.clientX - x);
          const dy = Math.abs(touch.clientY - y);

          if (dx > 5 || dy > 5) { // Moved past threshold, start drag
              e.preventDefault(); // Prevent scrolling when drag starts
              touchStartRef.current.isDrag = true;
              handleDragStart(touchStartRef.current.item);
          }
      }

      if (draggedItem) {
          e.preventDefault(); // Continue preventing scroll while dragging

          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          setDragOverIndex(null);
          setIsDraggingOverReturn(false);

          if (!element) return;
          
          const lineupItem = element.closest('[data-lineup-index]');
          if (lineupItem) {
              const index = parseInt(lineupItem.getAttribute('data-lineup-index')!, 10);
              setDragOverIndex(index);
              return;
          }

          const returnArea = element.closest('[data-return-area]');
          if (returnArea) {
              setIsDraggingOverReturn(true);
              return;
          }
      }
  };

  const handleTouchEnd = () => {
    // If a drag operation was in progress (indicated by draggedItem)
    if (draggedItem) {
      if (dragOverIndex !== null) {
          handleDropOnLineup(dragOverIndex);
      } else if (isDraggingOverReturn) {
          handleDropOnAvailableArea();
      }
      // Clean up drag-related state after the drop is handled.
      handleDragEnd();
    }

    // Defer clearing the touch start reference. This is a crucial fix to allow
    // the subsequent `onClick` event to correctly check if a drag occurred.
    // Without this, `onClick` would fire even after a drag, causing unwanted behavior.
    setTimeout(() => { touchStartRef.current = null; }, 100);
  };

  const handleOrderClick = (index: number) => {
    if (touchStartRef.current?.isDrag) return;

    if (selection?.type === 'lineup-order') {
        if (selection.index === index) {
            setSelection(null); // Deselect if clicking the same one
        } else {
            // Swap with the selected slot
            const sourceIndex = selection.index;
            const targetIndex = index;

            const newPositions = [...positions];
            [newPositions[sourceIndex], newPositions[targetIndex]] = [newPositions[targetIndex], newPositions[sourceIndex]];
            
            const newLineup = [...lineup];
            [newLineup[sourceIndex], newLineup[targetIndex]] = [newLineup[targetIndex], newLineup[sourceIndex]];
            
            setPositions(newPositions);
            setLineup(newLineup);
            setSelection(null); // Clear selection after swap
        }
    } else {
        // No order selected, so select this one
        setSelection({ type: 'lineup-order', index });
    }
  };

  const handlePositionClick = (index: number) => {
    if (touchStartRef.current?.isDrag) return;
    if (selection?.type === 'lineup-position') {
      if (selection.index === index) {
        setSelection(null);
      } else {
        const newPositions = [...positions];
        [newPositions[index], newPositions[selection.index]] = [newPositions[selection.index], newPositions[index]];
        setPositions(newPositions);
        setSelection(null);
      }
    } else {
      setSelection({ type: 'lineup-position', index });
    }
  };

  const handlePlayerSlotClick = (index: number) => {
    if (touchStartRef.current?.isDrag) return;
    const playerInSlot = lineup[index];

    if (selection?.type === 'available-player') {
      const newLineup = [...lineup];
      newLineup[index] = selection.player;
      setLineup(newLineup);
      setSelection(null);
    } else if (selection?.type === 'lineup-player') {
      if (selection.index === index) {
        setSelection(null);
      } else {
        const newLineup = [...lineup];
        [newLineup[index], newLineup[selection.index]] = [newLineup[selection.index], newLineup[index]];
        setLineup(newLineup);
        setSelection(null);
      }
    } else if (playerInSlot) {
      setSelection({ type: 'lineup-player', index });
    }
  };

  const handleAvailablePlayerClick = (player: Player) => {
    if (touchStartRef.current?.isDrag) return;
    if (selection?.type === 'available-player' && selection.player.id === player.id) {
        setSelection(null);
    } else {
        setSelection({ type: 'available-player', player });
    }
  };

  const handleReturnAreaClick = () => {
    if (touchStartRef.current?.isDrag) return;
    if (selection?.type === 'lineup-player') {
      const newLineup = [...lineup];
      newLineup[selection.index] = null;
      setLineup(newLineup);
      setSelection(null);
    }
  };

  const addDhSlot = () => {
    setPositions(prev => [...prev, 'DH']);
    setLineup(prev => [...prev, null]);
  };

  const removeLineupSlot = (indexToRemove: number) => {
    // By filtering the lineup, the removed player's ID will no longer be in the `lineup` state.
    // This causes the `availablePlayers` list to be recalculated,
    // and the player automatically reappears there.
    setLineup(prev => prev.filter((_, index) => index !== indexToRemove));
    setPositions(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDownloadImage = () => {
    if (lineupRef.current) {
      html2canvas(lineupRef.current, { 
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then((canvas: HTMLCanvasElement) => {
        const image = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = 'starting-lineup.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  const handleReverseLineup = () => {
    setLineup(prev => [...prev].reverse());
    setPositions(prev => [...prev].reverse());
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleGenerateRandomLineup = (selectedPlayers: Player[]) => {
    const requiredDefensivePlayers = 9;

    let availablePlayers = [...selectedPlayers];
    const lineupAssignments: { player: Player; position: string }[] = [];

    const findAndAssign = (
        positionType: Position,
        count: number,
        defensivePositions: string[]
    ) => {
        const assignedPlayersForRole: Player[] = [];
        const positionsToAssign = shuffleArray([...defensivePositions]);

        const assignPlayer = (player: Player) => {
            if (assignedPlayersForRole.length < count) {
                assignedPlayersForRole.push(player);
                // Remove from main pool immediately to prevent re-assignment
                availablePlayers = availablePlayers.filter(p => p.id !== player.id); 
            }
        };
        
        // 1. Find by main position
        const mainPosCandidates = shuffleArray(availablePlayers.filter(p => p.mainPosition === positionType));
        mainPosCandidates.forEach(assignPlayer);
        
        // 2. Find by sub position 1
        if (assignedPlayersForRole.length < count) {
            const sub1Candidates = shuffleArray(availablePlayers.filter(p => p.subPosition1 === positionType));
            sub1Candidates.forEach(assignPlayer);
        }

        // 3. Find by sub position 2
        if (assignedPlayersForRole.length < count) {
            const sub2Candidates = shuffleArray(availablePlayers.filter(p => p.subPosition2 === positionType));
            sub2Candidates.forEach(assignPlayer);
        }
        
        // Add to the final lineup assignments
        assignedPlayersForRole.forEach(player => {
            const position = positionsToAssign.pop();
            if (position) {
                lineupAssignments.push({ player, position });
            }
        });
    };

    // Assign players to defensive roles
    findAndAssign(Position.PITCHER, 1, ['投']);
    findAndAssign(Position.CATCHER, 1, ['捕']);
    findAndAssign(Position.INFIELDER, 4, ['一', '二', '三', '遊']);
    findAndAssign(Position.OUTFIELDER, 3, ['左', '中', '右']);

    // Validate if a 9-person defensive team can be formed
    if (lineupAssignments.length < requiredDefensivePlayers) {
        alert(`守備ポジションを埋められませんでした。選手選択を見直してください。\n(現在: ${lineupAssignments.length} / 9人)`);
        return;
    }
    
    // Assign any remaining players as DH
    if (availablePlayers.length > 0) {
        availablePlayers.forEach(player => {
            lineupAssignments.push({ player, position: 'DH' });
        });
    }
    
    // Create the final lineup with random batting order
    const shuffledLineupAssignments = shuffleArray(lineupAssignments);
    
    const newLineup = shuffledLineupAssignments.map(a => a.player);
    const newPositions = shuffledLineupAssignments.map(a => a.position);
    
    setLineup(newLineup);
    setPositions(newPositions);
    setIsModalOpen(false); // Close modal
};

  return (
    <div>
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-700 mb-3">試合情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="match-date" className="block text-sm font-medium text-gray-600 mb-1">試合日</label>
            <input type="date" id="match-date" value={matchDetails.date} onChange={e => setMatchDetails(prev => ({ ...prev, date: e.target.value }))} className="p-2 border rounded-md w-full" />
          </div>
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-600 mb-1">試合開始時間</label>
            <input type="time" id="start-time" step="900" value={matchDetails.time} onChange={e => setMatchDetails(prev => ({ ...prev, time: e.target.value }))} className="p-2 border rounded-md w-full" />
          </div>
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-600 mb-1">試合会場</label>
            <input type="text" id="venue" placeholder="東台" value={matchDetails.venue} onChange={e => setMatchDetails(prev => ({ ...prev, venue: e.target.value }))} className="p-2 border rounded-md w-full" />
          </div>
          <div>
            <label htmlFor="opponent" className="block text-sm font-medium text-gray-600 mb-1">対戦相手</label>
            <input type="text" id="opponent" placeholder="国分寺ハムファイターズ" value={matchDetails.opponent} onChange={e => setMatchDetails(prev => ({ ...prev, opponent: e.target.value }))} className="p-2 border rounded-md w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className={`self-start ${isMobile ? 'sticky top-4' : ''}`}>
          <div ref={lineupRef} className="p-2 bg-white rounded-lg shadow">
              {(matchDetails.date || matchDetails.time || matchDetails.venue || matchDetails.opponent) && (
                <div className="mb-2 p-2 border-b text-sm text-gray-700">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <p><span className="font-semibold">日時:</span> {matchDetails.date || ''} {matchDetails.time || ''}</p>
                    <p><span className="font-semibold">会場:</span> {matchDetails.venue || ''}</p>
                    <p><span className="font-semibold">相手:</span> {matchDetails.opponent || ''}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-2 p-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-700">スターティングメンバー</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-500 text-white text-sm font-semibold py-1 px-3 rounded hover:bg-green-600 transition-colors"
                  >
                    ランダム
                  </button>
                  <button
                    onClick={handleReverseLineup}
                    className="bg-gray-200 text-gray-700 text-sm font-semibold py-1 px-3 rounded hover:bg-gray-300 transition-colors"
                  >
                    打順を逆にする
                  </button>
                </div>
              </div>
              <ul className="space-y-1">
                {positions.map((position, index) => {
                  const player = lineup[index];
                  const isPlayerSelected = selection?.type === 'lineup-player' && selection.index === index;
                  const isPositionSelected = selection?.type === 'lineup-position' && selection.index === index;
                  const isOrderSelected = selection?.type === 'lineup-order' && selection.index === index;

                  const isSlotGhost = draggedItem?.type === 'lineup-slot' && draggedItem.index === index;
                  const isDropTarget = dragOverIndex === index && draggedItem?.type === 'lineup-slot' && draggedItem.index !== index;

                  return (
                    <li 
                      key={index} 
                      data-lineup-index={index}
                      draggable
                      onDragStart={() => handleDragStart({ type: 'lineup-slot', index })}
                      onTouchStart={(e) => handleTouchStart(e, { type: 'lineup-slot', index })}
                      onDragEnd={handleDragEnd}
                      onDrop={() => handleDropOnLineup(index)} 
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                      onDragLeave={() => setDragOverIndex(null)}
                      className={`flex items-center text-sm rounded-md cursor-pointer transition-all duration-150 ${isSlotGhost ? 'opacity-30' : ''} ${isDropTarget ? 'bg-blue-100 ring-2 ring-blue-400' : ''} ${isOrderSelected ? 'ring-2 ring-green-500' : ''}`}
                    >
                      <div
                        onClick={() => handleOrderClick(index)}
                        className={`w-8 flex-shrink-0 text-center font-semibold text-gray-600 p-2 rounded-l-md transition-colors ${isOrderSelected ? 'bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {index + 1}
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePositionClick(index)
                          }}
                        className={`p-2 text-gray-600 font-semibold w-20 sm:w-24 text-center truncate ${isPositionSelected ? 'ring-2 ring-blue-500 z-10' : ''}`}
                        style={{ backgroundColor: LINEUP_POSITION_COLORS[position] || '#e5e7eb' }}
                      >
                        {position}
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayerSlotClick(index)
                        }}
                        className={`flex-grow p-2 rounded-r-md text-gray-800 font-semibold relative ${ (player || selection?.type === 'available-player') ? '' : 'bg-gray-100'} ${isPlayerSelected ? 'ring-2 ring-blue-500 z-10' : ''}`}
                        style={player ? { background: getGradient(player) } : {}}
                      >
                        {player ? (
                          <div className="flex items-center justify-center gap-x-2">
                              <span className="flex-shrink-0 bg-white bg-opacity-70 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold text-gray-800 shadow-sm">
                              {player.number || '-'}
                              </span>
                              <span className="truncate">{player.name}</span>
                          </div>
                          ) : (
                          <span className="text-center w-full block">-</span>
                          )}
                        {position === 'DH' && positions.length > 9 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLineupSlot(index);
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-opacity"
                            aria-label="スロットを削除"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2">
                  <button
                      onClick={addDhSlot}
                      className="w-full bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                  >
                      + メンバーを追加
                  </button>
              </div>
          </div>
          <button
            onClick={handleDownloadImage}
            className="mt-2 w-full bg-teal-500 text-white font-bold py-2 px-4 rounded hover:bg-teal-600 transition-colors"
          >
            画像としてダウンロード (JPG)
          </button>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2 p-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-700">登録選手一覧 ({availablePlayers.length})</h2>
            <div className="flex items-center">
                  <label htmlFor="lineup-sort" className="mr-2 text-sm font-semibold text-gray-600">並び順:</label>
                  <select
                      id="lineup-sort"
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value as SortType)}
                      className="p-1 border rounded-md bg-white text-sm"
                  >
                      <option value="default">登録順</option>
                      <option value="number">背番号順</option>
                      <option value="position">ポジション順</option>
                  </select>
              </div>
          </div>
          <div onDrop={handleDropOnAvailableArea} onDragOver={(e) => e.preventDefault()} className="bg-white rounded-lg shadow p-1 sm:p-2 min-h-[200px] flex flex-col">
              <ul className="space-y-1 flex-grow">
                {availablePlayers.map((player) => {
                  const isGhost = draggedItem?.type === 'unassigned-player' && draggedItem.player?.id === player.id;
                  const isSelected = selection?.type === 'available-player' && selection.player.id === player.id;
                  return (
                    <li
                      key={player.id}
                      draggable
                      onDragStart={() => handleDragStart({ type: 'unassigned-player', player })}
                      onTouchStart={(e) => handleTouchStart(e, { type: 'unassigned-player', player })}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleAvailablePlayerClick(player)}
                      className={`p-2 rounded-md cursor-pointer text-sm ${isGhost ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      style={{ background: getGradient(player) }}
                    >
                      <div className="flex items-center justify-center gap-x-2 w-full">
                          <span className="flex-shrink-0 bg-white bg-opacity-70 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold text-gray-800 shadow-sm">
                              {player.number || '-'}
                          </span>
                          <span className="font-semibold text-gray-800 text-center truncate">{player.name}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div
                data-return-area="true"
                onClick={() => handleReturnAreaClick()}
                onDrop={handleDropOnAvailableArea} 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOverReturn(true); }}
                onDragLeave={() => setIsDraggingOverReturn(false)}
                className={`mt-2 p-3 text-center text-gray-500 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDraggingOverReturn ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-100'}`}
              >
                ここに戻す
              </div>
          </div>
        </div>
      </div>
      <RandomLineupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerateRandomLineup}
        players={players}
      />
    </div>
  );
};

export default StartingLineupPage;