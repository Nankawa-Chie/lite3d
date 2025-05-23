document.addEventListener("DOMContentLoaded", function () {
	const videoItems = document.querySelectorAll(".video-item");
	const videoPlayer = document.querySelector(".video-player");
	const videoElement = videoPlayer.querySelector("video");

	videoItems.forEach(function (item) {
		item.addEventListener("click", function () {
			const videoSrc = this.getAttribute("data-video-src");
			videoElement.src = videoSrc;
			videoPlayer.style.display = "block";
			videoElement.load();
		});
	});
});

// 字幕数据，使用对象存储，键为视频文件名（不含路径），值为字幕数组
const subtitlesData = {
	"Lilium.mp4": [
		// 注意路径
		{ start: 1, end: 8, text: "Os iusti" },
		{ start: 8, end: 21, text: "Meditabitur sapietiam" },
		{ start: 21, end: 26, text: "Et lingua eius" },
		{ start: 26, end: 31, text: "Loquetur indicium" },
		{ start: 31, end: 36, text: "Beatus vir qui" },
		{ start: 36, end: 41, text: "Suffert tentationem" },
		{ start: 41, end: 48, text: "Quoniam cum probatus" },
		{ start: 48, end: 55, text: "Fuerit accipient coronam vitae" },
		{ start: 55, end: 65, text: "Kyrie, fons bonitatis" },
		{ start: 65, end: 80, text: "Kyrie, ignis divine, eleison" },
		{ start: 80, end: 85, text: "O quam sancta" },
		{ start: 85, end: 91, text: "Quam serena" },
		{ start: 91, end: 96, text: "Quam benigma" },
		{ start: 96, end: 101, text: "Quam amoena——esse" },
		{ start: 101, end: 106, text: "Virgo creditur" },
		{ start: 106, end: 110, text: "O quam sancta" },
		{ start: 110, end: 117, text: "Quam serena" },
		{ start: 117, end: 121, text: "Quam benigma" },
		{ start: 121, end: 124, text: "Quam amoena" },
		{ start: 124, end: 136, text: "O castitatis lilium" },
		{ start: 136, end: 191, text: "O——" },
		{ start: 191, end: 201, text: "Kyrie, fons bonitatis" },
		{ start: 201, end: 214, text: "Kyrie, ignis divine, eleison" },
		{ start: 214, end: 218, text: "O quam sancta" },
		{ start: 218, end: 225, text: "Quam serena" },
		{ start: 225, end: 230, text: "Quam benigma" },
		{ start: 230, end: 232, text: "Quam amoena" },
		{ start: 232, end: 264, text: "O castitatis lilium" },
	],

	"Realize.mp4": [
		{ start: 10, end: 16, text: "仿佛作著一场美梦" },
		{ start: 16, end: 22, text: "脸颊拂过 徐徐清风" },
		{ start: 23, end: 28, text: "这是一场 多么美丽" },
		{ start: 28, end: 33, text: "又飘渺的梦境" },

		{ start: 33, end: 36, text: "只要永远留在梦中" },
		{ start: 36, end: 40, text: "就能从此获得解脱" },
		{ start: 40, end: 48, text: "我却还不能够" },
		{ start: 48, end: 55, text: "逃避眼前过错" },

		{ start: 55, end: 58, text: "任凭" },
		{ start: 58, end: 60, text: "沉重行囊压在背后" },
		{ start: 60, end: 64, text: "重新扛起再往前走" },
		{ start: 64, end: 68, text: "我不怕眼前这条路" },
		{ start: 68, end: 70, text: "多么坎坷难走" },
		{ start: 70, end: 72, text: "我不愿随梦漂流" },
		{ start: 72, end: 76, text: "面对现实的坚强" },
		{ start: 76, end: 80, text: "紧握在手中" },
		{ start: 80, end: 86, text: "此时此刻 勇敢地活" },
		{ start: 86, end: 92, text: "向明天走" },

		{ start: 105, end: 112, text: "咽下孤独 一个人走" },
		{ start: 112, end: 119, text: "正确的路 无从掌握" },
		{ start: 119, end: 125, text: "这一路上 不曾回头" },
		{ start: 125, end: 130, text: "不敢稍作停留" },

		{ start: 130, end: 133, text: "只怕无法再向前走" },
		{ start: 133, end: 136, text: "害怕迷失在夜色中" },
		{ start: 136, end: 140, text: "随黑暗渐渐沉没" },
		{ start: 140, end: 143, text: "戒慎惶恐" },
		{ start: 143, end: 148, text: "于是成就 此刻的我" },

		{ start: 148, end: 151, text: "纵使狂风骤雨来袭" },
		{ start: 151, end: 154, text: "带来纷扰不安恐惧" },
		{ start: 154, end: 156, text: "昨日的回忆会" },
		{ start: 156, end: 160, text: "让我一天比一天坚定" },
		{ start: 160, end: 163, text: "不在美梦中迷失自我" },
		{ start: 163, end: 169, text: "此时此刻要勇敢地活" },
		{ start: 169, end: 175, text: "决心不放手" },

		{ start: 175, end: 177, text: "任凭" },
		{ start: 177, end: 180, text: "沉重行囊压在背后" },
		{ start: 180, end: 184, text: "重新扛起再往前走" },
		{ start: 184, end: 187, text: "我不怕眼前的今天" },
		{ start: 187, end: 189, text: "多么艰困难过" },
		{ start: 189, end: 192, text: "我不愿随梦漂流" },
		{ start: 192, end: 196, text: "面对现实的坚强" },
		{ start: 196, end: 200, text: "紧握在手中" },
		{ start: 200, end: 205, text: "此时此刻 勇敢地活" },
		{ start: 205, end: 212, text: "向明天走" },
	],
};

document.addEventListener("DOMContentLoaded", function () {
	const screenMirroringButton = document.getElementById("screenMirroring");

	screenMirroringButton.addEventListener("click", function () {
		const videoURL = videoElement.src;
		const videoFileName = videoURL.substring(videoURL.lastIndexOf("/") + 1); // 提取文件名

		// 获取当前视频的字幕数据
		const currentSubtitles = subtitlesData[videoFileName] || null;

		// 广播消息到所有localhost端口
		broadcastMessage({
			type: "VIDEO_CONTROL",
			action: "PLAY",
			videoURL: videoURL, // 仍然发送videoURL，以防需要
			videoFileName: videoFileName, // 发送文件名
			subtitles: currentSubtitles, // 发送字幕数据
		});
	});
});

function broadcastMessage(message) {
	const ports = [4031, 8080, 3000]; // 添加可能用到的端口号

	// 发送消息到localhost的不同端口
	ports.forEach((port) => {
		window.parent.parent.postMessage(message, `http://localhost:${port}`);
	});

	// 发送消息到 https://nankawa-chie.vercel.app
	window.parent.parent.postMessage(message, "https://nankawa-chie.vercel.app");
}

// Get the video element
var videoElement = document.getElementById("videoElement");
var closeButton = document.getElementById("closeVideoPlayer");
closeButton.addEventListener("click", function () {
	videoElement.pause();
	videoElement.parentNode.style.display = "none";
});
