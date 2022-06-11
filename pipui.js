
var cnvPipboy = document.getElementById("cnvPipboy");
var ctxPipboy = cnvPipboy.getContext("2d");
 
var dvPipboy = document.getElementById("dvPipboy");
 
var dvInvScreen = document.getElementById("dvInvScreen");
var dvMapScreen = document.getElementById("dvMapScreen");
var dvDataScreen = document.getElementById("dvDataScreen");

var ms1 = document.getElementById("ms1");
var ms2 = document.getElementById("ms2");
var ms3 = document.getElementById("ms3");
var ms4 = document.getElementById("ms4");

var dvInvInfo = document.getElementById("dvInvInfo");
var btnModeNormal = document.getElementById("btnModeNormal");
var btnModeEndless = document.getElementById("btnModeEndless");
var btnModeSurvival = document.getElementById("btnModeSurvival");
var btnModeCustom = document.getElementById("btnModeCustom");

var dvInfoNormal = document.getElementById("dvInfoNormal");
var dvInfoEndless = document.getElementById("dvInfoEndless");
var dvInfoSurvival = document.getElementById("dvInfoSurvival");
var dvInfoCustom = document.getElementById("dvInfoCustom");

var dvCustomSettings = document.getElementById("dvCustomSettings");

var pRoundCount = document.getElementById("pRoundCount");
var pTimer = document.getElementById("pTimer");
var pMinScore = document.getElementById("pMinScore");
var pSurvivalScore = document.getElementById("pSurvivalScore");
var pCurrentScore = document.getElementById("pCurrentScore");
var dvGameInfo = document.getElementById("dvGameInfo");

var btnReady = document.getElementById("btnReady");
btnReady.style.display = "none";

var btnConfirmGuess = document.getElementById("btnConfirmGuess");
btnConfirmGuess.disabled = true;
btnConfirmGuess.style.display = "none";

var btnNextRound = document.getElementById("btnNextRound");
btnNextRound.style.display = "none";

var btnNewGame = document.getElementById("btnNewGame");
btnNewGame.style.display = "none";

var btnShowSummary = document.getElementById("btnShowSummary");
btnShowSummary.style.display = "none";

var btnRepeatGame = document.getElementById("btnRepeatGame");
btnRepeatGame.style.display = "none";

var btnEndData = document.getElementById("btnEndData");
btnEndData.style.display = "none";

var roundResultsList = document.getElementById("roundResults");

btnModeNormal.onclick = () => {
    dvCustomSettings.style.display = "none";
    pipModeInfoChange("normal");
}

btnModeEndless.onclick = () => { 
    dvCustomSettings.style.display = "none";
    pipModeInfoChange("endless");
}

btnModeSurvival.onclick = () => {
    dvCustomSettings.style.display = "none";
    pipModeInfoChange("survival");
}

btnModeCustom.onclick = () => { 
    dvCustomSettings.style.display = "grid";
    pipModeInfoChange("custom");
}

var imPipboy = new Image();
var imNavInv = new Image();
var imNavMap = new Image();
var imNavData = new Image();
var imRad = new Image();
var imDif = new Image();
var imNavCurrent;

imPipboy.onload = () => { checkLoadedImages(); };
imNavInv.onload = () => { checkLoadedImages(); };
imNavMap.onload = () => { checkLoadedImages(); };
imNavData.onload = () => { checkLoadedImages(); };
imRad.onload = () => { checkLoadedImages(); };
imDif.onload = () => { checkLoadedImages(); };

imPipboy.src = "./assets/pip/pipboy.png";
imNavInv.src = "./assets/pip/navInv.png";
imNavMap.src = "./assets/pip/navMap.png";
imNavData.src = "./assets/pip/navData.png";
imRad.src = "./assets/pip/rad.png";
imDif.src = "./assets/pip/dif.png";

var loadedCount = 0;
var pipVisible = true

function checkLoadedImages()
{
    loadedCount++;
    if (loadedCount >= 5)
    {
        pipNavChange("inv");
        pipDraw();
    }
}

function pipToggleVisible()
{
    pipSetVisible(!pipVisible);
}

function pipSetVisible(desiredVis)
{
    //if desiredVis is true, make pipboy visible
    dvPipboy.style.left = desiredVis ? "5%" : "-80%";
    pipVisible = desiredVis;
}

