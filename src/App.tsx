import { GameProvider, useGame } from "./contexts/GameContext";
import { GameSettings } from "./components/GameSettings";
import { Game } from "./components/Game";


function GameContainer() {
	const {gameInProgress} = useGame();

	return (
		<>
			{gameInProgress ? <Game /> : <GameSettings />}
		</>
	)
}


export default function App() {
	return(
		<GameProvider>
			<GameContainer />
		</GameProvider>
	)
}
