let blackIsYou = true;
let whiteIsYou = true;
let isBlackTurn = true;

const getCellElement = function (row, col) {
	return document.getElementById("cell-" + row + "-" + col);
};

const addStone = function (row, col, className) {
	const cell = getCellElement(row, col);
	const stone = document.createElement("div");
	stone.classList.add("stone");
	stone.classList.add(className);
	cell.appendChild(stone);
};

const hasClass = function (element, className) {
	for (let i = 0; i < element.classList.length; i++) {
		if (element.classList[i] === className) {
			return true;
		}
	}
	return false;
};

const removeClassAll = function (className) {
	const elements = document.getElementsByClassName(className);
	for (let i = elements.length; i > 0; i--) {
		elements[i - 1].classList.remove(className);
	}
};

const isMyStone = function (cell) {
	if ((isBlackTurn && hasClass(cell.children[0], "black")) || (!isBlackTurn && hasClass(cell.children[0], "white"))) {
		return true;
	}
	return false;
};

const isValidLine = function (row, col, addRow, addCol) {
	let rowCount = addRow;
	let colCount = addCol;
	for (let i = 0; i < 7; i++) {
		const cell = getCellElement(row - rowCount, col - colCount);
		if (!cell || !cell.children.length) {
			return false;
		}
		if (isMyStone(cell)) {
			if (rowCount === addRow && colCount === addCol) {
				return false;
			} else {
				return true;
			}
		}
		rowCount = rowCount + addRow;
		colCount = colCount + addCol;
	}
	return false;
};

const isValidCell = function (row, col) {
	if (
		isValidLine(row, col, -1, -1) ||
		isValidLine(row, col, -1, 0) ||
		isValidLine(row, col, -1, 1) ||
		isValidLine(row, col, 0, -1) ||
		isValidLine(row, col, 0, 1) ||
		isValidLine(row, col, 1, -1) ||
		isValidLine(row, col, 1, 0) ||
		isValidLine(row, col, 1, 1)
	) {
		return true;
	}
};

const turnStones = function (cells) {
	for (let i = 0; i < cells.length; i++) {
		const cell = document.getElementById(cells[i]);
		// 白转黑
		if (isBlackTurn) {
			cell.children[0].classList.remove("white");
			cell.children[0].classList.add("black");
			cell.children[0].classList.add("turn-effect");
			setTimeout(function () {
				cell.children[0].classList.remove("turn-effect");
			}, 200);
			//黑转白
		} else {
			cell.children[0].classList.remove("black");
			cell.children[0].classList.add("white");
			cell.children[0].classList.add("turn-effect");
			setTimeout(function () {
				cell.children[0].classList.remove("turn-effect");
			}, 200);
		}
	}
};

const turnLineStones = function (row, col, addRow, addCol) {
	let rowCount = addRow;
	let colCount = addCol;
	let cells = [];
	for (let i = 0; i < 7; i++) {
		const cell = getCellElement(row - rowCount, col - colCount);
		if (!cell || !cell.children.length) {
			return;
		}
		if (isMyStone(cell)) {
			if (rowCount !== addRow || colCount !== addCol) {
				turnStones(cells);
			}
			return;
		}
		cells.push(cell.id);
		rowCount = rowCount + addRow;
		colCount = colCount + addCol;
	}
	return;
};

const turnAllStones = function (row, col) {
	turnLineStones(row, col, -1, -1);
	turnLineStones(row, col, -1, 0);
	turnLineStones(row, col, -1, 1);
	turnLineStones(row, col, 0, -1);
	turnLineStones(row, col, 0, 1);
	turnLineStones(row, col, 1, -1);
	turnLineStones(row, col, 1, 0);
	turnLineStones(row, col, 1, 1);
};

const searchValidCells = function () {
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const cell = getCellElement(row, col);
			if (cell.children.length) continue;
			if (isValidCell(row, col)) {
				cell.classList.add("valid");
			}
		}
	}
};

