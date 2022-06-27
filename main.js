
//i hope you've got a strong stomach


const cnvGuess = document.getElementById("cnvGuess");
const ctxGuess = cnvGuess.getContext("2d");

var guessImageLoaded = false;
const guessImage = new Image();
guessImage.onload = function()
{
    window.clearTimeout(errorImageTimeout);

    if (pzGuessImage == undefined)
    {
        pzGuessImage = new PZImage(guessImage, cnvGuess, 4);
    }

    if (guessImageAnimFrame != undefined)
    {
        cancelAnimationFrame(guessImageAnimFrame);
    }

    guessImageLoaded = true;
    showGuessImage();

    beginRoundTimer(); //try to start round timer each round. won't start when first loaded since player won't be ready
    beginScoreDecay();
};

const errorImage = new Image();
errorImage.src = "./assets/psb.jpg";

var allImageData;
var currentImageData;
const imageDir = "./assets/f4gimages/";
var randomisedImageOrder = [];
var pzGuessImage;
var roundNumber;
var gameEnded;

var guessPosWorld;
var guessPlaced = false; //control visibility of guess marker, only show after first click
var guessConfirmed = false; //guess has been confirmed and asking for answer

var guessImageAnimFrame;

var gameSeed = 0;
var gameParameters = {};

const gpNormal = {
    rounds: 5,
    timeLimit: 60,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 1,
    survival: false,
    showRemainingRounds: true
};

const gpSurvival = {
    rounds: 636,
    timeLimit: 0,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    survival: true,
    showRemainingRounds: false
};

const gpEndless = {
    rounds: 636,
    timeLimit: 0,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    survival: false,
    showRemainingRounds: false
};

var roundsRemaining;
var roundStartTime;
var roundTimerTimeout;
var roundTimerUpdateTimeout;
var remainingTime;
var scoreDecayPerSecond;
var scoreDecayUpdateTimeout;
var errorImageTimeout;

var playerReady = false;
var gameLocationSummary = [];
var totalScore = 0;
var totalTime = 0;
var totalDistance = 0;
var scoreStrictness = -3.9; /*Could be changed for difficulty balance https://www.desmos.com/calculator/nvdbx3r4qx */
var survivalStartingScore = 10000;
var survivalPeakScore = 0;
var gameOverMessage;
const genericDeathMessages = [
    "you starved to death",
    "you died of dehydration",
    "you were kidnapped by the institute, never to be seen again",
    "you died to an infection"
];

const greenColour = "rgb(20, 255, 23)";
const specialColour = "cyan";


////////////////Resources & Initialisation////////////////

