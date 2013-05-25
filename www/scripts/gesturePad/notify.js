var notify = {
	init: function() {
		var pushNotification = window.plugins.pushNotification;
		pushNotification.registerDevice({
			alert: true,
			badge: true,
			sound: false
		}, function(status) {
			//navigator.notification.alert(JSON.stringify(['registerDevice', status]));
			//console.log('registerDevice: ' + status.deviceToken);
			//probably should sent this to the server here...
		});
	},
	clearAllBadges: function() {
		var pushNotification = window.plugins.pushNotification;
		pushNotification.setApplicationIconBadgeNumber(0, function(status) {
			//console.log('setApplicationIconBadgeNumber: ' +  status );
		});
		pushNotification.cancelAllLocalNotifications(function() {
			//console.log('cancelAllLocalNotifications');
		});
	}
};