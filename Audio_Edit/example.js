
import { PitchShifter } from './soundtouch.js';
//getElementById 메소드는 주어진 문자열과 일치하는 id 속성을 가진 요소를 찾고, 이를 나타내는 Element 객체 반환

const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const tempoSlider = document.getElementById('tempoSlider');
const tempoOutput = document.getElementById('tempo');
tempoOutput.innerHTML = tempoSlider.value;
const pitchSlider = document.getElementById('pitchSlider');
const pitchOutput = document.getElementById('pitch');
pitchOutput.innerHTML = pitchSlider.value;
const keySlider = document.getElementById('keySlider');
const keyOutput = document.getElementById('key');
keyOutput.innerHTML = keySlider.value;
const volumeSlider = document.getElementById('volumeSlider');
const volumeOutput = document.getElementById('volume');
volumeOutput.innerHTML = volumeSlider.value;
const currTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const progressMeter = document.getElementById('progressMeter');

const mic_record = document.getElementById('mc_record');
const mic_stop = document.getElementById('mc_stop');
const mic_audio = document.getElementById('mc_audio');

const down_button = document.getElementById('mp3-button');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();



let shifter;

var fileInput = document.querySelector('input[type="file"]');

var description = "";

var recorder;
let chunks = [];

var mc_source;
var mc_analyser;
var mc_bufferLength;
var mc_dataArray;

let loading_text = document.getElementsByClassName("loading")[0];

const loadSource = function (url) { //음성 파일 로드
  playBtn.setAttribute('disabled', 'disabled');
  if (shifter) {
    shifter.off();
  }
  fetch(url)
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      console.log('have array buffer');
      audioCtx.decodeAudioData(buffer, (audioBuffer) => {
        console.log('decoded the buffer');
        shifter = new PitchShifter(audioCtx, audioBuffer, 16384);
        shifter.tempo = tempoSlider.value;
        shifter.pitch = pitchSlider.value;
        loading_text.innerText="Loading Success!!"; 
        shifter.on('play', (detail) => {
          console.log(`timeplayed: ${detail.timePlayed}`);
          currTime.innerHTML = detail.formattedTimePlayed;
          progressMeter.value = detail.percentagePlayed;
        });
        duration.innerHTML = shifter.formattedDuration;
        playBtn.removeAttribute('disabled');
      });
    });
};

let is_playing = false;
const play = function () { //재생 기능
  shifter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  audioCtx.resume().then(() => {
    is_playing = true;
    this.setAttribute('disabled', 'disabled');
  });
};

const pause = function (playing = false) { //멈춤 기능
  shifter.disconnect();
  is_playing = playing;
  playBtn.removeAttribute('disabled');
};

fileInput.addEventListener( //파일 불러오기 
  "change",
  function () {
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      loadSource(this.result); //음성 파일 로드
      playBtn.onclick = play;
      stopBtn.onclick = pause;
    });
    reader.readAsDataURL(this.files[0]);
    description += (this.files[0]).name.replace(/\..*|\s+/g, "");
  },
  false
);

tempoSlider.addEventListener('input', function () { //속도 조절 기능
  tempoOutput.innerHTML = shifter.tempo = this.value;
});

pitchSlider.addEventListener('input', function () { //음정 높낮이 조절 기능
  pitchOutput.innerHTML = shifter.pitch = this.value;
  shifter.tempo = tempoSlider.value; // 음정인데 템포 조절하는건 왜 들어가 있어???????
  
});

keySlider.addEventListener('input', function () { //음성 키 조절 기능(음정에 따라 속도도 조절)
  shifter.pitchSemitones = this.value;
  keyOutput.innerHTML = this.value / 2;
  shifter.tempo = tempoSlider.value;
});

volumeSlider.addEventListener('input', function () { //볼륨 조절 기능
  volumeOutput.innerHTML = gainNode.gain.value = this.value;
});

