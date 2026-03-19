// TO LOCALLY RUN FOR TESTING, USE VSCODE EXTENSION "Live Server" AND PRESS AT BOTTOM RIGHT "Go Live"

async function getDictionary(): Promise<string[]> {
    const dictURL = "./dictionary.txt";
    try {
        const response = await fetch(dictURL);
        if (!response.ok) {
            throw new Error(`Response status ${response.status}`);
        }
        const text = await response.text();
        const dictionary = text.split(/\r?\n/).map(word => word.trim());
        return dictionary;

    } catch(error) {
        throw new Error(String(error));
    }
}

async function makeGlobalHashDict(): Promise<Set<string>> {
    const dictionaryArray = await getDictionary();
    const dictionaryHash = new Set<string>();
    for (const word of dictionaryArray) {
        dictionaryHash.add(word.toUpperCase().trim());
    }
    return dictionaryHash;
}

function chooseWord(dictionary: string[]) {
    // First choose a random word from the dictionary
    const randomNumber = Math.floor(Math.random() * dictionary.length);

    return dictionary[randomNumber];
}

let ANSWER_WORD = "";
let current_tile = 0;
let current_row = 1;
let game_done = false;

let dictionaryHash = new Set();
const dialogue = new Map<string, string[]>();

function getGuess() {
   
    const row = document.getElementById(`game-row${current_row}`)
    const tiles = row?.querySelectorAll(".tile");
    
    let guess = "";
    
    if (tiles) {
        tiles.forEach((tile) => {
            const content = tile.textContent ?? "";
            guess += content.toUpperCase().trim();
        });
    } else {
        throw new Error("Tiles not found (getGuess function)")
    }
    return guess;
}

// Called whenever a button is pressed
window.addEventListener("keydown", (e) =>{
    if (game_done === false) {
        if (e.key === "Enter") {
            const guess = getGuess();
            if (guess.length < 5) {
                const meg = document.getElementById("meg") as HTMLImageElement;
                if (meg) {
                    meg.src = "./img/disappointed.jpg"
                }
                
                
                const textBubble = document.getElementById("text-bubble");
                if (textBubble) {
                    textBubble.textContent = "uhhh can you COUNT? can you READ? can you LOOK with your EYES? " + guess + " is NOT 5 letters!"
                }
            } else {
                // PLAYER HAS WON
                if (checkGuess(guess)) {
                    colorGuess(guess);
                    game_done = true;
                    const textBubble = document.getElementById("text-bubble");
                    const randomNumber = Math.floor(Math.random() * dialogue.get("winner")!.length);

                    if (textBubble) {
                        textBubble.textContent = dialogue.get("winner")![randomNumber] ?? "";
                    }

                    const meg = document.getElementById("meg") as HTMLImageElement;
                    if (meg) {
                        meg.src = "./img/winner.jpg"
                    }

                    const win_screen = document.getElementById("final-screen") as HTMLElement;
                    if (win_screen) {
                        win_screen.textContent = `YOU WON! The word was ${ANSWER_WORD}!`;
                        win_screen.classList.remove("hidden");

                        win_screen.onclick = () => {
                            win_screen.classList.add("hidden");
                        }
                    }

                    const retry_button = document.getElementById("retry-button");
                    if (retry_button) {
                        retry_button.classList.remove("hidden");

                        retry_button.onclick = () => {
                            window.location.reload();
                        };
                    };


                // VALID GUESS WE TAKE IT
                } else if (guessInDictionary(guess)) {
                    colorGuess(guess);
                    current_row++;
                    current_tile = 0;

                    // LAST GUESS
                    if (current_row === 6) {
                        const meg = document.getElementById("meg") as HTMLImageElement;
                        if (meg) {
                            meg.src = "./img/serious.jpg"
                        }
                        const randomNumber = Math.floor(Math.random() * dialogue.get("last-guess")!.length);
                        const textBubble = document.getElementById("text-bubble");
                        if (textBubble) {
                            textBubble.textContent = dialogue.get("last-guess")![randomNumber] ?? "";
                        }
                    }

                    // GAME LOST
                    if (current_row > 6) {
                        game_done = true;
                        const meg = document.getElementById("meg") as HTMLImageElement;
                        if (meg) {
                            meg.src = "./img/disappointed.jpg"
                        }
                        const randomNumber = Math.floor(Math.random() * dialogue.get("lost")!.length);
                        const textBubble = document.getElementById("text-bubble");
                        if (textBubble) {
                            textBubble.textContent = dialogue.get("lost")![randomNumber] ?? "";
                        }

                        const retry_button = document.getElementById("retry-button");
                        if (retry_button) {
                            retry_button.classList.remove("hidden");

                            retry_button.onclick = () => {
                                window.location.reload();
                            };
                        }

                        const lose_screen = document.getElementById("final-screen") as HTMLElement;
                        if (lose_screen) {
                            lose_screen.textContent = `YOU LOSE! The word was ${ANSWER_WORD}!`;
                            lose_screen.classList.remove("hidden");

                            lose_screen.onclick = () => {
                                lose_screen.classList.add("hidden");
                            };
                        };

                    }
                } else {
                    
                    const meg = document.getElementById("meg") as HTMLImageElement;
                    if (meg) {
                        meg.src = "./img/disappointed.jpg"
                    }
                    
                    const textBubble = document.getElementById("text-bubble");
                    if (textBubble) {
                        textBubble.textContent = "yeah, so like, " + guess + ", is NOT a meg word! do you even know me???"
                    }
                }

            }
        } else if (e.key === "Backspace") {
            deleteLetter();
        }
        if (e.key.length === 1 && /^[A-Za-z]+$/.test(e.key)) {
            addLetter(e.key);
        }
    }     
});

