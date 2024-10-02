const gameModeTypes = Object.freeze({
    NORMAL: 0,
    ENDLESS: 1,
    SURVIVAL: 2,
    CUSTOM_NORMAL: 3,
    CUSTOM_SURVIVAL: 4
});

const gpNormal = {
    type: gameModeTypes.NORMAL,
    rounds: 5,
    timeLimit: 90,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    seed: 0,
    roundOffset: 0,
    showRemainingRounds: true,
    isCustom: false,

    manageSeed(repeat)
    {
        //using seed in localstorage
        if (repeat)
        {
            //clicked "repeat game" at end of previous one, so want to have the same images as before
            setLocalStorage("roundOffset", getLocalStorage("roundOffset") - gameParameters.rounds);
            gameParameters.roundOffset = getLocalStorage("roundOffset");
        }
        else
        {
            //not repeating a game, want new images
            setLocalStorage("roundOffset", maxOffset);
            gameParameters.roundOffset = maxOffset;
        }

        gameParameters.seed = getLocalStorage("seed");
    },

    modeConfirmGuess()
    {
        roundsRemaining--;
    },

    getScore(dist)
    {
        return getScoreNormal(dist);
    },

    checkGameOvers()
    {
        if (roundsRemaining <= 0)
        {
            //completed the number of rounds the game was set to
            gameOver(gameOverTypes.COMPLETED_ROUNDS_NORMAL);
        }
    }
};

const gpEndless = {
    type: gameModeTypes.ENDLESS,
    rounds: 0,
    timeLimit: 0,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    seed: 0,
    roundOffset: 0,
    showRemainingRounds: false,
    isCustom: false,

    manageSeed(repeat)
    {
        //using seed in localstorage
        if (repeat)
        {
            //clicked "repeat game" at end of previous one, so want to have the same images as before
            setLocalStorage("roundOffset", getLocalStorage("roundOffset") - gameParameters.rounds);
            gameParameters.roundOffset = getLocalStorage("roundOffset");
        }
        else
        {
            //not repeating a game, want new images
            setLocalStorage("roundOffset", maxOffset);
            gameParameters.roundOffset = maxOffset;
        }

        gameParameters.seed = getLocalStorage("seed");
    },

    modeConfirmGuess()
    {
        //nothing specific to check in endless
    },

    getScore(dist)
    {   
        return getScoreNormal(dist);
    },

    checkGameOvers()
    {
        //endless mode can't game over
    }
};

const gpSurvival = {
    type: gameModeTypes.SURVIVAL,
    rounds: -1,
    timeLimit: 0,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    seed: 0,
    roundOffset: 0,
    showRemainingRounds: false,
    isCustom: false,

    updateRoundMax(num)
    {
        this.rounds = num;
    },

    manageSeed(repeat)
    {
        if (!repeat)
        {
            //using specific seed, not from localstorage
            if (!firstGame)
            {
                //new game not wanting repeat
                gameParameters.seed = generateSeed();
            }
            else
            {
                //first game being played, seed was not set by options in initialisation, so a random one is desired
                if (gameParameters.seed == "" || gameParameters.seed == 0) gameParameters.seed = generateSeed();
            }
        }
    },

    modeConfirmGuess(score, gamer)
    {
        confirmGuessSurvival(score, gamer);
    },

    getScore(dist)
    {
        return getScoreSurvival(dist);
    },

    checkGameOvers()
    {
        if (survivalRemainingScore <= 0)
        {
            //score decayed to 0
            gameOver(gameOverTypes.FAILED_SCOREDRAIN);
            return;
        }

        if (roundsRemaining <= 0)
        {
            //completed all survival rounds
            gameOver(gameOverTypes.COMPLETED_ROUNDS_SURVIVAL);
        }
    }
};

