// 阻止网页上下移动
document.addEventListener(
	"keydown",
	function (e) {
		e = e || window.event;
		var keyCode = e.keyCode;
		if (keyCode >= 37 && keyCode <= 40) {
			e.preventDefault();
			// Do whatever else you want with the keydown event (i.e. your navigation).
		}
	},
	false
);
$(function () {
	//--------------------------------------------------------------------------------全局变量
	const globalState = {
		apps: [
			{
				应用名: "日历",
				应用图标: "./src/日历.png",
				type: "widgetFull",
				动态: true,
			},
			{
				应用名: "天气",
				应用图标: "./src/天气.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "facetime",
				应用图标: "./src/facetime.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "日历",
				应用图标: "./src/日历.png",
				type: "app",
				动态: true,
			},
			{
				应用名: "时钟",
				应用图标: "./src/时钟.png",
				type: "app",
				动态: true,
			},
			{
				应用名: "照片",
				应用图标: "./src/照片.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "地图",
				应用图标: "./src/地图.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "相机",
				应用图标: "./src/相机.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "提醒事项",
				应用图标: "./src/提醒事项.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "Facebook",
				应用图标: "./src/facebook.png",
				type: "app",
				通知es: 5,
				动态: false,
			},
			{
				应用名: "便签",
				应用图标: "./src/便签.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "应用商店",
				应用图标: "./src/appstore.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "健康",
				应用图标: "./src/健康.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "信息",
				应用图标: "./src/信息.png",
				通知es: 123,
				type: "app",
				动态: false,
			},
			{
				应用名: "设置",
				应用图标: "./src/设置.png",
				type: "app",
				通知es: 3,
				动态: false,
			},
			{
				应用名: "WhatsApp",
				应用图标: "./src/whatsapp.png",
				type: "app",
				通知es: 22,
				动态: false,
			},
			{
				应用名: "计算器",
				应用图标: "./src/计算器.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "Twitter",
				应用图标: "./src/twitter.png",
				type: "app",
				通知es: 2,
				动态: false,
			},
			{
				应用名: "指南针",
				应用图标: "./src/safari.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "Pinterest",
				应用图标: "./src/pinterest.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "Google",
				应用图标: "./src/谷歌.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "音乐",
				应用图标: "./src/音乐.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "Netflix",
				应用图标: "./src/netflix.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "语音备忘录",
				应用图标: "./src/语音备忘录.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "钱包",
				应用图标: "./src/wallet.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "文件",
				应用图标: "./src/文件.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "联系人",
				应用图标: "./src/联系人.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "Bing",
				应用图标: "./src/Bing.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "找回 iPhone",
				应用图标: "./src/findphone.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "EasyChess",
				应用图标: "./apps/EasyChess/easychess.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "黑白棋",
				应用图标: "./apps/黑白棋/黑白棋.jpg",
				type: "app",
				动态: false,
			},
			{
				应用名: "扫雷",
				应用图标: "./apps/扫雷/扫雷.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "视频",
				应用图标: "./src/视频.png",
				type: "app",
				动态: false,
			},
			{
				应用名: "Open-LLM-VTuber",
				应用图标: "./apps/Open-LLM-VTuber/Open-LLM-VTuber.png",
				type: "app",
				动态: false,
			}
		],
		wrapperApps: {
			appsGrupo: 24,
			grupoactive: 1,
			medida: $(".wrapperApps").outerWidth(true),
			transform: 0,
		},
		dateTime: {
			meses: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
			dias: ["日周", "一周", "二周", "三周", "四周", "五周", "六周"],
		},
		电量低: false,
		draggScreen: false,
		statusBarHeight: 25, // 定义状态栏高度变量
	};
	//--------------------------------------------------------------------------------------扩展功能
	$.fn.extend({
		touchMov: function (config) {
			config = jQuery.extend(
				{
					mov: "x",
					movIzq: function () {},
					movDer: function () {},
					movUp: function () {},
					movDown: function () {},
					updateMovX: function () {},
					updateMovY: function () {},
					finishMov: function () {},
				},
				config
			);
			let el = this;
			let initCoords = { x: 0, y: 0 };
			let movCoords = { x: 0, y: 0 };
			let downCoords = { x: 0, y: 0 };
			el.on("pointerdown", function (e) {
				initCoords = { x: e.pageX, y: e.pageY };
				downCoords = { x: movCoords.x, y: movCoords.y };
				el.on("pointermove", function (e2) {
					globalState.draggScreen = true;
					movCoords = { x: e2.pageX, y: e2.pageY };
					if (config.mov === "x") {
						config.updateMovX(e2, movCoords.x - initCoords.x);
					} else if (config.mov === "y") {
						config.updateMovY(e2, movCoords.y - initCoords.y);
					}
				});
				el.on("pointerup pointercancel", function (ex) {
					if (config.mov === "x") {
						if (movCoords.x - downCoords.x != 0) {
							movCoords.x - initCoords.x > 0 ? config.movDer(ex) : config.movIzq(ex);
						}
					} else if (config.mov === "y") {
						if (movCoords.y - downCoords.y != 0) {
							movCoords.y - initCoords.y > 0 ? config.movDown(ex) : config.movUp(ex);
						}
					}
					globalState.draggScreen = false;
					config.finishMov(ex);
					el.off("pointermove");
					el.off("pointerup pointercancel");
				});
			});
			return this;
		},
		日历: function (config) {
			config = jQuery.extend(
				{
					日期: new Date(),
					diaCompleto: false,
				},
				config
			);
			let mes = globalState.dateTime.meses[config.日期.getMonth()];
			let diasMes = new Date(config.日期.getFullYear(), config.日期.getMonth() + 1, 0).getDate();
			let hoy = config.日期.getDate();
			let primerDia = new Date(config.日期.getFullYear(), config.日期.getMonth(), 0).getDay();
			this.append(`
<div class="mes">
<p class="mesName">${mes}</p>
<div class="日历Tabla">
<div class="tablaHeader"></div>
<div class="tablaContent"></div>
</div>
</div>`);
			let header = this.find(".mes .tablaHeader");
			let content = this.find(".mes .tablaContent");
			globalState.dateTime.dias.map((dia) =>
				header.append(`<div class="diaName">${config.diaCompleto ? dia : dia.charAt(0)}</div>`)
			);
			for (var k = 0; k <= primerDia; k++) {
				content.prepend("<div></div>");
			}
			for (let index = 1; index <= diasMes; index++) {
				content.append(`<div class="diaNum ${hoy == index ? "active" : ""}">${index}</div>`);
			}
			return this;
		},
		日期应用图标: function (config) {
			config = jQuery.extend(
				{
					日期: new Date(),
					diaCompleto: false,
				},
				config
			);
			let hoy = config.日期.getDate();
			let dia = globalState.dateTime.dias[config.日期.getDay()];
			let diaReversed = (config.diaCompleto ? dia : dia.substring(0, 3)).split("").reverse().join("");
			this.append(`<div class="日期Wrapper"><p class="diaNom">${diaReversed}</p><p class="diaNum">${hoy}</p></div>`);
			return this;
		},
		时钟: function () {
			let tiempo = new Date();
			let numeros = "";
			for (let index = 1; index <= 12; index++) {
				numeros += `<div class="numero" data-num="${index}"></div>`;
			}
			let transform时间 = `calc(${(360 / 12 - 360) * tiempo.getHours()}deg + ${(30 / 60) * tiempo.getMinutes()}deg)`;
			let transform时分 = `calc(6deg * ${tiempo.getMinutes()} + ${(6 / 60) * tiempo.getSeconds()}deg)`;
			let transform时秒 = `calc(6deg * ${tiempo.getSeconds()})`;
			this.append(
				`<div class="时钟Wrapper">
<div class="时钟">
<div class="numeros">${numeros}</div>
<div class="指针s">
<div class="指针 时间" style="transform: rotate(${transform时间});"><div class="bar"></div></div>
<div class="指针 时分" style="transform: rotate(${transform时分});"><div class="bar"></div></div>
<div class="指针 时秒" style="transform: rotate(${transform时秒});"><div class="bar"></div></div>
</div>
</div>
</div>`
			);
			return this;
		},
		时间: function (config) {
			config = jQuery.extend(
				{
					realtime: true,
				},
				config
			);
			var hoy = new Date();
			var 时间 = hoy.getHours();
			if (时间 < 10) 时间 = "0" + 时间;
			var 时分 = hoy.getMinutes();
			if (时分 < 10) 时分 = "0" + 时分;
			if (config.realtime) {
				setInterval(() => {
					hoy = new Date();
					时间 = hoy.getHours();
					if (时间 < 10) 时间 = "0" + 时间;
					时分 = hoy.getMinutes();
					if (时分 < 10) 时分 = "0" + 时分;
					this.empty();
					this.text(`${时间}:${时分}`);
				}, 1000);
			}
			this.text(`${时间}:${时分}`);
			return this;
		},
		日期: function (config) {
			config = jQuery.extend(
				{
					日期: new Date(),
					diaCompleto: true,
				},
				config
			);
			let hoy = config.日期.getDate();
			let dia = globalState.dateTime.dias[config.日期.getDay()];
			let mes = globalState.dateTime.meses[config.日期.getMonth()];
			let diaReversed = (config.diaCompleto ? dia : dia.substring(0, 3)).split("").reverse().join("");
			this.text(`${mes}${hoy}号 ，${diaReversed}`);
			return this;
		},
	});

	//---------------------------------------------------------------------------------------------- 功能
	/**
	 * 规范化字符串，移除音标符号。
	 * @param {string} string - 需要处理的原始字符串。
	 * @returns {string} - 处理后的字符串。
	 */
	function sanearString(string) {
		return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	}

	/**
	 * 在指定的容器中渲染应用程序图标和分页点。
	 * @param {Array<Object>} apps - 应用程序对象数组。
	 * @param {jQuery} container - 渲染应用程序图标的jQuery容器对象。
	 * @param {jQuery} containerDots - 渲染分页点的jQuery容器对象。
	 */
	function pintarApps(apps, container, containerDots) {
		container.empty();
		containerDots.empty();
		globalState.wrapperApps.grupos = Math.ceil(apps.length / globalState.wrapperApps.appsGrupo);
		let appCount = 1;
		let html = "";
		apps.map((app, idArr) => {
			if (appCount == 1) html += '<div class="grupo">';
			let clases = "app";
			if (app.type == "widgetFull") clases = clases + " widgetFull";
			if (app.动态 && app.type == "app") clases = `${clases} ${sanearString(app.应用名).toLowerCase()}动态`;
			html += `<div class="${clases}" data-app="${app.type + sanearString(app.应用名)}" data-id="${idArr}">
${app.通知es ? `<div class="通知">${app.通知es}</div>` : ""}
<div class="应用图标" style="${!app.动态 ? `background-image:url(${app.应用图标});` : "background-color:#fff;"}"></div>
<p class="应用名">${app.应用名}</p>
</div>`;
			if (appCount == globalState.wrapperApps.appsGrupo) {
				html += "</div>";
				appCount = 1;
				return false;
			}
			app.type == "widgetFull" ? (appCount = appCount + 8) : appCount++;
		});
		if (globalState.wrapperApps.grupos > 1) {
			for (let index = 0; index < globalState.wrapperApps.grupos; index++) {
				containerDots.append(`<div class="dot ${index == 0 ? "active" : ""}"></div>`);
			}
		}
		container.append(html);
	}

	/**
	 * 显示一个iOS风格的警告框。
	 * @param {Object} config - 配置对象。
	 */
	function alertaiOS(config) {
		if ($("#iOSAlert").length && !config.ocultar) return false;
		config = jQuery.extend(
			{
				wrapper: $(".iphone .黑色边框"),
				actions: [ { texto: "Aceptar", warning: true,}, { texto: "取消", warning: false,}, ],
				closable: false,
				closeOnActions: true,
				encabezado: "Encabezado de la modal",
				mensaje: "Mensaje de la modal...",
				ocultar: false,
			},
			config
		);
		var actions = "";
		if (config.actions) {
			$.each(config.actions, function (k, action) {
				actions += `<div class="action ${action.warning ? "warning" : ""}">${action.texto}</div>`;
			});
		}
		if (config.ocultar) {
			$(document).off("click", "#iOSAlert .action");
			$("#iOSAlert").fadeOut(function () { $(this).remove(); });
			return false;
		}
		config.wrapper.append(`
<div id="iOSAlert">
<div class="容器 hidAnim">
<p class="encabezado">${config.encabezado}</p>
<p class="mensaje">${config.mensaje}</p>
<div class="actions">${actions}</div>
</div>
</div>
`);
		if (config.closable) $("#iOSAlert").prepend('<div class="closable"></div>');
		$("#iOSAlert")
			.fadeIn("fast", function () { $(this).children(".容器").removeClass("hidAnim"); })
			.css("display", "flex");
		$(document).on("click", "#iOSAlert .action", function (e) {
			let action = config.actions[$(e.currentTarget).index()];
			if (action.callback && typeof action.callback == "function") { action.callback(e); }
			if (config.closeOnActions) {
				$(document).off("click", "#iOSAlert .action");
				$("#iOSAlert").fadeOut("fast", function () { $(this).remove(); });
			}
		});
		if (config.hasOwnProperty("autoclose")) {
			setTimeout(function () {
				$(document).off("click", "#iOSAlert .action");
				$("#iOSAlert").fadeOut("fast", function () { $(this).remove(); });
			}, config.autoclose);
		}
		$(document).on("click", "#iOSAlert .closable", function () {
			$(document).off("click", "#iOSAlert .action");
			$("#iOSAlert").fadeOut("fast", function () { $(this).remove(); });
		});
	}

	/**
	 * 渲染用户界面，包括应用程序图标和小部件。
	 */
	function renderizarUI() {
		pintarApps(globalState.apps, $(".wrapperApps"), $(".wrapperDots"));
		if ($('.wrapperApps .app[data-app="widgetFull日历"]').length) {
			$('.wrapperApps .app[data-app="widgetFull日历"] .应用图标').append(
				'<div class="eventos"><p>' + getToday() + '</p></div><div class="日历Wrapper"></div>'
			);
			$('.wrapperApps .app[data-app="widgetFull日历"] .应用图标 .日历Wrapper').日历();
		}
		if ($(".wrapperApps .app.日历动态").length) {
			$(".wrapperApps .app.日历动态 .应用图标").日期应用图标();
		}
		if ($(".wrapperApps .app.时钟动态").length) {
			$(".wrapperApps .app.时钟动态 .应用图标").时钟();
		}
	}

	/**
	 * 获取今天的日期和星期。
	 * @returns {string} - 格式化的日期字符串，例如："今天是2023.10.26，星期四"。
	 */
	function getToday() {
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var week = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
		return "今天是" + year + "." + month + "." + day + "，星期" + week;
	}
	//----------------------------------------------------------------------------------------- 原始动画
	/**
	 * 执行iPhone开机动画和初始化UI渲染。
	 */
	function encendido() {
		renderizarUI();
		setTimeout(() => {
			$(".交互元素").removeClass("hidden");
			$(".iphone").removeClass("initAnimation").addClass("powerOn");
			setTimeout(() => {
				$(".iphone").removeClass("powerOn").addClass("arrhe");
				$(".mainScreen").removeClass("锁屏");
			}, 2000);
		}, 1000);
	}

	//------------------------------------------------------------------------------------------ 物理按键
	$("#touchID").on("click", function () {
		if (!$(this).hasClass("active")) {
			let sonido = new Audio("./iphoneLockScreen.mp3");
			sonido.play().catch(e => console.log("锁屏音效播放失败:", e));
		}
		$("#iOSAlert").remove();
		$(this).toggleClass("active");
		$(".mainScreen").toggleClass("锁屏");
	});
	$("#switch").on("click", function () {
		$(this).toggleClass("active");
		$(".iphone").toggleClass("showBackSide");
	});
	$("#voiceup").on("click", function () { /* 音量增加逻辑 (暂未实现) */ });
	$("#voicedown").on("click", function () { /* 音量减少逻辑 (暂未实现) */ });

	encendido();
	$(".statusBar .时间").时间();
	$(".lockScreen .时间").时间();
	$(".lockScreen .日期").日期();
	$(".widgetCenter .block.eventos").日期应用图标({ diaCompleto: true });

	$(".lockScreen").touchMov({
		mov: "y",
		movUp: function (e) {
			$(e.currentTarget).siblings(".statusBar").addClass("mov");
			$(e.currentTarget).addClass("hidden");
			$(e.currentTarget).siblings(".appScreen.hidden").removeClass("hidden");
			setTimeout(() => {
				$(e.currentTarget).siblings(".statusBar").removeClass("mov");
				$(e.currentTarget).siblings(".statusBar").find(".operador").addClass("hidden");
				$(e.currentTarget).siblings(".statusBar").find(".时间").removeClass("hidden");
			}, 300);
			if (!globalState.电量低) {
				setTimeout(() => {
					alertaiOS({
						encabezado: "电池电量低。",
						mensaje: "剩余 20% 备用核能电源",
						actions: [ { texto: "Ok", }, ],
					});
					$(".mainScreen .statusBar .电量").removeClass("mid").addClass("low");
					globalState.电量低 = true;
				}, 3000);
			}
		},
	});
	$(".wrapperApps").touchMov({
		updateMovX: function (e, mov) {
			$(e.currentTarget).css({
				transform: `translateX(${globalState.wrapperApps.transform + mov}px)`,
				transition: "none",
			});
		},
		movIzq: function (e) {
			if (globalState.wrapperApps.grupoactive != globalState.wrapperApps.grupos) {
				globalState.wrapperApps.grupoactive++;
			}
			$(e.currentTarget).css({
				transform: `translateX(-${globalState.wrapperApps.medida * (globalState.wrapperApps.grupoactive - 1)}px)`,
				transition: "ease all 0.2s",
			});
			$(".wrapperDots .dot").removeClass("active");
			$(".wrapperDots .dot")
				.eq(globalState.wrapperApps.grupoactive - 1)
				.addClass("active");
		},
		movDer: function (e) {
			if (globalState.wrapperApps.grupoactive != 1) {
				globalState.wrapperApps.grupoactive--;
				$(e.currentTarget).css({
					transform: `translateX(${globalState.wrapperApps.transform + globalState.wrapperApps.medida}px)`,
					transition: "ease all 0.2s",
				});
			} else {
				$(e.currentTarget).parents(".mainScreen").addClass("blur");
				$(e.currentTarget).parents(".appScreen").addClass("moveOut");
				$(e.currentTarget).parents(".appScreen").siblings(".widgetCenter").removeClass("hidden");
				$(e.currentTarget).css({
					transform: `translateX(${globalState.wrapperApps.medida * (globalState.wrapperApps.grupoactive - 1)}px)`,
					transition: "ease all 0.2s",
				});
			}
			$(".wrapperDots .dot").removeClass("active");
			$(".wrapperDots .dot")
				.eq(globalState.wrapperApps.grupoactive - 1)
				.addClass("active");
		},
		finishMov: function (e) {
			let transform = e.currentTarget.style.transform;
			if (transform.length) {
				transform = transform.split("(");
				transform = transform[1].split("px");
				transform = parseInt(transform[0]);
			} else {
				transform = 0;
			}
			globalState.wrapperApps.transform = transform;
		},
	});
	$(".widgetCenter .contenido").touchMov({
		mov: "x",
		movIzq: function (e) {
			$(e.currentTarget).parents(".mainScreen").removeClass("blur");
			$(e.currentTarget).parent().addClass("hidden").removeAttr("style");
			$(e.currentTarget).parent().siblings(".appScreen.moveOut").removeClass("moveOut");
		},
		updateMovX: function (e, mov) {
			if (Math.sign(mov) == 1) {
				$(e.currentTarget)
					.parent()
					.css({
						transform: `translateX(${mov}px)`,
						transition: "none",
					});
			}
		},
		movDer: function (e) {
			$(e.currentTarget).parent().css({
				transform: "none",
				transition: "ease all .2s",
			});
			setTimeout(() => {
				$(e.currentTarget).parent().removeAttr("style");
			}, 200);
		},
	});
	$(".widgetScreen .wrapper").touchMov({
		mov: "y",
		movDown: function (e) {
			$(e.currentTarget).parents(".mainScreen").removeClass("widgetScreenOpen");
			$(e.currentTarget).parent().addClass("hidden");
			setTimeout(() => {
				$(e.currentTarget).removeAttr("style");
			}, 200);
		},
		updateMovY: function (e, mov) {
			if (Math.sign(mov) == 1) {
				$(e.currentTarget).css({
					transform: `translateY(${mov}px)`,
					transition: "none",
				});
			}
		},
	});
	$(".statusBar").touchMov({
		mov: "y",
		movDown: function (e) {
			$(e.currentTarget).parent().addClass("blur");
			$(e.currentTarget).siblings(".controlCenter.hidden").removeClass("hidden");
		},
	});
	$(".controlCenter").touchMov({
		mov: "y",
		movUp: function (e) {
			$(e.currentTarget).addClass("hidden");
			$(e.currentTarget).parent().removeClass("blur");
		},
	});

	$(".mainScreen .appScreen").mousedown(function (e) {
		if ($(this).parent().hasClass("shakingApps")) return false;
		let timeout = setTimeout(() => {
			if (!globalState.draggScreen) {
				if ($(e.target).hasClass("app") || $(e.target).parents(".app").length) {
					$(this).parent().addClass("filterBlur");
					let app;
					if ($(e.target).hasClass("app")) {
						app = $(e.target);
					} else {
						app = $(e.target).parents(".app");
					}
					let appClon = app.clone();
					appClon.attr("id", "fixedApp");
					appClon.css({
						top: app[0].getBoundingClientRect().top,
						left: app[0].getBoundingClientRect().left,
						width: app[0].getBoundingClientRect().width,
					});
					$("body").append(appClon);
					let rectsIphone = $(".iphone .黑色边框")[0].getBoundingClientRect();
					let rectsApp = appClon.children(".应用图标")[0].getBoundingClientRect();
					let cssMenu = `left: ${
						rectsIphone.x + rectsIphone.width - rectsApp.x >= 190 ? rectsApp.x : rectsApp.x + rectsApp.width - 190
					}px;`;
					if (rectsIphone.top + 65 * 2 >= rectsApp.top) {
						cssMenu += `top : ${rectsApp.y + rectsApp.height}px; transform: translateY(10px)`;
					} else {
						cssMenu += `top: ${rectsApp.y}px; transform: translateY(calc(-100% - 10px));`;
					}
					$("body").append(`
<div class="fixedMenuFixedApp" style="${cssMenu}">
<div class="菜单选项 卸载">卸载应用
<div class="应用图标">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<circle cx="32" cy="32" r="30"></circle>
<path d="M48 32H16"></path>
</svg>
</div>
</div>
<div class="菜单选项 shaking">编辑主屏幕
<div class="应用图标">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<path d="M14 59a3 3 0 0 0 3 3h30a3 3 0 0 0 3-3v-9H14zM50 5a3 3 0 0 0-3-3H17a3 3 0 0 0-3 3v5h36zm0 45V10m-36 0v40"></path>
<circle cx="32" cy="56" r="2"></circle>
</svg>
</div>
</div>
</div>
`);
				} else {
					$(this).parent().addClass("shakingApps");
					$(".appScreen .app").append('<div class="removeApp"></div>');
				}
			}
		}, 1000);
		$(this).mouseup(function () { clearTimeout(timeout); });
		$(this).mouseleave(function () { clearTimeout(timeout); });
	});
	$("body").on("click", ".fixedMenuFixedApp .菜单选项.shaking", function () {
		$(this).parent().remove();
		$("#fixedApp").remove();
		$(".mainScreen").removeClass("filterBlur").addClass("shakingApps");
		$(".appScreen .app").append('<div class="removeApp"></div>');
	});
	$(".exitShake").click(function () {
		$(".mainScreen").removeClass("shakingApps");
		$(".appScreen .app .removeApp").remove();
	});
	$(".widgetPlus").click(function () {
		$(".widgetScreen").removeClass("hidden");
		$(".appScreen .app .removeApp").remove();
		$(".mainScreen").removeClass("shakingApps").addClass("widgetScreenOpen");
	});
	$("body").on("click", ".fixedMenuFixedApp .菜单选项.卸载", function () {
		let idApp = $("#fixedApp").data("id");
		if (idApp == undefined) { var idDeck = $("#fixedApp").data("indeck"); }
		$(this).parent().remove();
		$("#fixedApp").remove();
		$(".mainScreen").removeClass("filterBlur");
		alertaiOS({
			encabezado: `你想将 ${idApp !== undefined ? globalState.apps[idApp].应用名 : "app"} 转移到应用库还是删除该应用？`,
			mensaje: "转移该应用将从您的主屏幕上删除它，但保留所有数据。",
			actions: [
				{ texto: "卸载应用", warning: true, callback: function () {
						if (idApp !== undefined) {
							globalState.apps.splice(idApp, 1);
							renderizarUI();
						} else if (idDeck) {
							$('.deckApps .app[data-indeck="' + idDeck + '"]').remove();
						}
					}, },
				{ texto: "转移到应用库", callback: function () { console.log("应用库功能待实现"); }, },
				{ texto: "取消", },
			],
		});
	});
	$(".appScreen").on("click", ".app .removeApp", function () {
		let idApp = $(this).parent(".app").data("id");
		if (idApp == "undefined") { var idDeck = $(this).parent(".app").data("indeck");}
		$(".appScreen .app .removeApp").remove();
		$(".mainScreen").removeClass("shakingApps");
		alertaiOS({
			encabezado: `你想将 ${idApp !== undefined && idApp !== "undefined" ? globalState.apps[idApp].应用名 : "app"} 转移到应用库还是删除该应用？`,
			mensaje: "转移该应用将从您的主屏幕上删除它，但保留所有数据。",
			actions: [
				{ texto: "卸载应用", warning: true, callback: function () {
						if (idApp !== undefined && idApp !== "undefined") {
							globalState.apps.splice(idApp, 1);
							renderizarUI();
						} else if (idDeck) {
							$('.deckApps .app[data-indeck="' + idDeck + '"]').remove();
						}
					}, },
				{ texto: "转移到应用库", callback: function () { console.log("应用库功能待实现"); }, },
				{ texto: "取消", },
			],
		});
	});
	$(".controlCenter .actionIcon").click(function () {
		$(this).toggleClass("active");
		if ($(this).hasClass("modoVuelo")) {
			$(this).siblings(".datosCelulares, .wifi").removeClass("active");
		} else if ($(this).hasClass("datosCelulares") || $(this).hasClass("wifi")) {
			$(this).siblings(".modoVuelo").removeClass("active");
		}
	});

	//-------------------------------------------------------------------------------------一些应用程序的用户界面----------------------//

	//-------------------------------------------------------------------------------------------------相机
	/**
	 * 启动相机应用程序。
	 */
	function 相机() {
		const appContainerClass = "相机App";
		let $appContainer = $(`.${appContainerClass}`);

		if (!$appContainer.length) {
			$appContainer = $(`
      <div class="${appContainerClass} genericAppContainer hidden">
        <div class="topBar">
          <div class="backButton">返回</div>
          <h3 class="title">相机</h3>
           <div class="camIco flash">
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <path d="M41 6L13 34h14.187L23 58l27.998-29.999H37L41 6z"></path>
            </svg>
          </div>
          <div class="camIco chevronUp">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
              <path d="M20 40l11.994-14L44 40"></path>
            </svg>
          </div>
          <div class="camIco circles">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
              <path d="M45 32a17 17 0 0 1-9.8 5.7M22 34.8a17 17 0 1 1 26.2-8.5"></path>
              <path d="M15.8 26.3a17 17 0 1 1-5.8 2.3"></path>
              <path d="M32 54a17 17 0 0 1-3.3-16m3.3-6a17 17 0 1 1 6 26.5"></path>
            </svg>
          </div>
        </div>
        <div class="相机Area">
          <video id="camera_feed" autoplay playsinline></video>
        </div>
        <div class="modos相机">
          <div class="modo">慢动作</div>
          <div class="modo">视频</div>
          <div class="modo active">照片</div>
          <div class="modo">肖像</div>
          <div class="modo">全景</div>
        </div>
        <div class="obturadorArea">
          <div class="imgPreview" style="background-image: url(./src/黑客主角.png);"></div>
          <div class="obturador"></div>
          <div class="toggleCam">
            <div class="camIco">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                <path d="M54.741 28.14a23.002 23.002 0 0 1-39.088 19.124"></path>
                <path d="M9.065 33.62A23.008 23.008 0 0 1 31.917 8a22.934 22.934 0 0 1 16.262 6.732"></path>
                <path d="M2 24l7.065 9.619L18 26"></path>
                <path d="M62 38l-7.259-9.86L46 36"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `);
			$appContainer.css({
				'position': 'absolute', 'top': globalState.statusBarHeight + 'px', 'left': '0', 'width': '100%',
				'height': `calc(100% - ${globalState.statusBarHeight}px)`, 'background-color': '#000000',
				'overflow': 'hidden', 'box-sizing': 'border-box', 'z-index': '500',
				'display': 'flex', 'flex-direction': 'column',
				'transition': 'opacity 0.3s ease-out, transform 0.3s ease-out',
			});
			// Specific styles for camera app's topBar and content area
			$appContainer.find(".topBar").css({'color': '#fff', 'background-color': 'rgba(0,0,0,0.5)', 'height': '50px', 'flex-shrink': '0' });
            $appContainer.find(".topBar .title").css({'color':'#fff'});
			$appContainer.find(".相机Area").css({'flex-grow': '1', 'background-color': '#000', 'display':'flex', 'align-items':'center', 'justify-content':'center'});
            $appContainer.find(".modos相机").css({'height': '60px', 'background-color':'rgba(0,0,0,0.8)', 'color':'#fff', 'display':'flex', 'align-items':'center', 'justify-content':'space-around', 'flex-shrink':'0'});
            $appContainer.find(".obturadorArea").css({'height': '100px', 'background-color':'#000', 'color':'#fff', 'display':'flex', 'align-items':'center', 'justify-content':'space-around', 'flex-shrink':'0'});


			$(".mainScreen").append($appContainer);

			const backButtonSelector = `.${appContainerClass} .topBar .backButton`;
			$("body").off("click", backButtonSelector).on("click", backButtonSelector, function () {
				const $appToClose = $(this).closest(`.${appContainerClass}`);
				$appToClose.addClass("hidden");
				const video = document.getElementById("camera_feed");
				if (video && video.srcObject) {
					video.srcObject.getTracks().forEach(track => track.stop());
					video.srcObject = null;
				}
				$(".statusBar").removeClass("onlyLed camActiv");
				setTimeout(() => { $appToClose.hide(); }, 300);
			});
		}

		setTimeout(function () {
			const video = document.getElementById("camera_feed");
			if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
				navigator.mediaDevices
					.getUserMedia({ video: true, audio: false })
					.then((stream) => {
						video.srcObject = stream;
						video.play().catch(e => console.error("Video play error:", e));
						$(".statusBar").addClass("onlyLed camActiv");
						$appContainer.show().removeClass("hidden");
					})
					.catch((error) => {
						console.error("无法访问摄像头:", error);
						alertaiOS({
							encabezado: "摄像头错误",
							mensaje: "无法访问您的摄像头。请检查权限或确保没有其他应用正在使用它。",
							actions: [{ texto: "好的" }]
						});
					});
			} else {
				alertaiOS({
					encabezado: "功能不支持",
					mensaje: "您的浏览器不支持访问摄像头。",
					actions: [{ texto: "好的" }]
				});
			}
		}, 10); // Reduced delay for quicker UI update
	}

	$("body").on("click", '.app[data-app="app相机"]', function () {
		相机();
	});

	//-------------------------------------------------------------------------------------------------照片
	let importedImages = [];
	/**
	 * 启动照片应用程序。
	 */
	function 照片app() {
		const appContainerClass = "照片app";
		let $appContainer = $(`.${appContainerClass}`);
		if (!$appContainer.length) {
			$appContainer = $(`
      <div class="${appContainerClass} genericAppContainer hidden">
        <div class="topBar">
          <div class="backButton">返回</div>
          <h3 class="title">照片</h3>
          <div class="importButton">导入</div>
        </div>
        <input type="file" class="importInput" accept="image/*" style="display: none;">
        <div class="照片Area">
          <img src="./src/4.png" width="80px" height="120px" alt="预设图片">
          ${importedImages.map((url) => `<img src="${url}" width="80px" height="120px" alt="导入的图片">`).join("")}
        </div>
      </div>
    `);
			$appContainer.css({
				'position': 'absolute', 'top': globalState.statusBarHeight + 'px', 'left': '0', 'width': '100%',
				'height': `calc(100% - ${globalState.statusBarHeight}px)`, 'background-color': '#f0f0f0', // Light gray background
				'overflow': 'hidden', 'box-sizing': 'border-box', 'z-index': '500',
				'display': 'flex', 'flex-direction': 'column',
				'transition': 'opacity 0.3s ease-out, transform 0.3s ease-out',
			});
            $appContainer.find(".照片Area").css({'flex-grow':'1', 'overflow-y':'auto', 'padding':'10px'});
            $appContainer.find(".topBar .importButton").css({'color': '#007aff', 'cursor':'pointer', 'padding':'5px'});


			$(".mainScreen").append($appContainer);

			const backButtonSelector = `.${appContainerClass} .topBar .backButton`;
			$("body").off("click", backButtonSelector).on("click", backButtonSelector, function () {
				const $appToClose = $(this).closest(`.${appContainerClass}`);
				$appToClose.addClass("hidden");
				setTimeout(() => { $appToClose.hide(); }, 300);
			});

            // Import button specific to Photos app
            const importButtonSelector = `.${appContainerClass} .topBar .importButton`;
            $("body").off("click", importButtonSelector).on("click", importButtonSelector, function () {
                $appContainer.find(".importInput").click();
            });

            const importInputChangeSelector = `.${appContainerClass} .importInput`;
            $("body").off("change", importInputChangeSelector).on("change", importInputChangeSelector, function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        importedImages.push(e.target.result);
                        $appContainer.find(".照片Area").append(`<img src="${e.target.result}" width="80px" height="120px" alt="新导入的图片">`);
                    };
                    reader.readAsDataURL(file);
                    $(this).val('');
                }
            });

            const imageClickSelector = `.${appContainerClass} .照片Area img`;
            $("body").off("click", imageClickSelector).on("click", imageClickSelector, function () {
                if ($(".fullscreen-image-mask").length) {
                    $(".fullscreen-image-mask").remove();
                    return;
                }
                const imgSrc = $(this).attr("src");
                const mask = $('<div class="fullscreen-image-mask"></div>').css({
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center',
                    alignItems: 'center', zIndex: 10000, cursor: 'pointer'
                });
                const imgElement = $('<img>').attr('src', imgSrc).css({
                    maxWidth: '95%', maxHeight: '95%', objectFit: 'contain'
                });
                mask.append(imgElement);
                $appContainer.append(mask); // Append to the app container
                mask.on("click", function() { $(this).remove(); });
            });
		}
		$appContainer.show().removeClass("hidden");
	}

	$("body").on("click", '.app[data-app="app照片"]', function () {
		照片app();
	});

	//------------------------------------------------------------------------------------------------- 通用App启动器
	/**
	 * 通用应用程序启动函数。
	 * @param {string} appName - 应用程序的名称 (用于CSS类名和data-attribute)。
	 * @param {string} appTitle - 应用程序在顶部栏显示的标题。
	 * @param {string} iframeSrc - iframe的源URL。
	 * @param {boolean} [requiresMicrophone=false] - iframe是否需要麦克风权限。
	 */
	function launchApp(appName, appTitle, iframeSrc, requiresMicrophone = false) {
		const appContainerClass = `${appName}AppContainer`; // e.g., EasyChessAppContainer
		let $appContainer = $(`.${appContainerClass}`);

		if (!$appContainer.length) {
			let iframeAttrs = `src="${iframeSrc}" class="${appName}Frame" frameborder="0" style="flex-grow: 1; width: 100%; height: 100%; border: none;"`;
			if (requiresMicrophone) {
				iframeAttrs += ` allow="microphone"`;
			}

			// Create the app container HTML structure
			$appContainer = $(`
                <div class="${appContainerClass} genericAppContainer hidden">
                    <div class="topBar">
                        <div class="backButton">返回</div>
                        <h3 class="title">${appTitle}</h3>
                    </div>
                    <iframe ${iframeAttrs}></iframe>
                </div>
            `);

			// Apply essential CSS for positioning and layout
			$appContainer.css({
				'position': 'absolute',
				'top': globalState.statusBarHeight + 'px', // Position below the main status bar
				'left': '0',
				'width': '100%',
				'height': `calc(100% - ${globalState.statusBarHeight}px)`, // Full height below status bar
				'background-color': '#f7f7f7', // A neutral background
				'overflow': 'hidden',
				'box-sizing': 'border-box',
				'z-index': '500', // Above home screen, below system alerts
				'display': 'flex',
				'flex-direction': 'column',
				'opacity': '0', // Start hidden for animation
				'transform': 'scale(0.95)', // Start scaled down for animation
				'transition': 'opacity 0.25s ease-out, transform 0.25s ease-out'
			});

            // Style the topBar within the app
            $appContainer.find('.topBar').css({
                'height': '36px',
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                'padding': '0 10px',
                'background-color': '#f7f7f7', // iOS-like top bar
                'border-bottom': '1px solid #cccccc',
                'flex-shrink': '0', // Prevent topBar from shrinking
                'box-sizing': 'border-box'
            });
            $appContainer.find('.topBar .backButton').css({
                'color': '#007aff',
                'cursor': 'pointer',
                'padding': '5px 10px'
            });
            $appContainer.find('.topBar .title').css({
                'font-weight': '600',
                'font-size': '17px',
                'position': 'absolute', // Center title
                'left': '50%',
                'transform': 'translateX(-50%)'
            });


			$(".mainScreen").append($appContainer);

			// Back button event handler (ensure it's bound only once per app type)
			const backButtonSelector = `.${appContainerClass} .topBar .backButton`;
			$("body").off("click", backButtonSelector).on("click", backButtonSelector, function () {
				const $appToClose = $(this).closest(`.${appContainerClass}`);
				$appToClose.css({'opacity': '0', 'transform': 'scale(0.95)'}); // Trigger exit animation
				setTimeout(() => {
					$appToClose.hide();
				}, 250); // Match animation duration
			});
		}

		// Show App: Ensure it's visible and trigger entry animation
		$appContainer.show();
        setTimeout(() => { // Timeout to allow CSS to apply for transition
            $appContainer.css({'opacity': '1', 'transform': 'scale(1)'});
        }, 10);
	}

	// 更新应用点击事件以使用launchApp
	$("body").on("click", '.app[data-app="appEasyChess"]', function () {
		launchApp("EasyChess", "Easy Chess", "./apps/EasyChess/index.html");
	});

	$("body").on("click", '.app[data-app="app音乐"]', function () {
		launchApp("音乐", "音乐", "./apps/音乐播放器/index.html");
	});

	$("body").on("click", '.app[data-app="app黑白棋"]', function () {
		launchApp("黑白棋", "黑白棋", "./apps/黑白棋/index.html");
	});

	$("body").on("click", '.app[data-app="app扫雷"]', function () {
		launchApp("扫雷", "扫雷", "./apps/扫雷/index.html");
	});

	$("body").on("click", '.app[data-app="app视频"]', function () {
		launchApp("视频", "视频", "./apps/video/index.html");
	});

	$("body").on("click", '.app[data-app="appOpen-LLM-VTuber"]', function () {
		launchApp("OpenLLMVTuber", "Open-LLM-VTuber", "http://localhost:12393/", true);
	});

});