//黑白子数量对比条
const updateScore = function () {
	const black = document.getElementsByClassName("black");
	const white = document.getElementsByClassName("white");
	const all = black.length + white.length;
	const blackRatio = (black.length * 100) / all;
	const whiteRatio = (white.length * 100) / all;
	document.getElementById("black-score").innerText = black.length;
	document.getElementById("white-score").innerText = white.length;
	document.getElementById("black-bar").style.width = blackRatio + "%";
	document.getElementById("white-bar").style.width = whiteRatio + "%";
};

const showMessageNoPlace = function () {
	if (isBlackTurn) {
		document.getElementById("message").innerText = "Black can't put.";
	} else {
		document.getElementById("message").innerText = "White can't put.";
	}
	document.getElementById("message-container").style.display = "block";
};

const isGameOver = function () {
	const stones = document.getElementsByClassName("stone");
	if (stones.length === 8 * 8) {
		// 停止计时器
		clearInterval(timerId);
		return true;
	}
	const black = document.getElementsByClassName("black");
	if (black.length === 0) {
		clearInterval(timerId);
		return true;
	}
	const white = document.getElementsByClassName("white");
	if (white.length === 0) {
		clearInterval(timerId);
		return true;
	}
};

const endGame = function () {
	document.getElementById("white-label").classList.remove("turn");
	document.getElementById("black-label").classList.remove("turn");
	const black = document.getElementsByClassName("black");
	const white = document.getElementsByClassName("white");
	if (black.length > white.length) {
		clearInterval(timerId);
		document.getElementById("message").innerText = "Black win.";
	} else if (black.length < white.length) {
		clearInterval(timerId);
		document.getElementById("message").innerText = "White win.";
	} else {
		clearInterval(timerId);
		document.getElementById("message").innerText = "Draw.";
	}
	document.getElementById("message-container").style.display = "block";
};

// --------------------------------------------------------------------------------------萌新AI //
const clickCorner = function (elements) {
	for (let i = 0; i < elements.length; i++) {
		const splitedId = elements[i].id.split("-");
		if (
			(splitedId[1] === "0" && splitedId[2] === "0") ||
			(splitedId[1] === "0" && splitedId[2] === "7") ||
			(splitedId[1] === "7" && splitedId[2] === "0") ||
			(splitedId[1] === "7" && splitedId[2] === "7")
		) {
			return elements[i];
		}
	}
	return null;
};

// 计算一条线上能翻转多少对方棋子
const countLineFlips = function (row, col, addRow, addCol) {
	let rowCount = addRow;
	let colCount = addCol;
	let flips = 0;
	for (let i = 0; i < 7; i++) {
		const cell = getCellElement(row - rowCount, col - colCount);
		if (!cell || !cell.children.length) {
			return 0;
		}
		if (isMyStone(cell)) {
			if (rowCount === addRow && colCount === addCol) {
				return 0;
			} else {
				return flips;
			}
		}
		flips++;
		rowCount = rowCount + addRow;
		colCount = colCount + addCol;
	}
	return 0;
};

// 计算一个位置能翻转多少对方棋子
const countFlips = function (row, col) {
	let flips = 0;
	flips += countLineFlips(row, col, -1, -1);
	flips += countLineFlips(row, col, -1, 0);
	flips += countLineFlips(row, col, -1, 1);
	flips += countLineFlips(row, col, 0, -1);
	flips += countLineFlips(row, col, 0, 1);
	flips += countLineFlips(row, col, 1, -1);
	flips += countLineFlips(row, col, 1, 0);
	flips += countLineFlips(row, col, 1, 1);
	return flips;
};

// 使用贪心算法选择能翻转最多对方棋子的位置
const clickGreedy = function (elements) {
	let maxFlips = -Infinity;
	let cellToClick = null;
	for (let i = 0; i < elements.length; i++) {
		const splitedId = elements[i].id.split("-");
		const row = parseInt(splitedId[1]);
		const col = parseInt(splitedId[2]);
		const flips = countFlips(row, col);
		if (flips > maxFlips) {
			maxFlips = flips;
			cellToClick = elements[i];
		}
	}
	return cellToClick;
};

