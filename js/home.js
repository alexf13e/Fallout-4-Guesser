
const slMap = document.getElementById("slMap");
const slScreen = document.getElementById("slScreen");
const slUnitType = document.getElementById("slUnitType");
// const cbTracking = document.getElementById("cbTracking");

//These ones seemed somewhat suitable as background images
const bgImages = [
    10, 14, 26, 31, 87, 93, 109, 150, 181, 186,
    206, 245, 306, 307, 332, 334, 380, 386, 463,
    507, 563, 569, 593, 603, 633, 634, 637, 660,
    676, 706, 728, 747, 750, 782
];

window.onload = () => {

    checkLocalStorage();


    //pick a random background image
    let im = Math.floor(Math.random() * bgImages.length);
    let imNum = ("" + bgImages[im]).padStart(4, "0");
    document.getElementById("dvBackground").style.backgroundImage = "url('./assets/f4gimages/img_" + imNum + ".webp'";

    /*set default values for options, either keeping their default for new users,
    or going to what they set them to before for returning ones*/
    let mapType = getLocalStorage("mapType");
    let screenType = getLocalStorage("screenType");
    let unitType = getLocalStorage("unitType");
    // let tracking = getLocalStorage("enableTracking");

    if (mapType != null) slMap.value = mapType;
    if (screenType != null) slScreen.value = screenType;
    if (unitType != null) slUnitType.value = unitType;
    // if (tracking != null) cbTracking.checked = tracking;
};

function toggleOptions()
{
    var dvOptions = document.getElementById("dvOptions");
    dvOptions.style.display = window.getComputedStyle(dvOptions).display == "none" ? "grid" : "none";
}

function startGame()
{
    //store the selected options and go to the game
    setLocalStorage("mapType", slMap.value);
    setLocalStorage("screenType", slScreen.value);
    setLocalStorage("unitType", slUnitType.value);
    // setLocalStorage("enableTracking", cbTracking.checked);

    if (getLocalStorage("tutorialActive") === null) setLocalStorage("tutorialActive", true);

    window.location.href = "game.html";
}

function clearData()
{
    if (confirm("This will clear stats and reset the system for not seeing duplicates in normal and endless"))
    {
        localStorage.removeItem("fallout4guesser");

        //legacy localstorage clearing
        localStorage.removeItem("enableTracking");
        localStorage.removeItem("mapType");
        localStorage.removeItem("playerStats");
        localStorage.removeItem("roundOffset");
        localStorage.removeItem("screenType");
        localStorage.removeItem("seed");
        localStorage.removeItem("tutorialActive");
        localStorage.removeItem("unitType");
    }
}

function getLocalStorage(name)
{
    let ls = localStorage.getItem("fallout4guesser");
    if (ls === null) return null;
    else ls = JSON.parse(ls);
    
    let value = ls[name];
    if (value === undefined) return null;
    else return value;
}

function setLocalStorage(name, value)
{
    let ls = localStorage.getItem("fallout4guesser");
    if (ls === null) ls = {};
    else ls = JSON.parse(ls);

    ls[name] = value;

    localStorage.setItem("fallout4guesser", JSON.stringify(ls));
}

function checkLocalStorage()
{
    if (localStorage.getItem("fallout4guesser") === null)
    {
        let ls = {};
        
        // let enableTracking = localStorage.getItem("enableTracking");
        let mapType = localStorage.getItem("mapType");
        let playerStats = localStorage.getItem("playerStats");
        let roundOffset = localStorage.getItem("roundOffset");
        let screenType = localStorage.getItem("screenType");
        let seed = localStorage.getItem("seed");
        let tutorialActive = localStorage.getItem("tutorialActive");
        let unitType = localStorage.getItem("unitType");

        // if (enableTracking != null) ls.enableTracking = (enableTracking === "true");
        if (mapType != null) ls.mapType = mapType;
        if (playerStats != null) ls.playerStats = JSON.parse(playerStats);
        if (roundOffset != null) ls.roundOffset = parseInt(roundOffset);
        if (screenType != null) ls.screenType = screenType;
        if (seed != null) ls.seed = parseInt(seed);
        if (tutorialActive != null) ls.tutorialActive = (tutorialActive === "true");
        if (unitType != null) ls.unitType = unitType;

        localStorage.setItem("fallout4guesser", JSON.stringify(ls));


    }
}