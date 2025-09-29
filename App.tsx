import React, { useState, useEffect } from 'react';
import { Player, MatchDetails } from './types';
import PlayerRegistrationForm from './components/PlayerRegistrationForm';
import PlayerList from './components/PlayerList';
import StartingLineupPage from './components/StartingLineupPage';
import InningRosterPage from './components/InningRosterPage';
import { LINEUP_POSITIONS } from './constants';

// LocalStorage Keys
const PLAYERS_STORAGE_KEY = 'baseballApp.players';
const LINEUP_STORAGE_KEY = 'baseballApp.lineup';
const POSITIONS_STORAGE_KEY = 'baseballApp.positions';
const INNING_ROSTER_STORAGE_KEY = 'baseballApp.inningRoster';
const MATCH_DETAILS_STORAGE_KEY = 'baseballApp.matchDetails';

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const savedPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);
      return savedPlayers ? JSON.parse(savedPlayers) : [];
    } catch (error) {
      console.error("Failed to parse players from localStorage", error);
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'roster' | 'lineup' | 'inningRoster'>('roster');
  
  const [lineup, setLineup] = useState<(Player | null)[]>(() => {
    try {
      const savedLineup = localStorage.getItem(LINEUP_STORAGE_KEY);
      return savedLineup ? JSON.parse(savedLineup) : Array(LINEUP_POSITIONS.length).fill(null);
    } catch (error) {
      console.error("Failed to parse lineup from localStorage", error);
      return Array(LINEUP_POSITIONS.length).fill(null);
    }
  });
  
  const [positions, setPositions] = useState<string[]>(() => {
    try {
      const savedPositions = localStorage.getItem(POSITIONS_STORAGE_KEY);
      return savedPositions ? JSON.parse(savedPositions) : LINEUP_POSITIONS;
    } catch (error) {
      console.error("Failed to parse positions from localStorage", error);
      return LINEUP_POSITIONS;
    }
  });
  
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  
  const [inningRoster, setInningRoster] = useState<Record<string, string[]>>(() => {
    try {
      const savedInningRoster = localStorage.getItem(INNING_ROSTER_STORAGE_KEY);
      return savedInningRoster ? JSON.parse(savedInningRoster) : {};
    } catch (error) {
      console.error("Failed to parse inning roster from localStorage", error);
      return {};
    }
  });

  const [matchDetails, setMatchDetails] = useState<MatchDetails>(() => {
    try {
      const saved = localStorage.getItem(MATCH_DETAILS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { date: '', time: '', venue: '', opponent: '' };
    } catch (error) {
      console.error("Failed to parse match details from localStorage", error);
      return { date: '', time: '', venue: '', opponent: '' };
    }
  });

  // Save players to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
    } catch (error) {
      console.error("Failed to save players to localStorage", error);
    }
  }, [players]);

  // Save lineup to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LINEUP_STORAGE_KEY, JSON.stringify(lineup));
    } catch (error) {
      console.error("Failed to save lineup to localStorage", error);
    }
  }, [lineup]);

  // Save positions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
    } catch (error) {
      console.error("Failed to save positions to localStorage", error);
    }
  }, [positions]);

  // Save inning roster to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INNING_ROSTER_STORAGE_KEY, JSON.stringify(inningRoster));
    } catch (error) {
      console.error("Failed to save inning roster to localStorage", error);
    }
  }, [inningRoster]);

  // Save match details to localStorage
  useEffect(() => {
    try {
        localStorage.setItem(MATCH_DETAILS_STORAGE_KEY, JSON.stringify(matchDetails));
    } catch (error) {
        console.error("Failed to save match details to localStorage", error);
    }
  }, [matchDetails]);


  const addPlayer = (player: Omit<Player, 'id'>) => {
    setPlayers([...players, { ...player, id: Date.now().toString() }]);
  };

  const addMultiplePlayers = (newPlayers: Omit<Player, 'id'>[]) => {
    const playersWithIds = newPlayers.map((p, index) => ({
      ...p,
      id: `${Date.now()}-${index}`
    }));
    setPlayers(prev => [...prev, ...playersWithIds]);
  };

  const deletePlayer = (id: string) => {
    setPlayers(players.filter(player => player.id !== id));
    setLineup(lineup.map(p => (p?.id === id ? null : p)));
  };

  const handleStartEdit = (player: Player) => {
    setPlayerToEdit(player);
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    // Also update player in lineup if they are there
    setLineup(lineup.map(p => p?.id === updatedPlayer.id ? updatedPlayer : p));
    setPlayerToEdit(null);
  };
  
  const handleCancelEdit = () => {
    setPlayerToEdit(null);
  };

  useEffect(() => {
    const lineupPlayerIds = new Set(lineup.filter(p => p).map(p => p!.id));

    const updatedInningRoster: Record<string, string[]> = {};

    // Keep existing data for players still in the lineup
    for (const playerId in inningRoster) {
        if (lineupPlayerIds.has(playerId)) {
            updatedInningRoster[playerId] = inningRoster[playerId];
        }
    }

    // Add new players from the lineup and initialize their innings
    lineup.forEach((player, index) => {
        if (player && !updatedInningRoster[player.id]) {
            const position = positions[index];
            updatedInningRoster[player.id] = Array(9).fill(position);
        }
    });

    setInningRoster(updatedInningRoster);
  }, [lineup, positions]);


  return (
    <div className="container mx-auto p-2 sm:p-4 font-sans">
      <h1 className="text-3xl sm:text-4xl font-bold text-center my-4 sm:my-6 text-gray-800">メンバー管理</h1>
      <div className="flex justify-center mb-6 sm:mb-8 border-b">
        <button
          className={`px-4 py-2 text-lg font-semibold ${activeTab === 'roster' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('roster')}
        >
          選手
        </button>
        <button
          className={`px-4 py-2 text-lg font-semibold ${activeTab === 'lineup' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('lineup')}
        >
          スタメン
        </button>
        <button
          className={`px-4 py-2 text-lg font-semibold ${activeTab === 'inningRoster' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('inningRoster')}
        >
          イニング別
        </button>
      </div>

      {activeTab === 'roster' && (
        <div>
          <PlayerRegistrationForm 
            addPlayer={addPlayer} 
            playerToEdit={playerToEdit}
            updatePlayer={handleUpdatePlayer}
            cancelEdit={handleCancelEdit}
          />
          <PlayerList 
            players={players} 
            deletePlayer={deletePlayer} 
            onEditPlayer={handleStartEdit} 
            addMultiplePlayers={addMultiplePlayers}
          />
        </div>
      )}

      {activeTab === 'lineup' && 
        <StartingLineupPage 
          players={players} 
          lineup={lineup}
          setLineup={setLineup}
          positions={positions}
          setPositions={setPositions}
          matchDetails={matchDetails}
          setMatchDetails={setMatchDetails}
        />
      }

      {activeTab === 'inningRoster' && 
        <InningRosterPage
            lineupPlayers={lineup.filter((p): p is Player => p !== null)}
            inningRoster={inningRoster}
            setInningRoster={setInningRoster}
            matchDetails={matchDetails}
        />
      }
    </div>
  );
};

export default App;