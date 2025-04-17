
let photo = document.querySelector("img#Initial"),
  photoNumber,
  photoArray,
  slideShowInterval;


resetPhoto();

document.querySelector("input#loadPhotos").onclick = loadPhotos;
document.querySelector("input#loadJSON").onclick = loadJSON;
document.querySelector("input#First").onclick = firstPhoto;
document.querySelector("input#Previous").onclick = prevPhoto;
document.querySelector("input#Next").onclick = nextPhoto;
document.querySelector("div#photoFrame").onclick = nextPhoto;
document.querySelector("input#Last").onclick = lastPhoto;
document.querySelector("input#slideShow").onclick = slideShow;
document.querySelector("input#Random").onclick = randomSlideShow;
document.querySelector("input#Stop").onclick = stopSlideShow;
document.querySelector("input#Reset").onclick = resetPhoto;



function loadPhotos() {
  let photosFolder = document.querySelector("input#photosFolder").value;
  let commonName = document.querySelector("input#commonName").value;
  let startPhotoNumber = document.querySelector("input#startPhotoNumber").value;
  let endPhotoNumber = document.querySelector("input#endPhotoNumber").value;

  if (isValidRange(startPhotoNumber, endPhotoNumber)) {
    photoArray = [];
    photoNumber = 0;
  
    for (let i = startPhotoNumber; i <= endPhotoNumber; i++) {
      photoArray[i - startPhotoNumber] = photosFolder + commonName + i + ".jpg";
    }
  
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}



function loadJSON() {
  fetchJSON().then((photos) => {  /* LAMBDA */
    photoArray = [];
    photoNumber = 0;

    for (let i = 0; i < photos.images.length; i++) {
      photoArray[i] = photos.images[i].imageURL;
    }

    updateDisplayedPhoto(photoArray[photoNumber]);
  });
}

async function fetchJSON() { 
  let JSONURL = document.querySelector("input#JSONURL").value;
  const response = await fetch(JSONURL);
  const images = await response.json();
  return images;
}


function prevPhoto() {
  if(!isEmpty()) {
    photoNumber -= 1;
    if (photoNumber < 0) {
      photoNumber = photoArray.length - 1;
    }
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}



function nextPhoto() {
  if(!isEmpty()) {
    photoNumber += 1;
    if (photoNumber > photoArray.length - 1) {
      photoNumber = 0;
    }
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}


function firstPhoto() {
  if(!isEmpty()) {
    photoNumber = 0;
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}


function lastPhoto() {
  if(!isEmpty()) {
    photoNumber = photoArray.length - 1;
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}


function slideShow() {
  if(!isEmpty()) {
    slideShowInterval = setInterval("nextPhoto()", 1000);
  }
}

function randomPhoto() {
  photoNumber = Math.floor(Math.random() * photoArray.length);
  updateDisplayedPhoto(photoArray[photoNumber]);
}


function randomSlideShow() {
  if(!isEmpty()) {
    slideShowInterval = setInterval("randomPhoto()", 1000);
  }
}


function stopSlideShow() {
  clearInterval(slideShowInterval);
}

function isEmpty() {
  if(photoArray.length === 0) {
    // Update View
    document.querySelector("p#pageDescription").innerHTML = "Error: you must load data first";
    return true;
  }
  else {
    document.querySelector("p#pageDescription").innerHTML = "Photo Viewer System";
    return false;
  }
}

function isValidRange(start, end) {
  if(end >= start) {
    return true;
  }
  else {
    document.querySelector("p#pageDescription").innerHTML = "Error: invalid range";
    return false;
  }
}

function updateDisplayedPhoto(photoSrc) {
  photo.src = photoSrc;
  document.querySelector("input#displayedPhoto").value = photoSrc;
  isEmpty();
}


function resetPhoto() {
  photoArray = [];
  photoNumber = 0;
}