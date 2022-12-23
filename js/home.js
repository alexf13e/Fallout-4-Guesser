
const slMap = document.getElementById("slMap");
const slScreen = document.getElementById("slScreen");
const slUnitType = document.getElementById("slUnitType");
const cbTracking = document.getElementById("cbTracking");

//These ones seemed somewhat suitable as background images
const bgImages = [
    10, 14, 26, 31, 87, 93, 109, 150, 181, 186,
    206, 245, 306, 307, 332, 334, 380, 386, 463,
    507, 563, 569, 593, 603, 633, 634, 637, 660,
    676, 706, 728, 747, 750, 782
];

window.onload = () => {
    //pick a random background image
    let im = Math.floor(Math.random() * bgImages.length);
    let imNum = ("" + bgImages[im]).padStart(4, "0");
    document.getElementById("dvBackground").style.backgroundImage = "url('./assets/f4gimages/img_" + imNum + ".webp'";

    /*set default values for options, either keeping their default for new users,
    or going to what they set them to before for returning ones*/
    let mapType = localStorage.getItem("mapType");
    let screenType = localStorage.getItem("screenType");
    let unitType = localStorage.getItem("unitType");
    let tracking = localStorage.getItem("enableTracking");

    if (mapType != null) slMap.value = mapType;
    if (screenType != null) slScreen.value = screenType;
    if (unitType != null) slUnitType.value = unitType;
    if (tracking != null) cbTracking.checked = (tracking === "true");
};

function toggleOptions()
{
    var dvOptions = document.getElementById("dvOptions");
    dvOptions.style.display = window.getComputedStyle(dvOptions).display == "none" ? "grid" : "none";
}

function startGame()
{
    //store the selected options and go to the game
    localStorage.setItem("mapType", slMap.value);
    localStorage.setItem("screenType", slScreen.value);
    localStorage.setItem("unitType", slUnitType.value);
    localStorage.setItem("enableTracking", cbTracking.checked);

    if (localStorage.getItem("tutorialActive") == null) localStorage.setItem("tutorialActive", true);

    window.location.href = "game.html";
}

function clearData()
{
    if (confirm("This will clear stats and reset the system for not seeing duplicates in normal and endless"))
    {
        localStorage.clear();
    }
}