// --------------------------------------------------------------------------------------高手AI //
// 定义一个全局变量，用来存储每个位置的权重因子
let weights = [
	[100, -10, 11, 6, 6, 11, -10, 100],
	[-10, -20, 1, 2, 2, 1, -20, -10],
	[11, 1, 5, 4, 4, 5, 1, 11],
	[6, 2, 4, 2, 2, 4, 2, 6],
	[6, 2, 4, 2, 2, 4, 2, 6],
	[11, 1, 5, 4, 4, 5, 1, 11],
	[-10, -20, 1, 2, 2, 1, -20, -10],
	[100, -10, 11, 6, 6, 11, -10, 100],
];

// 极小化极大算法
const clickMinMax = function (elements) {
	const maxDepth = 4000;
	// 评估函数
	const evaluate = function () {
		const black = document.getElementsByClassName("black");
		const white = document.getElementsByClassName("white");
		const totalStones = black.length + white.length;

		// 权重参数（根据游戏阶段动态调整）
		let stoneWeight;
		let mobilityWeight;
		let stabilityWeight;
		let positionWeight;

		if (totalStones < 20) {
			// 开局
			stoneWeight = 0.1;
			mobilityWeight = 0.4;
			stabilityWeight = 0.5;
			positionWeight = 0.7;
		} else if (totalStones < 36) {
			// 中局
			stoneWeight = 0.2;
			mobilityWeight = 0.6;
			stabilityWeight = 0.4;
			positionWeight = 0.9;
		} else {
			// 残局 (更注重行动力)
			stoneWeight = 0.4;
			mobilityWeight = 0.9;
			stabilityWeight = 0.7;
			positionWeight = 0.8;
		}

		// 如果棋子数达到一定数量，切换到终局评估模式
		if (totalStones > 50) {
			let myMobility = 0;
			let opponentMobility = 0;
			for (let row = 0; row < 8; row++) {
				for (let col = 0; col < 8; col++) {
					const cell = getCellElement(row, col);
					if (cell.children.length > 0) continue;
					if (isValidCell(row, col)) {
						if (isBlackTurn) {
							myMobility++;
						} else {
							opponentMobility++;
						}
					}
				}
			}
			return (myMobility - opponentMobility) * 100; // 行动力差异放大
		}

		// 1. 计算数量分数
		const stoneScore = black.length - white.length;

		// 2. 计算行动力分数
		let mobilityScore = 0;
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const cell = getCellElement(row, col);
				if (cell.children.length > 0) continue;
				if (isValidCell(row, col)) {
					if (isBlackTurn) {
						mobilityScore++;
					} else {
						mobilityScore--;
					}
				}
			}
		}

		// 辅助函数：检查指定方向是否有对手的棋子
		const isOpponentStoneInDirection = function (row, col, dr, dc, isBlackTurn) {
			let r = row + dr;
			let c = col + dc;
			while (r >= 0 && r < 8 && c >= 0 && c < 8) {
				const cell = getCellElement(r, c);
				if (cell.children.length === 0) return false;
				if (isBlackTurn && cell.querySelector(".white")) return true;
				if (!isBlackTurn && cell.querySelector(".black")) return true;
				if (isBlackTurn && cell.querySelector(".black")) return false;
				if (!isBlackTurn && cell.querySelector(".white")) return false;
				r += dr;
				c += dc;
			}
			return false;
		};

		// 3. 计算稳定性分数
		let stabilityScore = 0;
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const cell = getCellElement(row, col);
				if (cell.children.length === 0) continue;

				let isStable = true;
				// 检查八个方向是否有对手的棋子
				for (let dr = -1; dr <= 1; dr++) {
					for (let dc = -1; dc <= 1; dc++) {
						if (dr === 0 && dc === 0) continue;
						if (isOpponentStoneInDirection(row, col, dr, dc, isBlackTurn)) {
							isStable = false;
							break;
						}
					}
					if (!isStable) break;
				}

				if (isStable) {
					if (cell.querySelector(".black")) {
						stabilityScore++;
					} else {
						stabilityScore--;
					}
				} else {
					// 对不稳定的棋子给予较小的惩罚
					if (cell.querySelector(".black")) {
						stabilityScore -= 0.2;
					} else {
						stabilityScore += 0.2;
					}
				}
			}
		}

		// 4. 计算位置分数 + 棋形识别 (简单版)
		let positionScore = 0;
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const cell = getCellElement(row, col);
				if (cell.children.length === 0) continue;

				let score = 1;
				let weight = weights[row][col];
				score *= weight;

				// 棋形识别: 角落和边缘加分
				if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
					score *= 2; // 角落更重要
				} else if (row === 0 || row === 7 || col === 0 || col === 7) {
					score *= 1.5; // 边缘也比较重要
				}
				// X-square 惩罚
				if ((row === 1 || row === 6) && (col === 1 || col === 6)) {
					if ((row === 1 || row === 6) && (col == 0 || col == 7)) {
						//score *= 1; //这是C位
					} else if ((col === 1 || col === 6) && (row == 0 || row == 7)) {
						//score *= 1;
					} else score *= -1.2; // X-square 不利
				}

				if (cell.querySelector(".black")) {
					positionScore += score;
				} else {
					positionScore -= score;
				}
			}
		}

		// 计算总分数
		const totalScore =
			stoneWeight * stoneScore +
			mobilityWeight * mobilityScore +
			stabilityWeight * stabilityScore +
			positionWeight * positionScore;

		return totalScore;
	};

	// 定义转置表，存储之前搜索过的结果
	const transpositionTable = {};
	// 定义哈希函数，生成棋盘的唯一标识
	const hash = function () {
		let result = "";
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const cell = getCellElement(row, col);
				if (!cell.children.length) {
					result += "0";
				} else if (hasClass(cell.children[0], "black")) {
					result += "1";
				} else {
					result += "2";
				}
			}
		}
		return result;
	};
	// 极小化极大搜索，加入alpha-beta剪枝和转置表
	const minimax = function (depth, alpha, beta, isMaximizing) {
		if (depth === maxDepth) {
			return evaluate();
		}
		const key = hash() + depth + isMaximizing; // 生成转置表的键
		if (transpositionTable[key]) {
			return transpositionTable[key]; // 如果之前搜索过，直接返回结果
		}
		if (isMaximizing) {
			let bestValue = -Infinity;
			for (let i = 0; i < elements.length; i++) {
				const value = minimax(depth + 1, alpha, beta, false);
				bestValue = Math.max(bestValue, value);
				alpha = Math.max(alpha, bestValue); // 更新alpha值
				if (beta <= alpha) {
					break; // 剪枝
				}
			}
			transpositionTable[key] = bestValue; // 存储结果到转置表
			return bestValue;
		} else {
			let bestValue = Infinity;
			for (let i = 0; i < elements.length; i++) {
				const value = minimax(depth + 1, alpha, beta, true);
				bestValue = Math.min(bestValue, value);
				beta = Math.min(beta, bestValue); // 更新beta值
				if (beta <= alpha) {
					break; // 剪枝
				}
			}
			transpositionTable[key] = bestValue; // 存储结果到转置表
			return bestValue;
		}
	};
	let bestValue = -Infinity;
	let bestCell = null;
	for (let i = 0; i < elements.length; i++) {
		const value = minimax(0, -Infinity, Infinity, false);
		if (value > bestValue) {
			bestValue = value;
			bestCell = elements[i];
		}
	}
	return bestCell;
};