let gpCustom = {
    type: gameModeTypes.NORMAL,
    rounds: 5,
    timeLimit: 60,
    minPassingScore: 0,
    minDifficulty: 0,
    maxDifficulty: 2,
    seed: 0,
    roundOffset: 0,
    showRemainingRounds: true,
    isCustom: true,

    manageSeed(repeat)
    {
        if (!repeat)
        {
            //using specific seed, not from localstorage
            if (!firstGame)
            {
                //new game not wanting repeat
                gameParameters.seed = generateSeed();
            }
            else
            {
                //first game being played, seed was not set by options in initialisation, so a random one is desired
                if (gameParameters.seed == "" || gameParameters.seed == 0) gameParameters.seed = generateSeed();
            }
        }
    },

    modeConfirmGuess(score, gamer)
    {
        if (this.type == gameModeTypes.SURVIVAL)
        {
            confirmGuessSurvival(score, gamer);
        }
        else
        {
            roundsRemaining--;
        }
    },

    getScore(dist)
    {
        switch (this.type)
        {
            case gameModeTypes.NORMAL:
                return getScoreNormal(dist);
            
            case gameModeTypes.SURVIVAL:
                return getScoreSurvival(dist);

            default:
                return 0;
        }
    },

    checkGameOvers(score)
    {
        if (this.type == gameModeTypes.NORMAL)
        {
            if (roundsRemaining <= 0)
            {
                //completed the number of rounds the game was set to
                gameOver(gameOverTypes.COMPLETED_ROUNDS_NORMAL);
            }
        }

        if (this.type == gameModeTypes.SURVIVAL)
        {
            if (survivalRemainingScore <= 0)
            {
                //score decayed to 0
                gameOver(gameOverTypes.FAILED_SCOREDRAIN);
                return;
            }
    
            if (roundsRemaining <= 0)
            {
                if (this.rounds == gpSurvival.rounds)
                {
                    //completed all survival rounds
                    gameOver(gameOverTypes.COMPLETED_ROUNDS_SURVIVAL);
                }
                else
                {
                    //completed the number of rounds the game was set to
                    gameOver(gameOverTypes.COMPLETED_ROUNDS_NORMAL);
                }
                
            }
        }

        if (score < gameParameters.minPassingScore)
        {
            //didn't get enough points to pass the round
            gameOver(gameOverTypes.FAILED_MINSCORE);
            return;
        }
    }
};

function getScoreNormal(dist)
{
        /*Score on a curve which seemed about reasonable for how difficult I want it to be
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
        
        const SCORE_STRICTNESS = -3.9;
        const a = -(MAX_SCORE + 495 * SCORE_STRICTNESS) / 249975;
        const c = MAX_SCORE - PERFECT_DIST * PERFECT_DIST * a - PERFECT_DIST * SCORE_STRICTNESS;

        let score = a * dist * dist + SCORE_STRICTNESS * dist + c;
        score = Math.floor(Math.max(Math.min(MAX_SCORE, score), 0)); //constrain score between 0 and maxscore

        return score;
}

function getScoreSurvival(dist)
{
    //stricter than normal scoring. score drops to 0 at 100 metres, and decays more steeply
    //see normal scoring function for details
    const SCORE_STRICTNESS = -10;
    const a = -(MAX_SCORE + 95 * SCORE_STRICTNESS) / 9975;
    c = MAX_SCORE - PERFECT_DIST * PERFECT_DIST * a - PERFECT_DIST * SCORE_STRICTNESS;
    
    let score = a * dist * dist + SCORE_STRICTNESS * dist + c;
    score = Math.floor(Math.max(Math.min(MAX_SCORE, score), 0)); //constrain score between 0 and maxscore

    return score;
}

function confirmGuessSurvival(score, gamer)
{
    uipCurrentScore.element.innerHTML = "Score: " + survivalRemainingScore + " + " + score;
    survivalRemainingScore += score;
    if (survivalRemainingScore > survivalPeakScore) survivalPeakScore = survivalRemainingScore;
    if (gamer) scoreDecayPerSecond = 100; //reset score decay rate as reward for good guess
    else scoreDecayPerSecond = Math.min(scoreDecayPerSecond + 50, 750);
    roundsRemaining--;
}
