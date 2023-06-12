import { ChangeEvent, useEffect, useState } from "react";
import { Actor, Item, ItemType, Movie, SAM_L_JACKSON_ID, useGame } from "../contexts/GameContext";
import { Chain } from "./Game";


export interface ItemCardProps {
	addItemToChain: (item: Item, chain: Chain) => void,
	item: Item,
	itemIndexInChain: number,
	itemIsLast: boolean,
	removeItemFromChain: (index: number) => void,
}


export const ACTOR_SELECT_LABEL_ID = 'actor-select-label';
export const MOVIE_SELECT_LABEL_ID = 'movie-select-label';
const TMDB_IMG_WIDTH = '154';


export function ItemCard({addItemToChain, item, itemIndexInChain, itemIsLast, removeItemFromChain}: ItemCardProps) {
	const {settings, startingActors, tmdbImgBaseURL} = useGame();
	const [imgLoading, setImgLoading] = useState(true);
	const [characterLabel, setCharacterLabel] = useState('');
	const [characterAriaLabel, setCharacterAriaLabel] = useState('');

	const itemIsActor = item.type === ItemType.Actor;
	const options = itemIsActor ? (item as Actor).movies : (item as Movie).cast;


	useEffect(() => setCharacterLabel(''), [startingActors]);


	function formatCharacterName(actor: Actor, character: string): string {
		const name = character
			.replace(' (archive footage)', '')
			.replace(' (voice)', '')
			.replace(' - Narrator', '')
			.replace(' (Uncredited)', '')
			.replace(' (uncredited)', '');
		return name == 'Self' || name == actor.name ? 'himself' : name;
	}


	function handleSelectChange(e: ChangeEvent) {
		const index = parseInt((e.target as HTMLInputElement).value, 10);

		/* eslint-disable @typescript-eslint/no-non-null-assertion */
		const selectedItem = itemIsActor ?
			(item as Actor).movies![index] :
			(item as Movie).cast![index];
		/* eslint-enable @typescript-eslint/no-non-null-assertion */

		if (!selectedItem) return;

		addItemToChain(selectedItem, itemIndexInChain);

		// Show character label
		const character = selectedItem.character;
		if (!character) return;

		const formattedCharacterName = formatCharacterName(
			itemIsActor ? item : selectedItem,
			character
		);

		const characterLabel = itemIsActor ?
			`${itemIndexInChain !== 0 ? 'who ' : ''}played ${formattedCharacterName} in...` :
			`which featured ${formattedCharacterName} played by...`;
		setCharacterLabel(characterLabel);

		// Set text for aria live region so selection is announced to user
		const characterAriaLabel = itemIsActor ?
			`${item.name} played ${formattedCharacterName} in ${selectedItem.name}` :
			`${item.name} featured ${formattedCharacterName} played by ${selectedItem.name}`;
		setCharacterAriaLabel(characterAriaLabel);
	}


	return (
		<li className="item-card card">
			<div className="item-card__btn-container">
				{itemIndexInChain !== 0 &&
					<button
							aria-label={`Remove "${item.name}" from chain`}
							className="btn"
							onClick={() => removeItemFromChain(itemIndexInChain)}>
						<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clipPath="url(#clip0_15_25)">
								<path d="M7.41 6L11.71 1.71C11.8983 1.5217 12.0041 1.2663 12.0041 1C12.0041 0.733701 11.8983 0.478306 11.71 0.290002C11.5217 0.101699 11.2663 -0.00408936 11 -0.00408936C10.7337 -0.00408936 10.4783 0.101699 10.29 0.290002L6 4.59L1.71 0.290002C1.5217 0.101699 1.2663 -0.00408936 1 -0.00408936C0.733698 -0.00408935 0.478304 0.101699 0.29 0.290002C0.101696 0.478306 -0.00409174 0.733701 -0.00409174 1C-0.00409174 1.2663 0.101696 1.5217 0.29 1.71L4.59 6L0.29 10.29C0.196272 10.383 0.121877 10.4936 0.0711088 10.6154C0.0203401 10.7373 -0.00579834 10.868 -0.00579834 11C-0.00579834 11.132 0.0203401 11.2627 0.0711088 11.3846C0.121877 11.5064 0.196272 11.617 0.29 11.71C0.382963 11.8037 0.493564 11.8781 0.615423 11.9289C0.737282 11.9797 0.867988 12.0058 1 12.0058C1.13201 12.0058 1.26272 11.9797 1.38458 11.9289C1.50644 11.8781 1.61704 11.8037 1.71 11.71L6 7.41L10.29 11.71C10.383 11.8037 10.4936 11.8781 10.6154 11.9289C10.7373 11.9797 10.868 12.0058 11 12.0058C11.132 12.0058 11.2627 11.9797 11.3846 11.9289C11.5064 11.8781 11.617 11.8037 11.71 11.71C11.8037 11.617 11.8781 11.5064 11.9289 11.3846C11.9797 11.2627 12.0058 11.132 12.0058 11C12.0058 10.868 11.9797 10.7373 11.9289 10.6154C11.8781 10.4936 11.8037 10.383 11.71 10.29L7.41 6Z" fill="currentColor"/>
							</g>

							<defs>
								<clipPath id="clip0_15_25">
								<rect width="24" height="24" fill="white" transform="translate(-6 -6)"/>
								</clipPath>
							</defs>
						</svg>
					</button>
				}
			</div>

			<div className="item-card__content">
				{item.imgPath &&
					<div className="item-card__img-container">
						<img
							className={`item-card__img${imgLoading ? ' item-card__img--loading' : ''}`}
							onLoad={() => setImgLoading(false)}
							role="presentation"
							src={`${tmdbImgBaseURL}w${TMDB_IMG_WIDTH}/${item.imgPath}`} />
					</div>
				}

				<div className="item-card__text">
					<h2 className="card__heading">
						{item.name}{(item as Movie).year && ` (${(item as Movie).year})`}
					</h2>

					{/* p for screen reader only, used to announce link after user selection. */}
					{!itemIsLast &&
						<p
								aria-live="polite"
								className="u-sr-only">
							{characterAriaLabel}
						</p>
					}

					{!itemIsLast && characterLabel &&
						<p
								aria-hidden="true"
								className="card__p">
							{characterLabel}
						</p>
					}

					{itemIsLast && options && options.length > 0 &&
						<select
								aria-labelledby={itemIsActor ? MOVIE_SELECT_LABEL_ID : ACTOR_SELECT_LABEL_ID}
								className="item-card__select"
								onChange={handleSelectChange}>
							<option></option>

							{options?.map((item: Item, i: number) => (
								<option
										disabled={
											!itemIsActor &&
											!settings.allowSamLJackson &&
											item.id === SAM_L_JACKSON_ID
										}
										key={item.id}
										value={i}>
									{item.name}
								</option>
							))}
						</select>
					}
				</div>
			</div>
		</li>
	)
}
