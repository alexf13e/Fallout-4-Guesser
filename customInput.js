
var paramRounds = document.getElementById("paramRounds");
var paramTimeLimit = document.getElementById("paramTimeLimit");
var paramMinScore = document.getElementById("paramMinScore");
var paramMinDifficulty = document.getElementById("paramMinDifficulty");
var paramMaxDifficulty = document.getElementById("paramMaxDifficulty");
var paramSeed = document.getElementById("paramSeed");

function validateInput(event)
{
    //https://stackoverflow.com/questions/7295843/allow-only-numbers-to-be-typed-in-a-textbox
    event = (event) ? event : window.event;
    let charCode = (event.which) ? event.which : event.keyCode;
    let oldValue = event.target.value;
    let oldSelection = event.target.selectionStart;

    if (!(charCode > 31 && (charCode < 48 || charCode > 57)))
    {
        event.target.value = oldValue.slice(0, event.target.selectionStart) + 
        String.fromCharCode(charCode) + oldValue.slice(event.target.selectionStart);
        event.target.selectionStart = oldSelection + 1;
        event.target.selectionEnd = event.target.selectionStart;
        event.target.setCustomValidity("");
        event.target.reportValidity();
    }
    else
    {
        event.target.setCustomValidity("Please only enter numbers");
        event.target.reportValidity();
    }
}

function validateRange(event, min, max)
{
    if (parseInt(event.target.value) == 0)
    {
        event.target.value = "";
    }

    if (parseInt(event.target.value) > parseInt(max))
    {
        event.target.value = max;
    }
    
    if (parseInt(event.target.value) <= parseInt(min))
    {
        event.target.value = min;
    }
}

function validatePaste(event)
{
    let input = (event.clipboardData || window.clipboardData).getData('text');
    let output = "";

    for (let i = 0; i < input.length; i++)
    {
        let charCode = input.charCodeAt(i);
        if (charCode > 31 && (charCode < 48 || charCode > 57))
        {
            //character not a number, abort paste
            event.target.setCustomValidity("Please only enter numbers");
            event.target.reportValidity();
            return;
        }

        output += String.fromCharCode(charCode);
    }

    //reached the end with only valid characters, ok to update input box
    event.target.value = output;
}

function validateDeselect(event)
{
    let value = event.target.value;
    for (let i = 0; i < value.length; i++)
    {
        let charCode = value.charCodeAt(i);
        if (charCode > 31 && (charCode < 48 || charCode > 57))
        {
            //character not a number, abort paste
            event.target.setCustomValidity("Please only enter numbers");
            event.target.reportValidity();
            return;
        }
    }

    event.target.setCustomValidity("");
    event.target.reportValidity();    
}

function updateDifficultySelects(event)
{
    //min difficulty can only show values less or equal to max difficulty
    //max difficulty can only show values more or equal to min difficulty
    let minValue = paramMinDifficulty.value;
    let maxValue = paramMaxDifficulty.value;

    if (event.target == paramMinDifficulty)
    {
        for (let i = 0; i < 3; i++)
        {
            paramMaxDifficulty.children[i].disabled = (i < minValue);
        }
    }

    if (event.target == paramMaxDifficulty)
    {
        for (let i = 0; i < 3; i++)
        {
            paramMinDifficulty.children[i].disabled = (i > maxValue);
        }
    }
}

function readShareCode()
{
    let code = inpShareCode.value;

    if (code == "")
    {
        inpShareCode.setCustomValidity("");
        inpShareCode.reportValidity();
        inpShareCode.style.borderBottom = "solid rgb(20, 255, 23) 3px";
        return;
    }

    if (!validateShareCode(code))
    {
        inpShareCode.setCustomValidity("Invalid Code");
        inpShareCode.reportValidity();
        inpShareCode.style.borderBottom = "solid rgb(225, 93, 61) 3px";
        return;
    }

    //Sharecode is valid
    inpShareCode.setCustomValidity("");
    inpShareCode.reportValidity();
    inpShareCode.style.borderBottom = "solid rgb(20, 255, 23) 3px";

    paramRounds.value = (parseInt(codeRounds) == 0 ? "" : parseInt(codeRounds).toString()); //get rid of extra 0s
    paramTimeLimit.value = (parseInt(codeTimeLimit) == 0 ? "" : parseInt(codeTimeLimit).toString());
    paramMinScore.value = (parseInt(codeMinScore) == 0 ? "" : parseInt(codeMinScore).toString());
    paramMinDifficulty.value = parseInt(codeMinDifficulty);
    paramMaxDifficulty.value = parseInt(codeMaxDifficulty);
    paramSeed.value = parseInt(codeSeed).toString();
}

function validateShareCode(code)
{
    let codeRounds = code.slice(0, 3);
    let codeTimeLimit = code.slice(3, 6);
    let codeMinScore = code.slice(6, 10);
    let codeMinDifficulty = code.slice(10, 11);
    let codeMaxDifficulty = code.slice(11, 12);
    let codeSeed = code.slice(12, 22);

    //True when share code is valid
    return (code.length == 22
        && validateSCVal(codeRounds, paramRounds)
        && validateSCVal(codeTimeLimit, paramTimeLimit)
        && validateSCVal(codeMinScore, paramMinScore)
        && validateSCDifficulty(codeMinDifficulty)
        && validateSCDifficulty(codeMaxDifficulty)
        && codeMinDifficulty <= codeMaxDifficulty
        && validateSCVal(codeSeed, paramSeed));
}

function validateSCVal(val, param)
{
    return parseInt(val) >= parseInt(param.min) && parseInt(val) <= parseInt(param.max);
}

function validateSCDifficulty(val)
{
    return parseInt(val) >= 0 && parseInt(val) <= 2;
}