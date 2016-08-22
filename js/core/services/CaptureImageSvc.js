coreApp.service('CaptureImageSvc', function(GlobalSvc, DaoSvc,$alert, Settings){

	return {
		takePhoto : function(onSuccess, onError){
			var options = { quality : 95,
				destinationType : Camera.DestinationType.DATA_URL,
				sourceType : Camera.PictureSourceType.CAMERA,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 250,
				targetHeight: 250,
				correctOrientation: true
        	};
			try{
				navigator.camera.getPicture(onSuccess, onError, options);
			}catch(e){
            $alert({content:'Warning: Image has been saved locally, please sync later as you appear to be offline', duration: 5, placement: 'top-right', type: 'warning', show: true});
        	}
		},

		savePhoto : function(key, img){
			var data = {};
			//data.ID = key;
			//data.FileData = img;
			data.FormID = key;
			data.ClientID = '';
			data.ImageID = data.FormID;
			data.ImageData = img;
			data.CreatedOn = '';
			data.url = Settings.url + 'Post?method=SGIImages_modify';
			DaoSvc.put(data, 'Unsent', key, console.log('Image Saved to Unsent!'),undefined);
		}

	}

});