function colorGuess(guess: string) {
    // A correct or incorrect answer could be here, if correct the whole thing
    // becomes green, if incorrect only some or none become green and yellow
    const row = document.getElementById(`game-row${current_row}`);
    const tiles = row?.querySelectorAll(".tile");

    // Idea is to track the number of occurences of each letter, so if there are for example 2 and one is green,
    // then it still makes that other letter yellow as there is one more to look for

    // Need a map of each letter with corresponding count occurence of answer word
    const letterMap = new Map<string, number>();
    const indicesCorrect = new Set();

    for (let i = 0; i < 5; i++) {
        if (ANSWER_WORD !== undefined) {
            if (letterMap.get(ANSWER_WORD[i]!) === undefined) {
                letterMap.set(ANSWER_WORD[i]!, 0);
            }
            letterMap.set(ANSWER_WORD[i]!, letterMap.get(ANSWER_WORD[i]!)! + 1);
        }
    }

    // Going over each tile in the guessed row looking for correct answers
    for (let i = 0; i < 5; i++) {
        if (tiles && tiles[i]) {
            const tile = tiles[i]!;
            if (guess[i] === ANSWER_WORD[i]) {
                tile.classList.remove("incorrect-tile");
                tile.classList.add("correct-tile");
                letterMap.set(ANSWER_WORD[i]!, letterMap.get(ANSWER_WORD[i]!)! - 1);
                indicesCorrect.add(i);
            }
        }
    }

    for (let i = 0; i < 5; i++) {
        if (tiles && tiles[i]) {
            const tile = tiles[i]!;
            // Should not be recoloring any green ones
            if (letterMap.has(guess[i]!) && letterMap.get(guess[i]!)! > 0 && !(indicesCorrect.has(i))) {
                console.log("Contains the index: " + indicesCorrect.has(i))
                tile.classList.remove("incorrect-tile");
                tile.classList.add("wrong-spot-tile");
                letterMap.set(guess[i]!, letterMap.get(guess[i]!)! - 1);
            }
        }
    }

    // If there are no correct indices, it was a "bad" guess
    if (indicesCorrect.size === 0) {
        const meg = document.getElementById("meg") as HTMLImageElement;
        if (meg) {
            meg.src = "./img/mocking.jpg"
        }

        const textBubble = document.getElementById("text-bubble");
        const randomNumber = Math.floor(Math.random() * dialogue.get("bad-guess")!.length);

        if (textBubble) {
            textBubble.textContent = dialogue.get("bad-guess")![randomNumber] ?? "";
        }

    // Good guess
    } else {
        const meg = document.getElementById("meg") as HTMLImageElement;
        if (meg) {
            meg.src = "./img/suspicious.jpg"
        }

        const textBubble = document.getElementById("text-bubble");
        const randomNumber = Math.floor(Math.random() * dialogue.get("good-guess")!.length);

        if (textBubble) {
            textBubble.textContent = dialogue.get("good-guess")![randomNumber] ?? "";
        }
    }
}

function deleteLetter() {
    // If there is a tile to delete
    if (!(current_tile === 0)) {

        // Decrement the current tile
        current_tile--;

        const row = document.getElementById(`game-row${current_row}`);
            
        const tiles = row?.querySelectorAll(".tile");
        
        // If tiles and tiles[current_tile] exist, remove the current tile
        if (tiles && tiles[current_tile]) {
            try {
                tiles[current_tile]!.textContent = "";
            } catch(error) {
                throw new Error(String(error));
            }
        }
        
    }
}

