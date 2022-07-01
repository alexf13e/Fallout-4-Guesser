
var slMap = document.getElementById("slMap");
var slScreen = document.getElementById("slScreen");
var slUnitType = document.getElementById("slUnitType");

//These ones seemed somewhat suitable as background images
const bgImages = [
    10, 14, 26, 31, 87, 93, 109, 150, 181, 186,
    206, 245, 306, 307, 332, 334, 380, 386, 463,
    507, 563, 569, 593, 603, 633, 634
];

window.onload = () => {
    //pick a random background image
    var im = Math.floor(Math.random() * bgImages.length);
    document.getElementById("dvBackground").style.backgroundImage = "url('./assets/f4gimages/img (" + bgImages[im] + ").jpg'";
    
    /*set default values for options, either keeping their default for new users,
    or going to what they set them to before for returning ones*/
    var mapType = localStorage.getItem("mapType");
    var screenType = localStorage.getItem("screenType");
    var unitType = localStorage.getItem("unitType");

    if (mapType) slMap.value = mapType;
    if (screenType) slScreen.value = screenType;
    if (unitType) slUnitType.value = unitType;

    //disable spying for people who don't want it
    if (!(navigator.doNotTrack == "1" || navigator.doNotTrack == "yes" || window.doNotTrack == "1"))
    {
        var glowScript = document.createElement("script");
        glowScript.src = "https://www.googletagmanager.com/gtag/js?id=G-LB4FV46CJK";
        glowScript.async = true;

        document.body.appendChild(glowScript);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-LB4FV46CJK');
    }
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

    window.location.href = "game.html";
}