/*I know this is inefficient and makes cheating easy, but setting up a server/database
to load from is a bit beyond me atm*/
fetch("./assets/imgData.json")
.then( (response) => {
        response.text().then(createAnswerArray);
    },
    (response) => {
        //should probably alert the user somethings broke
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

    //get data about image
    currentImageData = allImageData[randomisedImageOrder[roundNumber - 1]];
    guessImageLoaded = false;
    guessImage.src = imageDir + currentImageData.src;

    //update pipboy rads and difficulty
    pipDraw();

    errorImageTimeout = window.setTimeout(showErrorImage, 5000);
}

function initialiseGame(mode)
{
    //set up the game parameters based on the mode or custom settings

    //reset timers that may have been active if starting a new game during a previous one
    clearTimeouts();

    //tell the game to generate a random order of images, unless a seed is provided
    var newSeed = true;
    
    switch (mode)
    {
        case "endless":
            gameParameters = Object.assign(gameParameters, gpEndless);
            break;
    
        case "normal":
            gameParameters = Object.assign(gameParameters, gpNormal);
            break;
        
        case "survival":
            gameParameters = Object.assign(gameParameters, gpSurvival);
            scoreDecayPerSecond = 100;
            break;
    
        case "custom":
            const rounds = document.getElementById("paramRounds").value;
            const tl = document.getElementById("paramTimeLimit").value;
            const minps = document.getElementById("paramMinScore").value;
            const s = document.getElementById("paramSeed").value;

            gameParameters.rounds = (rounds == "" || parseInt(rounds) == 0) ? 636 : parseInt(rounds);
            gameParameters.timeLimit = (tl == "" || parseInt(tl) == 0) ? 0 : parseInt(tl);
            gameParameters.minPassingScore = (minps == "" || parseInt(minps) == 0) ? 0 : parseInt(minps);
            gameParameters.survival = false;
            gameParameters.showRemainingRounds = !(rounds == "" || parseInt(rounds) == 0);
            gameParameters.minDifficulty = parseInt(document.getElementById("paramMinDifficulty").value);
            gameParameters.maxDifficulty = parseInt(document.getElementById("paramMaxDifficulty").value);
        
            if (s != "")
            {
                newSeed = false;
                gameSeed = parseInt(s);
            }
            break; 
    }

    //set visibility of ui elements to only show those relevent to current game settings
    if (gameParameters.timeLimit == 0)
    {
        roundTimer = null;
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
        pSurvivalScore.innerHTML = "Score: " + survivalStartingScore;
    }
    else
    {
        pSurvivalScore.style.display = "none";
    }

    //roundcount is always relevant
    pRoundCount.style.display = "block";
    btnReady.style.display = "block";

    //start a game with the newly set parameters
    newGame(newSeed);
}

function newGame(newSeed)
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

    playerReady = false;
    gameEnded = false;
    gameLocationSummary = [];
    totalScore = gameParameters.survival ? survivalStartingScore : 0;
    totalTime = 0;
    totalDistance = 0;
    survivalPeakScore = 0;

    /*create a new order of images if either no seed was provided in the setup menu,
    or the player selected to start a new game with a new seeed. otherwise, the 
    random order will just be regenerated with the old seed and be the same*/
    if (newSeed)
    {
        generateSeed();
        createRandomImageOrder();
    }

    updateImage();

    if (randomisedImageOrder.length < gameParameters.rounds)
    {
        addMessage("Note: only " + randomisedImageOrder.length + " images available with current settings", false);
        roundsRemaining = randomisedImageOrder.length;
    }
    
    addMessage("Game code for sharing: " + createGameCode() + "<br>", false);
    updateRoundCounter();
    pTimer.innerHTML = "Time: " + formatTimeString(gameParameters.timeLimit);

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
    
    showGuessImage();

    if (guessImageLoaded)
    {
        pzGuessImage.resetPos();
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
        const maxScore = 5000;
        const perfectDist = 5;

        //Score on a quadratic curve which seemed about reasonable for how difficult I want it to be
        //https://www.desmos.com/calculator/nvdbx3r4qx (b is scoreStrictness)
        const a = -(maxScore + 495 * scoreStrictness) / 249975;
        const c = maxScore - perfectDist * perfectDist * a - perfectDist * scoreStrictness;
        score = a * distanceMetres * distanceMetres + scoreStrictness * distanceMetres + c;
        score = Math.floor(Math.max(Math.min(maxScore, score), 0)); //constrain score between 0 and maxscore

        if (distanceMetres < 1)
        {
            //for the real gamers
            score += 1;
            gamer = true;
        }
    
        distMessage = formatDistance(distanceMetres);
        totalDistance += distanceMetres;
        pSurvivalScore.innerHTML = "Score: " + totalScore + " + " + score;
    }
    else
    {
        distMessage = "No guess made";
        //add distinct "nothing" for no guess, so it doesnt draw the guess or line in the summary
        gameLocationSummary.push([0, answerPosMap]);

        map.flyTo(answerPosMap, 3);
    }

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
        scoreDecayPerSecond = Math.min(scoreDecayPerSecond + 50, 500);
    }

    //check if game is over
    if (score < gameParameters.minPassingScore)
    {
        //didn't get enough points to pass the round
        gameOver(1);
        return;
    }

    if (gameParameters.showRemainingRounds)
    {
        //in a mode with non-unlimited rounds (i.e. not survival or endless)
        roundsRemaining--;

        if (roundsRemaining <= 0)
        {
            //completed the number of rounds the game was set to, finished
            gameOver(0);
        }
    }
    else if (gameParameters.survival && roundNumber == gameParameters.rounds)
    {
        //in survival mode, completed all rounds
        gameOver(2);
    }
    else if (gameParameters.survival && totalScore <= 0)
    {
        //score decayed to 0
        gameOver(3);
    }
}

