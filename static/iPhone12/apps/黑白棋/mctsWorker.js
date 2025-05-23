self.onmessage = function (e) {
	const { board, isBlackTurn, searchCount, searchDepth, elements } = e.data;

	console.log(`Worker started with search depth ${searchDepth} and count ${searchCount}`);

	const result = runMCTS(board, isBlackTurn, searchCount, searchDepth, elements);

	// 检查 result 是否为 null
	if (result) {
		console.log(`Worker finished with move (${result.row}, ${result.col}) and score ${result.score}`);
		self.postMessage(result);
	} else {
		console.log(`Worker finished but found no valid move.`);
		self.postMessage({ row: -1, col: -1, score: -Infinity }); // 发送一个表示没有有效走法的消息
	}
};

function runMCTS(board, isBlackTurn, searchCount, searchDepth, elements) {
	let maxScore = -Infinity;
	let bestMove = null;

	const startTime = Date.now();
	const timeLimit = 10000; // 设定时间限制

	// 如果没有可落子位置，直接返回
	if (elements.length === 0) {
		return null;
	}

	const cache = new Map();
	const ucbParam = 3;

	// 模拟多次游戏
	while (Date.now() - startTime < timeLimit) {
		for (let i = 0; i < elements.length; i++) {
			const [row, col] = elements[i];
			let score = 0;

			// 复制棋盘状态
			const tempBoard = JSON.parse(JSON.stringify(board));
			// 落子
			putStone(tempBoard, row, col, isBlackTurn);

			// 使用缓存技术存储节点访问次数和得分
			const key = `${row}-${col}`;
			if (!cache.has(key)) {
				cache.set(key, [0, 0]);
			}

			const ucbScores = elements.map(([r, c]) => {
				const k = `${r}-${c}`;
				const [count, s] = cache.get(k) || [0, 0];
				return s / (count || 1) + ucbParam * Math.sqrt(Math.log(i + 1) / (count || 1));
			});

			const maxIndex = ucbScores.reduce((maxIdx, score, idx) => {
				return score > ucbScores[maxIdx] ? idx : maxIdx;
			}, 0);

			const [r, c] = elements[maxIndex];
			const k = `${r}-${c}`;
			const tmpBoard = JSON.parse(JSON.stringify(tempBoard));
			putStone(tmpBoard, r, c, !isBlackTurn);

			const [prevCount, prevScore] = cache.get(k) || [0, 0];
			const newScore = prevScore + MCT(tmpBoard, !isBlackTurn, searchDepth - 1);
			const newCount = prevCount + 1;
			cache.set(k, [newCount, newScore]);

			score = newScore / newCount;

			if (score > maxScore) {
				maxScore = score;
				bestMove = { row, col, score };
			}
		}
	}

	return bestMove;
}

function MCT(board, isBlackTurn, depth) {
	if (depth === 0 || isGameOver(board)) {
		return heuristic(board, isBlackTurn);
	}
	const validCells = getValidCells(board, isBlackTurn);
	if (validCells.length === 0) {
		return MCT(board, !isBlackTurn, depth - 1);
	}

	let maxScore = -Infinity;
	for (const [row, col] of validCells) {
		const tempBoard = JSON.parse(JSON.stringify(board));
		putStone(tempBoard, row, col, isBlackTurn);
		const score = MCT(tempBoard, !isBlackTurn, depth - 1);
		maxScore = Math.max(maxScore, score);
	}
	return maxScore;
}

function heuristic(board, isBlackTurn) {
	const weights = [
		[100, -10, 11, 6, 6, 11, -10, 100],
		[-10, -20, 1, 2, 2, 1, -20, -10],
		[11, 1, 5, 4, 4, 5, 1, 11],
		[6, 2, 4, 2, 2, 4, 2, 6],
		[6, 2, 4, 2, 2, 4, 2, 6],
		[11, 1, 5, 4, 4, 5, 1, 11],
		[-10, -20, 1, 2, 2, 1, -20, -10],
		[100, -10, 11, 6, 6, 11, -10, 100],
	];

	let blackScore = 0;
	let whiteScore = 0;

	// 考虑棋盘位置权重
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			if (board[row][col] === "black") {
				blackScore += weights[row][col];
			} else if (board[row][col] === "white") {
				whiteScore += weights[row][col];
			}
		}
	}

	// 考虑棋子稳定性
	blackScore += countStableStones(board, "black");
	whiteScore += countStableStones(board, "white");

	return isBlackTurn ? blackScore - whiteScore : whiteScore - blackScore;
}