function addLetter(keyPressed: string) {
    // If there is space to add a tile
    if (current_tile < 5) {
        
        const row = document.getElementById(`game-row${current_row}`);
            
        const tiles = row?.querySelectorAll(".tile");
        
        // If tiles and tiles[current_tile] exist, remove the current tile
        if (tiles && tiles[current_tile]) {
            try {
                tiles[current_tile]!.textContent = keyPressed.toUpperCase();
            } catch(error) {
                throw new Error(String(error));
            }
        }

        // Incrememnt the current tile
        current_tile++;
    }
}


// Parameter: The user's guess (string)
function checkGuess(guess: string) {
    if (guess === ANSWER_WORD) {
        return true;
    } else {
        return false;
    }
}

function guessInDictionary(guess: string): boolean {
    if (dictionaryHash.has(guess)) {
        return true;
    } else {
        return false;
    }
}

function createDialogue() {
    // Welcome dialogue
    dialogue.set("welcome", []);
    dialogue.get("welcome")?.push("oh, hi. im meg.");
    dialogue.get("welcome")?.push("oh, hi. im huge.");
    dialogue.get("welcome")?.push("hey there. welcome. i guess.");
    dialogue.get("welcome")?.push("do you think you can do this?? its hard");
    dialogue.get("welcome")?.push("HI WELCOME TO MEGDLE THIS IS AWESOME YOU HAVE TO PLAY")
    dialogue.get("welcome")?.push(`YOU GOTTA GUESS "FATTY"! THATS WHAT I WOULD GUESS!`);
    dialogue.get("welcome")?.push("do you realy think you'll win? like really?")
    dialogue.get("welcome")?.push(`I LOVE MUFFIN HOUSE MMMMMMMM YUMMY YUMMY MUFFY HOUSY`);
    dialogue.get("welcome")?.push("sorry, no talky without MAAAHHHH COOOFFFEEEEEEEEE");
    dialogue.get("welcome")?.push(`FEE FI FO FUM!`);

    dialogue.set("good-guess", []);
    dialogue.get("good-guess")?.push("not a bad guess! still wrong tho");
    dialogue.get("good-guess")?.push("i mean you got some, but personally i wouldve just guessed the actual word");
    dialogue.get("good-guess")?.push("YOU CALL THAT A GUESS????!?!?!!? i mean yeah, it was a pretty fine guess");

    dialogue.set("bad-guess", []);
    dialogue.get("bad-guess")?.push("you call that a guess? highkey embarassing");
    dialogue.get("bad-guess")?.push("wow. you genuinely suck.");
    dialogue.get("bad-guess")?.push("shhhheeeeeesssshhh that was terrible");
    dialogue.get("bad-guess")?.push("awwwwww its adorable!!! stupid things are SOOOOOO CUTE!");
    dialogue.get("bad-guess")?.push("maybe just give up?");
    dialogue.get("bad-guess")?.push("HAHAHAHAHAHAHAHAHAHAHHA WHAT A WASTE OF A GUESS LMAO");

    dialogue.set("winner", []);
    dialogue.get("winner")?.push("hey look at that, you won");
    dialogue.get("winner")?.push("WOOOOOOHOOOOO THATS WHAT IM TALKING ABOUT");
    dialogue.get("winner")?.push("yeah i lowk knew that one chief");
    dialogue.get("winner")?.push("that was awesome! do you wanna know what else is awesome? mm-- mm... muuff.... MUFFIN HOOOOOOUUUUSSEEEE!");
    

    dialogue.set("last-guess", []);
    dialogue.get("last-guess")?.push("woah. last guess.");
    dialogue.get("last-guess")?.push("LOCK IN!!!! ONE MORE GUESS!!!!");
    dialogue.get("last-guess")?.push("suuurely you wont LOOOSEEE right? right? (youre so gonna lose)");

    dialogue.set("lost", []);
    dialogue.get("lost")?.push("genuinely that was terrible. highkey embarssing. wow.");
    dialogue.get("lost")?.push("okay are we serious that was obvious. like come on");
    dialogue.get("lost")?.push("does it make you feel good to be a loser? you adorable, little, LOSER!");
}


async function startGame() {
    // Create the dialogue
    createDialogue();

    // Get dictionary
    const dictionary = await getDictionary();
    dictionaryHash = await makeGlobalHashDict();
    
    const proposedAnswer = chooseWord(dictionary);
    if (proposedAnswer === undefined) {
        throw new Error("Proposed answer is undefined");
    }
    // ANSWER_WORD must be a string now
    ANSWER_WORD = proposedAnswer.toUpperCase().trim();

    
    // Starting dialogue
    const textBubble = document.getElementById("text-bubble");
    const randomNumber = Math.floor(Math.random() * dialogue.get("welcome")!.length);

    if (textBubble) {
        textBubble.textContent = dialogue.get("welcome")![randomNumber] ?? "";
    }
        

    // For debugging/cheating
    console.log(ANSWER_WORD);
}


startGame();    

