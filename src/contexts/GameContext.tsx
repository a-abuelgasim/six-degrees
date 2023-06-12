import { ReactNode, createContext, useContext, useEffect, useState } from "react";


export enum Difficulty {
	Easy,
	Medium,
	Hard,
}

export enum ItemType {
	Actor,
	Movie,
}

interface _Item {
	character?: string,
	id: number,
	imgPath: string,
	name: string,
	type: ItemType,
}

export interface Movie extends _Item {
	cast?: Actor[]
	year: number,
}

export interface Actor extends _Item{
	movies?: Movie[],
}

export type Item = Actor | Movie;

interface RandomNumberLimits {
	max: number,
	min: number,
}

export interface Settings {
	allowSamLJackson: boolean,
	difficulty: Difficulty,
	startWithBacon: boolean,
}


interface GameContext {
	gameInProgress: boolean,
	getActorDetails: (id: number) => Promise<Actor | null>,
	getMovieDetails: (id: number) => Promise<Movie | null>,
	getPopularActors: () => Promise<void>,
	newGame: () => Promise<void>,
	setGameInProgress: React.Dispatch<React.SetStateAction<boolean>>,
	setSettings: React.Dispatch<React.SetStateAction<Settings>>,
	settings: Settings,
	startingActors: [(Actor | null), (Actor | null)],
	tmdbImgBaseURL: string,
}

interface GameProviderProps {
	children: ReactNode
}


const API_KEY = '303bfe0cb9291c31c52f02191ab37d68';
const DEFAULT_SETTINGS: Settings = {
	allowSamLJackson: true,
	difficulty: Difficulty.Medium,
	startWithBacon: true,
}
const KEVIN_BACON_ID = 4724;
const POPULAR_ACTORS_MIN_COUNT = 500;
export const SAM_L_JACKSON_ID = 2231;


// Create Game Context
const GameContext = createContext({} as GameContext);
export const useGame = () => useContext(GameContext);


