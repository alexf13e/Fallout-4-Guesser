
//i hope you've got a strong stomach https://youtu.be/j0_u26Vpb4w?t=483

const cnvGuess = document.getElementById("cnvGuess");
const ctxGuess = cnvGuess.getContext("2d");

var guessImageLoaded = false;
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
    }
    
    beginRoundTimer(); //try to start round timer each round. won't start when first loaded since player won't be ready
    beginScoreDecay();
};

const pzGuessImage = new PZImage(guessImage, cnvGuess, 4);

//shown if the guess image is taking to long to load. if this doesnt load then idk
const errorImage = new Image();
errorImage.src = "./assets/psb.jpg";
var errorImageTimeout;
var showingErrorImage = false;

const imageDir = "./assets/f4gimages/";
var allImageData;
var currentImageData;
var randomisedImageOrder;

const maxScore = 5000;
const perfectDist = 5;
const survivalStartingScore = 10000;
var locationIndex;
var roundNumber;
var roundsRemaining;
var gameEnded;

var playerReady;
var guessPosWorld;
var guessPlaced;
var guessConfirmed;
var firstGame;

var gameLocationSummary;
var totalScore = 0;
var totalTime = 0;
var totalDistance = 0;
var survivalPeakScore = 0;
var gameOverMessage;
const genericDeathMessages = [
    "you starved to death",
    "you died of dehydration",
    "you were kidnapped by the institute, never to be seen again",
    "you died to an infection"
];

var roundStartTime;
var roundTimerTimeout;
var roundTimerUpdateTimeout;
var remainingTime;
var scoreDecayPerSecond;
var scoreDecayUpdateTimeout;

var gameParameters = {}; //current gameParameters, will copy from those of another mode, or be set itself for custom mode

const gpNormal = {
    rounds: 5,
    timeLimit: 60,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 1,
    survival: false,
    custom: false,
    seed: 0,
    roundOffset: 0,
    showRemainingRounds: true
};

const gpSurvival = {
    rounds: 636,
    timeLimit: 0,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    survival: true,
    custom: false,
    seed: 0,
    roundOffset: 0,
    showRemainingRounds: false
};

const gpEndless = {
    rounds: 636,
    timeLimit: 0,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    survival: false,
    custom: false,
    seed: 0,
    roundOffset: 0,
    showRemainingRounds: false
};

if (!localStorage.getItem("seed")) newStoredSeed();
/*if the player repeats a game, then starts a new one mid way through, instead of
continuing from the round after the one they left during, go to the round that would
have been after the game theyre repeating*/
var maxOffset = parseInt(localStorage.getItem("roundOffset"));

const greenColour = "rgb(20, 255, 23)";
const specialColour = "cyan";
const deathColour = "rgb(225, 93, 61)";


////////////////Resources & Initialisation////////////////

/*I know this is inefficient and makes cheating easy, but setting up a server/database
to load from is a bit beyond me atm*/
fetch("./assets/imgData.json")
.then( (response) => {
        response.text().then(createAnswerArray);
    },
    (response) => {
        //should probably tell the user somethings broke... oh well
        console.log(response);
    }
);

function createAnswerArray(text)
{
    //create array containing information for each image
    allImageData = JSON.parse(text);
}

function updateImage()
{    
    hideGuessImage();
    errorImageTimeout = window.setTimeout(showErrorImage, 5000);

    if (!gameParameters.custom)
    {
        localStorage.setItem("roundOffset", parseInt(localStorage.getItem("roundOffset")) + 1);
        maxOffset = Math.max(parseInt(localStorage.getItem("roundOffset")), maxOffset);
    }

    currentImageData = allImageData[randomisedImageOrder[locationIndex]];
    guessImageLoaded = false;
    guessImage.src = imageDir + currentImageData.src;

    //update rads and difficulty indicators on pip boy
    pipDraw();
}