// -----------------------------------------------------------------------------------老手AI //
const clickMCT = async function (elements) {
	const board = getBoardState();
	const searchCount = 500;
	const timeLimit = 10000;
	let maxScore = -Infinity;
	let bestCell;
	let searchDepth = 3;
	let startTime = Date.now();
	// **如果只有一个可落子位置，就直接返回它**
	if (elements.length === 1) {
		return elements[0];
	}
	// 循环增加搜索深度，直到超出时间上限
	while (true) {
		// 遍历所有可落子位置
		for (let i = 0; i < elements.length; i++) {
			const cell = elements[i];
			const splitedId = cell.id.split("-");
			const row = parseInt(splitedId[1]);
			const col = parseInt(splitedId[2]);
			let score = 0;
			// 创建一个数组存储所有模拟游戏的Promise对象
			let promises = [];
			// 模拟多次游戏
			for (let j = 0; j < searchCount; j++) {
				// 复制棋盘状态
				const tempBoard = JSON.parse(JSON.stringify(board));
				// 落子
				putStone(tempBoard, row, col, isBlackTurn);
				console.log("搜索次数");
				// 使用async/await来搜索并累加得分，并将Promise对象放入数组中
				promises.push(
					(async () => {
						score += await MCT(tempBoard, !isBlackTurn, searchDepth);
					})()
				);
			}
			// 等待所有Promise对象都完成后再继续执行
			await Promise.all(promises);
			// 计算平均得分
			score /= searchCount;
			// 更新最大得分和最佳落子位置
			if (score > maxScore) {
				maxScore = score;
				bestCell = cell;
				console.log("当前总分数为：" + score);
			}
		}
		// 记录结束时间
		let endTime = Date.now();
		// 如果超过时间上限，就停止搜索并返回最佳落子位置
		if (endTime - startTime > timeLimit) {
			console.log("当前搜索时间为：" + (endTime - startTime));
			break;
		}
		// 否则，增加搜索深度并继续循环
		searchDepth++;
		console.log("当前搜索深度为：" + searchDepth);
	}
	return bestCell;
};

