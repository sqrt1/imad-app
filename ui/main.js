console.log('Loaded!');
var element = document.getElementById('main-text');
element.innerHTML='New value';
var marginLeft = 0;
function moveRight(){
    marginLeft = marginLeft + 10;
    marginLeft = marginLeft +'px';
}
var img= document.getElementById('madi');
img.onclick = function(){
    var interval  = setInterval(moveRight, 100);
    
};
