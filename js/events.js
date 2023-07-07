
/*I tried to keep event based stuff together here, but some just make more
sense to be elsewhere in the program. e.g. cnvGuess stuff is here becasue I feel it
would take up too much space in main, whereas the guess image onload is in main
because its more related to stuff there and isn't that big*/

var guessImageDragging = false;

cnvGuess.addEventListener("mousedown", (event) => {
    if (!guessImageLoaded) return;

    pzGuessImage.mouseDown(event);
    if (currentGameState == gameStates.GUESSING || currentGameState == gameStates.WAITING_NEXT_ROUND) cnvGuess.style.cursor = "grabbing";
    guessImageDragging = true;
});

cnvGuess.addEventListener("wheel", (event) => {
    if (!guessImageLoaded) return;

    event.stopPropagation();
    event.preventDefault();
    pzGuessImage.scrolled(event);
    requestAnimationFrame(drawGuessImage);
});

cnvGuess.addEventListener("mouseenter", () => {
    if (currentGameState == gameStates.GUESSING || currentGameState == gameStates.WAITING_NEXT_ROUND)
    {
        if (guessImageDragging) cnvGuess.style.cursor = "grabbing";
        else cnvGuess.style.cursor = "grab";
    }
    else
    {
        cnvGuess.style.cursor = "default";
    }
});

//Automatically try to show the image again if it became ready during the transition away
cnvGuess.addEventListener("transitionend", (event) => {
    if (event.propertyName == "opacity" && window.getComputedStyle(cnvGuess).opacity == "0" && currentGameState == gameStates.GUESSING)
    {
        showGuessImage();
    }
});

window.addEventListener("mousemove", (event) => {
    if (guessImageDragging)
    {
        pzGuessImage.mouseMoved(event);
        requestAnimationFrame(drawGuessImage);
    }
});

window.addEventListener("mouseup", (event) => {
    if (guessImageDragging)
    {
        pzGuessImage.mouseUp(event);
        guessImageDragging = false;
        if (currentGameState == gameStates.GUESSING || currentGameState == gameStates.WAITING_NEXT_ROUND) cnvGuess.style.cursor = "grab";
    }
});

window.addEventListener("keyup", (event) => {
    //change to a switch if more keys get added
    if (event.key == "Shift") pipToggleVisible();
    else if (event.key == " ")
    {
        if (window.getComputedStyle(btnConfirmGuess).display == "block" && !btnConfirmGuess.disabled)
        {
            confirmGuess();

            /*block space from clicking a focused element only if it is likely the player wants
            to use space to for a shortcut (though i doubt anyone would be playing keyboard
            only and need to click with it)*/
            event.preventDefault();
        }
        else if (window.getComputedStyle(btnNextRound).display == "block")
        {
            nextRound();
            event.preventDefault();
        }
    }
});

window.addEventListener("keypress", (event) => {
    if (event.key == " ")
    {
        if ((window.getComputedStyle(btnConfirmGuess).display == "block" && !btnConfirmGuess.disabled) || window.getComputedStyle(btnNextRound).display == "block" )
        {
            //see keyup event, need to block both that and keypress
            event.preventDefault();
        }
    }
});

window.addEventListener("beforeunload", (event) => {
    /*for the specific case of played game -> repeated game -> left half way through,
    so the stored roundOffset isnt half way through the repeated game when they come back.
    doesn't matter if activated in other conditions, roundOffset will already be maxOffset*/    
    
    //fix annoying issue from moving localstorage to its own json that no one would ever encounter unless deliberately trying to break things
    if (localStorage.getItem("fallout4guesser") != null) setLocalStorage("roundOffset", maxOffset);
});


/*right this is probably a terrible way of doing things, but basically i want
to restrict what can be typed into the boxes so it's obvious and nice to deal with
when the player enters unacceptable values, and they are automatically fitted to
the limit they exceed. see customInput.js*/
let inputs = document.getElementsByTagName("input");

for (let i = 0; i < inputs.length; i++)
{
    //only want to set these events for the text inputs in the custom settings area
    if (inputs[i].type != "text" || inputs[i].id == "shareCodeInput") continue;

    inputs[i].addEventListener("keypress", (event) => {
        event.preventDefault();
        validateInput(event);
        validateRange(event, event.target.min, event.target.max);
    });

    inputs[i].addEventListener("paste", (event) => {
        event.preventDefault();
        validatePaste(event);
        validateRange(event, event.target.min, event.target.max);
    });

    inputs[i].addEventListener("focusout", (event) => {
        validateOnDefocus(event);
    });
}

let selects = document.getElementsByTagName("select");

for (let i = 0; i < selects.length; i++)
{
    selects[i].addEventListener("change", (event) => updateDifficultySelects(event));
}

let inpShareCode = document.getElementById("shareCodeInput");

inpShareCode.addEventListener("keyup", () => {
    readGameCode();
});