// 蒙特卡洛树搜索算法
const MCT = function (board, isBlackTurn, depth) {
	if (depth === 0 || isGameOver(board)) {
		return heuristic(board);
	}
	const validCells = getValidCells(board, isBlackTurn);
	if (validCells.length === 0) {
		return MCT(board, !isBlackTurn, depth - 1);
	}

	// 使用缓存技术存储节点访问次数和得分
	const cache = new Map();
	// 设置 UCB 参数
	const ucbParam = 3;

	// 模拟多次游戏
	for (let i = 0; i < searchCount; i++) {
		// 计算 UCB 得分，使用 map 方法简化循环操作
		const ucbScores = validCells.map(([row, col]) => {
			const key = `${row}-${col}`;
			if (!cache.has(key)) {
				return Infinity;
			}
			const [count, score] = cache.get(key);
			return score / count + ucbParam * Math.sqrt(Math.log(i) / count);
		});

		// 获取最大 UCB 得分的索引，使用 reduce 方法简化循环操作
		const maxIndex = ucbScores.reduce((maxIndex, score, index) => {
			return score > ucbScores[maxIndex] ? index : maxIndex;
		}, 0);

		// 更新节点访问次数和得分
		const [row, col] = validCells[maxIndex];
		const key = `${row}-${col}`;
		const tempBoard = JSON.parse(JSON.stringify(board));
		putStone(tempBoard, row, col, isBlackTurn);
		const newScore = cache.has(key) ? cache.get(key)[1] : 0 + MCT(tempBoard, !isBlackTurn, depth - 1);
		const newCount = cache.has(key) ? cache.get(key)[0] : 0 + 1;
		cache.set(key, [newCount, newScore]);
	}

	// 返回最大平均得分的索引，使用 reduce 方法简化循环操作
	const bestIndex = [...cache.values()].reduce((bestIndex, [count, score], index) => {
		return score / count > [...cache.values()][bestIndex][1] / [...cache.values()][bestIndex][0] ? index : bestIndex;
	}, 0);
	return validCells[bestIndex];
};

