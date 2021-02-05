const mainDiv = document.getElementById("main-div");
const table = document.getElementById("table");


const gameData = [
    [2, 2, 2, 2, 2, 2, 2, 2], //player 0; 00, 01, 02, 03, 04, 05, 06, 07
    [2, 2, 2, 2, 2, 2, 2, 2], //player 0; 15, 14, 13, 12, 11, 10, 09, 08

    [2, 2, 2, 2, 2, 2, 2, 2], //player 1; 15, 14, 13, 12, 11, 10, 09, 08
    [2, 2, 2, 2, 2, 2, 2, 2]  //player 1; 00, 01, 02, 03, 04, 05, 06, 07
    /*
    9,10,14,15 after first round 34, rest 36
     */
];

function generateTable(table, data) {
    for (let i = 0; i < data.length; i++) {
        let row = table.insertRow();

        row.classList.add("row");
        row.classList.add("row-" + i);

        for (let j = 0; j < data[i].length; j++) {
            let cell = row.insertCell();
            const player = i > 1 ? 1 : 0;
            const index = (i === 0 || i === 3) ? j : 16 - j;
            cell.onclick = () => {
                makeMove(data, player, index, true);
            };
            cell.id = `cell-${i}-${j}`;
            cell.innerHTML = data[i][j].toString();

        }
    }
}

function updateTable() {
    for (let i = 0; i < gameData.length; i++) {
        for (let j = 0; j < gameData[i].length; j++) {
            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.innerHTML = gameData[i][j].toString();
        }
    }
}

generateTable(table, gameData);

let currentPlayer;
let okToMove = true;
async function makeMove(data, player, index, display) { //player 0: rows 0,1; player 1: rows 2,3
    console.log(`player: ${player}, index: ${index}`);
    if (display) {
        if (okToMove) {
            if (typeof currentPlayer === "undefined") {
                currentPlayer = player;
            } else if (currentPlayer === player) {
                alert(`Spieler ${player + 1} ist nicht an der Reihe.`);
                return data;
            } else {
                currentPlayer = player;
            }
            okToMove = false;
        } else {
            alert(`Bitte warte. Du bist noch nicht an der Reihe.`)
            return data;
        }
    }
    let first = true;
    while (true) {
        let stoneCount = getStoneCount(data, player, index);
        if (stoneCount < 2 || checkEnd(data) !== -1) {
            if (display) okToMove = true;
            if (display && !first && player === 1 && checkEnd(data) === -1) {
                await doAiMove(0);
            }
            return data;
        }
        setStoneCount(data, player, index, 0);
        await updateGraphic(stoneCount, 500, display);
        if (!first && index > 7) {
            stoneCount += getStoneCount(data, otherPlayer(player), index);
            setStoneCount(data, otherPlayer(player), index, 0);
            await updateGraphic(stoneCount, 500, display);
        }

        while (stoneCount > 0) {
            index = (index + 1) % 16;
            incrementStoneCount(data, player, index, 1);
            stoneCount--;
            await updateGraphic(stoneCount, 500, display);
        }
        first = false;
    }
}

function cloneGameData() {
    return JSON.parse(JSON.stringify(arguments.length === 0 ? gameData : arguments[0]));
}

async function doAiMove(player) {
    const bestTurns = await getBestMoves(gameData, player);
    const bestTurn =  bestTurns[Math.floor(Math.random() * bestTurns.length)];
    await makeMove(gameData, player,bestTurn, true);
}

async function getBestMoves(data, player) {
    let maxVal = -1;
    let bestTurns = [];
    for (let i = 0; i < 16; i++) {
        const val = getStonesOfPlayer(await makeMove(cloneGameData(data), i, player), player);
        if (val > maxVal) {
            maxVal = val;
            bestTurns = [i];
        } else if (val === maxVal) {
            bestTurns.push(i);
        }
    }
    return bestTurns;
}

function getStonesOfPlayer(data, player) {
    let stones = 0;
    for (let i = (player === 0 ? 0 : 2); i < (player === 0 ? 2 : 4); i++) {
        for (const val of gameData[i]) {
            stones += val;
        }
    }
    return stones;
}

async function updateGraphic(stoneCount, waitingTime, display) {
    if (display) {
        displayStonesInHand(stoneCount);
        updateTable();
        await wait(waitingTime);
    }
}

const infoDiv = document.getElementById("info-div");
function displayStonesInHand(stonesInHand) {
    let stones0 = getStonesOfPlayer(gameData, 0);
    let stones1 = getStonesOfPlayer(gameData, 1);
    if (currentPlayer === 0) {
        stones0 += stonesInHand;
    } else {
        stones1 += stonesInHand;
    }
    infoDiv.innerHTML = `Aktueller Spieler: Spieler ${currentPlayer + 1}<br>
    Steine in Hand: ${stonesInHand}<br>
    Steine Spieler 1: ${stones0}<br>
    Steine Spieler 2: ${stones1}<br>`;
}

function checkEnd(data) { //-1 nobody wins; //0 player 1 wins; //1 player 2 wins
    if (checkAllZero(data, 1)) {
        return 1;
    }
    if (checkAllZero(data, 2)) {
        return 0;
    }
    return -1;
}

function checkAllZero(data, rowIndex) {
    for (let i = 0; i < data[rowIndex].length; i++) {
        if (data[rowIndex][i] !== 0) return false;
    }
    return true;
}

async function wait(time) {
    await new Promise(r => setTimeout(r, time));
}

function otherPlayer(player) {
    return (player - 1) * (player - 1);
}


function getArrayIndex(player, index) {
    let row = Math.floor(index / 8);
    if (player === 1) {
        row = 3 - row;
    }
    let cell = index % 8;
    if (row === 1 || row === 2) {
        cell = 7 - cell;
    }
    return [row, cell];
}

function getStoneCount(data, player, index) {
    const arrIndex = getArrayIndex(player, index);
    return data[arrIndex[0]][arrIndex[1]];
}

function setStoneCount(data, player, index, newStoneCount) {
    const arrIndex = getArrayIndex(player, index);
    return data[arrIndex[0]][arrIndex[1]] = newStoneCount;
}

function incrementStoneCount(data, player, index, increment) {
    const arrIndex = getArrayIndex(player, index);
    return data[arrIndex[0]][arrIndex[1]] += increment;
}
