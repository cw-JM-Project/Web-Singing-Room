
import { PitchShifter } from './soundtouch.js';

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

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();
let shifter;

var fileInput = document.querySelector('input[type="file"]');

const echoBtn = document.getElementById('echo');
var description = "";

var recorder;


const loadSource = function (url) {
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
const play = function () {
  shifter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  audioCtx.resume().then(() => {
    is_playing = true;
    this.setAttribute('disabled', 'disabled');
  });
};

const pause = function (playing = false) {
  shifter.disconnect();
  is_playing = playing;
  playBtn.removeAttribute('disabled');
};

fileInput.addEventListener(
  "change",
  function () {
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      loadSource(this.result);
      playBtn.onclick = play;
      stopBtn.onclick = pause;
    });
    reader.readAsDataURL(this.files[0]);
    description += (this.files[0]).name.replace(/\..*|\s+/g, "");
  },
  false
);

tempoSlider.addEventListener('input', function () {
  tempoOutput.innerHTML = shifter.tempo = this.value;
});

pitchSlider.addEventListener('input', function () {
  pitchOutput.innerHTML = shifter.pitch = this.value;
  shifter.tempo = tempoSlider.value;
  
});

keySlider.addEventListener('input', function () {
  shifter.pitchSemitones = this.value;
  keyOutput.innerHTML = this.value / 2;
  shifter.tempo = tempoSlider.value;
});

volumeSlider.addEventListener('input', function () {
  volumeOutput.innerHTML = gainNode.gain.value = this.value;
});

progressMeter.addEventListener('click', function (event) {
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

echoBtn.addEventListener('click', function () {
  
  
});