function initialiseGame(mode)
{
    //set up the game parameters based on the mode or custom settings

    //reset timers that may have been active if starting a new game during a previous one
    clearTimeouts();
    
    firstGame = true;

    switch (mode)
    {
        case "normal":
            gameParameters = Object.assign(gameParameters, gpNormal);
            break;

        case "endless":
            gameParameters = Object.assign(gameParameters, gpEndless);
            break;
        
        case "survival":
            gameParameters = Object.assign(gameParameters, gpSurvival);
            break;
    
        case "custom":
            //felt like not typing x.value multiple times for ones that are used multiple times
            const rounds = paramRounds.value;
            const tl = paramTimeLimit.value;
            const minps = paramMinScore.value;
            const seed = paramSeed.value;

            gameParameters.survival = paramMode.value == "1";
            gameParameters.rounds = (rounds == "" || parseInt(rounds) == 0) ? allImageData.length : parseInt(rounds);
            gameParameters.timeLimit = (tl == "" || parseInt(tl) == 0) ? 0 : parseInt(tl);
            gameParameters.minPassingScore = (minps == "" || parseInt(minps) == 0) ? 0 : parseInt(minps);
            gameParameters.minDifficulty = parseInt(paramMinDifficulty.value);
            gameParameters.maxDifficulty = parseInt(paramMaxDifficulty.value);
            gameParameters.custom = true;
            gameParameters.roundOffset = 0;
            gameParameters.showRemainingRounds = !(rounds == "" || parseInt(rounds) == 0);
            gameParameters.seed = seed;
            break;
    }

    //set visibility of ui elements to only show those relevent to current game settings
    if (gameParameters.timeLimit == 0)
    {
        pTimer.style.display = "none";
    }
    else
    {
        pTimer.style.display = "block";
    }

    if (gameParameters.minPassingScore == 0)
    {
        pMinScore.style.display = "none";
    }
    else
    {
        pMinScore.innerHTML = "Score required: " + gameParameters.minPassingScore;
        pMinScore.style.display = "block";
    }

    if (gameParameters.survival)
    {
        pSurvivalScore.style.display = "block";
    }
    else
    {
        pSurvivalScore.style.display = "none";
    }

    //roundcount is always relevant
    pRoundCount.style.display = "block";
    btnReady.style.display = "block";

    //start a game with the newly set parameters
    newGame(false);
}

function newGame(repeat)
{
    //reset all the game states to be ready for a new game to start
    roundNumber = 1;
    roundsRemaining = gameParameters.rounds;

    roundResultsList.innerHTML = "";

    guessPosWorld = [0,0];
    guessPlaced = false;
    guessConfirmed = false;

    btnReady.style.display = "block";
    btnConfirmGuess.disabled = true;
    btnConfirmGuess.style.display = "none";
    btnNextRound.style.display = "none";
    btnShowSummary.style.display = "none";
    btnNewGame.style.display = "none";
    btnRepeatGame.style.display = "none";

    pMinScore.style.color = greenColour;
    pSurvivalScore.style.color = greenColour;

    playerReady = false;
    gameEnded = false;
    gameLocationSummary = [];
    totalScore = gameParameters.survival ? survivalStartingScore : 0;
    totalTime = 0;
    totalDistance = 0;
    survivalPeakScore = 0;
    scoreDecayPerSecond = 100;
    pSurvivalScore.innerHTML = "Score: " + survivalStartingScore;
    pTimer.innerHTML = "Time: " + formatTimeString(gameParameters.timeLimit);

    /*if replaying game, dont regenerate new image order. for custom seed, the
    round number going back to 1 will make the game repeat. for non-custom seed,
    the round offset will be reduced by the number of rounds in the game, undoing
    the increase at the end of the last game.*/
    if (!gameParameters.custom)
    {
        if (repeat)
        {
            localStorage.setItem("roundOffset", parseInt(localStorage.getItem("roundOffset")) - gameParameters.rounds);
            gameParameters.roundOffset = parseInt(localStorage.getItem("roundOffset"));
        }
        else
        {
            localStorage.setItem("roundOffset", maxOffset);
            gameParameters.roundOffset = maxOffset;
        }

        gameParameters.seed = parseInt(localStorage.getItem("seed"));
    }
    else if (!repeat)
    {
        if (firstGame)
        {
            //seed was not set by options in initialisation, so a random one is desired
            if (gameParameters.seed == "") gameParameters.seed = generateSeed();
        }
        else
        {
            //new game not wanting repeat
            gameParameters.seed = generateSeed();
        }
    }

    firstGame = false;

    //if a repeating a custom mode, the seed will have to already have been set and will be unchanged
    

    /*createRandomImageOrder should be called whenever not repeating in case the
    previous game and current game aren't using the same seed. if they are using
    the same seed it wont matter (and takes very little time to process so whatever)*/
    if (!repeat) createRandomImageOrder();
    locationIndex = gameParameters.roundOffset;

    updateImage();
    
    if (randomisedImageOrder.length < gameParameters.rounds)
    {
        roundsRemaining = randomisedImageOrder.length;
        gameParameters.rounds = randomisedImageOrder.length;

        if (gameParameters.showRemainingRounds)
        {
            //wanted a specific number of rounds which cannot be done, let player know
            addMessage("Note: only " + roundsRemaining + " images available with current settings", false);
        }
    }
    
    if (gameParameters.custom) addMessage("Game code for sharing: " + createGameCode() + "<br>", false);
    updateRoundCounter();

    if (map)
    {
        mapClear();
        mapDefaultPos();
    }

    pipNavChange("data");
}


