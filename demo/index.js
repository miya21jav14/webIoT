var channel;
onload = async function(){
	// webSocketリレーの初期化
	var relay = RelayServer("chirimentest", "webiotteamg2022okayama" );
	channel = await relay.subscribe("control");
	channel.onmessage = getMessage;

	getData();
	getWeatherData();
}

function getMessage(msg){ // メッセージを受信したときに起動する関数
	var mdata = msg.data;
	console.log("mdata:",mdata);

	var temperature = Math.round(mdata.temperature * 10) / 10;
	var humidity = Math.round(mdata.humidity);
	var pressure = Math.round(mdata.pressure);
	var light_intensity = Math.round(mdata.light_intensity);

	if(temperature < -30 || humidity < 0 
		|| pressure < 0 || light_intensity <0
		|| mdata.upstream_level < 0){
		getData();
		return;
	}

	temTd.innerText = temperature;
	humTd.innerText = humidity;
	preTd.innerText = pressure;
	ligTd.innerText = light_intensity;
	timeStamp.innerText = getStrNowDate();

	setWaterLevel(mdata.upstream_level);
	//setGateOpen(mdata.gateopen);
	getWeatherData();
}

function getData(){ // get microbit's internal sensor data
	var sendData = makeSendBase();
	sendData.command = "GET SENSOR DATA";
	channel.send(sendData);
}

function openGate(){
	var sendData = makeSendBase();
	sendData.command = "OPEN GATE";
	channel.send(sendData);
}

function closeGate(){
	var sendData = makeSendBase();
	sendData.command = "CLOSE GATE";
	channel.send(sendData);
}

function controlGate(){
	var sendData = makeSendBase();
	sendData.command = "TARGET LEVEL";
	var level = document.getElementById("waterLevel").value;

	console.log('レベル:'+parseFloat(level)+'で水門を調整します。');
	sendData.level = parseFloat(level);
	channel.send(sendData);
}

function ledOn(mode){
	switch(mode) {
		case 'gate':
			console.log('gateモードでLEDを点灯します。');
			var sendData = makeSendBase();
			sendData.command = "LED MODE";
			sendData.mode = "gate";
			channel.send(sendData);
			break;
		case 'heat':
			console.log('heatモードでLEDを点灯します。');
			var sendData = makeSendBase();
			sendData.command = "LED MODE";
			sendData.mode = "heat";
			channel.send(sendData);
			break;
		case 'weather':
			console.log('weatherモードでLEDを点灯します。');
			var sendData = makeSendBase();
			sendData.command = "LED MODE";
			sendData.mode = "weather";
			channel.send(sendData);
			break;
		case 'error':
			console.log('errorモードでLEDを点灯します。');
			var sendData = makeSendBase();
			sendData.command = "LED MODE";
			sendData.mode = "error";
			channel.send(sendData);
			break;
		case 'game':
			console.log('gameモードでLEDを点灯します。');
			var sendData = makeSendBase();
			sendData.command = "LED MODE";
			sendData.mode = "identify";
			channel.send(sendData);
			break;
		default:
		  console.log('LEDを点灯しません。');
	}
}

function makeSendBase(){
	var base = new Object();
	base.command 		= "STATUS REPORT";
	base.destination 	= "sensor";
	base.sender 		= "server";
	return base;
}

function getStrNowDate(){
	var nDate = new Date();
	//「年」を取得する
	var YYYY = nDate.getFullYear();
	//「月」を取得する
	var MM   = nDate.getMonth()+1;
	//「日」を取得する
	var DD   = nDate.getDate();
	//「時」を取得する
	var hh   = nDate.getHours();
	//「分」を取得する
	var mm   = nDate.getMinutes();

	return YYYY+"年"+MM+"月"+DD+"日 "+hh+"時"+mm+"分 現在";
}

var latitude = 34.6888; 
var longitude = 133.9228;

//var latitude = 36.1473; 
//var longitude = 139.3886;

