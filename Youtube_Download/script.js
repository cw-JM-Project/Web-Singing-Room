var main = document.querySelector('.main');

var mp3Btn = document.querySelector('#mp3-button');
var playlistBtn = document.querySelector('#playlist-button')

mp3Btn.style.display = 'none';
playlistBtn.style.display = 'none';

var URLinput = document.querySelector('.URL-input');
var searchBtn = document.querySelector('#search-button')

var baseURL = 'https://denisytdl.herokuapp.com';

window.addEventListener("pageshow", () => {
  URLinput.value = "";
  URLinput.focus();
});

var source = 'yt';

URLinput.addEventListener('input', inputQuery)
mp3Btn.addEventListener("click", function(){downloadMp3(this.id)})
searchBtn.addEventListener("click", function(){
  if(URLinput.value == ''){
    alert('Please write something on the search bar first. :)');
    return;
  }
  
  let request = new XMLHttpRequest();
  let url = `${baseURL}/search?Query=${URLinput.value}`;
  
  request.open('GET', url);
  request.responseType = 'text';
  request.onload = function() {
    let info = request.response;
    let json = JSON.parse(info);
    removeResults();
    addResults(json);
  };
  request.send();
})
URLinput.addEventListener("keypress", function(e){
  if(e.keyCode === 13){
    if(playlistBtn.style.display == 'none'){
      searchBtn.click();
    }else if(searchBtn.style.display == 'none'){
      playlistBtn.click();
    }
  }
})
playlistBtn.addEventListener("click", function(){
  if(URLinput.value == ''){
    alert('Please write something on the search bar first. :)');
    return;
  }
  
  let playlistID = getPLaylistID(URLinput.value);

  let request = new XMLHttpRequest();
  let url = `${baseURL}/ytPlaylist/?id=${playlistID}`;
  
  request.open('GET', url);
  request.responseType = 'text';
  request.onload = function() {
    let info = request.response;
    let json = JSON.parse(info);
    removeResults();
    addResults(json);
  };
  request.send();
})

//downloadMp3 and downloadMp4 functions work for both link and list results.
function downloadMp3(id){
  if(!id.startsWith('http')){
    id = URLinput.value;
  }
  console.log('Downloading: '+id);
  window.location.href = `${baseURL}/download/${source}/?URL=${id}`;
}



//Show correct style and buttons for the input given
function inputQuery(e){
  let input = e.target;
  
  //if we recieve input we remove the red border 
  input.style.border = "1px solid #0485ff";

  //while we are writing we show the search button
  searchBtn.style.display = 'inline-flex';

  //buttons are kept hidden unless you write out a link
  mp3Btn.style.display = 'none';
  playlistBtn.style.display = 'none';

  //header images are only shown if you insert a proper link
 
  //by default we use the youtube downloader
  source = 'yt';

  //if we delete and input is empty we show red around the bar
  if (input.value == '') {
    input.style.border = "2px solid #FF0000";
  }
  
  //if its a youtube link 
  if((input.value).startsWith('https://youtu') || (input.value).startsWith('https://www.youtu')){
    //if its a youtube playlist link we show the playlist button that lists the videos
    if((input.value).includes('&list=') || (input.value).includes('?list=')){
      playlistBtn.style.display = 'inline-flex';
    }else{
    //if its a normal video link we just show the mp3
      playlistBtn.style.display = 'none';
      mp3Btn.style.display = 'inline-flex';
    }
    //either way we hide the search button
    searchBtn.style.display = 'none';

    //we show the youtube logo
    
  }

}

function addResults(json){

  json = fixElements(json);

  if(json.error != undefined){
    alert(json.error.message);
    return;
  }

  var resultsDiv = document.querySelector('.resultsArea');
  var item = document.querySelector('.results-item');
  for(var i = 0;i<json.items.length;i++){
	
    if(json.items[i].id.kind == 'youtube#video' || json.items[i].kind == 'youtube#playlistItem'){
      var clone = item.cloneNode(true);
      //add image and length
      clone.childNodes[1].childNodes[1].src = json.items[i].snippet.thumbnails.medium.url;
      clone.childNodes[1].childNodes[3].innerHTML = json.items[i].snippet.length;
      //add title,Channel name,Video Views and Release Date
      clone.childNodes[3].childNodes[1].innerHTML = json.items[i].snippet.title;
      clone.childNodes[3].childNodes[3].childNodes[1].innerHTML = json.items[i].snippet.channelTitle;
      clone.childNodes[3].childNodes[3].childNodes[3].innerHTML = json.items[i].snippet.views;
      clone.childNodes[3].childNodes[3].childNodes[5].innerHTML = json.items[i].snippet.publishTime;
      //add youtube videoID to the buttons
      if(json.items[i].kind == 'youtube#playlistItem'){
        clone.childNodes[3].childNodes[5].id = 'https://youtube.com/watch?v=' + json.items[i].snippet.resourceId.videoId;
        clone.childNodes[3].childNodes[7].id = 'https://youtube.com/watch?v=' + json.items[i].snippet.resourceId.videoId;
      }else{
        clone.childNodes[3].childNodes[5].id = 'https://youtube.com/watch?v=' + json.items[i].id.videoId;
        clone.childNodes[3].childNodes[7].id = 'https://youtube.com/watch?v=' + json.items[i].id.videoId;
      }
      
      resultsDiv.appendChild(clone);
    }
  }
  console.log('Finished showing results');
}