////////////////Game Actions////////////////

function ready()
{
    //actually start the damn game
    playerReady = true;
    btnReady.style.display = "none";
    btnConfirmGuess.style.display = "block";
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
    if (!guessConfirmed && playerReady && guessImageLoaded)
    {
        guessPosWorld = mapToWorldPos(guessMarker._latlng);
        guessPlaced = true;
        btnConfirmGuess.disabled = false;
    }
}

function confirmGuess()
{
    clearTimeouts();

    guessConfirmed = true;

    btnConfirmGuess.disabled = true;
    btnNextRound.style.display = "block";
    btnConfirmGuess.style.display = "none";
    if (!gameParameters.survival)
    {
        pCurrentScore.style.display = "block";
        dvGameInfo.style.display = "none";
    }

    pipSetVisible(true);
    pipNavChange("map");

    var score = 0;
    var gamer = false;

    const answerPosMap = worldToMapPos(currentImageData.pos);
    answerMarker = mapCreateAnswerMarker(answerPosMap).addTo(map);

    if (guessPlaced)
    {
        //add a line between the guess and answer if a guess was placed
        guessLine = mapCreateLine([answerPosMap, guessMarker._latlng]).addTo(map);

        //get desired bounding rectangle to show guess and answer (+ a little gap at the edges)
        const guessPosMap = guessMarker._latlng;
        const BL = new L.LatLng(Math.min(guessPosMap["lat"], answerPosMap["lat"]) - 3, Math.min(guessPosMap["lng"], answerPosMap["lng"]) - 3); //min y, min x
        const TR = new L.LatLng(Math.max(guessPosMap["lat"], answerPosMap["lat"]) + 3, Math.max(guessPosMap["lng"], answerPosMap["lng"]) + 3); //max y, max x

        map.flyToBounds([BL, TR]);
        gameLocationSummary.push([guessPosMap, answerPosMap]);

        const guessDistance = Math.sqrt(Math.pow(currentImageData.pos[0] - guessPosWorld[0], 2) + Math.pow(currentImageData.pos[1] - guessPosWorld[1], 2));
        const distanceMetres = guessDistance * 0.01428; //magic number no touch (converts from game units to metres)

        score = gameParameters.survival ? getSurvivalScore(distanceMetres) : getNormalScore(distanceMetres);

        if (distanceMetres < 1)
        {
            //for the real gamers
            score += 1;
            gamer = true;
        }
    
        distMessage = formatDistance(distanceMetres);
        totalDistance += distanceMetres;
        if (gamer) pSurvivalScore.style.color = specialColour;
    }
    else
    {
        distMessage = "No guess made";
        //add distinct "nothing" for no guess, so it doesnt draw the guess or line in the summary
        gameLocationSummary.push([null, answerPosMap]);

        map.flyTo(answerPosMap, 3);
    }

    pSurvivalScore.innerHTML = "Score: " + totalScore + " + " + score;

    const roundText = roundNumber + ": " + score + " points (" + distMessage + ")";
    addMessage(roundText, gamer);

    totalScore += score;
    totalTime += (Date.now() - roundStartTime) / 1000;

    updateCurrentScoreDisplay(score, gamer);

    guessPlaced = false;

    //update peak score stat
    if (gameParameters.survival)
    {
        if (totalScore > survivalPeakScore) survivalPeakScore = totalScore;
        scoreDecayPerSecond = Math.min(scoreDecayPerSecond + 50, 750);
    }

    //check if game is over
    if (score < gameParameters.minPassingScore)
    {
        //didn't get enough points to pass the round
        gameOver(1);
        return;
    }

    if (gameParameters.survival && totalScore <= 0)
    {
        //score decayed to 0
        gameOver(3);
        return;
    }

    //only reduce rounds in non-endless modes
    if (gameParameters.custom || gameParameters.showRemainingRounds) roundsRemaining--;

    if (roundsRemaining <= 0)
    {
        if (gameParameters.survival)
        {
            //in survival mode, completed all rounds
            gameOver(2);
        }
        else
        {
            //completed the number of rounds the game was set to
            gameOver(0);
        }
    }
}

