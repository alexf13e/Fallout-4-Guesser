
//want to read this code, do you? https://youtu.be/j0_u26Vpb4w?t=483

DEBUG_DISABLE_RANDOM = false;

//setup Image to allow easily checking loading progress
//https://stackoverflow.com/questions/14218607/javascript-loading-progress-of-an-image
Image.prototype.load = function(url) {
    var thisImg = this;
    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.open('GET', url,true);
    xmlHTTP.responseType = 'arraybuffer';
    xmlHTTP.onload = function(e) {
        var blob = new Blob([this.response]);
        thisImg.src = window.URL.createObjectURL(blob);
    };
    xmlHTTP.onprogress = function(e) {
        thisImg.completedPercentage = parseInt((e.loaded / e.total) * 100);
    };
    xmlHTTP.onloadstart = function() {
        thisImg.completedPercentage = 0;
    };
    xmlHTTP.send();
};

Image.prototype.completedPercentage = 0;

let guessImageLoaded = false;
const guessImage = new Image();
guessImage.onload = function()
{
    //stop the error image appearing
    window.clearTimeout(errorImageTimeout);

    pzGuessImage.resetPos();
    
    guessImageLoaded = true;
    showGuessImage();

    if (showingErrorImage)
    {
        /*fade transition from the error image to the actual image, which will
        automatically redraw the guess image too*/
        hideGuessImage();
        showingErrorImage = false;
        pLoadingProgress.style.display = "none";
        window.clearInterval(loadingProgressInterval);
    }
    
    beginRoundTimer(); //try to start round timer each round. won't start when first loaded since player won't be ready
    beginScoreDecay();
};

const pzGuessImage = new PZImage(guessImage, cnvGuess, 4);

//shown if the guess image is taking to long to load. if this doesnt load then tough
const errorImage = new Image();
errorImage.src = "./assets/psb.jpg";
let errorImageTimeout;
let showingErrorImage = false;

const imageDir = "./assets/f4gimages/";
let allImageData;
let randomisedImageOrder;
let currentImageData;

const METRES_PER_GAME_UNIT = 0.01428; //1 in game unit (pretty much) = 0.01428 metres https://www.creationkit.com/index.php?title=Unit
const MAX_SCORE = 5000;
const PERFECT_DIST = 5;
const SURVIVAL_STARTING_SCORE = 10000;
const SURVIVAL_BASE_DECAY = 100;
const SURVIVAL_MAX_DECAY = 750;

let locationIndex;
let roundNumber;
let roundsRemaining;

const gameStates = Object.freeze({
    NOT_INITIALISED : 0,
    INITIALISED : 1,
    GUESSING : 2,
    WAITING_NEXT_ROUND : 3,
    OVER : 4,
    SHOWING_SUMMARY : 5
});
let currentGameState = gameStates.NOT_INITIALISED;

const gameOverTypes = Object.freeze({
    NOT_ENDED : 0,
    COMPLETED_ROUNDS_NORMAL : 1,
    FAILED_MINSCORE : 2,
    COMPLETED_ROUNDS_SURVIVAL : 3,
    FAILED_SCOREDRAIN : 4
});
let gameOverStatus = gameOverTypes.NOT_ENDED;

let guessPosWorld;
let guessPlaced;
let firstGame;

let gameLocationSummary;
let totalScore = 0;
let totalTime = 0;
let totalDistance = 0;
let survivalPeakScore = 0;
let survivalRemainingScore = 0;
let gameOverMessage;
const genericDeathMessages = [
    "you starved to death",
    "you died of dehydration",
    "you were kidnapped by the institute, never to be seen again",
    "you died to an infection",
    "you crossed paths with a stray mininuke"
];
let showPromotionMessage = false;

let roundStartTime;
let roundTimerTimeout;
let roundTimerUpdateTimeout;
let loadingProgressInterval;
let remainingTime;
let scoreDecayPerSecond;
let scoreDecayUpdateTimeout;

let gameParameters = {}; //current gameParameters, will copy from those of another mode (gamemodes.js)