progressMeter.addEventListener('click', function (event) { //재생 디스플레이 (초단위)
  const pos = event.target.getBoundingClientRect();
  const relX = event.pageX - pos.x;
  const perc = relX / event.target.offsetWidth;
  pause(is_playing);
  shifter.percentagePlayed = perc;
  progressMeter.value = 100 * perc;
  currTime.innerHTML = shifter.timePlayed;
  if (is_playing) {
    play();
  }
});

//녹음
if (navigator.mediaDevices.getUserMedia) { //마이크 액세스 허용했는가?
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    mic_record.onclick = function() { //start_record 버튼
      mediaRecorder.start(); //녹음 시작
      if (!is_playing) {
        play();
      }
      console.log(mediaRecorder.state); //녹음 되는지 확인
      console.log("recorder started");
      mic_record.style.background = "red"; //실행되면 레드 버튼

      mic_stop.disabled = false; //재생중이니까 멈춤 버튼 활성화
      mic_record.disabled = true; //녹음중이니까 녹음 버튼 비활성화
    }

    mic_stop.onclick = function() { //stop_record 버튼
      mediaRecorder.stop();
      pause();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      mic_record.style.background = "";
      mic_record.style.color = "";
      // mediaRecorder.requestData();

      mic_stop.disabled = true;
      mic_record.disabled = false;
    }

    mediaRecorder.onstop = function(e) { //stop 버튼 눌러졌을때 이벤트 발생
      console.log("data available after MediaRecorder.stop() called.");

      //const clipName = prompt('Enter a name for your sound clip?','My unnamed clip');

      //const clipContainer = document.createElement('article');
      //const clipLabel = document.createElement('p');
      
      const deleteButton = document.createElement('button');

      //clipContainer.classList.add('clip');
      mic_audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';

      /*if(clipName === null) {
        clipLabel.textContent = 'My unnamed clip';
      } else {
        clipLabel.textContent = clipName;
      }*/

      //clipContainer.appendChild(audio);
      //clipContainer.appendChild(clipLabel);
      //clipContainer.appendChild(deleteButton);
      //soundClips.appendChild(clipContainer);

      mic_audio.controls = true; //녹음한거 재생 디스플레이 띄우는 기능 html 넣어놨음
      
      const blob = new Blob(chunks, { 'type' : 'audio/mp3;' }); //블랍 객체 생성 오디오 중 mp3 형식의 데이터
      chunks = []; //그 데이터(chunks) 초기화
      const audioURL = window.URL.createObjectURL(blob); //녹음 디스플레이에 audio 넣어주려고 url 변수 생성
      mic_audio.src = audioURL; //소스에 값 audio url 부여
      console.log("recorder stopped");
      

      /*deleteButton.onclick = function(e) {
        let evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      }*/

      /*clipLabel.onclick = function() {
        const existingName = clipLabel.textContent;
        const newClipName = prompt('Enter a new name for your sound clip?');
        if(newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }*/
    }

    mediaRecorder.ondataavailable = function(e) { //chunks 배열에 녹음이 되는 순간 미디어레코더의 이벤트 발생
      chunks.push(e.data); //chunks에 축적된 음성 데이터 넣음
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError); //마이크 액세스 거부 당했을때 메세지 

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) { //웹 오디오 api 쓸 때 필요한 것들 초기화 
  

  mc_source = audioCtx.createMediaStreamSource(stream);

  mc_analyser = audioCtx.createAnalyser();
  mc_analyser.fftSize = 2048;
  mc_bufferLength = mc_analyser.frequencyBinCount;
  mc_dataArray = new Uint8Array(mc_bufferLength);

  mc_source.connect(mc_analyser);
}

down_button.addEventListener('click', function () {
  
  loading_text.innerText="Loading . . ."; 
  loadSource(`${'https://denisytdl.herokuapp.com'}/download/${'yt'}/?URL=${URLinput.value}`);
 
  
  playBtn.onclick = play;
  stopBtn.onclick = pause;
  console.log(`good`);
});