// 计算稳定棋子数量
function countStableStones(board, color) {
	let count = 0;

	// 检查角落棋子
	if (board[0][0] === color) count++;
	if (board[0][7] === color) count++;
	if (board[7][0] === color) count++;
	if (board[7][7] === color) count++;

	// 检查边缘稳定棋子
	for (let i = 1; i < 7; i++) {
		// 检查水平边缘
		if (board[0][i] === color && isStableEdgeLine(board, 0, i, 0, 1, color)) {
			count++;
		}
		if (board[7][i] === color && isStableEdgeLine(board, 7, i, 0, 1, color)) {
			count++;
		}
		// 检查垂直边缘
		if (board[i][0] === color && isStableEdgeLine(board, i, 0, 1, 0, color)) {
			count++;
		}
		if (board[i][7] === color && isStableEdgeLine(board, i, 7, 1, 0, color)) {
			count++;
		}
	}

	return count;
}

// 检查边缘线是否稳定
function isStableEdgeLine(board, row, col, rowIncrement, colIncrement, color) {
	let currentRow = row + rowIncrement;
	let currentCol = col + colIncrement;

	while (currentRow >= 0 && currentRow < 8 && currentCol >= 0 && currentCol < 8) {
		if (board[currentRow][currentCol] !== color) {
			return false;
		}
		currentRow += rowIncrement;
		currentCol += colIncrement;
	}

	return true;
}

// Example implementations of helper functions
function getValidCells(board, isBlackTurn) {
	const validCells = [];
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			if (board[row][col] === null && isValidCell(board, row, col, isBlackTurn)) {
				validCells.push([row, col]);
			}
		}
	}
	return validCells;
}

function putStone(board, row, col, isBlackTurn) {
	board[row][col] = isBlackTurn ? "black" : "white";
	turnAllStones(board, row, col, isBlackTurn);
}

// These functions need to be adjusted based on their actual implementations
function turnAllStones(board, row, col, isBlackTurn) {
	turnLineStones(board, row, col, -1, -1, isBlackTurn);
	turnLineStones(board, row, col, -1, 0, isBlackTurn);
	turnLineStones(board, row, col, -1, 1, isBlackTurn);
	turnLineStones(board, row, col, 0, -1, isBlackTurn);
	turnLineStones(board, row, col, 0, 1, isBlackTurn);
	turnLineStones(board, row, col, 1, -1, isBlackTurn);
	turnLineStones(board, row, col, 1, 0, isBlackTurn);
	turnLineStones(board, row, col, 1, 1, isBlackTurn);
}

function turnLineStones(board, row, col, addRow, addCol, isBlackTurn) {
	let rowCount = addRow;
	let colCount = addCol;
	const cells = [];
	for (let i = 0; i < 7; i++) {
		const cell = getCell(board, row - rowCount, col - colCount);
		if (!cell) {
			return;
		}
		if (cell === (isBlackTurn ? "black" : "white")) {
			if (rowCount !== addRow || colCount !== addCol) {
				for (const [r, c] of cells) {
					board[r][c] = isBlackTurn ? "black" : "white";
				}
			}
			return;
		}
		cells.push([row - rowCount, col - colCount]);
		rowCount += addRow;
		colCount += addCol;
	}
}

function getCell(board, row, col) {
	if (row < 0 || row >= 8 || col < 0 || col >= 8) {
		return null;
	}
	return board[row][col];
}

function isValidCell(board, row, col, isBlackTurn) {
	return (
		isValidLine(board, row, col, -1, -1, isBlackTurn) ||
		isValidLine(board, row, col, -1, 0, isBlackTurn) ||
		isValidLine(board, row, col, -1, 1, isBlackTurn) ||
		isValidLine(board, row, col, 0, -1, isBlackTurn) ||
		isValidLine(board, row, col, 0, 1, isBlackTurn) ||
		isValidLine(board, row, col, 1, -1, isBlackTurn) ||
		isValidLine(board, row, col, 1, 0, isBlackTurn) ||
		isValidLine(board, row, col, 1, 1, isBlackTurn)
	);
}

function isValidLine(board, row, col, addRow, addCol, isBlackTurn) {
	let rowCount = addRow;
	let colCount = addCol;
	for (let i = 0; i < 7; i++) {
		const cell = getCell(board, row - rowCount, col - colCount);
		if (!cell) {
			return false;
		}
		if (cell === (isBlackTurn ? "black" : "white")) {
			if (rowCount === addRow && colCount === addCol) {
				return false;
			} else {
				return true;
			}
		}
		rowCount += addRow;
		colCount += addCol;
	}
	return false;
}

function isGameOver(board) {
	const blackStones = countStones(board, "black");
	const whiteStones = countStones(board, "white");
	if (blackStones === 0 || whiteStones === 0 || blackStones + whiteStones === 64) {
		return true;
	}
	return false;
}

function countStones(board, color) {
	let count = 0;
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			if (board[row][col] === color) {
				count++;
			}
		}
	}
	return count;
}