let maxOffset = 0;
maxOffset = parseInt(localStorage.getItem("roundOffset"));
if (!localStorage.getItem("seed")) newStoredSeed();

let tutorialActive = (localStorage.getItem("tutorialActive") === "true");
let tutorialGameComplete = false; //need this as well as tutorialActive to say the game has been complete, then disable tutorial mode when a new game is started
let tutorialImageIds = [637, 649, 94, 289, 416];

let mapHintTier = 0;
let scoreCap = 5000;

const tipMessages = [
    "you can press shift to quickly show/hide the pipboy, and space to confirm a guess",
    "you can get up to 2 hints per round from the radio tab, with increasing accuracy",
    "the lighting direction on the map matches the game images",
    "in survival mode, it's generally better to get a good-enough guess quickly than a perfect one, but you'll be rewarded if you do",
    "normal and endless mode keep track of the images shown to prevent seeing duplicates, but survival and custom modes start with a new set each game to allow for sharing the game code",
    "the pip-boy shows the radiation level of the area you are in, as well as an indication of how difficult the location may be to guess"
];


////////////////Resources & Initialisation////////////////

/*I know this is inefficient and makes cheating easy, but setting up a server/database
to load from is a bit beyond me atm*/
fetch("./assets/imgData.json")
.then( (response) => {
        if (!response.ok)
        {
            //should probably tell the user somethings broke
            alert("Failed to load image data. Try refreshing the page")
            console.log(response);
        }
        else response.text().then(createAnswerArray);
    }
);

function createAnswerArray(text)
{
    //create array containing information for each image
    allImageData = JSON.parse(text);
    document.getElementById("paramRounds").max = allImageData.length;
    gpSurvival.updateRoundMax(allImageData.length);
}

function updateImage()
{    
    hideGuessImage();
    errorImageTimeout = window.setTimeout(showErrorImage, 3000);

    if (tutorialActive)
    {
        currentImageData = allImageData[tutorialImageIds[roundNumber - 1]];
    }
    else
    {
        if (!(gameParameters.type == gameModeTypes.SURVIVAL || gameParameters.isCustom))
        {
            localStorage.setItem("roundOffset", parseInt(localStorage.getItem("roundOffset")) + 1);
            maxOffset = Math.max(parseInt(localStorage.getItem("roundOffset")), maxOffset);
        }
    
        currentImageData = allImageData[randomisedImageOrder[locationIndex]];
    }
    
    guessImageLoaded = false;
    guessImage.load(imageDir + currentImageData.src);

    //update rads and difficulty indicators on pip boy
    pipDraw();
}

function initialiseGame(mode)
{
    //set up the game parameters based on the mode or custom settings

    //reset timers that may have been active if starting a new game during a previous one
    clearTimeouts();
    
    //new game mode being selected, so the next game will be the first of that type
    firstGame = true;

    switch (mode)
    {
        case "normal":
            Object.assign(gameParameters, gpNormal);
            break;

        case "endless":
            Object.assign(gameParameters, gpEndless);
            break;
        
        case "survival":
            Object.assign(gameParameters, gpSurvival);
            break;
    
        case "custom":
            //read the values from the custom settings elements into gameParameters
            const rounds = paramRounds.value;
            const tl = paramTimeLimit.value;
            const minps = paramMinScore.value;
            const seed = paramSeed.value;

            gpCustom.type = (paramMode.value == "1" ? gameModeTypes.SURVIVAL : gameModeTypes.NORMAL);
            gpCustom.rounds = (rounds == "" || parseInt(rounds) == 0) ? allImageData.length : parseInt(rounds);
            gpCustom.timeLimit = (tl == "" || parseInt(tl) == 0) ? 0 : parseInt(tl);
            gpCustom.minPassingScore = (minps == "" || parseInt(minps) == 0) ? 0 : parseInt(minps);
            gpCustom.minDifficulty = parseInt(paramMinDifficulty.value);
            gpCustom.maxDifficulty = parseInt(paramMaxDifficulty.value);
            gpCustom.roundOffset = 0;
            gpCustom.showRemainingRounds = !(rounds == "" || parseInt(rounds) == 0);
            gpCustom.seed = seed;

            Object.assign(gameParameters, gpCustom);
            break;
    }

    //start a game with the newly set parameters
    newGame(false);
}

