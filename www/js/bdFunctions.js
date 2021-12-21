/****
 *  bdFunctions.js
 *
 *  This contains Javascript methods for usage in the HTML pages of the example app.
 *
 *
 * @author Bluedot Innovation
 * Copyright (c) 2021 Bluedot Innovation. All rights reserved.
 */

 var projectId = "YOUR_PROJECT_ID";
 var destinationId = "";
 var orderId = "";

 const CLAuthorizationStatusEnum =
 {
     notDetermined : 0,
     restricted : 1,
     denied : 2,
     authorizedAlways : 3,
     authorizedWhenInUse: 4,
     properties:
     {
         0: { name: "notDetermined" },
         1: { name: "restricted" },
         2: { name: "denied" },
         3: { name: "authorizedAlways" },
         4: { name: "authorizedWhenInUse" }
     }
 }

 const CLAccuracyAuthorizationEnum =
 {
     fullAccuracy : 0,
     reducedAccuracy : 1,
     properties:
     {
         0: { name: "fullAccuracy" },
         1: { name: "reducedAccuracy" }
     }
 }

 /*
  *  Add text to the status area.
  */
 function updateStatus( statusText )
 {
     var textAreaId = document.getElementById( 'statusText' );
     let timestamp = new Intl.DateTimeFormat('en',
                                             {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric',
                                                second: 'numeric',
                                                hourCycle: 'h23'
                                             }
                                            ).format(new Date())

     textAreaId.value += timestamp + ": " +  statusText + "\n";
     textAreaId.scrollTop = textAreaId.scrollHeight
 }

 function initializationSuccessfulCallback()
 {
     updateStatus( "Initialization Successful" );
     if (device.platform === "iOS") {
         // Request Location Always Authorization
         cordova.plugins.diagnostic.requestLocationAuthorization(
             function(status)
             {
                 updateStatus("Location Permission Status: " + status);
             }, null, cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);
     } else {
       cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
           switch(status){
               case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
                   updateStatus("Permission not requested");
                   break;
               case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                   updateStatus("Permission denied");
                   break;
               case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                   updateStatus("Permission granted always");
                   break;
               case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
                   updateStatus("Permission granted only when in use");
                   break;
           }
       }, function(error){
           updateStatus(error);
       }, cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);
     }
 }

 function installRefCallback( installRef )
 {
     updateStatus("InstallRef: " + installRef);
 }

 function sdkVersionCallback( sdkVersion )
 {
     updateStatus("Bluedot SDK Version: " + sdkVersion);
 }

 /*
  *  Initialize Bluedot Point SDK
  */
 function doInitialize()
 {
     updateStatus( "Initializing with Bluedot SDK..." );
     projectId = document.getElementById( "projectId" ).value;

     // Display the installRef, SDK Version
     io.bluedot.cordova.plugin.getInstallRef(installRefCallback);
     io.bluedot.cordova.plugin.getSdkVersion(sdkVersionCallback);

     //  Add the BluedotServiceDelegate functions for receiving data
     io.bluedot.cordova.plugin.bluedotServiceDidReceiveErrorCallback( bluedotServiceReceivedError );
     io.bluedot.cordova.plugin.locationAuthorizationDidChangeCallback( locationAuthorizationChanged );
     io.bluedot.cordova.plugin.accuracyAuthorizationDidChangeCallback( accuracyAuthorizationChanged );
     io.bluedot.cordova.plugin.lowPowerModeDidChangeCallback( lowPowerModeChanged );

     //  Add the GeoTriggeringEventDelegate functions for receiving data
     io.bluedot.cordova.plugin.zoneInfoUpdateCallback( zoneUpdate );
     io.bluedot.cordova.plugin.enteredZoneCallback( zoneEntered );
     io.bluedot.cordova.plugin.exitedZoneCallback( zoneExited );

     //  Add the TempTrackingDelegate functions for receiving data
     io.bluedot.cordova.plugin.tempoStoppedWithErrorCallback(
         function (error) { updateStatus("Tempo stopped with error: " + error) }
     );
     io.bluedot.cordova.plugin.tempoTrackingExpiredCallback( tempoTrackingExpired );

     // Initialize SDK
     io.bluedot.cordova.plugin.initializeWithProjectId(
         initializationSuccessfulCallback,
         function (error) { updateStatus("Initialization Failed with error: " + error)},
         projectId);
 }

 function doIsInitialized()
 {
     io.bluedot.cordova.plugin.isInitialized(
         function (isInitialized) { updateStatus("Is SDK Initialized: " + isInitialized) }
      );
 }

 function doReset()
 {
     io.bluedot.cordova.plugin.reset(
         function () { updateStatus("Reset Successful") },
         function (error) { updateStatus("Reset Failed with error: " + error)}
     );
 }


 function bluedotServiceReceivedError(error)
 {
     updateStatus(error);
 }

 function locationAuthorizationChanged(previousStatus, newStatus)
 {
     updateStatus("Location Authorization Status: " + CLAuthorizationStatusEnum.properties[ newStatus ].name);
 }

 function accuracyAuthorizationChanged(previousStatus, newStatus)
 {
     updateStatus("Accuracy Authorization Status: " + CLAccuracyAuthorizationEnum.properties[ newStatus ].name);
 }

 function lowPowerModeChanged(isLowPowerMode)
 {
     updateStatus("Low Power Mode changed to " + isLowPowerMode);
 }
 function doStartBGGeoTriggering(){
 if (device.platform === "Android") {
    console.log("Starting Android GeoTriggering...");
    io.bluedot.cordova.plugin.androidStartGeoTriggering(
                function () { updateStatus("Start BG Geotriggering Successful") },
                function (error) { updateStatus("Start BG Geotriggering Failed with error: " + error) },
                '',
                '',
                '',
                '',
                -1
            );
    } else {
      updateStatus("BG feature only supported for Android devices");
    }
 }

 function doStartGeoTriggering()
 {
    updateStatus("Starting GeoTriggering");

    if (device.platform === "iOS") {
        updateStatus("Starting iOS GeoTriggering...");
        io.bluedot.cordova.plugin.iOSStartGeoTriggering(
            function () { updateStatus("Start Geotriggering Successful") },
            function (error) { updateStatus("Start Geotriggering Failed with error: " + error) }
        );
    } else if (device.platform === "Android") {
        console.log("Starting Android GeoTriggering...");

        const androidNotificationParams = {
            channelId: "Bluedot Cordova",
            channelName: "Bluedot Cordova",
            title: "Bluedot Foreground Service - Geo-triggering",
            content:
              "This app is running a foreground service using location services",
            notificationId: 123,
          };

          io.bluedot.cordova.plugin.androidStartGeoTriggering(
            function () { updateStatus("Start Geotriggering Successful") },
            function (error) { updateStatus("Start Geotriggering Failed with error: " + error) },
            androidNotificationParams.channelId,
            androidNotificationParams.channelName,
            androidNotificationParams.title,
            androidNotificationParams.content,
            androidNotificationParams.notificationId
        );
    }
 }

 function zoneUpdate( zoneInfos )
 {
     updateStatus( "Zones info has been updated for " + zoneInfos.length + " zones" );
     updateStatus( JSON.stringify(zoneInfos) );
 }

 function zoneEntered( fenceInfo, zoneInfo, locationInfo, willCheckOut, customData )
 {
     updateStatus( fenceInfo["name"] + " has been triggered in " + zoneInfo["name"] + " at " + locationInfo["latitude"] + ":" + locationInfo["longitude"] );

     if(customData)
     {
        updateStatus( JSON.stringify(customData) );
     }

     if ( willCheckOut == true )
     {
         updateStatus( "Zone is awaiting check-out" );
     }
 }

 function zoneExited( fenceInfo, zoneInfo, date, dwellTime, customData )
 {
     updateStatus( fenceInfo["name"] + " has been left in " + zoneInfo["name"] + " after " + dwellTime + " minutes" );

     if(customData)
     {
        updateStatus( JSON.stringify(customData) );
     }
 }

 function doStopGeoTriggering()
 {
     updateStatus("Stopping GeoTriggering...");
     io.bluedot.cordova.plugin.stopGeoTriggering(
         function () { updateStatus("Stop Geotriggering Successful") },
         function (error) { updateStatus("Stop Geotriggering Failed with error: " + error) }
     );
 }

 function doIsGeoTriggeringRunning()
 {
     io.bluedot.cordova.plugin.isGeoTriggeringRunning(
         function (isRunning) { updateStatus("Is Geo Triggering Running: " + isRunning) }
     );
 }

 function doGetZones()
 {
     io.bluedot.cordova.plugin.getZones( zonesCallback );
 }

 function zonesCallback(zoneInfos)
 {
     updateStatus( "Current zones count: " + zoneInfos.length + " zones" );
     console.log(JSON.stringify(zoneInfos));
 }

 function doStartTempoTracking()
 {
     updateStatus("Starting Tempo...");

     destinationId = document.getElementById( "destinationId" ).value;
     orderId = document.getElementById( "orderId" ).value;

     // Setting the Custom Event Metadata
     if(orderId)
     {
        io.bluedot.cordova.plugin.setCustomEventMetaData( { "hs_OrderId": orderId } )
        updateStatus( "Set CustomEventMetadata { \"hs_OrderId\": \"" + orderId + "\" }" );
     }

     if (device.platform === "iOS") {
        io.bluedot.cordova.plugin.iOSStartTempoTracking(
            function () { updateStatus("Start Tempo Successful") },
            function (error) { updateStatus("Start Tempo Failed: " + error) },
            destinationId);
     } else if (device.platform === "Android") {
        const androidNotificationParams = {
            channelId: 'Bluedot Cordova',
            channelName: 'Bluedot Cordova',
            title: 'Bluedot Foreground Service - Tempo',
            content: "This app is running a foreground service using location services",
            notificationId: -1
        }

        io.bluedot.cordova.plugin.androidStartTempoTracking(
            function () { updateStatus("Start Tempo Successful") },
            function (error) { updateStatus("Start Tempo Failed: " + error) },
            destinationId,
            androidNotificationParams.channelId,
            androidNotificationParams.channelName,
            androidNotificationParams.title,
            androidNotificationParams.content,
            androidNotificationParams.notificationId
        );
    }
 }

 function doStopTempoTracking()
 {
     updateStatus("Stopping Tempo...");
     io.bluedot.cordova.plugin.stopTempoTracking(
         function () { updateStatus("Stop Tempo Successful") },
         function (error) { updateStatus("Stop Tempo Failed: " + error) }
     );
 }


 function doIsTempoRunning()
 {
     io.bluedot.cordova.plugin.isTempoRunning(
     function (isRunning) { updateStatus("Is Tempo Running: " + isRunning) }
     );
 }

 function tempoTrackingExpired()
 {
     updateStatus("Tempo Tracking Expired");
 }
 
 /*
  *  Setup the click processing for demonstration of Bluedot Point SDK
  */
 document.addEventListener( 'DOMContentLoaded', function()
 {
     document.getElementById( "initializeButton" ).addEventListener( "click", doInitialize );
     document.getElementById( "resetButton" ).addEventListener( "click", doReset );
     document.getElementById( "isInitializedButton" ).addEventListener( "click", doIsInitialized );
     document.getElementById( "startGeoTriggeringButton" ).addEventListener( "click", doStartGeoTriggering );
     document.getElementById( "startBGGeoTriggeringButton" ).addEventListener( "click", doStartBGGeoTriggering );
     document.getElementById( "stopGeoTriggeringButton" ).addEventListener( "click", doStopGeoTriggering  );
     document.getElementById( "isGeoTriggeringRunningButton" ).addEventListener( "click", doIsGeoTriggeringRunning );
     document.getElementById( "getZonesButton" ).addEventListener( "click", doGetZones );
     document.getElementById( "startTempoTrackingButton" ).addEventListener( "click", doStartTempoTracking );
     document.getElementById( "stopTempoTrackingButton" ).addEventListener( "click", doStopTempoTracking );
     document.getElementById( "isTempoRunningButton" ).addEventListener( "click", doIsTempoRunning );
 });
 