function nextRound()
{
    //reset some of the game state for a new round
    guessConfirmed = false;
    
    roundNumber++;
    locationIndex++;

    //deal with endless mode
    if (locationIndex >= allImageData.length)
    {
        //should only reach here in endless and survival, non custom
        locationIndex = 0;
        newStoredSeed();
        createRandomImageOrder();
    }

    //go to next location
    updateImage();
    guessPosWorld = [0,0];

    //update ui
    btnNextRound.style.display = "none";
    btnConfirmGuess.style.display = "block";
    pCurrentScore.style.display = "none";
    dvGameInfo.style.display = "grid";
    pTimer.innerHTML = "Time: " + formatTimeString(gameParameters.timeLimit);
    pSurvivalScore.style.color = greenColour;
    updateRoundCounter();

    //reset map
    mapClear();
    mapDefaultPos();

    pipSetVisible(false);
    pipNavChange("map");
}

function gameOver(reason)
{
    var deathMessage = currentImageData.deathMessage;
    if (deathMessage == "")
    {
        const i = Math.floor(RNG(gameParameters.seed) * genericDeathMessages.length);
        deathMessage = genericDeathMessages[i];
    }

    switch (reason)
    {
        case 0: //completed all rounds, i.e. success
            gameOverMessage = "Total Score: " + totalScore + "/" + 5000 * gameParameters.rounds;
            break;

        case 1: //score less than min passing score
            gameOverMessage = "You survived " + (roundNumber - 1) + " rounds before " + deathMessage;
            pMinScore.style.color = deathColour;
            break;
            
        case 2: //completed all rounds of a survival game
            gameOverMessage = "Congratulations, you survived every round and won " 
            + "<a href='https://fallout.fandom.com/wiki/Graygarden?file=FO4_Brand_New_Car.jpg'"
            + "target='_blank' rel='noreferrer noopener'>a brand new car!</a>";
            break;
        
        case 3: //score drained to 0
            gameOverMessage = "You survived " + (roundNumber - 1) + " rounds before " + deathMessage;
            pSurvivalScore.style.color = deathColour;
            break;

        default:
            gameOverMessage = "Game over";
    }

    btnNextRound.style.display = "none";
    btnShowSummary.style.display = "block";
}

function enableSummary()
{
    gameEnded = true;
    btnShowSummary.style.display = "none";
    btnEndData.style.display = "block";
    pCurrentScore.style.color = greenColour;
    pCurrentScore.innerHTML = "Game Summary";
    dvGameInfo.style.display = "none";
    pCurrentScore.style.display = "block";
    
    addMessage("<br>"); //add an empty line for readability
    addMessage(gameOverMessage, false);
    addMessage("Total Time: " + formatTimeString(totalTime), false);
    addMessage("Total Distance Away: " + formatDistance(totalDistance), false);
    if (gameParameters.survival) addMessage("Peak score: " + survivalPeakScore);

    btnNewGame.textContent = "New Game" + (gameParameters.custom ? " (random seed)" : "");

    hideGuessImage();

    mapDefaultPos();
    mapClear();
    mapGenerateSummary();

    pipNavChange("map");
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

function generateSeed()
{
    return Math.floor(Math.random() * 2147483648);
}

function createRandomImageOrder()
{
    //put shuffled order for images into array
    randomisedImageOrder = [];
    const availableImNums = [];
    //return; //comment to enable random order

    //get number of total images for selected difficulties
    for (var imData of allImageData)
    {
        if (imData.difficulty <= gameParameters.maxDifficulty && imData.difficulty >= gameParameters.minDifficulty)
        {
            availableImNums.push(imData.id);
        }
    }

    if (!(gameParameters.custom || gameParameters.rounds == 636) && gameParameters.rounds > availableImNums.length - gameParameters.roundOffset)
    {
        /*dont want this to get too complicated. if there arent enough unseen
        locations left to fill this game, just get a new seed and start at the
        beginning again (cba to use remaining locations, then get a new seed and
        fill the remaining rounds with new images but making sure they weren't
        used before)
        Endless and survival games sort themseleves out, and custom games have
        no offset*/
        newStoredSeed();
    }

    //https://bost.ocks.org/mike/shuffle/
    var m = availableImNums.length;
    var i;
    var s = gameParameters.seed;

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
    var t = seed;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function beginRoundTimer()
{
    if (!playerReady) return;

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
            pTimer.innerHTML = "Time: " + formatTimeString(0)
            confirmGuess();
        }, gameParameters.timeLimit * 1000);
}

