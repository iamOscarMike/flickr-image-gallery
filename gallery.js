//set API_KEY and declare PHOTOSET_ID and AmountOfPhotos (public accessible variables)
var API_KEY = "c1c6da1a7bab71f17f3cd599842cbc7f";
var PHOTOSET_ID = "72157630788621682";
var AmountOfPhotos = 0;

$(document).ready(function(){

	// If isset, set PHOTOSET_ID to the passed hash variable
	if(window.location.hash){
		var hash_value= window.location.hash.replace("#", "");
		PHOTOSET_ID = hash_value;
	}

	GetPhotosetInformation();
	GetPhotosInformation();

	// Handle next and previous button
	$("#navbutton-previous").click(function(){

		var currentMarginLeft = parseInt($("#gallery-photos").css("marginLeft").replace("px", ""));
		// Safety measure to be shure that the user can't go before/beyond the first/last photo
		if(currentMarginLeft%-905 != 0) return;
		if(currentMarginLeft != 0){
			animateNavBar((currentMarginLeft+905)/-905);
			$("#gallery-photos").animate({marginLeft:"+=905px"});
		}
	});
	$("#navbutton-next").click(function(){

		var currentMarginLeft = parseInt($("#gallery-photos").css("marginLeft").replace("px", ""));
		if(currentMarginLeft%-905 != 0) return;
		if(currentMarginLeft != ((AmountOfPhotos-1)*-905)){
			animateNavBar((currentMarginLeft-905)/-905);
			$("#gallery-photos").animate({marginLeft:"-=905px"});
		}
	});
	
});

// Gets the information of the photoset and appends the necessary information to the DOM
function GetPhotosetInformation(){
	$.getJSON("http://api.flickr.com/services/rest/?&method=flickr.photosets.getInfo&api_key="+API_KEY+"&photoset_id="+PHOTOSET_ID+"&format=json&jsoncallback=?", function(rsp){
		AmountOfPhotos = rsp.photoset.count_photos;
		$("#gallery-header").append("<h2><a href='http://www.flickr.com/photos/"+rsp.photoset.owner+"/sets/"+PHOTOSET_ID+"/'>"+rsp.photoset.title._content+" by "+rsp.photoset.username+"</a></h2>");
	});
}

// Starts the chain of getting photo information and appending them to the DOM
// Gets the ids, titles and margins of the photos in the specified photoset
function GetPhotosInformation(){
	var photosData = [];

	$.getJSON("http://api.flickr.com/services/rest/?&method=flickr.photosets.getPhotos&api_key="+API_KEY+"&photoset_id="+PHOTOSET_ID+"&format=json&jsoncallback=?", function(rsp){

		$.each(rsp.photoset.photo, function(i, photo){
			var photoData = new Object();
			photoData.id = photo.id;
			photoData.title = photo.title;
			photoData.margin = -905*i;

			photosData[i] = photoData;
		});

		if(photosData.length == rsp.photoset.photo.length){
			$("#gallery-photos").css({width: rsp.photoset.photo.length*905});
			$("#gallery-thumbnails").css({width: rsp.photoset.photo.length*75});
			// When all the data is set, pass them to the next phase
			GetPhotosElement(photosData);
		}

	});
}

// Second phase in the chain
// Completing the data for each photo with the photo's urls, width, height and top margin.
function GetPhotosElement(oldPhotosData){

	var photosData = [];

	$.each(oldPhotosData, function(i, photo){
		
		var photoData = new Object();
		photoData.id = oldPhotosData[i].id;
		photoData.title = oldPhotosData[i].title;
		photoData.margin = oldPhotosData[i].margin;

		$.getJSON("http://api.flickr.com/services/rest/?&method=flickr.photos.getSizes&api_key="+API_KEY+"&photo_id="+photoData.id+"&format=json&jsoncallback=?", function(rsp){
			
			var ratio;

			$.each(rsp.sizes.size, function(i, size){
			
				if(size.label == "Square") photoData.thumbnailUrl = size.source;
				if(size.label == "Large"){ 
					photoData.largeUrl = size.source;
					
					if(size.width >= 1024) {
						ratio = 905/size.width;
						photoData.width = size.width*ratio;
						photoData.height = size.height*ratio;

					} else {
						ratio = 607/size.height;
						photoData.width = size.width*ratio;
						photoData.height = size.height*ratio;
					}

					if(size.height < 607)
						photoData.marginTop = 303 - (size.height/2);
					else
						photoData.marginTop = 0;
				} 
			});

		});
		
		photosData[i] = photoData;
			
	});

	// Make shure all the data isset before appending the photos in phase 3.
	var interval = window.setInterval(
	function(){
		
		if(photosData.length == oldPhotosData.length){
			
			if(	typeof photosData[photosData.length-1].id == 'undefined' || 
				typeof photosData[photosData.length-1].title == 'undefined' || 
				typeof photosData[photosData.length-1].margin == 'undefined' || 
				typeof photosData[photosData.length-1].thumbnailUrl == 'undefined' || 
				typeof photosData[photosData.length-1].largeUrl == 'undefined' ||
				typeof photosData[photosData.length-1].width == 'undefined' || 
				typeof photosData[photosData.length-1].height == 'undefined' ||
				typeof photosData[photosData.length-1].marginTop == 'undefined' ){
			}
			else{
				AppendPhotos(photosData);
				window.clearInterval(interval);
			}
		}
	}, 0);
}

// third phase
// All the data is collected and the photos will be appended to the DOM
function AppendPhotos(photosData){
	
	for(var i=0; i<photosData.length;i++){

		(function(j){
			$('#gallery-photos').append("<div class='photo-container'><img class='photo' src='"+photosData[i].largeUrl+"' alt='"+photosData[i].title+" width='"+photosData[i].width+"' height='"+photosData[i].height+"' style='margin-top:"+photosData[i].marginTop+"px;' ></div>");
			$('#gallery-thumbnails').append("<img id='photo-"+i+"' class='thumbnail' src='"+photosData[i].thumbnailUrl+"' alt='"+photosData[i].title+" thumbnail'>" );
			
			// Add an click handler to the appended thumbnails
			$("#photo-"+j+"").click(function(){
				animateGallery(j, photosData[j].margin);
				
			});
		})(i);
	}

	// Animate gallery for the first photo so it's highlighted at the start.
	animateGallery(0, photosData[0]);
}

// Animate the container with the photos to the right margin
function animateGallery(i, margin){
	$("#gallery-photos").animate({marginLeft:margin});
	animateNavBar(i);
}

// Animate the navigation bar with the thumbnails to the right margin
function animateNavBar(i){
	$(".thumbnail").css({"box-sizing":"border-box", "-moz-box-sizing":"border-box", "-webkit-box-sizing":"border-box", "width":"75px", "height":"75px", "border":"5px solid white", "filter": "url(filters.svg#grayscale)", "filter":"gray", "-webkit-filter": "grayscale(1)"});
	$("#photo-"+i).css({"border": "none", "filter":"none", "-webkit-filter": "grayscale(0)"});
	var margin = (i*-75)+415;
	if(margin > 0) margin = 0;
	if(margin < ((AmountOfPhotos)*-75)+905) margin = ((AmountOfPhotos)*-75)+905;
	$("#gallery-thumbnails").animate({marginLeft:margin});
}