function ngStates()
{
    //reset all the game states to be ready for a new game to start
    roundNumber = 1;
    roundsRemaining = gameParameters.rounds;
    guessPosWorld = [0,0];
    guessPlaced = false;
    gameOverStatus = -1;
    gameLocationSummary = [];
    totalScore = 0;
    totalTime = 0;
    totalDistance = 0;
    survivalPeakScore = 0;
    survivalRemainingScore = SURVIVAL_STARTING_SCORE;
    scoreDecayPerSecond = SURVIVAL_BASE_DECAY;
    currentGameState = gameStates.INITIALISED;
    showPromotionMessage = false;
    mapHintTier = 0;
    scoreCap = MAX_SCORE

    if (tutorialActive && tutorialGameComplete)
    {
        tutorialActive = false;
        localStorage.setItem("tutorialActive", false);
    }
}

function ngUI()
{
    //reset the game ui to show appropriate elements for the start of a new game
    uibtnConfirmGuess.element.disabled = true;
    uipMinScore.element.style.color = greenColour;
    uipCurrentScore.element.style.color = greenColour;

    roundResultsList.innerHTML = "";
    uipTimer.element.innerHTML = "Time: " + formatTimeString(gameParameters.timeLimit);
    uipMinScore.element.innerHTML = "Score required: " + gameParameters.minPassingScore;
    if (gameParameters.type == gameModeTypes.SURVIVAL) uipCurrentScore.element.innerHTML = "Score: " + SURVIVAL_STARTING_SCORE;
    
    btnGetHint.disabled = true;
    btnGetHint.innerHTML = "Get hint (score limit 5000 -> 4000)";
}

function newGame(repeat)
{
    //reset control variables and ui for new game
    ngStates();
    ngUI();

    /*if replaying game, dont regenerate new image order. for custom or survival seed, the
    round number going back to 1 will make the game repeat. for non-custom seed,
    the round offset will be reduced by the number of rounds in the game, undoing
    the increase at the end of the previous game.*/
    gameParameters.manageSeed(repeat);

    //if a repeating custom or survival game, the seed will have to already have been set and will be unchanged.
    //the next game will not be the first (used in deciding if to generate a new seed above)
    firstGame = false;

    /*createRandomImageOrder should be called whenever not repeating in case the
    previous game and current game aren't using the same seed. if they are using
    the same seed it wont matter (and takes very little time to process so whatever)*/
    if (!repeat) createRandomImageOrder();
    locationIndex = gameParameters.roundOffset;

    //load the first image for the game
    updateImage();
    
    //there are less images available with the given gameParameters than the user requested
    if (randomisedImageOrder.length < gameParameters.rounds)
    {
        roundsRemaining = randomisedImageOrder.length;
        gameParameters.rounds = randomisedImageOrder.length;

        //only tell the user if they chose the number of rounds, which will always mean showRemainingRounds is true.
        //if it was a localstorage seed game, new rounds after this set run out will be automatically dealt with
        if (gameParameters.showRemainingRounds)
        {
            addMessage("Note: only " + roundsRemaining + " images available with current settings", false);
        }
    }
    
    //update the display for the round number in the ui (pipui.js)
    updateRoundCounter();

    //if the map has been loaded, reset it back to the centre
    if (map)
    {
        mapClear();
        mapDefaultPos();
    }

    if (tutorialActive)
    {
        addMessage("When the game starts, the pipboy will be hidden and you will " +
        "be shown an image taken from somewhere in The Commonwealth. Click the icon " + 
        "in the bottom left to toggle showing/hiding the pipboy, and place a marker " +
        "on the map where you think the player was standing to take the image. " +
        "You can click again to change your mind, or confirm your guess to end " +
        "the round early. After 5 rounds, the game is over and you will be shown a " +
        "summary of the locations and how far you were from them. You can also see " +
        "the summary so far at any point by changing to the data screen in the top right.");
        addMessage("If you feel completely lost, you can radio for help from Preston, " +
        "I'm sure he'll be happy to mark your map with a hint.<br><br>")
        addMessage("Click the start button when you're ready<br><br>");
    }
    else
    {
        let messageIndex = Math.floor(Math.random() * tipMessages.length);
        addMessage("Tip: " + tipMessages[messageIndex] + "<br><br>");
    }

    if (gameParameters.type == gameModeTypes.SURVIVAL || gameParameters.isCustom)
    {
        let gc = createGameCode();
        addMessage("Game code for sharing: " + gc + "<br><br>", false);
        statsAddGameCode(gc);
    }


    pipNavChange("data");
}


