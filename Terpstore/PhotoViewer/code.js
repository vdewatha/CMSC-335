"use strict";

let photo = document.querySelector("img#photo"),
  photoNumber,
  photoArray,
  slideShowInterval;
const intervalInMilliseconds = 1000;

resetPhoto();

document.querySelector("input#loadPhotosButton").onclick = loadPhotos;

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

document.querySelector("input#loadJSONButton").onclick = loadJSON;

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

document.querySelector("input#previousPhotoButton").onclick = prevPhoto;

function prevPhoto() {
  if(!isEmpty()) {
    photoNumber -= 1;
    if (photoNumber < 0) {
      photoNumber = photoArray.length - 1;
    }
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}

document.querySelector("input#nextPhotoButton").onclick = nextPhoto;
document.querySelector("div#photoFrame").onclick = nextPhoto;

function nextPhoto() {
  if(!isEmpty()) {
    photoNumber += 1;
    if (photoNumber > photoArray.length - 1) {
      photoNumber = 0;
    }
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}

document.querySelector("input#firstPhotoButton").onclick = firstPhoto;

function firstPhoto() {
  if(!isEmpty()) {
    photoNumber = 0;
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}

document.querySelector("input#lastPhotoButton").onclick = lastPhoto;

function lastPhoto() {
  if(!isEmpty()) {
    photoNumber = photoArray.length - 1;
    updateDisplayedPhoto(photoArray[photoNumber]);
  }
}

document.querySelector("input#slideShowButton").onclick = slideShow;

function slideShow() {
  if(!isEmpty()) {
    slideShowInterval = setInterval("nextPhoto()", intervalInMilliseconds);
  }
}

function randomPhoto() {
  photoNumber = Math.floor(Math.random() * photoArray.length);
  updateDisplayedPhoto(photoArray[photoNumber]);
}

document.querySelector("input#randomSlideShowButton").onclick = randomSlideShow;

function randomSlideShow() {
  if(!isEmpty()) {
    slideShowInterval = setInterval("randomPhoto()", intervalInMilliseconds);
  }
}

document.querySelector("input#stopSlideShowButton").onclick = stopSlideShow;

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

document.querySelector("input#resetForm").onclick = resetPhoto;

function resetPhoto() {
  photoArray = [];
  photoNumber = 0;
}