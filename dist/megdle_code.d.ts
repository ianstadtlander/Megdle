declare function getDictionary(): Promise<string[]>;
declare function makeGlobalHashDict(): Promise<Set<string>>;
declare function chooseWord(dictionary: string[]): string | undefined;
declare let ANSWER_WORD: string;
declare let current_tile: number;
declare let current_row: number;
declare let game_done: boolean;
declare let dictionaryHash: Set<unknown>;
declare const dialogue: Map<string, string[]>;
declare function getGuess(): string;
declare function colorGuess(guess: string): void;
declare function deleteLetter(): void;
declare function addLetter(keyPressed: string): void;
declare function checkGuess(guess: string): boolean;
declare function guessInDictionary(guess: string): boolean;
declare function createDialogue(): void;
declare function startGame(): Promise<void>;
//# sourceMappingURL=megdle_code.d.ts.map