////////////////Game Actions////////////////
function ready()
{
    //actually start the damn game
    currentGameState = gameStates.GUESSING;
    btnGetHint.disabled = false;
    pipSetVisible(false);
    pipNavChange("map");
    mapDefaultPos();
    showGuessImage();

    if (guessImageLoaded)
    {
        beginRoundTimer();
        beginScoreDecay();
    }
}

function updateGuessPos()
{
    //player clicked on the map, update the guess position and move the marker (and allow them to confirm the guess by enabling the button)
    if (currentGameState == gameStates.GUESSING && guessImageLoaded)
    {
        guessPosWorld = mapToWorldPos(guessMarker._latlng);
        guessPlaced = true;
        uibtnConfirmGuess.element.disabled = false;
    }
}

function confirmGuess()
{
    clearTimeouts();

    let score = 0;
    let gamer = false;
    let distanceMetres;

    const answerPosMap = worldToMapPos(currentImageData.pos);
    answerMarker = mapCreateAnswerMarker(answerPosMap).addTo(map);

    if (guessPlaced)
    {
        //add a line between the guess and answer if a guess was placed
        guessLine = mapCreateLine([answerPosMap, guessMarker._latlng]).addTo(map);

        //get desired bounding rectangle to show guess and answer (+ a little gap at the edges)
        const edgeGap = 3;
        const guessPosMap = guessMarker._latlng;
        const BL = new L.LatLng(Math.min(guessPosMap["lat"], answerPosMap["lat"]) - edgeGap, Math.min(guessPosMap["lng"], answerPosMap["lng"]) - edgeGap); //min y, min x
        const TR = new L.LatLng(Math.max(guessPosMap["lat"], answerPosMap["lat"]) + edgeGap, Math.max(guessPosMap["lng"], answerPosMap["lng"]) + edgeGap); //max y, max x

        map.flyToBounds([BL, TR]);
        gameLocationSummary.push([guessPosMap, answerPosMap]);

        const guessDistance = Math.sqrt(Math.pow(currentImageData.pos[0] - guessPosWorld[0], 2) + Math.pow(currentImageData.pos[1] - guessPosWorld[1], 2));
        distanceMetres = guessDistance * METRES_PER_GAME_UNIT;

        //different modes have different scoring systems, get a score from the appropriate one
        score = gameParameters.getScore(distanceMetres);

        if (score > scoreCap) score = scoreCap;

        if (distanceMetres < 1 && mapHintTier == 0)
        {
            //for the real gamers
            score += 1;
            gamer = true;
        }
    
        distMessage = formatDistance(distanceMetres);
        totalDistance += distanceMetres;
    }
    else
    {
        //add distinct "nothing" for no guess, so it doesnt draw the guess or line in the summary
        gameLocationSummary.push([null, answerPosMap]);
        map.flyTo(answerPosMap, 3);
        distMessage = "No guess made";
    }


    const roundText = roundNumber + ": " + score + " points (" + distMessage + ") +" + Math.floor(statsCalculateXp(score, distanceMetres)) + "xp";
    addMessage(roundText, gamer);

    totalScore += score;
    let roundTime = (Date.now() - roundStartTime) / 1000;
    totalTime += roundTime;

    updateCurrentScoreDisplay(score, gamer);

    uibtnConfirmGuess.element.disabled = true;
    btnGetHint.disabled = true;
    guessPlaced = false;
    currentGameState = gameStates.WAITING_NEXT_ROUND;
    pipNavChange("map");
    pipSetVisible(true);

    //mode specific operations which want to run during confirmGuess
    gameParameters.modeConfirmGuess(score, gamer);
    
    //check mode specific game-overs
    gameParameters.checkGameOvers(score);
    
    statsUpdateRound(score, distanceMetres, roundTime);
}