function nextRound()
{
    //reset some of the game state for a new round
    guessConfirmed = false;
    
    roundNumber = (roundNumber + 1) % (gameParameters.rounds + 1);
    if (roundNumber == 0)
    {
        roundNumber = 1;
        addMessage("All images complete, re-randomisng order", false);
        generateSeed();
        createRandomImageOrder();
    }

    updateImage();
    pzGuessImage.resetPos();
    guessPosWorld = [0,0];

    //update ui
    btnNextRound.style.display = "none";
    btnConfirmGuess.style.display = "block";
    pCurrentScore.style.display = "none";
    dvGameInfo.style.display = "grid";
    pTimer.innerHTML = "Time: " + formatTimeString(gameParameters.timeLimit);
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
        const i = Math.floor(RNG(gameSeed) * genericDeathMessages.length);
        deathMessage = genericDeathMessages[i];
    }

    switch (reason)
    {
        case 0: //completed all rounds, i.e. success
            gameOverMessage = "Total Score: " + totalScore + "/" + 5000 * gameParameters.rounds;
            break;

        case 1: //score less than min passing score
            gameOverMessage = "You survived " + (roundNumber - 1) + " rounds before " + deathMessage;
            break;
            
        case 2:
            gameOverMessage = "You survived every round";
            break;
        
        case 3:
            gameOverMessage = "You survived " + (roundNumber - 1) + " rounds before " + deathMessage;
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
    
    addMessage("<br>"); //add an empty line for readability
    addMessage(gameOverMessage, false);
    addMessage("Total Time: " + formatTimeString(totalTime), false);
    addMessage("Total Distance Away: " + formatDistance(totalDistance), false);
    if (gameParameters.survival) addMessage("Peak score: " + survivalPeakScore);

    hideGuessImage();

    mapDefaultPos();
    mapClear();
    mapGenerateSummary();
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
    gameSeed = Math.floor(Math.random() * 2147483648);
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

    //https://bost.ocks.org/mike/shuffle/
    var m = availableImNums.length;
    var i;
    var s = gameSeed;

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
    roundTimerTimeout = window.setTimeout(confirmGuess, gameParameters.timeLimit * 1000);
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
    //highly sophisticated algorithm to convert the game parameters to a string which can be copied
    return (gameParameters.rounds.toString().padStart(3, "0")
    + gameParameters.timeLimit.toString().padStart(3, "0")
    + gameParameters.minPassingScore.toString().padStart(4, "0")
    + gameParameters.minDifficulty
    + gameParameters.maxDifficulty
    + gameSeed.toString().padStart(10, "0"));
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
}

function getReportData()
{
    const info = {
        gameParameters: gameParameters,
        gameCode: createGameCode(),
        imageData: currentImageData,
        roundNumber: roundNumber,
        mapType: localStorage.getItem("mapType"),
        screenType: localStorage.getItem("screenType"),
        units: localStorage.getItem("unitType")
    };

    navigator.clipboard.writeText("```" + JSON.stringify(info, null, 3) + "```");
    alert("Information copied to clipboard. Please send to ▪alex#3059 on discord, " +
    "along with a description of the problem (if you needed to copy the username " +
    "and overwrote the copied data, clicking the report button again will copy the " +
    "same info as before)");
}