
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

const mic_record = document.getElementById('mc_record');
const mic_stop = document.getElementById('mc_stop');
const mic_audio = document.getElementById('mc_audio');

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


if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    mic_record.onclick = function() {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      mic_record.style.background = "red";

      mic_stop.disabled = false;
      mic_record.disabled = true;
    }

    mic_stop.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      mic_record.style.background = "";
      mic_record.style.color = "";
      // mediaRecorder.requestData();

      mic_stop.disabled = true;
      mic_record.disabled = false;
    }

    mediaRecorder.onstop = function(e) {
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

      mic_audio.controls = true;
      const blob = new Blob(chunks, { 'type' : 'audio/mp3;' });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      mic_audio.src = audioURL;
      console.log("recorder stopped");

      deleteButton.onclick = function(e) {
        let evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      }

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

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  

  mc_source = audioCtx.createMediaStreamSource(stream);

  mc_analyser = audioCtx.createAnalyser();
  mc_analyser.fftSize = 2048;
  mc_bufferLength = mc_analyser.frequencyBinCount;
  mc_dataArray = new Uint8Array(mc_bufferLength);

  mc_source.connect(mc_analyser);
}