function nextRound()
{
    roundNumber++;
    
    if (!tutorialActive) locationIndex++;

    //localstorage seed games finishing the current set of images
    if (locationIndex >= allImageData.length)
    {
        /*should only reach here in endless, other modes will regenerate
        their location order so they dont run out within the game*/
        locationIndex = 0;
        newStoredSeed();
        createRandomImageOrder();
    }

    //go to next location
    guessPosWorld = [0,0];
    updateImage();

    //update ui
    uipTimer.element.innerHTML = "Time: " + formatTimeString(gameParameters.timeLimit);
    uipCurrentScore.element.style.color = greenColour;
    updateRoundCounter();

    //reset map
    mapClear();
    mapDefaultPos();

    currentGameState = gameStates.GUESSING;
    mapHintTier = 0;
    scoreCap = MAX_SCORE
    btnGetHint.disabled = false;
    btnGetHint.innerHTML = "Get hint (score limit 5000 -> 4000)";
    pipSetVisible(false);
    pipNavChange("map");
}

function gameOver(reason)
{
    let deathMessage = currentImageData.deathMessage;
    if (deathMessage == "")
    {
        const i = Math.floor(RNG(gameParameters.seed) * genericDeathMessages.length);
        deathMessage = genericDeathMessages[i];
    }

    switch (reason)
    {
        case gameOverTypes.COMPLETED_ROUNDS_NORMAL: //completed all rounds, i.e. success
            gameOverMessage = "All rounds completed";
            break;

        case gameOverTypes.FAILED_MINSCORE: //score less than min passing score
            gameOverMessage = "You survived " + (roundNumber - 1) + " rounds before " + deathMessage;
            uipMinScore.element.style.color = deathColour;
            break;
            
        case gameOverTypes.COMPLETED_ROUNDS_SURVIVAL: //completed all rounds of a survival game
            gameOverMessage = "Congratulations, you survived every round and won " 
            + "<a href='https://fallout.fandom.com/wiki/Graygarden?file=FO4_Brand_New_Car.jpg'"
            + "target='_blank' rel='noreferrer noopener'>a brand new car!</a>";
            break;
        
        case gameOverTypes.FAILED_SCOREDRAIN: //score drained to 0
            gameOverMessage = "You survived " + (roundNumber - 1) + " rounds before " + deathMessage;
            uipCurrentScore.element.style.color = deathColour;
            break;

        default:
            gameOverMessage = "Game over";
    }

    if (tutorialActive)
    {
        gameOverMessage = "Tutorial completed, other modes now available in inventory";
        tutorialGameComplete = true;        
        pipModeInfoChange("normal");
    }

    gameOverStatus = reason;
    currentGameState = gameStates.OVER;
    updateUIVisibility("map");
    statsUpdateGame(totalScore, totalTime);
}

function enableSummary()
{    
    addMessage("<br>"); //add an empty line for readability
    addMessage(gameOverMessage, false);
    let scoreMessage = totalScore;
    if (gameParameters.showRemainingRounds) scoreMessage += "/" + MAX_SCORE * gameParameters.rounds;
    addMessage("Total Score: " + scoreMessage);
    if (gameParameters.type == gameModeTypes.SURVIVAL) addMessage("Peak score: " + survivalPeakScore);
    addMessage("Total Time: " + formatTimeString(totalTime), false);
    addMessage("Total Distance Away: " + formatDistance(totalDistance), false);
    
    addMessage("<br>");
    if (showPromotionMessage)
    {
        addMessage("You have been promoted to " + (playerStats.rating.legendary ? "★ " : "") + "level " + playerStats.rating.level +
            " " + playerStats.rating.title);
    }

    roundResultsList.appendChild(createXPBar());

    hideGuessImage();

    mapDefaultPos();
    mapClear();
    mapGenerateSummary();

    currentGameState = gameStates.SHOWING_SUMMARY;
    pipNavChange("map");
}

