let autoVisiblePipElements = [];

//pip boy//
//These elements are always shown
const cnvPipboy = document.getElementById("cnvPipboy");
const ctxPipboy = cnvPipboy.getContext("2d");

const cnvTogglePip = document.getElementById("cnvTogglePip");
const ctxToggle = cnvTogglePip.getContext("2d");

const dvPipboy = document.getElementById("dvPipboy");
const dvPBNav = document.getElementById("dvPBNav");

const pLoadingProgress = document.getElementById("pLoadingProgress");

//These elements are always shown when their screen/parent div are shown
const ms1 = document.getElementById("ms1");
const ms2 = document.getElementById("ms2");
const ms3 = document.getElementById("ms3");
const ms4 = document.getElementById("ms4");

const dvInvInfo = document.getElementById("dvInvInfo");

const uiBtnModeNormal = new PipUIElement(document.getElementById("btnModeNormal"), "block", [], [], () => !tutorialActive || tutorialGameComplete);
const uiBtnModeEndless = new PipUIElement(document.getElementById("btnModeEndless"), "block", [], [], () => !tutorialActive || tutorialGameComplete);
const uiBtnModeSurvival = new PipUIElement(document.getElementById("btnModeSurvival"), "block", [], [], () => !tutorialActive || tutorialGameComplete);
const uiBtnModeCustom = new PipUIElement(document.getElementById("btnModeCustom"), "block", [], [], () => !tutorialActive || tutorialGameComplete);
const uiBtnModeTutorial = new PipUIElement(document.getElementById("btnModeTutorial"), "block", [], [], () => tutorialActive && !tutorialGameComplete);

const dvInfoNormal = document.getElementById("dvInfoNormal");
const dvInfoEndless = document.getElementById("dvInfoEndless");
const dvInfoSurvival = document.getElementById("dvInfoSurvival");
const dvInfoCustom = document.getElementById("dvInfoCustom");
const dvCustomSettings = document.getElementById("dvCustomSettings");
const dvInfoTutorial = document.getElementById("dvInfoTutorial");

const roundResultsList = document.getElementById("roundResults");

//These elements may be shown on multiple screens, and with additional conditions
const uiScreenStats = new PipUIElement(document.getElementById("dvScreenStats"), "block", ["stats"]);
const uiScreenInv = new PipUIElement(document.getElementById("dvScreenInv"), "block", ["inv"]);
const uiScreenData = new PipUIElement(document.getElementById("dvScreenData"), "block", ["data"]);
const uiScreenMap = new PipUIElement(document.getElementById("dvScreenMap"), "block", ["map"]);

const uidvGameInfo = new PipUIElement(document.getElementById("dvGameInfo"), "grid", ["data", "map"]);
const uidvGameButtons = new PipUIElement(document.getElementById("dvGameButtons"), "grid", ["data", "map"]);

const uipRoundCount = new PipUIElement(document.getElementById("pRoundCount"), "block", [], [gameStates.INITIALISED, gameStates.GUESSING]);
const uipTimer = new PipUIElement(document.getElementById("pTimer"), "block", [], [gameStates.INITIALISED, gameStates.GUESSING], () => gameParameters.timeLimit != 0);
const uipMinScore = new PipUIElement(document.getElementById("pMinScore"), "block", [], [], () => gameParameters.minPassingScore != 0 && ((currentGameState == gameStates.INITIALISED || currentGameState == gameStates.GUESSING) || (gameOverStatus == gameOverTypes.FAILED_MINSCORE && currentGameState == gameStates.OVER))); //screw this element, ruined my whole nice state system for the ui
const uipCurrentScore = new PipUIElement(document.getElementById("pCurrentScore"), "block", [], [], () => (gameParameters.survival && (currentGameState == gameStates.INITIALISED || currentGameState == gameStates.GUESSING || currentGameState == gameStates.WAITING_NEXT_ROUND || currentGameState == gameStates.OVER)) || currentGameState == gameStates.WAITING_NEXT_ROUND || currentGameState == gameStates.OVER); //screw this one even more

const uibtnReady = new PipUIElement(document.getElementById("btnReady"), "block", [], [gameStates.INITIALISED]);
const uibtnConfirmGuess = new PipUIElement(document.getElementById("btnConfirmGuess"), "block", [], [gameStates.GUESSING]);
const uibtnNextRound = new PipUIElement(document.getElementById("btnNextRound"), "block", [], [gameStates.WAITING_NEXT_ROUND]);
const uibtnShowSummary = new PipUIElement(document.getElementById("btnShowSummary"), "block", [], [gameStates.OVER]);
const uibtnEndData = new PipUIElement(document.getElementById("btnEndData"), "block", ["map"], [gameStates.SHOWING_SUMMARY]);
const uibtnNewGame = new PipUIElement(document.getElementById("btnNewGame"), "block", ["data"], [gameStates.SHOWING_SUMMARY]);
const uibtnRepeatGame = new PipUIElement(document.getElementById("btnRepeatGame"), "block", ["data"], [gameStates.SHOWING_SUMMARY], () => !tutorialActive);

autoVisiblePipElements.push(uiBtnModeNormal);
autoVisiblePipElements.push(uiBtnModeEndless);
autoVisiblePipElements.push(uiBtnModeSurvival);
autoVisiblePipElements.push(uiBtnModeCustom);
autoVisiblePipElements.push(uiBtnModeTutorial);

autoVisiblePipElements.push(uiScreenStats);
autoVisiblePipElements.push(uiScreenInv);
autoVisiblePipElements.push(uiScreenData);
autoVisiblePipElements.push(uiScreenMap);

autoVisiblePipElements.push(uidvGameInfo);
autoVisiblePipElements.push(uidvGameButtons);

autoVisiblePipElements.push(uipRoundCount);
autoVisiblePipElements.push(uipTimer);
autoVisiblePipElements.push(uipMinScore);
autoVisiblePipElements.push(uipCurrentScore);

autoVisiblePipElements.push(uibtnReady);
autoVisiblePipElements.push(uibtnConfirmGuess);
autoVisiblePipElements.push(uibtnNextRound);
autoVisiblePipElements.push(uibtnShowSummary);
autoVisiblePipElements.push(uibtnEndData);
autoVisiblePipElements.push(uibtnNewGame);
autoVisiblePipElements.push(uibtnRepeatGame);

////

//main//
const cnvGuess = document.getElementById("cnvGuess");
const ctxGuess = cnvGuess.getContext("2d");
////