function fixElements(json){
  console.log(json.items);
//fix timestamp======================================================
  for(i in json.items){
    if(json.items[i].id.kind == 'youtube#video' || json.items[i].kind == 'youtube#playlistItem'){
      //REMOVE PT from timestamp
      let tmp = json.items[i].snippet.length;
      tmp = tmp.substring(2, tmp.length)
      //lets use a as a temporary variable to store number of hours/minutes/seconds
      let a = '';
      let timestamp = '';
      let hours = '',minutes = '',seconds = '';
      /*A timestamp format is like this: PT2M15S. This shows a video 2mins and 15 secons long
       */
      for (let i = 0; i < tmp.length; i++) {
        if(tmp[i]== 'H' || tmp[i]== 'M' || tmp[i]== 'S' ){
            if(parseInt(a) < 10){
              a = '0' + a;
            }
            if(tmp[i] == 'H'){
              hours = a;
            }
            if(tmp[i] == 'M'){
              minutes = a;
            }
            if(tmp[i] == 'S'){
              seconds = a;
            }
            a = '';
            continue;
        }
        a +=tmp[i];
      }
      
      console.log(hours+'>'+minutes+'>'+seconds);

      if(hours != ''){
        timestamp += hours + ':';
      }
      if(minutes != ''){
        timestamp += minutes + ':';
      //if minutes are 0 but the video is >= 1 hr, then we have to still show the minutes
      //if the video is shorter than a minute, we still have to show the minutes as zeroes
      }else{
        if(hours != ''){
          timestamp += '00:';
        }
        if(seconds != ''){
          timestamp += '00:';
        }
      }
      if(seconds == '' && minutes != ''){
        seconds = '00';
      }
      timestamp += seconds;
      
      json.items[i].snippet.length = timestamp;
    }
  }

//fix view count=====================================================
  for(i in json.items){
    if(json.items[i].id.kind == 'youtube#video' || json.items[i].kind == 'youtube#playlistItem'){
      let views = json.items[i].snippet.views;
      if(views >= 1000000000){
        views = Math.floor(views/1000000000) + 'B views';
      }
      if(views >= 1000000){
        views = Math.floor(views/1000000) + 'M views';
      }
      if(views >= 1000){
        views = Math.floor(views/1000) + 'K views';
      }
      if(views < 1000){
        views = views + ' views';G
      }
      json.items[i].snippet.views = views;
    }
  }

//fix release date===================================================
  for(i in json.items){
    if(json.items[i].id.kind == 'youtube#video' || json.items[i].kind == 'youtube#playlistItem'){
      console.log(json.items[i]);
      let date = (json.items[i].snippet.publishedAt).split('-');
      let day = date[2].split('T');
      date[2] = day[0];
      console.log(date);
      let videoDateInSeconds = new Date(`${date[0]}, ${date[1]}, ${date[2]}, 00:00`);
      let currentDate = new Date();

      var interval = Math.abs(currentDate - videoDateInSeconds) / 1000;
      let tmpInterval = interval;
      interval = interval / 31536000;
      console.log(interval)

      if (interval > 1) {
        json.items[i].snippet.publishTime = Math.floor(interval) + " years ago";
        continue;
      }
      interval = tmpInterval;
      interval = interval / 2592000;
      if (interval > 1) {
        json.items[i].snippet.publishTime = Math.floor(interval) + " months ago";
        continue;
      }
      interval = tmpInterval;
      interval = interval / 86400;
      if (interval > 1) {
        json.items[i].snippet.publishTime = Math.floor(interval) + " days ago";
        continue;
      }
      interval = tmpInterval;
      interval = interval / 3600;
      if (interval > 1) {
        json.items[i].snippet.publishTime = Math.floor(interval) + " hours ago";
        continue;
      }
      interval = tmpInterval;
      interval = interval / 60;
      if (interval > 1) {
        json.items[i].snippet.publishTime = Math.floor(interval) + " minutes ago";
        continue;
      }
      interval = tmpInterval;
      json.items[i].snippet.publishTime = Math.floor(interval) + " seconds ago";
    }
  }
  return json;
}

function removeResults(){
  var results = document.querySelectorAll('.results-item');
  if(results.length == 1){
    return;
  }else{
    for (let i = 1; i < results.length; i++) {
      results[i].remove();
    }
  }
  
  console.log('Finished deleting results')
}

function getPLaylistID(link){
  let IDPart = link.split('list=');
  return IDPart[1];
}