function getHint()
{
    mapHintTier++;
    let size;
    let buttonText;
    switch (mapHintTier)
    {
        case 1:
            size = hintAreaSizes.MEDIUM;
            scoreCap = 4000;
            buttonText = "Get hint (score limit 4000 -> 3000)";
            break;
        
        case 2:
            size = hintAreaSizes.SMALL;
            scoreCap = 3000;
            buttonText = "No more hints available";
            break;

        default:
            size = -1;
    }

    btnGetHint.innerHTML = buttonText;

    if (size != -1)
    {
        pipNavChange("map");
        mapAddHintArea(size);
    }
    
    if (mapHintTier >= 2)
    {
        btnGetHint.disabled = true;
    }
}


////////////////Utility Functions////////////////

function drawGuessImage()
{
    pzGuessImage.draw(ctxGuess);
}

function addMessage(message, special)
{
    //add a message to the message box in the data screen, and scroll to the bottom of it
    const li = document.createElement("li");
    li.style.color = special ? specialColour : greenColour;
    li.innerHTML = message;
    roundResultsList.appendChild(li);
    roundResultsList.scrollTop = roundResultsList.scrollHeight;
}

function createXPBar()
{
    let xpIntoCurrentLevel = Math.ceil(playerStats.rating.xp - statsCalculateXpForLevel(playerStats.rating.level));
    let xpDifferenceForLevel = Math.ceil(statsCalculateXpForLevel(playerStats.rating.level + 1) - statsCalculateXpForLevel(playerStats.rating.level));
    let xpMessage = "Level " + playerStats.rating.level + " - " + xpIntoCurrentLevel + "/" + xpDifferenceForLevel + "xp";

    const dvXPBarOuter = document.createElement("div");
    const dvXPBarInner = document.createElement("div");
    const pXPText = document.createElement("p");

    dvXPBarOuter.classList.add("xpBarOuter");
    dvXPBarInner.classList.add("xpBarInner");
    pXPText.classList.add("xpText");

    dvXPBarInner.style.width = (xpIntoCurrentLevel / xpDifferenceForLevel) * 100 + "%";
    pXPText.textContent = xpMessage;

    dvXPBarOuter.appendChild(dvXPBarInner);
    dvXPBarOuter.appendChild(pXPText);

    return dvXPBarOuter;
}

function generateSeed()
{
    return Math.floor(Math.random() * 2147483648);
}

function createRandomImageOrder()
{
    //put shuffled order for images into array
    randomisedImageOrder = [];
    const availableImNums = [];

    //get number of total images for selected difficulties
    for (let imData of allImageData)
    {
        if (imData.difficulty <= gameParameters.maxDifficulty && imData.difficulty >= gameParameters.minDifficulty)
        {
            availableImNums.push(imData.id);
        }
    }

    if (DEBUG_DISABLE_RANDOM)
    {
        randomisedImageOrder = availableImNums;
        return;
    }

    //is this a normal game, and are there more rounds than remaining locations in this batch
    if (gameParameters.type == gameModeTypes.NORMAL && gameParameters.rounds > availableImNums.length - gameParameters.roundOffset)
    {
        /*dont want this to get too complicated. if there arent enough unseen
        locations left to fill this game, just get a new seed and start at the
        beginning again (as opposed to using remaining locations, then get a new seed during
        the game and fill the remaining rounds with new images but making sure they weren't
        used before - as well as figuring out how to repeat the game)
        Endless games sort themseleves out, and custom and survival games
        regenerate their images separate to the stored order, so this should only
        run when a new normal game is started*/
        newStoredSeed();
    }

    //https://bost.ocks.org/mike/shuffle/
    let m = availableImNums.length;
    let i;
    let s = gameParameters.seed;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(RNG(s) * m);
        m--;
        s += 0x6D2B79F5;

        //need to remove an image from available so it doesnt get repeated
        randomisedImageOrder.push(availableImNums.splice(i,1)[0]);
    }
}

