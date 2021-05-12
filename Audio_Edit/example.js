
import { PitchShifter } from './soundtouch.js';
//getElementById 메소드는 주어진 문자열과 일치하는 id 속성을 가진 요소를 찾고, 이를 나타내는 Element 객체 반환

const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const tempoCtrl = document.getElementById('tempoSlider');
const tempoOutput = document.getElementById('tempo');
tempoOutput.innerHTML = tempoCtrl.value;
const pitchCtrl = document.getElementById('pitchSlider');
const pitchOutput = document.getElementById('pitch');
pitchOutput.innerHTML = pitchCtrl.value;
const keyCtrl = document.getElementById('keySlider');
const keyOutput = document.getElementById('key');
keyOutput.innerHTML = keyCtrl.value;
const volumeCtrl = document.getElementById('volumeSlider');
const volumeOutput = document.getElementById('volume');
volumeOutput.innerHTML = volumeCtrl.value;
const currTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const playMeter = document.getElementById('playMeter');

const mic_record = document.getElementById('mc_record');
const mic_stop = document.getElementById('mc_stop');
const mic_audio = document.getElementById('mc_audio');

const BringAudioBtn = document.getElementById('mp3-button');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();

let shifter;

var fileInput = document.querySelector('input[type="file"]');


let chunks = [];

var mic_source;
var mic_analyser;
var mic_bufferLength;

let loading_text = document.getElementsByClassName("loading")[0];


const loadSource = function (url) { //음성 파일 로드
  playBtn.setAttribute('disabled', 'disabled');
  if (shifter) { //기존 데이터가 있으면 초기화
    shifter.off();
  }
  fetch(url)
    .then((response) => response.arrayBuffer()) //response의 arrayBuffer를 buffer에 반환한다 
    .then((buffer) => {
      console.log('have array buffer');
      audioCtx.decodeAudioData(buffer, (audioBuffer) => { //buffer를 webaudioapi에 적용시킨다 적용시키면 아래 실행
        console.log('decoded the buffer');
        shifter = new PitchShifter(audioCtx, audioBuffer, 16384); //buffer를 기반으로 편집할 데이터 생성
        shifter.tempo = tempoCtrl.value; //템포 기본값 적용
        shifter.pitch = pitchCtrl.value; //피치 기본값 적용
        loading_text.innerText="Loading Success!!";  //로딩 완료
        shifter.on('play', (detail) => { //재생 시간 적용
          console.log(`timeplayed: ${detail.timePlayed}`);
          currTime.innerHTML = detail.formattedTimePlayed;
          playMeter.value = detail.percentagePlayed;
        });
        duration.innerHTML = shifter.formattedDuration;
        playBtn.removeAttribute('disabled');
      });
    });
};
BringAudioBtn.addEventListener('click', function () { //음성 추출
  
  loading_text.innerText="Loading . . ."; //로딩 중
  loadSource(`${'https://denisytdl.herokuapp.com'}/download/${'yt'}/?URL=${URLinput.value}`); 
  //heroku서버에 있는 유튜브 다운로더 api에 입력된URL 값을 보내 다운로드 실행
  playBtn.onclick = play;
  stopBtn.onclick = pause;
  console.log(`good`);
});


fileInput.addEventListener( //파일 불러오기 
  "change",
  function () {
    var fReader = new FileReader();
    fReader.addEventListener("load", function () {
      loadSource(this.result); //음성 파일 로드
      playBtn.onclick = play; //버튼 활성화
      stopBtn.onclick = pause; //버튼 활성화
    });
    fReader.readAsDataURL(this.files[0]);
  },
  false
);


let is_playing = false;
const play = function () { //재생
  shifter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  audioCtx.resume().then(() => {
    is_playing = true;
    this.setAttribute('disabled', 'disabled');
  });
};

const pause = function (playing = false) { //일시정지
  shifter.disconnect();
  is_playing = false;
  playBtn.removeAttribute('disabled');
};

volumeCtrl.addEventListener('input', function () { //볼륨 조절 기능
  volumeOutput.innerHTML = gainNode.gain.value = this.value;
});

tempoCtrl.addEventListener('input', function () { //속도 조절 기능
  tempoOutput.innerHTML = shifter.tempo = this.value;
});

pitchCtrl.addEventListener('input', function () { //음정 높낮이 조절 기능
  pitchOutput.innerHTML = shifter.pitch = this.value;
  shifter.tempo = tempoCtrl.value;
});

keyCtrl.addEventListener('input', function () { //음성 키 조절 기능(음정에 따라 속도도 조절)
  shifter.pitchSemitones = this.value;
  keyOutput.innerHTML = this.value / 2;
  shifter.tempo = tempoCtrl.value;
});


playMeter.addEventListener('click', function (event) { //재생 바(초단위)
  const pos = event.target.getBoundingClientRect();
  const relX = event.pageX - pos.x;
  const perc = relX / event.target.offsetWidth;
  pause(is_playing);
  shifter.percentagePlayed = perc;
  playMeter.value = 100 * perc;
  currTime.innerHTML = shifter.timePlayed;
  if (is_playing) {
    play();
  }
});


//녹음 기능
if (navigator.mediaDevices.getUserMedia) { //마이크 사용 권한 허용
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    mic_record.onclick = function() { 
      mediaRecorder.start(); //녹음 시작
      if (!is_playing) {
        play();
      }
      console.log(mediaRecorder.state);
      console.log("recorder started");
      mic_record.style.background = "red";
      mic_stop.disabled = false; //중지(완료) 버튼 활성화
      mic_record.disabled = true; //녹음 버튼 비활성화
    }

    mic_stop.onclick = function() { 
      mediaRecorder.stop(); //녹음 중지
      pause();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      mic_record.style.background = "";
      mic_record.style.color = "";
      mic_stop.disabled = true; //중지(완료) 버튼 비활성화
      mic_record.disabled = false; //녹음 버튼 활성화
    }

    mediaRecorder.onstop = function(e) { 
      console.log("data available after MediaRecorder.stop() called.");
      mic_audio.setAttribute('controls', '');
      mic_audio.controls = true;
      
      const blob = new Blob(chunks, { 'type' : 'audio/mp3;' }); //블랍 객체 생성
      chunks = []; //음성 데이터 배열 초기화
      const audioURL = window.URL.createObjectURL(blob); //가상 URL 생성
      mic_audio.src = audioURL; 
      console.log("recorder stopped");
  
    }

    mediaRecorder.ondataavailable = function(e) { //녹음 되면
      chunks.push(e.data); //배열 축적된 음성 데이터 저장
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError); //마이크 액세스 거부 당했을때 메세지 

} else {
   console.log('getUserMedia not supported on your browser!');
}


function visualize(stream) { //새로운 스트림 생성하여 스트림 초기화
  
  mic_source = audioCtx.createMediaStreamSource(stream);

  mic_analyser = audioCtx.createAnalyser();
  mic_analyser.fftSize = 2048;
  mic_bufferLength = mic_analyser.frequencyBinCount;
  
  mic_source.connect(mic_analyser);
}