const heuristic = function (board) {
	// 使用缓存技术存储启发式函数的值
	const cache = new Map();
	let blackScore = 0;
	let whiteScore = 0;
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const key = `${row}-${col}`;
			if (board[row][col] === "black") {
				// 如果缓存中有值，直接使用，否则计算并存入缓存
				if (cache.has(key)) {
					blackScore += cache.get(key);
				} else {
					let score = 1;
					// 直接引用全局变量中的权重因子
					let weight = weights[row][col];
					score *= weight;
					blackScore += score;
					cache.set(key, score);
				}
			} else if (board[row][col] === "white") {
				// 如果缓存中有值，直接使用，否则计算并存入缓存
				if (cache.has(key)) {
					whiteScore += cache.get(key);
				} else {
					let score = 1;
					// 直接引用全局变量中的权重因子
					let weight = weights[row][col];
					score *= weight;
					whiteScore += score;
					cache.set(key, score);
				}
			}
		}
	}
	return isBlackTurn ? blackScore - whiteScore : whiteScore - blackScore;
};

// 获取当前棋盘状态
const getBoardState = function () {
	const board = [];
	for (let row = 0; row < 8; row++) {
		const rowData = [];
		for (let col = 0; col < 8; col++) {
			const cell = getCellElement(row, col);
			if (cell.children.length === 0) {
				rowData.push(null);
			} else if (hasClass(cell.children[0], "black")) {
				rowData.push("black");
			} else {
				rowData.push("white");
			}
		}
		board.push(rowData);
	}
	return board;
};

// 获取所有可落子位置
const getValidCells = function (board, isBlackTurn) {
	// 使用缓存技术存储有效位置的列表
	const cache = new Map();
	const key = isBlackTurn ? "black" : "white";
	if (cache.has(key)) {
		return cache.get(key);
	} else {
		const validCells = [];
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				if (board[row][col] === null && isValidCell(board, row, col, isBlackTurn)) {
					validCells.push([row, col]);
				}
			}
		}
		cache.set(key, validCells);
		return validCells;
	}
};

// 落子
const putStone = function (board, row, col, isBlackTurn) {
	board[row][col] = isBlackTurn ? "black" : "white";
	turnAllStones(board, row, col, isBlackTurn);
};

// -----------------------------------------------------------------------------------大师AI
const clickPit = function (elements) {};
// --------------------------------------------------------------------------------------------------------------------难度选择 //
const clickCpu = async function (elements) {
	if ((isBlackTurn && !blackIsYou) || (!isBlackTurn && !whiteIsYou)) {
		let cellToClick;

		// 根据难度选择不同的算法
		const difficulty = document.getElementsByName("difficulty");
		if (difficulty[0].checked) {
			// 萌新
			cellToClick = clickCorner(elements);
			if (!cellToClick) {
				cellToClick = clickGreedy(elements);
			}
		} else if (difficulty[1].checked) {
			// 高手
			cellToClick = clickMinMax(elements);
		} else if (difficulty[2].checked) {
			// 老手
			cellToClick = await clickMCT(elements);
		} else if (difficulty[3].checked) {
			// 大师
			cellToClick = clickPit(elements);
		}

		cellToClick.click();
	}
};

const updateTurnLabels = function () {
	if (isBlackTurn) {
		document.getElementById("white-label").classList.remove("turn");
		document.getElementById("black-label").classList.add("turn");
	} else {
		document.getElementById("black-label").classList.remove("turn");
		document.getElementById("white-label").classList.add("turn");
	}
};

const updateTurnSecond = function (updateBlack) {
	isBlackTurn = updateBlack;
	updateTurnLabels();
	searchValidCells();
	const elements = document.getElementsByClassName("valid");
	if (elements.length === 0) {
		showMessageNoPlace();
		setTimeout(function () {
			endGame();
		}, 2000);
	} else {
		clickCpu(elements);
	}
};

