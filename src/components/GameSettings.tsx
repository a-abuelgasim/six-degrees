import { ChangeEvent, FormEvent, MutableRefObject, useEffect, useRef, useState } from "react";
import { useGame } from "../contexts/GameContext";
import { Difficulty, Settings } from "../contexts/GameContext";


export function GameSettings() {
	const {
		getPopularActors,
		newGame,
		setSettings,
		settings
	} = useGame();

	const [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty);
	const [ready, setReady] = useState(false);
	const [loading, setLoading] = useState(false);


	// Element refs
	const kevinBaconRef: MutableRefObject<HTMLInputElement | null> = useRef(null);
	const samLJacksonRef: MutableRefObject<HTMLInputElement | null> = useRef(null);
	const buttonRef: MutableRefObject<HTMLButtonElement | null> = useRef(null);


	// When game is ready start a new game
	useEffect(() => {ready && newGame()}, [ready]);


	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (
			!samLJacksonRef.current ||
			!kevinBaconRef.current ||
			!buttonRef.current
		) return;

		buttonRef.current.setAttribute('disabled', 'true');
		buttonRef.current.setAttribute('aria-label', 'Loading...');

		setLoading(true);


		try {
			await getPopularActors();
		} catch(error) {
			console.error(error);
			return;
		}

		// Create new settings object from form field values
		const settings: Settings = {
			allowSamLJackson: samLJacksonRef.current?.checked,
			difficulty: difficulty,
			startWithBacon: kevinBaconRef.current?.checked,
		}

		setSettings(settings);
		setReady(true);
	}


	return(
		<>
			<h1 className="settings__heading section-heading">
				<span>6 Degrees</span>
			</h1>

			<div className="settings__card card">
				<p className="settings__main-p">
					This game is based on the <a href="https://en.wikipedia.org/wiki/Six_Degrees_of_Kevin_Bacon" target="_blank">six degrees of Kevin Bacon</a> parlour game. The goal of the game is to link two actors to each other using a series of movies and other actors.
				</p>

				<h2 className="settings__subheading u-text-center">
					Options
				</h2>

				<form
						className="settings__form"
						onSubmit={onSubmit}>
					<div>
						<label className="settings__label">
							Start with Kevin Bacon?

							<input
									className="settings__input"
									defaultChecked={settings.startWithBacon}
									ref={kevinBaconRef}
									type="checkbox"/>
						</label>
					</div>

					<div>
						<label className="settings__label">
							Allow Samuel L. Jackson?

							<input
									className="settings__input"
									defaultChecked={settings.allowSamLJackson}
									ref={samLJacksonRef}
									type="checkbox"/>
						</label>
					</div>

					<fieldset className="settings__fieldset">
						<legend className="settings__legend">
							Difficulty
						</legend>

					<div onChange={(e: ChangeEvent<HTMLInputElement>) => setDifficulty(parseInt(e.target.value, 10))}>
						<label className="settings__label">
							Easy:

							<input
									className="settings__input"
									defaultChecked={difficulty === Difficulty.Easy}
									name="difficulty"
									type="radio"
									value={Difficulty.Easy} />
						</label>

						<label className="settings__label">
							Medium:

							<input
									className="settings__input"
									defaultChecked={difficulty === Difficulty.Medium}
									name="difficulty"
									type="radio"
									value={Difficulty.Medium} />
						</label>

						<label className="settings__label">
							Hard:

							<input
									className="settings__input"
									defaultChecked={difficulty === Difficulty.Hard}
									name="difficulty"
									type="radio"
									value={Difficulty.Hard} />
						</label>
					</div>
					</fieldset>

					<button
							aria-label="Play"
							className="btn settings__btn"
							ref={buttonRef}>
						{loading ?
							<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="m3 0c-.55228 0-1 .447715-1 1 0 .55228.44772 1 1 1v1.17157c0 .79565.31607 1.55871.87868 2.12132l2.70711 2.70711-2.70711 2.7071c-.56261.5626-.87868 1.3257-.87868 2.1213v1.1716c-.55228 0-1 .4477-1 1s.44772 1 1 1h10c.5523 0 1-.4477 1-1s-.4477-1-1-1v-1.1716c0-.7956-.3161-1.5587-.8787-2.1213l-2.70709-2.7071 2.70709-2.70711c.5626-.56261.8787-1.32567.8787-2.12132v-1.17157c.5523 0 1-.44772 1-1 0-.552285-.4477-1-1-1zm8 2h-6v1.17157c0 .26522.10536.51957.29289.70711l.12132.12132h5.17159l.1213-.12132c.1875-.18754.2929-.44189.2929-.70711zm-3 7.41421-2.70711 2.70709c-.18753.1876-.29289.4419-.29289.7071v1.1716h6v-1.1716c0-.2652-.1054-.5195-.2929-.7071z" fillRule="evenodd"/>
							</svg> :
							<svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="m424.4 214.7-352-208.1c-28.6-16.9-72.4-.5-72.4 41.3v416.1c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"/>
							</svg>
						}
					</button>
				</form>

				<div className="u-text-center">
					<p className="card__p">
						Created by <a href="https://a-abuelgasim.github.io/portfolio" target="_blank">Ahmed Abuelgasim</a>
					</p>

					<p className="settings__attribution card__p">
						Powered by

						<a
								aria-label="TMDB"
								href="https://www.themoviedb.org"
								target="_blank">
							<img
									className="settings__logo settings__logo--tmdb"
									role="presentation"
									src="imgs/tmdb.svg" />
						</a>

						&amp;

						<a
								href="https://iconduck.com/"
								target="_blank">
							IconDuck
						</a>

						<img
								className="settings__logo settings__logo--iconduck"
								role="presentation"
								src="imgs/iconduck.png" />
					</p>

					<p className="settings__footnote">
						This product uses the TMDB API but is not endorsed or certified by TMDB.
					</p>
				</div>
			</div>
		</>
	)
}