function updateRoundTimer()
{
    //update ui for timer
    remainingTime = Math.max((gameParameters.timeLimit * 1000 - (Date.now() - roundStartTime)) / 1000, 0);
    pTimer.innerHTML = "Time: " + formatTimeString(remainingTime);

    roundTimerUpdateTimeout = window.setTimeout(updateRoundTimer, 100);

    //yes events i know but this is easier for now in case theres both a timer and score decay
    if (remainingTime < 15 && !buttonFlashing && !pipVisible)
    {
        flashButtonOn();
    }
}

function beginScoreDecay()
{
    if (!playerReady || !gameParameters.survival) return;

    window.clearTimeout(scoreDecayUpdateTimeout);
    updateScoreDecay();   
}

function updateScoreDecay()
{
    totalScore = Math.max(totalScore - scoreDecayPerSecond / 10.0, 0);
    pSurvivalScore.innerHTML = "Score: " + Math.floor(totalScore);

    if (totalScore <= 0)
    {
        pSurvivalScore.innerHTML = "Score: 0";
        confirmGuess();
    }
    else
    {
        //set timeout to stop when the score would run out, rather than just after 100ms if it would be less. yes i am that stingy
        var updateDelay = Math.min(100, totalScore/scoreDecayPerSecond * 1000);
        scoreDecayUpdateTimeout = window.setTimeout(updateScoreDecay, updateDelay);
    }

    if (totalScore < 2500 && !buttonFlashing && !pipVisible)
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
    buttonFlashing = false;
    drawToggleButton();
}

function createGameCode()
{
    /*slightly more sophisticated way (which only saves like 30% at best)
    cant be bothered to make something to convert from base 10 to a higher base
    for the entire code treated as one number, since its too large to use built
    in methods*/

    //if no gameparameters have been set, cant return a code
    if (Object.keys(gameParameters).length == 0) return null;

    var gcSurvival = (gameParameters.survival ? "1" : "0");
    var gcRounds = gameParameters.rounds;
    var gcTimeLimit = gameParameters.timeLimit;
    var gcMinScore = gameParameters.minPassingScore;
    var gcMinDif = gameParameters.minDifficulty;
    var gcMaxDif = gameParameters.maxDifficulty;
    var gcSeed  = parseInt(gameParameters.seed).toString(16); //saves maybe 2 characters but may as well

    /*
        try to shorten the code by reducing leading 0s

        x -> x
        0x -> ax
        00x -> bx
        000x -> cx
        all 0 -> 0
    */

    var zeroChars = ["", "a", "b", "c"];

    gcRounds = (gcRounds == 0 ? "0" : zeroChars[3 - gcRounds.toString().length] + gcRounds.toString());
    gcTimeLimit = (gcTimeLimit == 0 ? "0" : zeroChars[3 - gcTimeLimit.toString().length] + gcTimeLimit.toString());
    gcMinScore = (gcMinScore == 0 ? "0" : zeroChars[4 - gcMinScore.toString().length] + gcMinScore.toString());

    /*convert pair of difficulties to a single value (not all are valid).
    0   1   2   3x  4   5   6x  7x   8
    ee  em  eh  me  mm  mh  he  hm  hh
    */
    var gcDif  = gcMinDif * 3 + gcMaxDif;

    return gcSurvival + gcRounds + gcTimeLimit + gcMinScore + gcDif + gcSeed;
}

