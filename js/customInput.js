
let paramRounds = document.getElementById("paramRounds");
let paramTimeLimit = document.getElementById("paramTimeLimit");
let paramMinScore = document.getElementById("paramMinScore");
let paramMinDifficulty = document.getElementById("paramMinDifficulty");
let paramMaxDifficulty = document.getElementById("paramMaxDifficulty");
let paramMode = document.getElementById("paramMode");
let paramSeed = document.getElementById("paramSeed");

function validateInput(event)
{
    //is the inputted value a number

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
    //is the inputted value within the correct range

    /*for the current text-based inputs, 0 is invalid or special, and will want
    to change to some default value (e.g. unlimited for rounds and time limits)*/
    if (parseInt(event.target.value) == 0)
    {
        event.target.value = "";
        return;
    }

    if (parseInt(event.target.value) > parseInt(max))
    {
        event.target.value = max;
        return;
    }
    
    if (parseInt(event.target.value) <= parseInt(min))
    {
        event.target.value = min;
        return;
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

function validateOnDefocus(event)
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

    //save some typing and space
    let vMin = paramMinDifficulty.value;
    let vMax = paramMaxDifficulty.value;

    /*when a select is changed, go through the other select and disable the values
    which would no longer be valid (e.g. max being 0 and min being 2, there are
    no solutions)*/
    if (event.target == paramMinDifficulty)
    {
        for (let i = 0; i < paramMaxDifficulty.children.length; i++)
        {
            paramMaxDifficulty.children[i].disabled = (i < vMin);
        }
    }

    if (event.target == paramMaxDifficulty)
    {
        for (let i = 0; i < paramMinDifficulty.children.length; i++)
        {
            paramMinDifficulty.children[i].disabled = (i > vMax);
        }
    }
}

function readGameCode()
{
    /*read the code from the input, check its valid, and if so update the inputs
    to match it so its clear to the user its been applied*/

    let code = inpShareCode.value;

    //cant be invalid if theres no code (also no point in running checks if it empty)
    if (code == "")
    {
        inpShareCode.setCustomValidity("");
        inpShareCode.reportValidity();
        inpShareCode.style.borderBottom = "solid rgb(20, 255, 23) 3px";
        return;
    }

    let codeParts = ["", "", "", "", "", "", ""];
    let leadingZeros = {"a": 1, "b": 2, "c": 3};
    let p = 1;

    codeParts[0] = parseInt(code[0]);
    code = code.slice(1);

    while (code.length)
    {
        if (p < 4)
        {
            if (code[0] == "0")
            {
                //this item is 0
                codeParts[p] = 0;
                code = code.slice(1);
                p++;
                continue;
            }

            let pe; //part end
            if (p == 3) pe = 4;
            else pe = 3;
    
            let lz = leadingZeros[code[0]];
            if (lz)
            {
                code = code.slice(1);
                codeParts[p] = parseInt(code.slice(0, pe - lz));
                code = code.slice(pe - lz);
            }
            else
            {
                codeParts[p] = parseInt(code.slice(0, pe));
                code = code.slice(pe);
            }
    
            p++;
        }
        else if (p == 4)
        {
            codeParts[p] = Math.floor(parseInt(code[0]) / 3);
            codeParts[p+1] = (parseInt(code[0]) % 3);
            code = code.slice(1);
            p += 2;
        }
        else if (p == 6)
        {
            codeParts[p] = parseInt(code, 16);
            code = "";
        }
    }

    /*basically is every code section valid. I would split this to another function
    but then all the code slices need to be redone or sent as parameters or a json and meh*/
    if (!(
        (codeParts[0] == 0 || codeParts[0] == 1)
        && validateSCVal(codeParts[1], paramRounds)
        && validateSCVal(codeParts[2], paramTimeLimit)
        && validateSCVal(codeParts[3], paramMinScore)
        && validateSCDifficulty(codeParts[4])
        && validateSCDifficulty(codeParts[5])
        && codeParts[4] <= codeParts[5]
        && validateSCVal(codeParts[6], paramSeed)
        ))
    {
        //code is invalid
        inpShareCode.setCustomValidity("Invalid Code");
        inpShareCode.reportValidity();
        inpShareCode.style.borderBottom = "solid rgb(225, 93, 61) 3px";
        return;
    }

    //code is valid
    inpShareCode.setCustomValidity("");
    inpShareCode.reportValidity();
    inpShareCode.style.borderBottom = "solid rgb(20, 255, 23) 3px";

    //update inputs to match code
    paramMode.value = codeParts[0];
    paramRounds.value = (codeParts[1] == 0 ? "" : codeParts[1]);
    paramTimeLimit.value = (codeParts[2] == 0 ? "" : codeParts[2]);
    paramMinScore.value = (codeParts[3] == 0 ? "" : codeParts[3]);
    paramMinDifficulty.value = codeParts[4];
    paramMaxDifficulty.value = codeParts[5];
    paramSeed.value = codeParts[6];
}

function validateSCVal(val, param)
{
    /*pretty much the same as validate range, but for sharecode input rather than
    direct input to the box. I just found it easier to have them separate like this
    so I can reject a code for being invalid without affecting any of the inputs
    parseInt here since the if statement is big enough already
    js is made by satan for letting you compare a string of a number to a number
    (but at least it saves some code i guess)*/
    return val >= param.min && val <= param.max;
}

function validateSCDifficulty(val)
{
    return val >= 0 && val <= 2;
}