function RNG(seed)
{
    /*mulberry32 https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
    returns value between 0 and 1*/
    let t = seed;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function beginRoundTimer()
{
    if (currentGameState != gameStates.GUESSING) return;

    if (gameParameters.timeLimit == 0)
    {
        roundStartTime = Date.now();
        return;
    }

    window.clearTimeout(roundTimerUpdateTimeout);
    window.clearTimeout(roundTimerTimeout);

    roundStartTime = Date.now();
    updateRoundTimer();
    roundTimerTimeout = window.setTimeout(() => {
            //make timer neatly say 0 at end
            window.clearTimeout(roundTimerTimeout);
            uipTimer.element.innerHTML = "Time: " + formatTimeString(0)
            confirmGuess();
        }, gameParameters.timeLimit * 1000);
}

function updateRoundTimer()
{
    //update ui for timer
    remainingTime = Math.max((gameParameters.timeLimit * 1000 - (Date.now() - roundStartTime)) / 1000, 0);
    uipTimer.element.innerHTML = "Time: " + formatTimeString(remainingTime);

    roundTimerUpdateTimeout = window.setTimeout(updateRoundTimer, 100);

    if (remainingTime < 15 && !buttonFlashing && !pipVisible)
    {
        flashButtonOn();
    }
}

function beginScoreDecay()
{
    if (currentGameState != gameStates.GUESSING || gameParameters.type != gameModeTypes.SURVIVAL) return;

    window.clearTimeout(scoreDecayUpdateTimeout);
    updateScoreDecay();   
}

function updateScoreDecay()
{
    //divided by 10 because the update runs 10x per second. if an early delay happens, this would end up below 0, so take the max
    survivalRemainingScore = Math.max(survivalRemainingScore - scoreDecayPerSecond / 10.0, 0);
    uipCurrentScore.element.innerHTML = "Score: " + Math.floor(survivalRemainingScore);

    if (survivalRemainingScore <= 0)
    {
        confirmGuess();
    }
    else
    {
        //set timeout to stop when the score would run out, rather than just after 100ms if it would be less. yes i am that stingy
        let updateDelay = Math.min(100, survivalRemainingScore/scoreDecayPerSecond * 1000);
        scoreDecayUpdateTimeout = window.setTimeout(updateScoreDecay, updateDelay);
    }

    let secondsRemaining = survivalRemainingScore / scoreDecayPerSecond;
    if (secondsRemaining < 15 && !buttonFlashing && !pipVisible)
    {
        flashButtonOn();
    }
}

function clearTimeouts()
{
    window.clearTimeout(roundTimerTimeout);
    window.clearTimeout(roundTimerUpdateTimeout);
    window.clearTimeout(scoreDecayUpdateTimeout);
    window.clearTimeout(buttonFlashTimeout);
    window.clearInterval(loadingProgressInterval);
    buttonFlashing = false;
    drawToggleButton();
}

function createGameCode()
{
    //if no gameparameters have been set, cant return a code
    if (Object.keys(gameParameters).length == 0) return null;

    let gcSurvival;
    if (gameParameters.type == gameModeTypes.SURVIVAL) gcSurvival = "1";
    else gcSurvival = "0";

    let gcRounds = gameParameters.rounds;
    if (gcRounds == gpSurvival.rounds) gcRounds = 0;
    let gcTimeLimit = gameParameters.timeLimit;
    let gcMinScore = gameParameters.minPassingScore;
    let gcMinDif = gameParameters.minDifficulty;
    let gcMaxDif = gameParameters.maxDifficulty;
    let gcSeed  = parseInt(gameParameters.seed).toString(16); //saves maybe 2 characters but may as well

    /*
        try to shorten the code by reducing leading 0s

        x -> x
        0x -> ax
        00x -> bx
        000x -> cx
        all 0 -> 0
    */

    let zeroChars = ["", "a", "b", "c"];

    gcRounds = (gcRounds == 0 ? "0" : zeroChars[3 - gcRounds.toString().length] + gcRounds.toString());
    gcTimeLimit = (gcTimeLimit == 0 ? "0" : zeroChars[3 - gcTimeLimit.toString().length] + gcTimeLimit.toString());
    gcMinScore = (gcMinScore == 0 ? "0" : zeroChars[4 - gcMinScore.toString().length] + gcMinScore.toString());

    /*convert pair of difficulties to a single value (not all are valid - min difficulty must be less than max).
    0   1   2   3x  4   5   6x  7x   8
    ee  em  eh  me  mm  mh  he  hm  hh
    */
    let gcDif  = gcMinDif * 3 + gcMaxDif;

    return gcSurvival + gcRounds + gcTimeLimit + gcMinScore + gcDif + gcSeed;
}

function formatDistance(metres)
{
    //convert a number of metres to a nice string representation with the preferred unit
    let output;

    if (localStorage.getItem("unitType") == "metric")
    {
        if (metres > 1000)
        {
            metres = (metres / 1000).toPrecision(3);
            output = metres + "km";
        }
        else
        {
            metres = metres.toPrecision(3);
            output = metres + "m";
        }
    }
    else
    {
        const yards = metres * 1.09361;
        /*feels weird to write over 1000 as yards rather 0.x miles, but i'm not
        sure if theres some convention for when to use which. the mess of imperial
        and metric in this country doesnt help*/
        if (yards > 1000)
        {
            output = (yards / 1760).toPrecision(3) + " miles";
        }
        else
        {
            output = yards.toPrecision(3) + " yards"
        }
    }
    

    return output;
}

    
function formatTimeString(seconds)
{
    //convert number of seconds to a nice string representation (e.g. 73 seconds -> 1m 13s)
    let output;

    if (seconds < 0)
    {
        //dont care about showing negative numbers, nicer to just stop at 0 instead of flickering as the timer runs out
        output = 0 + "s";
    }
    else if (seconds < 60)
    {
        output = (seconds > 10 ? Math.floor(seconds) : seconds.toPrecision(3)) + "s";
    }
    else
    {
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        output = Math.floor(seconds) + "s";

        if (minutes >= 60)
        {
            let hours = Math.floor(minutes / 60);
            minutes = minutes % 60;
            output = hours + "h " + minutes + "m " + output;
        }
        else
        {
            output = minutes + "m " + output;
        }

    }

    return output;
}

function hideGuessImage()
{
    if (window.getComputedStyle(cnvGuess).opacity == "1") cnvGuess.style.opacity = "0";
}

function showGuessImage()
{
    if (guessImageLoaded && currentGameState == gameStates.GUESSING && window.getComputedStyle(cnvGuess).opacity == "0")
    {
        drawGuessImage();
        cnvGuess.style.opacity = "1";
    }
}

function showErrorImage()
{
    cnvGuess.style.opacity = "1";
    ctxGuess.drawImage(errorImage, 0, 0, cnvGuess.width, cnvGuess.height);
    showingErrorImage = true;
    pLoadingProgress.style.display = "block";
    pLoadingProgress.innerHTML = "Loading image: " + guessImage.completedPercentage + "%";
    loadingProgressInterval = window.setInterval(updateGuessImageLoadingProgress, 500);

}

function updateGuessImageLoadingProgress()
{
    pLoadingProgress.innerHTML = "Loading image: " + guessImage.completedPercentage + "%";
}

function getReportData()
{
    const info = {
        gameParameters: gameParameters,
        gameCode: createGameCode(),
        imageData: currentImageData,
        roundNumber: roundNumber,
        locationIndex: locationIndex,
        mapType: localStorage.getItem("mapType"),
        screenType: localStorage.getItem("screenType"),
        units: localStorage.getItem("unitType")
    };

    navigator.clipboard.writeText("```" + JSON.stringify(info, null, 3) + "```");

    //alert stops clipboard from being allowed to write in chrome. please forgive me
    window.setTimeout(() => {
        alert("Information copied to clipboard. Please send via discord or email, " +
        "along with a description of the problem if you have anything to add");
    }, 500)
    
}

function newStoredSeed()
{
    gameParameters.roundOffset = 0;
    gameParameters.seed = generateSeed();
    localStorage.setItem("seed", gameParameters.seed);
    localStorage.setItem("roundOffset", 0);
    maxOffset = 0;
}