function formatDistance(metres)
{
    //convert a number of metres to a nice string representation with the preferred unit
    var message;

    if (localStorage.getItem("unitType") == "metric")
    {
        if (metres > 1000)
        {
            metres = (metres / 1000).toPrecision(3);
            message = metres + "km";
        }
        else
        {
            metres = metres.toPrecision(3);
            message = metres + "m";
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
            message = (yards / 1760).toPrecision(3) + " miles";
        }
        else
        {
            message = yards.toPrecision(3) + " yards"
        }
    }
    

    return message;
}

    
function formatTimeString(seconds)
{
    //convert number of seconds to a nice string representation (e.g. 73 seconds -> 1m 13s)
    var displayedTime;

    if (seconds < 0)
    {
        //dont care about showing negative numbers, nicer to just stop at 0 instead of flickering as the timer runs out
        displayedTime = 0 + "s";
    }
    else if (seconds < 60)
    {
        displayedTime = (seconds > 10 ? Math.floor(seconds) : seconds.toPrecision(3)) + "s";
    }
    else
    {
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        displayedTime = Math.floor(seconds) + "s";

        if (minutes >= 60)
        {
            var hours = Math.floor(minutes / 60);
            minutes = minutes % 60;
            displayedTime = hours + "h " + minutes + "m " + displayedTime;
        }
        else
        {
            displayedTime = minutes + "m " + displayedTime;
        }

    }

    return displayedTime;
}

function hideGuessImage()
{
    if (window.getComputedStyle(cnvGuess).opacity == "1") cnvGuess.style.opacity = "0";
}

function showGuessImage()
{
    if (guessImageLoaded && playerReady && window.getComputedStyle(cnvGuess).opacity == "0")
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
        alert("Information copied to clipboard. Please send to ▪alex#3059 on discord, " +
        "along with a description of the problem (if you needed to copy the username " +
        "and overwrote the copied data, clicking the report button again will copy the " +
        "same info as before)");
    }, 500)
    
}

function getNormalScore(dist)
{
    /*Score on a quadratic curve which seemed about reasonable for how difficult I want it to be
    Curve is tuned to have max score at 5 metres, and 0 points at 500 metres
    https://www.desmos.com/calculator/nvdbx3r4qx (b is scoreStrictness)
    Vague explanation about how its tuned:
    ax^2 + bx + c = score (x = distance in metres)

    (we want to find a, b and c which will give a curve suiting our needs (goes through 5000 points at 5 metres, and 0 points at 500 metres))
    a(5^2) + b(5) + c = 5000
    a(500^2) + b(500) + c = 0

    c = -a(500^2) - b(500) = 5000 - a(5^2) - b(5)
    (ignore c for now)
    5000 = a(5^2) - a(500^2) + b(5) - b(500)
    5000 = a(500^2 - 5^2) + b(500 - 5)
    5000 = a(250,000 - 25) + b(495)
    5000 = 249,975a + 495b

    (decide to tune based on b since it is nicer for adjusting the curve. so we want a as a function of b)
    249,975a = 5000 - 495b
    a = (5000 - 495b) / 249,975

    (b is set to whatever we want to tune the curve, named scoreStrictness here)

    c = 5000 - a(5^2) - b(5^2)

    I found b = -3.9 to be reasonable for the size of the map
    */
    
    const scoreStrictness = -3.9;
    const a = -(maxScore + 495 * scoreStrictness) / 249975;
    const c = maxScore - perfectDist * perfectDist * a - perfectDist * scoreStrictness;

    score = a * dist * dist + scoreStrictness * dist + c;
    score = Math.floor(Math.max(Math.min(maxScore, score), 0)); //constrain score between 0 and maxscore

    return score;
}

function getSurvivalScore(dist)
{
    //same as above, but stricter. score drops to 0 at 100 metres, and decays more steeply

    const scoreStrictness = -10;
    const a = -(maxScore + 95 * scoreStrictness) / 9975;
    c = maxScore - perfectDist * perfectDist * a - perfectDist * scoreStrictness;
    
    score = a * dist * dist + scoreStrictness * dist + c;
    score = Math.floor(Math.max(Math.min(maxScore, score), 0)); //constrain score between 0 and maxscore

    return score;
}

function newStoredSeed()
{
    gameParameters.roundOffset = 0;
    gameParameters.seed = generateSeed();
    localStorage.setItem("seed", gameParameters.seed);
    localStorage.setItem("roundOffset", 0);
    maxOffset = 0;
}