var guessImageDragging = false;

cnvGuess.addEventListener("mousedown", (event) => {
    if (!guessImageLoaded) return;

    pzGuessImage.mouseDown(event);
    if (playerReady) cnvGuess.style.cursor = "grabbing";
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
    if (playerReady)
    {
        if (guessImageDragging) cnvGuess.style.cursor = "grabbing";
        else cnvGuess.style.cursor = "grab";
    }
});

cnvGuess.addEventListener("mouseleave", () => {
    if (guessImageDragging && playerReady) document.body.style.cursor = "grabbing";
});

//Automatically try to show the image again if it became ready during the transition away
cnvGuess.addEventListener("transitionend", (event) => {
    if (event.propertyName == "opacity" && window.getComputedStyle(cnvGuess).opacity == "0" && !gameEnded)
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
        document.body.style.cursor = "default";
        if (playerReady) cnvGuess.style.cursor = "grab";
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key == "Shift") pipToggleVisible();
    if (event.key == " ")
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


/*right this is probably a terrible way of doing things, but basically i want
to restrict what can be typed into the boxes so it's obvious and nice to deal with
when the player enters unacceptable values, and they are automatically fitted to
the limit they exceed. see customInput.js*/
let inputs = document.getElementsByTagName("input");

for (let i = 0; i < inputs.length; i++)
{
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
        validateDeselect(event);
    });
}

let selects = document.getElementsByTagName("select");

for (let i = 0; i < selects.length; i++)
{
    selects[i].addEventListener("change", (event) => updateDifficultySelects(event));
}

let inpShareCode = document.getElementById("shareCodeInput");

inpShareCode.addEventListener("paste", (event) => {
    if (!validatePaste(event))
    {
        event.preventDefault();
    }
});

inpShareCode.addEventListener("keyup", () => {
    readShareCode();
});