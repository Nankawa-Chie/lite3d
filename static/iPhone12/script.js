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
			/*this.append(
				`<div class="日期Wrapper"><p class="diaNom">${
					config.diaCompleto ? dia : dia.substring(0, 3)
				}</p><p class="diaNum">${hoy}</p></div>`
			);*/
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
			/* this.text(
				`${mes}${hoy}号 ，${config.diaCompleto ? dia : dia.substring(0, 3)}`
			); */
			return this;
		},
	});

	//---------------------------------------------------------------------------------------------- 功能
	function sanearString(string) {
		return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	}
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
	function alertaiOS(config) {
		if ($("#iOSAlert").length || $(".mainScreen").hasClass("锁屏")) return false;
		config = jQuery.extend(
			{
				wrapper: $(".iphone .黑色边框"),
				actions: [
					{
						texto: "Aceptar",
						warning: true,
						// callback: function(){console.log('callback aceptar')}
					},
					{
						texto: "取消",
						warning: false,
						// callback: function () { console.log('callback 取消') }
					},
				],
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
			$("#iOSAlert").fadeOut(function () {
				$(this).remove();
			});
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
			.fadeIn("fast", function () {
				$(this).children(".容器").removeClass("hidAnim");
			})
			.css("display", "flex");
		$(document).on("click", "#iOSAlert .action", function (e) {
			let action = config.actions[$(e.currentTarget).index()];
			if (action.callback && typeof action.callback == "function") {
				action.callback(e);
			}
			if (config.closeOnActions) {
				$(document).off("click", "#iOSAlert .action");
				$("#iOSAlert").fadeOut("fast", function () {
					$(this).remove();
				});
			}
		});
		if (config.hasOwnProperty("autoclose")) {
			setTimeout(function () {
				$(document).off("click", "#iOSAlert .action");
				$("#iOSAlert").fadeOut("fast", function () {
					$(this).remove();
				});
			}, config.autoclose);
		}
		$(document).on("click", "#iOSAlert .closable", function () {
			$(document).off("click", "#iOSAlert .action");
			$("#iOSAlert").fadeOut("fast", function () {
				$(this).remove();
			});
		});
	}

	function renderizarUI() {
		//将所有应用程序渲染在主容器中
		pintarApps(globalState.apps, $(".wrapperApps"), $(".wrapperDots"));
		//如果日历小部件存在
		if ($('.wrapperApps .app[data-app="widgetFull日历"]').length) {
			//准备日历小部件
			$('.wrapperApps .app[data-app="widgetFull日历"] .应用图标').append(
				'<div class="eventos"><p>' + getToday() + '</p></div><div class="日历Wrapper"></div>'
			);
			//创建日历小部件
			$('.wrapperApps .app[data-app="widgetFull日历"] .应用图标 .日历Wrapper').日历();
		}
		//如果日历动态应用图标存在
		if ($(".wrapperApps .app.日历动态").length) {
			//日历动态应用图标
			$(".wrapperApps .app.日历动态 .应用图标").日期应用图标();
		}
		//如果动态模拟时钟存在
		if ($(".wrapperApps .app.时钟动态").length) {
			//动态模拟时钟
			$(".wrapperApps .app.时钟动态 .应用图标").时钟();
		}
	}

	function getToday() {
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var week = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
		return "今天是" + year + "." + month + "." + day + "，星期" + week;
	}
	//----------------------------------------------------------------------------------------- 原始动画
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
			sonido.play();
		}
		$("#iOSAlert").remove();
		$(this).toggleClass("active");
		$(".mainScreen").toggleClass("锁屏");
	});
	$("#switch").on("click", function () {
		$(this).toggleClass("active");
		$(".iphone").toggleClass("showBackSide");
	});
	$("#voiceup").on("click", function () {
		$;
	});
	$("#voicedown").on("click", function () {
		$;
	});

	encendido();
	//在状态栏中显示时间
	$(".statusBar .时间").时间();
	//在锁屏界面中显示时间
	$(".lockScreen .时间").时间();
	//在锁屏界面中显示日期
	$(".lockScreen .日期").日期();
	//在Widget中心屏幕的事件块中显示当天的事件
	$(".widgetCenter .block.eventos").日期应用图标({ diaCompleto: true });

	//锁屏界面的触摸动作
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
			//Timeout 模拟电池耗尽
			if (!globalState.电量低) {
				setTimeout(() => {
					alertaiOS({
						encabezado: "电池电量低。",
						mensaje: "剩余 20% 备用核能电源",
						actions: [
							{
								texto: "Ok",
							},
						],
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
			transform = e.currentTarget.style.transform;
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

	//------------------------------------------------------------------------长按应用程序1秒后显示浮动菜单
	$(".mainScreen .appScreen").mousedown(function (e) {
		if ($(this).parent().hasClass("shakingApps")) return false;
		let timeout = setTimeout(() => {
			console.log("a");
			if (!globalState.draggScreen) {
				if ($(e.target).hasClass("app") || $(e.target).parents(".app").length) {
					//Dio click en una app. Ok, le mostraremos el menu flotante
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
					//---------------------------------------------------------------------现在是抖动应用程序的时间了
					$(this).parent().addClass("shakingApps");
					$(".appScreen .app").append('<div class="removeApp"></div>');
				}
			}
		}, 1000);
		$(this).mouseup(function () {
			clearTimeout(timeout);
		});
		$(this).mouseleave(function () {
			clearTimeout(timeout);
		});
	});
	//从应用程序浮动菜单启动抖动应用程序
	$("body").on("click", ".fixedMenuFixedApp .菜单选项.shaking", function () {
		$(this).parent().remove();
		$("#fixedApp").remove();
		$(".mainScreen").removeClass("filterBlur").addClass("shakingApps");
		$(".appScreen .app").append('<div class="removeApp"></div>');
	});
	//退出应用程序删除模式（抖动应用程序）
	$(".exitShake").click(function () {
		$(".mainScreen").removeClass("shakingApps");
		$(".appScreen .app .removeApp").remove();
	});
	//显示Widget屏幕
	$(".widgetPlus").click(function () {
		$(".widgetScreen").removeClass("hidden");
		$(".appScreen .app .removeApp").remove();
		$(".mainScreen").removeClass("shakingApps").addClass("widgetScreenOpen");
	});
	//卸载应用
	$("body").on("click", ".fixedMenuFixedApp .菜单选项.卸载", function () {
		let idApp = $("#fixedApp").data("id");
		if (idApp == undefined) {
			var idDeck = $("#fixedApp").data("indeck");
		}
		$(this).parent().remove();
		$("#fixedApp").remove();
		$(".mainScreen").removeClass("filterBlur");
		alertaiOS({
			encabezado: `你想将 ${idApp !== undefined ? globalState.apps[idApp].应用名 : "app"} 转移到应用库还是删除该应用？`,
			mensaje: "转移该应用将从您的主屏幕上删除它，但保留所有数据。",
			actions: [
				{
					texto: "卸载应用",
					warning: true,
					callback: function () {
						if (idApp !== undefined) {
							globalState.apps.splice(idApp, 1);
							renderizarUI();
						} else if (idDeck) {
							$('.deckApps .app[data-indeck="' + idDeck + '"]').remove();
						}
					},
				},
				{
					texto: "转移到应用库",
					callback: function () {
						console.log("Biblioteca de apps pendiente");
					},
				},
				{
					texto: "取消",
				},
			],
		});
	});
	$(".appScreen").on("click", ".app .removeApp", function () {
		let idApp = $(this).parent(".app").data("id");
		if (idApp == "undefined") {
			var idDeck = $(this).parent(".app").data("indeck");
		}
		$(".appScreen .app .removeApp").remove();
		$(".mainScreen").removeClass("shakingApps");
		alertaiOS({
			encabezado: `你想将 ${idApp !== undefined ? globalState.apps[idApp].应用名 : "app"} 转移到应用库还是删除该应用？`,
			mensaje: "转移该应用将从您的主屏幕上删除它，但保留所有数据。",
			actions: [
				{
					texto: "卸载应用",
					warning: true,
					callback: function () {
						if (idApp !== undefined) {
							globalState.apps.splice(idApp, 1);
							renderizarUI();
						} else if (idDeck) {
							$('.deckApps .app[data-indeck="' + idDeck + '"]').remove();
						}
					},
				},
				{
					texto: "转移到应用库",
					callback: function () {
						console.log("Biblioteca de apps pendiente");
					},
				},
				{
					texto: "取消",
				},
			],
		});
	});
	//--------------------------------------------------------------------------控制中心应用程序图标的切换开关
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
	function 相机() {
		if (!$(".相机App").length) {
			$(".mainScreen").append(`
      <div class="相机App hidden">
        <div class="topBar">
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
          <video id="camera_feed" autoplay></video>
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
          <div class="obturador" onclick="takePicture()"></div>
          <div class="toggleCam" onclick="toggleCamera()">
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
			$(".相机App").touchMov({
				mov: "y",
				movUp: function (e) {
					$(e.currentTarget).addClass("hidden");
					$(".statusBar").removeClass("onlyLed camActiv");
				},
			});
		}
		setTimeout(function () {
			// 捕获摄像头
			const video = document.getElementById("camera_feed");
			navigator.mediaDevices
				.getUserMedia({ video: true, audio: false })
				.then((stream) => {
					video.srcObject = stream;
					video.play();
				})
				.catch((error) => {
					console.error("Could not access camera", error);
				});
			$(".statusBar").addClass("onlyLed camActiv");
			$(".相机App").removeClass("hidden");
		}, 100);
	}

	$("body").on("click", '.app[data-app="app相机"]', function () {
		相机();
	});
});

//-------------------------------------------------------------------------------------------------照片
let importedImages = [];

function 照片app() {
	if (!$(".照片app").length) {
		$(".mainScreen").append(`
      <div class="照片app">
        <div class="topBar">
          <div class="backButton">返回</div>
          <h3 class="title">照片</h3>
          <div class="importButton">导入</div>
        </div>
        <input type="file" class="importInput" accept="image/*" style="display: none;">
        <div class="照片Area">
          <img src="./src/4.png" width="80px" height="120px">
          ${importedImages.map((url) => `<img src="${url}" width="80px" height="120px">`).join("")}
        </div>
      </div>
    `);
	}
}

$("body").on("click", '.app[data-app="app照片"]', function () {
	照片app();
});

$("body").on("click", ".照片app .backButton", function () {
	$(".照片app").addClass("hidden");
	setTimeout(function () {
		$(".照片app").remove();
	}, 1000);
});

$("body").on("click", ".照片app .照片Area img", function () {
	if ($(this).hasClass("fullScreen")) {
		$(this).removeClass("fullScreen");
	} else {
		$(this).addClass("fullScreen");
	}
});

$("body").on("click", ".照片app .importButton", function () {
	$(".照片app .importInput").click();
});

$("body").on("change", ".照片app .importInput", function (e) {
	const file = e.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = function (e) {
			importedImages.push(e.target.result);
			$(".照片app .照片Area").append(`<img src="${e.target.result}" width="80px" height="120px">`);
		};
		reader.readAsDataURL(file);
	}
});
//-------------------------------------------------------------------------------------------------主部件
$("body").on("click", ".contenido .应用图标", function () {
	$(".mainScreen").append(`

  `);
});

$("body").on("click", " .closeButton", function () {
	$("").remove();
});

$("body").on("click", "", function (e) {});
//-------------------------------------------------------------------------------------------------EasyChess
function EasyChess() {
	if (!$(".EasyChess").length) {
		$(".mainScreen").append(`
      <div class="EasyChess">
        <div class="topBar">
          <div class="backButton">Back</div>
          <h3 class="title">Easy Chess</h3>
        </div>
        <iframe src="./apps/EasyChess/index.html" class="EasyChessFrame"></iframe>
      </div>
    `);
	}
}

$("body").on("click", '.app[data-app="appEasyChess"]', function () {
	EasyChess();
});

$("body").on("click", ".EasyChess .backButton", function () {
	$(".EasyChess").addClass("hidden");
	setTimeout(function () {
		$(".EasyChess").remove();
	}, 1000);
});

//-------------------------------------------------------------------------------------------------音乐
function 音乐() {
	if (!$(".音乐").length) {
		$(".mainScreen").append(`
      <div class="音乐">
        <div class="topBar">
          <div class="backButton">Back</div>
          <h3 class="title">音乐</h3>
        </div>
        <iframe src="./apps/音乐播放器/index.html" class="音乐Frame"></iframe>
      </div>
    `);
	}
}

$("body").on("click", '.app[data-app="app音乐"]', function () {
	音乐();
});

$("body").on("click", ".音乐 .backButton", function () {
	$(".音乐").addClass("hidden");
	setTimeout(function () {
		$(".音乐").remove();
	}, 1000);
});

//-------------------------------------------------------------------------------------------------黑白棋
function 黑白棋() {
	if (!$(".黑白棋").length) {
		$(".mainScreen").append(`
      <div class="黑白棋">
        <div class="topBar">
          <div class="backButton">Back</div>
          <h3 class="title">黑白棋</h3>
        </div>
        <iframe src="./apps/黑白棋/index.html" class="黑白棋Frame"></iframe>
      </div>
    `);
	}
}

$("body").on("click", '.app[data-app="app黑白棋"]', function () {
	黑白棋();
});

$("body").on("click", ".黑白棋 .backButton", function () {
	$(".黑白棋").addClass("hidden");
	setTimeout(function () {
		$(".黑白棋").remove();
	}, 1000);
});

//-------------------------------------------------------------------------------------------------扫雷
function 扫雷() {
	if (!$(".扫雷").length) {
		$(".mainScreen").append(`
      <div class="扫雷">
        <div class="topBar">
          <div class="backButton">Back</div>
          <h3 class="title">扫雷</h3>
        </div>
        <iframe src="./apps/扫雷/index.html" class="扫雷Frame"></iframe>
      </div>
    `);
	}
}

$("body").on("click", '.app[data-app="app扫雷"]', function () {
	扫雷();
});

$("body").on("click", ".扫雷 .backButton", function () {
	$(".扫雷").addClass("hidden");
	setTimeout(function () {
		$(".扫雷").remove();
	}, 1000);
});

//-------------------------------------------------------------------------------------------------视频
function openVideoApp() {
	if (!$(".videoApp").length) {
		$(".mainScreen").append(`
        <div class="videoApp">
            <div class="topBar">
                <div class="backButton">返回</div>
                <h3 class="title">视频</h3>
            </div>
            <iframe src="./apps/video/index.html" frameborder="0" class="videoFrame"></iframe>
        </div>
     `);
	} else {
		$(".videoApp").removeClass("hidden"); // 如果已经存在，则显示
		$(".videoApp").show(); // 确保display是block
	}
}

$("body").on("click", '.app[data-app="app视频"]', function () {
	openVideoApp();
});

$("body").on("click", ".videoApp .backButton", function () {
	$(".videoApp").addClass("hidden");
	setTimeout(function () {
		$(".videoApp").hide(); // 1秒后隐藏
	}, 1000); // 1秒后隐藏
});
