
const statFormattingTypes = Object.freeze({
    NONE: 0,
    DISTANCE: 1,
    TIME: 2
});

const statsVersion = 1;
const defaultStats = {
    version: 1,
    general: {
        roundsPlayed: {
            name: "Rounds played",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        totalScore: {
            name: "Total score",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        highestRoundScore: {
            name: "Highest score in one round",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        averageRoundScore: {
            name: "Average score per round",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        perfectScores: {
            name: "Perfect scores",
            value: 0,
            formatting: statFormattingTypes.NONE
        },
        
        specialScores: {
            name: "Special scores",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        totalGuessDist: {
            name: "Total distance from correct locations",
            value: 0,
            formatting: statFormattingTypes.DISTANCE
        },

        closestGuessDist: {
            name: "Closest guess distance",
            value: null,
            formatting: statFormattingTypes.DISTANCE
        },
        
        timePlayed: {
            name: "Time played",
            value: 0,
            formatting: statFormattingTypes.TIME
        },

        quickestRound: {
            name: "Quickest round",
            value: null,
            formatting: statFormattingTypes.TIME
        }
    },

    normal: {
        gamesCompleted: {
            name: "Games completed",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        highestGameScore: {
            name: "Highest score in one game",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        perfectGames: {
            name: "Perfect games",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        timePlayed: {
            name: "Time played",
            value: 0,
            formatting: statFormattingTypes.TIME
        },

        quickestGame: {
            name: "Quickest game",
            value: null,
            formatting: statFormattingTypes.TIME
        }
    },

    endless: {
        roundsPlayed: {
            name: "Rounds played",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        timePlayed: {
            name: "Time played",
            value: 0,
            formatting: statFormattingTypes.TIME
        }
    },

    survival: {
        highestRoundSurvived: {
            name: "Highest round survived",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        totalRoundsSurvived: {
            name: "Total rounds survived",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        totalScore: {
            name: "Total score",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        averageRoundScore: {
            name: "Average score per round",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        highestPeakScore: {
            name: "Highest peak score",
            value: 0,
            formatting: statFormattingTypes.NONE
        },
        
        deaths: {
            name: "Number of deaths",
            value: 0,
            formatting: statFormattingTypes.NONE
        },

        timePlayed: {
            name: "Time played",
            value: 0,
            formatting: statFormattingTypes.TIME
        },
        
        cars: {
            name: "Brand new cars",
            value: 0,
            formatting: statFormattingTypes.NONE
        }
    },

    previousGameCodes: {
        name: "Previous game codes (newest at top)",
        value: []
    },

    rating: {
        xp: 0,
        level: 1,
        title: "Radroach",
        legendary: false
    }
};

let playerStats = getLocalStorage("playerStats");
if (!playerStats)
{
    //No stored stats, generate default ones
    //null values aren't valid yet  (e.g. min distance would have to start at infinity, would look weird when displayed)
    playerStats = {};
    Object.assign(playerStats, defaultStats);

    setLocalStorage("playerStats", playerStats);
}

if (playerStats.version != statsVersion)
{
    /*go through playerStats and add ones which are missing.
    i'll figure this out when theres actually some to add.
    
    desiredStats = *ordered list of stats that should exist*
    dsi = 0 //index for desired stats list
    psi = 0 //index for player stats list

    while (dsi < desiredStats.length)
    {
        if (playerStats[psi] != desiredStats[dsi])
        {
            playerStats.insert(psi - 1, desiredStats[dsi])
            dsi++
            continue
        }

        dsi++
        psi++
    }

    playerStats.version = statsVersion
    */
}

const ratingTitles = [
    "Radroach",
    "Molerat",
    "Wild Mongrel",
    "Feral Ghoul",
    "Feral Ghoul Roamer",
    "Feral Ghoul Reaver",
    "Raider",
    "Raider Psycho",
    "Raider Scavver",
    "Super Mutant",
    "Super Mutant Brute",
    "Super Mutant Butcher",
    "Minuteman",
    "Minuteman Lieutenant",
    "Minuteman General",
    "Gunner",
    "Guner Private",
    "Gunner Sergent",
    "Synth",
    "Synth Patroller",
    "Synth Seeker",
    "Brotherhood Scribe",
    "Brotherhood Knight",
    "Brotherhood Paladin",
    "Mr Gutsy",
    "Sentrybot",
    "Assaultron",
    "Courser",
    "Sole Survivor"
];

function statsCalculateXp(score, dist)
{
    /*
    level based on rounds played:
        points scaled partially on score (e.g. 5000 points = 1x, 2500 = 0.75x, 0 = 0.25x, 5001 = 1.25x)
        100 + (20 * level) points per level:
        30 points per normal round
        20 points per endless round
        50 points per survival round
        10 points per custom round
    */

    //no guess made, give them 1 pity xp
    if (dist == null) return 1;

    let xp;
    switch (gameParameters.type)
    {
        case gameModeTypes.NORMAL:
            xp = 30;
            break;
        
        case gameModeTypes.ENDLESS:
            xp = 20;
            break;

        case gameModeTypes.SURVIVAL:
            xp = 50;
            break;
    }

    if (score == 5001) xp *= 1.25;
    else
    {
        //map score of 0-5000 to multiplier of 0.25-1
        xp *= 0.25 + 0.75 * score / 5000;
    }

    return xp;
}

function statsCalculateLevel(xp)
{
    /*
    100 + (20 * level) points per level
    want level 1 to require 0 total xp, 2 = 120, 3 = 260, 4 = 420 etc.
    total xp = 10 * level^2 + 90 * level - 100
    level = sqrt((xp + 100) / 10 + 20.25) - 4.5
    level is int, so take floor
    */

    let level = Math.sqrt((xp + 100) / 10 + 20.25) - 4.5;
    return Math.floor(level);
}

function statsCalculateXpForLevel(level)
{
    return 10 * level * level + 90 * level - 100;
}

function statsCalculateTitle()
{
    //name based on perfect scores (every 5 is the next title), see ratingTitles  

    //find the closest title below current amount of perfect scores
    let ps = Math.floor(playerStats.general.perfectScores.value / 5);
    if (ps > ratingTitles.length - 1) ps = ratingTitles.length - 1; 

    return ratingTitles[ps];
}

function statsUpdateRound(roundScore, dist, roundTime)
{
    if (!(gameParameters.type == gameModeTypes.SURVIVAL))
    {
        /*survival has different scoring and is more about getting good-enough
        guesses quickly rather than perfect ones, so don't alter general score
        stats if in survival*/
        playerStats.general.roundsPlayed.value++;
        playerStats.general.totalScore.value += roundScore;
        if (roundScore > playerStats.general.highestRoundScore.value) playerStats.general.highestRoundScore.value = roundScore;
        playerStats.general.averageRoundScore.value = (playerStats.general.totalScore.value / Math.max(playerStats.general.roundsPlayed.value, 1)).toFixed(2);
    }

    if (roundScore >= 5000) playerStats.general.perfectScores.value++;
    if (roundScore == 5001) playerStats.general.specialScores.value++;

    if (dist != null)
    {
        playerStats.general.totalGuessDist.value += dist;
        if (!playerStats.general.closestGuessDist.value || dist < playerStats.general.closestGuessDist.value) playerStats.general.closestGuessDist.value = dist;
    }
    
    playerStats.general.timePlayed.value += roundTime;
    if (!playerStats.general.quickestRound.value || roundTime < playerStats.general.quickestRound.value) playerStats.general.quickestRound.value = roundTime;

    switch (gameParameters.type)
    {
        case gameModeTypes.NORMAL:
            playerStats.normal.timePlayed.value += roundTime;
            break;
        
        case gameModeTypes.ENDLESS:
            playerStats.endless.roundsPlayed.value++;
            playerStats.endless.timePlayed.value += roundTime;
            break;
        
        case gameModeTypes.SURVIVAL: //preset survival mode only, not custom
            if (roundNumber > playerStats.survival.highestRoundSurvived.value && gameOverStatus != gameOverTypes.FAILED_SCOREDRAIN) playerStats.survival.highestRoundSurvived.value = roundNumber;
            playerStats.survival.totalRoundsSurvived.value++;
            playerStats.survival.totalScore.value += roundScore;
            playerStats.survival.averageRoundScore.value = (playerStats.survival.totalScore.value / Math.max(playerStats.survival.totalRoundsSurvived.value, 1)).toFixed(2);
            if (survivalPeakScore > playerStats.survival.highestPeakScore.value) playerStats.survival.highestPeakScore.value = survivalPeakScore;
            playerStats.survival.timePlayed.value += roundTime;
            break;
    }

    let prevLegendary = playerStats.rating.legendary;
    playerStats.rating.legendary = playerStats.general.specialScores.value >= 30;
    playerStats.rating.xp += statsCalculateXp(roundScore, dist);
    
    let prevLevel = playerStats.rating.level;
    playerStats.rating.level = statsCalculateLevel(playerStats.rating.xp);

    let prevTitle = playerStats.rating.title;
    playerStats.rating.title = statsCalculateTitle();

    if (prevLegendary != playerStats.rating.legendary ||
        prevLevel != playerStats.rating.level ||
        prevTitle != playerStats.rating.title)
            showPromotionMessage = true;

    setLocalStorage("playerStats", playerStats);
}

function statsUpdateGame(gameScore, gameTime)
{
    if (gameParameters.type == gameModeTypes.NORMAL)
    {
        playerStats.normal.gamesCompleted.value++;
        if (gameScore > playerStats.normal.highestGameScore.value) playerStats.normal.highestGameScore.value = gameScore;
        if (gameScore >= MAX_SCORE * 5) playerStats.normal.perfectGames.value++;
        if (!playerStats.normal.quickestGame.value || gameTime < playerStats.normal.quickestGame.value) playerStats.normal.quickestGame.value = gameTime;
    }

    if (gameOverStatus == gameOverTypes.FAILED_SCOREDRAIN || gameOverStatus == gameOverTypes.FAILED_MINSCORE) playerStats.survival.deaths.value++;
    if (gameOverStatus == gameOverTypes.COMPLETED_ROUNDS_SURVIVAL) playerStats.survival.cars.value++;

    setLocalStorage("playerStats", playerStats);
}

function statsAddGameCode(code)
{
    //store last 5 game codes, most recent is first item in array.
    //dont add if it is the same as the most recent
    if (code != playerStats.previousGameCodes.value[0])
    {
        playerStats.previousGameCodes.value.unshift(code);
        if (playerStats.previousGameCodes.value.length > 5) playerStats.previousGameCodes.value.pop();
        setLocalStorage("playerStats", playerStats);
    }
}

function statsCreateP(text)
{
    let p = document.createElement("p");
    p.textContent = text;
    p.classList.add("statText");
    return p;
}

function statsCreateSection(title, section)
{
    let heading = statsCreateP(title);
    heading.classList.remove("statText");
    heading.classList.add("statHeading");
    uiScreenStats.element.appendChild(heading);

    let dvStatSection = document.createElement("div");
    dvStatSection.classList.add("statSection");
    uiScreenStats.element.appendChild(dvStatSection);

    for (let key in section)
    {
        let stat = section[key];
        let text;

        if (stat.value == null) text = "N/A";
        else
        {
            switch(stat.formatting)
            {
                case statFormattingTypes.DISTANCE:
                    text = formatDistance(stat.value);
                    break;

                case statFormattingTypes.TIME:
                    text = formatTimeString(stat.value);
                    break;

                default:
                    text = stat.value;
            }
        }

        dvStatSection.appendChild(statsCreateP(stat.name));
        dvStatSection.appendChild(statsCreateP(text));
    }
}

function statsGenerateScreen()
{
    /*easier to just regenerate the stats screen when opened than to track and
    update each element to match the stat it displays*/

    uiScreenStats.element.replaceChildren();

    const dvTitle = document.createElement("div");
    const pTitle = document.createElement("p");

    dvTitle.classList.add("statTitle");
    pTitle.innerHTML = (playerStats.rating.legendary ? "★ " : "") + playerStats.rating.title;
    dvTitle.appendChild(pTitle);
    const xpBar = createXPBar();
    xpBar.classList.remove("xpBarOuter");
    xpBar.classList.add("xpBarOuterStats");
    dvTitle.appendChild(xpBar);
    uiScreenStats.element.appendChild(dvTitle);


    const dvCodeSection = document.createElement("div");
    dvCodeSection.classList.add("statSection");
    
    dvCodeSection.appendChild(statsCreateP("Previous game codes (newest at top)"));
    
    if (playerStats.previousGameCodes.value.length == 0)
    {
        dvCodeSection.appendChild(statsCreateP("N/A"));
    }
    else
    {
        const dvCodes = document.createElement("div");
        for (let code of playerStats.previousGameCodes.value)
        {
            dvCodes.appendChild(statsCreateP(code));
        }
        
        dvCodeSection.appendChild(dvCodes);
    }

    uiScreenStats.element.appendChild(dvCodeSection);

    statsCreateSection("General", playerStats.general);
    statsCreateSection("Normal", playerStats.normal);
    statsCreateSection("Endless", playerStats.endless);
    statsCreateSection("Survival", playerStats.survival);
}