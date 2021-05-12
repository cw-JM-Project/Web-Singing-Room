var mp3Btn = document.querySelector('#mp3-button');
mp3Btn.style.display = 'none';
var URLinput = document.querySelector('.URL-input');

var baseURL = 'https://denisytdl.herokuapp.com';

window.addEventListener("pageshow", () => {
  URLinput.value = "";
  URLinput.focus();
});

var source = 'yt';

URLinput.addEventListener('input', inputQuery)

function inputQuery(e){
  let input = e.target;

  input.style.border = "1px solid #0485ff";
  mp3Btn.style.display = 'none';

  //입력했다가 삭제하면 겉부분 빨간색으로 변경
  if (input.value == '') {
    input.style.border = "2px solid #FF0000";
  }
  //만약 유튜브 링크라면
  if((input.value).startsWith('https://youtu') || (input.value).startsWith('https://www.youtu')){
    mp3Btn.style.display = 'flex';
    mp3Btn.style.left = "46.7%";
  }
}