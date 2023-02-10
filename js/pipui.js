
uiBtnModeNormal.element.onclick = () => {
    dvCustomSettings.style.display = "none";
    pipModeInfoChange("normal");
}

uiBtnModeEndless.element.onclick = () => { 
    dvCustomSettings.style.display = "none";
    pipModeInfoChange("endless");
}

uiBtnModeSurvival.element.onclick = () => {
    dvCustomSettings.style.display = "none";
    pipModeInfoChange("survival");
}

uiBtnModeCustom.element.onclick = () => { 
    dvCustomSettings.style.display = "grid";
    pipModeInfoChange("custom");
}

uiBtnModeTutorial.element.onclick = () => {
    dvCustomSettings.style.display = "none"; //should never happen but may as well
    pipModeInfoChange("tutorial");
};

const imToggle = new Image();
const imPipboy = new Image();
const imNavStats = new Image();
const imNavInv = new Image();
const imNavMap = new Image();
const imNavData = new Image();
const imNavRadio = new Image();
const imRad = new Image();
const imDif = new Image();
let imNavCurrent;

imToggle.onload = () => drawToggleButton();
imPipboy.onload = () => checkLoadedImages();
imNavStats.onload = () => checkLoadedImages();
imNavInv.onload = () => checkLoadedImages();
imNavData.onload = () => checkLoadedImages();
imNavMap.onload = () => checkLoadedImages();
imNavRadio.onload = () => checkLoadedImages();
imRad.onload = () => checkLoadedImages();
imDif.onload = () => checkLoadedImages();

imToggle.load("./assets/pip/pipOutline.png");
imNavStats.load("./assets/pip/navStat.png")
imNavInv.load("./assets/pip/navInv.png");
imNavData.load("./assets/pip/navData.png");
imNavMap.load("./assets/pip/navMap.png");
imNavRadio.load("./assets/pip/navRadio.png");
imRad.load("./assets/pip/rad.png");
imDif.load("./assets/pip/dif.png");

let pipboyImageProgressInterval = window.setInterval(updatePipboyLoadingProgress, 500);

switch (localStorage.getItem("screenType"))
{
    case "dirt1":
        imPipboy.load("./assets/pip/pipboyndirt.png");
        break;
    
    case "dirt2":
        imPipboy.load("./assets/pip/pipboyfdirt.png");
        break;
    
    case "clean":
        imPipboy.load("./assets/pip/pipboyclean.png");
        break;
}


let loadedCount = 0;
let pipVisible = true
let buttonFlashTimeout;
let buttonFlashing = false;

const greenColour = "rgb(20, 255, 23)";
const specialColour = "cyan";
const deathColour = "rgb(225, 93, 61)";

function checkLoadedImages()
{
    //hide the pip boy until all elements/images have loaded
    loadedCount++;
    if (loadedCount >= 8)
    {
        window.clearInterval(pipboyImageProgressInterval);
        pLoadingProgress.style.display = "none";
        dvPipboy.style.display = "block";
        pipNavChange("inv");
        pipDraw();
        pipSetVisible(true);

        createXPBar();
    }
}

function updatePipboyLoadingProgress()
{
    let progress = (imToggle.completedPercentage + imPipboy.completedPercentage +
        imNavInv.completedPercentage + imNavData.completedPercentage + imNavMap.completedPercentage +
        imNavRadio.completedPercentage + imRad.completedPercentage + imDif.completedPercentage) / 8;
    pLoadingProgress.innerHTML = "Loading Pipboy: " + parseInt(progress) + "%";
}

function pipToggleVisible()
{
    pipSetVisible(!pipVisible);
}

function pipSetVisible(desiredVis)
{
    //if desiredVis is true, make pipboy visible
    dvPipboy.style.left = desiredVis ? "5%" : "-100%";
    pipVisible = desiredVis;
    cnvGuess.style.filter = pipVisible ? "blur(5px)" : "none";
    cnvGuess.style.pointerEvents = pipVisible ? "none" : "auto";
    window.clearTimeout(buttonFlashTimeout);
    drawToggleButton();
}

function updateUIVisibility(screen)
{
    for (let el of autoVisiblePipElements)
    {
        el.updateVisibility(screen, currentGameState);
    }
}

function pipNavChange(screen)
{
    //show appropriate ui for the selected screen
    updateUIVisibility(screen);
    
    //set nav dial image
    switch (screen)
    {
        case "stats":
            imNavCurrent = imNavStats;
            statsGenerateScreen();
            pipDraw();
            break;

        case "inv":
            imNavCurrent = imNavInv;
            pipDraw();
            break;
        
        case "map":
            if (!map) mapInit();
            map.invalidateSize();  /*map will stop loading tiles properly if this is
                                    not called and the window is resized while the map is hidden*/
            imNavCurrent = imNavMap; 
            pipDraw();
            break;
        
        case "data":
            imNavCurrent = imNavData;
            //scroll to bottom of game data to show most relevant info
            roundResultsList.scrollTop = roundResultsList.scrollHeight;
            pipDraw();
            break;
        
        case "radio":
            imNavCurrent = imNavRadio;
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
    dvInfoTutorial.style.display = (mode == "tutorial") ? "block" : "none";

    ms1.innerHTML = (mode == "normal" || mode == "tutorial") ? "▪" : "";
    ms2.innerHTML = (mode == "endless") ? "▪" : "";
    ms3.innerHTML = (mode == "survival") ? "▪" : "";
    ms4.innerHTML = (mode == "custom") ? "▪" : "";
}

function updateRoundCounter()
{
    if (gameParameters.showRemainingRounds) pRoundCount.innerHTML = "Round: " + roundNumber + "/" + gameParameters.rounds;
    else pRoundCount.innerHTML = "Round: " + roundNumber;
}

function updateCurrentScoreDisplay(score, gamerScore)
{
    uipCurrentScore.element.style.color = gamerScore ? specialColour : greenColour;
    uipCurrentScore.element.innerHTML = "Scored " + score + " points";
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
    let radAngle = d2r(80);
    let difAngle = d2r(120);

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
            default:
                radAngle = d2r(80);
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
            default:
                difAngle = d2r(120);
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


function drawToggleButton()
{
    ctxToggle.clearRect(0, 0, cnvTogglePip.width, cnvTogglePip.height);
    ctxToggle.shadowBlur = 10;
    ctxToggle.shadowColor = "black";
    ctxToggle.drawImage(imToggle, 0, 0);
}

function flashButtonOn()
{
    buttonFlashing = true;

    /*conveniently enough, having shadow when drawing the normal image makes the
    flashing colour look glowy. remember, its only a bug if you cant make up an
    excuse for why its in the program*/
    ctxToggle.shadowBlur = 0;
    ctxToggle.globalCompositeOperation = "source-in";
    ctxToggle.fillStyle = "#f9e289";
    ctxToggle.fillRect(0, 0, cnvTogglePip.width, cnvTogglePip.height);

    ctxToggle.globalCompositeOperation = "source-over";

    buttonFlashTimeout = window.setTimeout(flashButtonOff, 750);
}

function flashButtonOff()
{
    drawToggleButton();

    buttonFlashTimeout = window.setTimeout(flashButtonOn, 750);
}