// Create Game Context Provider
export function GameProvider({children}: GameProviderProps) {
	const [startingActors, setStartingActors] = useState<[Actor | null, Actor | null]>([null, null]);
	const [gameInProgress, setGameInProgress] = useState(false);
	const [popularActorsIDs, setPopularActorsIDs] = useState<number[]>([]);
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [kevinBacon, setKevinBacon] = useState<Actor | null>(null);
	const [tmdbImgBaseURL, setTMDBImgBaseURL] = useState<string>('');


	// Get TMDB image base URL from config once at start
	useEffect(() => {
		async function getImgBaseURL() {
			const response = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${API_KEY}`);

			const {images: {secure_base_url: tmdbImgBaseURL}} = await response.json();
			setTMDBImgBaseURL(tmdbImgBaseURL);
		}

		getImgBaseURL().catch(error => console.error(error));
	}, []);


	// Generate a random number between given min and max values
	function generateRandomIndex({min, max}: RandomNumberLimits): number {
		return Math.floor(Math.random() * ((max - 1) - min + 1) + min)
	}


	// Get details including credits for actor with given ID
	async function getActorDetails(id: number): Promise<Actor | null> {
		try {
			const response = await fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&append_to_response=combined_credits`);
			const {
				combined_credits: {cast},
				name,
				profile_path: imgPath
			} = await response.json();

			/* eslint-disable @typescript-eslint/no-explicit-any */
			const movies = cast
				.filter((credit: any) =>
					credit['media_type'] == 'movie' && // Only movies
					credit['video'] == false && // that are feature length
					credit['release_date'] && // that have been released
					!credit['genre_ids'].includes(99) && // and are not documentaries
					!credit['genre_ids'].includes(10770) // nor TV movies
				)
				.map((credit: any): Movie => ({
					character: credit.character,
					id: credit.id,
					imgPath: credit['poster_path'],
					name: credit.title,
					type: ItemType.Movie,
					year: parseInt(credit['release_date']?.split('-')[0], 10),
				}))
			/* eslint-enable @typescript-eslint/no-explicit-any */
				.sort((a: Movie, b: Movie) => b.year - a.year);

			const actor: Actor = {
				id,
				imgPath,
				movies,
				name,
				type: ItemType.Actor,
			};
			return actor;
		} catch(err) {
			console.error(err);
			return null;
		}
	}


	// Get details including cast for movie with given ID
	async function getMovieDetails(id: number): Promise<Movie | null> {
		try {
			const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=credits`);
			const {
				credits: {cast: fullCast},
				poster_path: imgPath,
				release_date: releaseDate,
				title: name
			} = await response.json();

			const cast = fullCast
				.map((actor: any): Actor => ({
					character: actor.character,
					id: actor.id,
					imgPath: actor['profile_path'],
					name: actor.name,
					type: ItemType.Actor,
				}))

			const movie: Movie = {
				cast,
				id,
				imgPath,
				name,
				type: ItemType.Movie,
				year: parseInt(releaseDate?.split('-')[0], 10),
			};
			return movie;
		} catch(err) {
			console.error(err);
			return null;
		}
	}


	// On load, get list of popular actors
	async function getPopularActors(): Promise<void> {
		// Do not get popular actors if already retrieved once
		if (popularActorsIDs.length > 0) {
			return;
		}

		const  popularActors: number[] = [];

		// Get POPULAR_ACTORS_MIN_COUNT popular actors since each api call returns 20 actors
		for(let i = 1; popularActors.length <= POPULAR_ACTORS_MIN_COUNT; i++) {
			const response = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${API_KEY}&page=${i}`);
			const data = await response.json();

			// Filter out non actors, non-English language actors and 'adult' actors
			/* eslint-disable @typescript-eslint/no-explicit-any */
			const filteredActors = data.results
				.filter((actor: any) =>
					actor['known_for_department'] === 'Acting' &&
					actor.adult === false &&
					actor['known_for'].find((x: any) => x["original_language"] === 'en')
				);

			popularActors.push(...filteredActors.map((result: any) => result.id));
			/* eslint-enable @typescript-eslint/no-explicit-any */
		}

		setPopularActorsIDs(popularActors);
	}


	async function newGame(): Promise<void> {
		// First actor by default is Kevin Bacon unless option is unchecked in settings, otherwise a random actor is used except for Sam L Jackson if that option also unchecked
		const popularActorsCount = popularActorsIDs.length;
		let randomNumber1Limits: RandomNumberLimits;
		switch(settings.difficulty) {
			case Difficulty.Easy:
			case Difficulty.Medium:
				randomNumber1Limits = {min: 0, max: (.5 * popularActorsCount)};
				break;
			case Difficulty.Hard:
				randomNumber1Limits = {min: (.75 * popularActorsCount), max: popularActorsCount};
				break;
		}

		let actor1ID = KEVIN_BACON_ID;
		if (!settings.startWithBacon) {
			do {
				actor1ID = popularActorsIDs[generateRandomIndex(randomNumber1Limits)];
			} while (
				actor1ID === KEVIN_BACON_ID ||
				(!settings.allowSamLJackson && actor1ID === SAM_L_JACKSON_ID)
			)
		}

		// Second actor can never be Kevin Bacon, either he is the first actor or the option to start with kevin is disabled. Second actor can't be Sam L Jackson if option to allow him is unchecked
		let randomNumber2Limits: RandomNumberLimits;
		switch(settings.difficulty) {
			case Difficulty.Easy:
				randomNumber2Limits = {min: 0, max: (.5 * popularActorsCount)};
				break;
			case Difficulty.Medium:
			case Difficulty.Hard:
				randomNumber2Limits = {min: (.75 * popularActorsCount), max: popularActorsCount};
				break;
		}

		let actor2ID;
		do {
			actor2ID = popularActorsIDs[generateRandomIndex(randomNumber2Limits)];
		} while (
			actor2ID === actor1ID ||
			actor2ID === KEVIN_BACON_ID ||
			(!settings.allowSamLJackson && actor2ID === SAM_L_JACKSON_ID)
		)

		const [actor1, actor2] = await Promise.all([
			!settings.startWithBacon || !kevinBacon ? getActorDetails(actor1ID) : kevinBacon,
			getActorDetails(actor2ID),
		]);

		if (settings.startWithBacon && !kevinBacon) {
			setKevinBacon(actor1);
		}

		setStartingActors([actor1, actor2]);
		setGameInProgress(true);
	}


	return (
		<GameContext.Provider
				value={{
					gameInProgress,
					getActorDetails,
					getMovieDetails,
					getPopularActors,
					newGame,
					setGameInProgress,
					setSettings,
					settings,
					startingActors,
					tmdbImgBaseURL,
				}}>
			{children}
		</GameContext.Provider>
	)
}