const updateTurn = function (updateBlack) {
	isBlackTurn = updateBlack;
	updateTurnLabels();
	searchValidCells();
	const elements = document.getElementsByClassName("valid");
	if (elements.length === 0) {
		showMessageNoPlace();
		//显示无法走子信息
		setTimeout(function () {
			document.getElementById("message-container").style.display = "";
			updateTurnSecond(!isBlackTurn);
		}, 2000);
	} else {
		clickCpu(elements);
	}
};

const addInitStones = function () {
	addStone(3, 3, "white");
	addStone(3, 4, "black");
	addStone(4, 3, "black");
	addStone(4, 4, "white");
};

const init = function () {
	blackIsYou = true;
	whiteIsYou = true;
	addInitStones();
	updateScore();
	updateTurn(true);
	document.getElementById("start-container").style.display = "";
};

const onClickCell = function () {
	if (!hasClass(this, "valid")) return;
	removeClassAll("valid");
	const splitedId = this.id.split("-");
	const row = parseInt(splitedId[1], 10); // Converts the string to an integer
	const col = parseInt(splitedId[2], 10); // Converts the string to an integer
	console.log("检测到落子:", row, col); // Added line to log moves
	if (isBlackTurn) {
		addStone(splitedId[1], splitedId[2], "black");
	} else {
		addStone(splitedId[1], splitedId[2], "white");
	}
	turnAllStones(splitedId[1], splitedId[2]);
	updateScore();
	setTimeout(function () {
		if (isGameOver()) {
			endGame();
			return;
		}
		updateTurn(!isBlackTurn);
	}, 500);
};

var timerId;
var timerValue = 0;

const onClickReset = function () {
	document.getElementById("message-container").style.display = "";
	removeClassAll("valid");
	const stones = document.getElementsByClassName("stone");
	for (let i = stones.length; i > 0; i--) {
		const parent = stones[i - 1].parentNode;
		parent.removeChild(stones[i - 1]);
	}
	// 重置计时器
	clearInterval(timerId);
	timerValue = 0;
	document.getElementById("timer-value").innerText = "00:00";
	init();

	// 隐藏所有头像
	const avatarIds = ["black-ai", "black-player", "white-ai", "white-player"];
	for (let i = 0; i < avatarIds.length; i++) {
		const avatar = document.getElementById(avatarIds[i]);
		avatar.style.display = "none";
	}
};

const onClickStart = function () {
	const black = document.getElementsByName("black");
	if (black[0].checked) {
		blackIsYou = true;
		document.getElementById("black-player").style.display = "block";
		document.getElementById("black-ai").style.display = "none";
	} else {
		blackIsYou = false;
		document.getElementById("black-player").style.display = "none";
		document.getElementById("black-ai").style.display = "block";
	}
	const white = document.getElementsByName("white");
	if (white[0].checked) {
		whiteIsYou = true;
		document.getElementById("white-player").style.display = "block";
		document.getElementById("white-ai").style.display = "none";
	} else {
		whiteIsYou = false;
		document.getElementById("white-player").style.display = "none";
		document.getElementById("white-ai").style.display = "block";
	}
	// 启动计时器
	timerId = setInterval(function () {
		timerValue++;
		// 计算分钟和秒数
		var minutes = Math.floor(timerValue / 60);
		var seconds = timerValue % 60;
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		document.getElementById("timer-value").innerText = minutes + ":" + seconds;
	}, 1000);

	document.getElementById("start-container").style.display = "none";
	updateTurn(true);
};

const addEvents = function () {
	const cells = document.getElementsByClassName("cell");
	for (let i = 0; i < cells.length; i++) {
		cells[i].addEventListener("click", onClickCell, false);
	}
	const reset = document.getElementById("reset");
	reset.addEventListener("click", onClickReset, false);
	const start = document.getElementById("start");
	start.addEventListener("click", onClickStart, false);
};

window.onload = function () {
	addEvents();
	init();
};
