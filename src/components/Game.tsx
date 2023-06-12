import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Item, ItemType, useGame } from "../contexts/GameContext";
import { ItemCard } from "./ItemCard";
import { ACTOR_SELECT_LABEL_ID, MOVIE_SELECT_LABEL_ID } from "./ItemCard";


export enum Chain {
	A,
	B
}


export function Game() {
	const {
		getMovieDetails,
		getActorDetails,
		setGameInProgress,
		startingActors,
		newGame,
	} = useGame();

	const [chainA, setChainA] = useState<(Item)[]>([]);
	const [chainB, setChainB] = useState<(Item)[]>([]);
	const [success, setSuccess] = useState(false);

	const chainARef: MutableRefObject<HTMLUListElement | null> = useRef(null);
	const chainBRef: MutableRefObject<HTMLUListElement | null> = useRef(null);


	// If startingActors change, empty chains and add new starting actors
	useEffect(() => {
		if (startingActors[0]) setChainA([startingActors[0]]);
		if (startingActors[1]) setChainB([startingActors[1]]);
	}, [startingActors]);


	async function addItemToChainA(item: Item, itemIndexInChain: number): Promise<void> {
		addItemToChain(item, itemIndexInChain, Chain.A);
	}


	async function addItemToChainB(item: Item, itemIndexInChain: number): Promise<void> {
		addItemToChain(item, itemIndexInChain, Chain.B);
	}


	async function addItemToChain(item: Item, itemIndexInChain: number, chain: Chain): Promise<void> {
		// Get movies or cast for Actor or Movie respectively.
		const detailedItem: Item | null = !item ?
			null :
			(item.type === ItemType.Actor ?
				await getActorDetails(item.id) :
				await getMovieDetails(item.id));

		// Check whether an item or the first option ("-") selected
		if (item) {
			// Check if item is already in other chain.
			// If so player has completed the link.
			const otherChain = chain === Chain.A ? chainB : chainA;
			const otherChainLastLink = otherChain[otherChain.length - 1];
			if (
				item.id == otherChainLastLink.id &&
				item.type == otherChainLastLink.type
			) {
				setSuccess(true);
				alert('You did it! Nice job! 🎉');
				return
			}
		}

		// State setter method shared by setChainA and setChainB
		function addToChain(prevChain: Item[]): Item[] {
			// Remove any items after item. Needed for when item in chain is edited.
			prevChain.length = itemIndexInChain + 1;
			if (detailedItem) prevChain.push(detailedItem);
			return [...prevChain];
		}

		// Add item to relevant chain
		chain === Chain.A ?
			setChainA((prevChain) => addToChain(prevChain)) :
			setChainB((prevChain) => addToChain(prevChain));
	}


	function getLinksTotal(): number {
		return (chainA.length + chainB.length - 1) / 2;
	}

	// Set focus on previous item in chain
	function setFocus(removedItemIndex: number, chainRef: MutableRefObject<HTMLUListElement | null>) {
		const elToSetFocusOn = chainRef
			.current?.children
			.item(removedItemIndex - 1);

		(elToSetFocusOn as any).focus();
	}


	function removeItemFromChainA(itemIndexInChain: number): void {
		setFocus(itemIndexInChain, chainARef);
		removeItemFromChain(itemIndexInChain, Chain.A);
	}

	function removeItemFromChainB(itemIndexInChain: number): void {
		setFocus(itemIndexInChain, chainBRef);
		removeItemFromChain(itemIndexInChain, Chain.B);
	}


	function removeItemFromChain(itemIndexInChain: number, chain: Chain): void {
		// State setter method shared by setChainA and setChainB
		function removeFromChain(prevChain: Item[]): Item[] {
			// Remove item and all items after it in chain
			prevChain.length = itemIndexInChain;
			return [...prevChain];
		}

		// Remove item from chain
		chain === Chain.A ?
			setChainA((prevChain) => removeFromChain(prevChain)) :
			setChainB((prevChain) => removeFromChain(prevChain));

		setSuccess(false);
	}


	function startNewGame(): void {
		setSuccess(false);
		newGame();
	}


	return(
		<>
			<header className="game__header">
				<img
						className="game__logo"
						role="presentation"
						src="imgs/logo.svg" />

				<div className="game__btns">
					<button
							aria-label="Back to settings"
							className="btn"
							onClick={() => setGameInProgress(false)}>
						<svg viewBox="0 0 362 337" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M169 312L25 168L169 24" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M45 168H337" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</button>

					<button
							aria-label="Start new game"
							className="btn"
							onClick={() => startNewGame()}>
						<svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clipPath="url(#clip0_5_4)">
							<mask id="mask0_5_4" maskUnits="userSpaceOnUse" x="-1" y="-1" width="24" height="24">
							<path d="M-1 -1H23V23H-1V-1Z" fill="white"/>
							</mask>
							<g mask="url(#mask0_5_4)">
							<path d="M11 1.99988C15.9706 1.99988 20 6.02931 20 10.9999C20 15.9705 15.9706 19.9999 11 19.9999C6.02944 19.9999 2 15.9705 2 10.9999C2 8.17261 3.30367 5.64983 5.34267 3.99988" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M2 3.49988H6V7.49988" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
							</g>
							</g>
							<defs>
							<clipPath id="clip0_5_4">
							<rect width="24" height="24" fill="white" transform="translate(-1 -1)"/>
							</clipPath>
							</defs>
						</svg>
					</button>
				</div>
			</header>

			<main>
				{startingActors[0] && startingActors[1] &&
					<>
						<h1 className="game__heading">
							Link <span className="u-no-wrap">{ startingActors[0].name }</span> to <span className="u-no-wrap">{startingActors[1].name}</span>
						</h1>

						<p
								aria-live="polite"
								className="game__goal handwriting">
							{success ?
								`🎉 You did it in ${getLinksTotal()} link${getLinksTotal() === 1 ? '' : 's'}! 🎊` :
								''
							}
						</p>

						{/* Labels for selects */}
						<p
								className="u-display-none"
								id={MOVIE_SELECT_LABEL_ID}>
							Pick a movie
						</p>

						<p
								className="u-display-none"
								id={ACTOR_SELECT_LABEL_ID}>
							Pick an actor
						</p>
					</>
				}

				{startingActors[0] &&
					<ul
							aria-label={`${chainA[0]?.name} links`}
							className="game__chain game__chain--a"
							ref={chainARef}>
						{chainA.map((item: Item, i: number) => (
							<ItemCard
									addItemToChain={addItemToChainA}
									item={item}
									itemIndexInChain={i}
									itemIsLast={i === chainA.length - 1}
									key={i}
									removeItemFromChain={removeItemFromChainA} />
						))}
					</ul>
				}

				<div className={`game__separator${ success ?
					' game__separator--success' :
					''
				}`}></div>

				{startingActors[1] &&
					<ul
							aria-label={`${chainB[0]?.name} links`}
							className="game__chain game__chain--b"
							ref={chainBRef}>
						{chainB.map((item: Item, i: number) => (
							<ItemCard
									addItemToChain={addItemToChainB}
									itemIndexInChain={i}
									item={item}
									itemIsLast={i === chainB.length - 1}
									key={i}
									removeItemFromChain={removeItemFromChainB} />
						))}
					</ul>
				}
			</main>
		</>
	)
}