// 3時間後の天気情報を取得し画面へ反映する
async function getWeatherData(){
	var apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude='+latitude+'&longitude='+longitude;
	apiUrl += '&hourly=temperature_2m,weathercode,rain&timezone=Asia%2FTokyo&current_weather=true'
	var data = await window.fetch(apiUrl).then(response => response.json());
	
	var hourly = data.hourly;
	var current = data.current_weather;
	var dataNo = 0;
	
	for(var i=0; i<hourly.time.length; i++){
		if(hourly.time[i] === current.time){
			dataNo = i+3;
			break;
		}
	}

	exWxTd.innerHTML = generateWeatherIcon(hourly.weathercode[dataNo]);
	exTemTd.innerHTML = hourly.temperature_2m[dataNo];
	exRainTd.innerHTML = hourly.rain[dataNo];

	console.log(data);
}

// 天気コードより天気情報を取得する
const generateWeatherIcon = weatherCode => {
    const iconText = (() => {
      if(weatherCode === 0) return { text: '快晴'  , emoji: '☀' };  // 0 : Clear Sky
      if(weatherCode === 1) return { text: '晴れ'  , emoji: '🌤' };  // 1 : Mainly Clear
      if(weatherCode === 2) return { text: '一部曇', emoji: '⛅' };  // 2 : Partly Cloudy
      if(weatherCode === 3) return { text: '曇り'  , emoji: '☁' };  // 3 : Overcast
      if(weatherCode <= 49) return { text: '霧'    , emoji: '🌫' };  // 45, 48 : Fog And Depositing Rime Fog
      if(weatherCode <= 59) return { text: '霧雨'  , emoji: '🌧' };  // 51, 53, 55 : Drizzle Light, Moderate And Dense Intensity ・ 56, 57 : Freezing Drizzle Light And Dense Intensity
      if(weatherCode <= 69) return { text: '雨'    , emoji: '☔' };  // 61, 63, 65 : Rain Slight, Moderate And Heavy Intensity ・66, 67 : Freezing Rain Light And Heavy Intensity
      if(weatherCode <= 79) return { text: '雪'    , emoji: '☃' };  // 71, 73, 75 : Snow Fall Slight, Moderate And Heavy Intensity ・ 77 : Snow Grains
      if(weatherCode <= 84) return { text: '俄か雨', emoji: '🌧' };  // 80, 81, 82 : Rain Showers Slight, Moderate And Violent
      if(weatherCode <= 94) return { text: '雪・雹', emoji: '☃' };  // 85, 86 : Snow Showers Slight And Heavy
      if(weatherCode <= 99) return { text: '雷雨'  , emoji: '⛈' };  // 95 : Thunderstorm Slight Or Moderate ・ 96, 99 : Thunderstorm With Slight And Heavy Hail
      return                       { text: '不明'  , emoji: '✨' };
    })();
    return `<span class="wxIcon" title="${iconText.text}">${iconText.emoji}</span>`;
};

// 水深表示更新
function setWaterLevel(arg){
	waterLevel.innerText = Math.round(arg * 10) / 10;
	var waterImg = "";
	if(arg < 2){
		waterImg = '<img class="water_img" src="water_level_00.jpg"></img>';
	} else if(arg < 5) {
		waterImg = '<img class="water_img" src="water_level_01.jpg"></img>';
	} else {
		waterImg = '<img class="water_img" src="water_level_02.jpg"></img>';
	}
	waterImgDiv.innerHTML = waterImg;

}

// 水門の開き具合表示更新
function setGateOpen(arg){
	gateOpen.innerText = arg;
	var gateImg = "";
	if(arg == 0){
		gateImg = '<img class="gate_img" src="gate_open_00.png"></img>';
	} else if(arg < 0.5) {
		gateImg = '<img class="gate_img" src="gate_open_01.png"></img>';
	} else {
		gateImg = '<img class="gate_img" src="gate_open_02.png"></img>';
	}
	gateImgDiv.innerHTML = gateImg;

}

function toggleHidden(){
	if(hiddenArea.className == "display_on"){
		hiddenArea.className = "display_off";
	} else {
		hiddenArea.className = "display_on";
	}
}

function playOpenGate(){
	if(window.confirm("水門を開きます。よろしいですか？")){
		openGate();
	}
}

function playCloseGate(){
	if(window.confirm("水門を閉じます。よろしいですか？")){
		closeGate();
	}
}

var cnt = 0;

function changeImg(){
	cnt++;
	if(cnt === 3){
		cnt = 0;
	}

	var imgsrc = "water_level_0"+cnt+".jpg";
	console.log(imgsrc);
	var elem = document.getElementById("waterImg22");
	console.log(elem);
	elem.src = imgsrc;
}