function pipNavChange(screen)
{
    //show appropriate div for the selected screen
    dvInvScreen.style.display = (screen == "inv") ? "grid" : "none";
    dvDataScreen.style.display = (screen == "data") ? "block" : "none";
    dvMapScreen.style.display = (screen == "map") ? "block" : "none";
    dvGameInfo.style.display = ((screen == "data" || screen == "map") && (!guessConfirmed || gameParameters.survival)) ? "grid" : "none";
    dvGameButtons.style.display = (screen == "data" || screen == "map") ? "grid" : "none";
    pCurrentScore.style.display = (guessConfirmed && screen != "inv" && !gameParameters.survival) ? "block" : "none";
    btnNewGame.style.display = (screen == "data" && gameEnded) ? "block" : "none";
    btnRepeatGame.style.display = (screen == "data" && gameEnded) ? "block" : "none";
    btnEndData.style.display = (screen == "map" && gameEnded) ? "block" : "none";


    //set nav dial image
    switch (screen)
    {
        case "inv":
            imNavCurrent = imNavInv;
            pipDraw();
            break;
        
        case "map":
            if (!map) mapInit();
            map.invalidateSize();  //in case window is resized while map is hidden (will stop loading tiles properly)
            imNavCurrent = imNavMap; 
            pipDraw();
            break;
        
        case "data":
            imNavCurrent = imNavData; 
            roundResultsList.scrollTop = roundResultsList.scrollHeight;
            pipDraw();
            break;
    }
}

function pipModeInfoChange(mode)
{
    //set which gamemode information div is visible
    dvInfoNormal.style.display = (mode == "normal") ? "block" : "none";
    dvInfoEndless.style.display = (mode == "endless") ? "block" : "none";
    dvInfoSurvival.style.display = (mode == "survival") ? "block" : "none";
    dvInfoCustom.style.display = (mode == "custom") ? "block" : "none";

    ms1.innerHTML = (mode == "normal") ? "▪" : "";
    ms2.innerHTML = (mode == "endless") ? "▪" : "";
    ms3.innerHTML = (mode == "survival") ? "▪" : "";
    ms4.innerHTML = (mode == "custom") ? "▪" : "";
}

function updateRoundCounter()
{
    if (gameParameters.showRemainingRounds) pRoundCount.innerHTML = "Round: " + roundNumber + "/" + (roundNumber + roundsRemaining - 1); //dont even worry about it
    else pRoundCount.innerHTML = "Round: " + roundNumber;
}

function updateCurrentScoreDisplay(score, gamerScore)
{
    pCurrentScore.style.color = gamerScore ? specialColour : greenColour;
    pCurrentScore.innerHTML = "Scored " + score + " points";
}

function pipDraw()
{
    //redraw pipboy ui
    ctxPipboy.clearRect(0, 0, cnvPipboy.width, cnvPipboy.height);
    ctxPipboy.shadowColor = "black";
    ctxPipboy.shadowBlur = 15;
    ctxPipboy.drawImage(imPipboy, 0, 0);
    ctxPipboy.drawImage(imNavCurrent, 1247, 193);
    
    ctxPipboy.shadowBlur = 0;

    //rotate rad needle depending on rads, and radio needle depending on difficulty (0, 1 or 2)
    var radAngle = d2r(80);
    var difAngle = d2r(120);

    if (currentImageData)
    {
        switch (currentImageData.rads)
        {
            case 0:
                radAngle = d2r(80);
                break;
            case 1:
                radAngle = d2r(10);
                break;
            case 2:
                radAngle = d2r(-70);
                break;
        }

        switch(currentImageData.difficulty)
        {
            case 0:
                difAngle = d2r(120);
                break;
            case 1:
                difAngle = d2r(150);
                break;
            case 2:
                difAngle = d2r(190);
                break;
        }
    }

    //translation offset taken from rad needle and pip boy images
    ctxPipboy.translate(1167, 513);
    ctxPipboy.rotate(radAngle);
    ctxPipboy.drawImage(imRad, -4, -4);
    ctxPipboy.rotate(-radAngle);
    ctxPipboy.translate(-1167, -513);

    ctxPipboy.translate(1368, 726);
    ctxPipboy.rotate(difAngle);
    ctxPipboy.drawImage(imDif, 0, -2);
    ctxPipboy.rotate(-difAngle);
    ctxPipboy.translate(-1368, -726);
}

function d2r(d)
{
    //convert degrees to radians
    return d / 180 * Math.PI;
}
