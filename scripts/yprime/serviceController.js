/***********************
File: 			serviceController.js
Date: 			29Oct2015
Created: 		J Osifchin
Description: 	control to handle service posts
***************************/
var SERVER_URL = 'http://dev-opcservices.eclinicalcloud.net/';
if (DEBUGMODE) {
    SERVER_URL = 'http://localhost:59388/'; //THIS IS FOR DEBUG
}


var serviceController = (function () {
    return {
        init: function () {
            $.ajaxSetup({
                cache: false,
                crossDomain: true,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                async: false
            });

            $.support.cors = true;

            app.writeLog('Initialized Service Controller...');
        },
        ajaxGet: function (url, onSuccess, onError) {
            this.networkStart();
            $.ajax({
                type: 'GET',
                url: url,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', serviceController.getAuthHeader());
                },
                success: function (e) {
                    serviceController.ajaxSuccess(e, onSuccess);
                },
                error: function (xhr, status, error) {
                    //alert(JSON.stringify(xhr));
                    serviceController.ajaxError(xhr, status, error, onError);
                }
            })
        },
        authHeaderKey: "authHeader",
        setAuthHeader: function (userid, password) {
            var auth = "Basic " + Base64.encode(userid + ":" + password);
            app.setSetting(this.authHeaderKey, auth);
        },
        getAuthHeader: function () {
            //return app.getSetting(this.authHeaderKey);
            var userid = '9999';
            var password = '1234';
            return app.getSetting(this.authHeaderKey);
            //return "Basic " + Base64.encode(userid + ":" + password);
        },
        ajaxPost: function (url, data, onSuccess, onError) {
            this.networkStart();
            this.cleanJSONData(data);
            $.ajax({
                type: 'POST',
                url: url,
                //crossDomain: true,
                //contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data),
                //dataType: "json",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', serviceController.getAuthHeader());
                },
                success: function (e) {
                    serviceController.ajaxSuccess(e, onSuccess);
                },
                error: function (xhr, status, error) {
                    serviceController.ajaxError(xhr, status, error, onError);
                }//,
                //async: false,
                //cache: false
            });
        },
        ajaxSuccess: function (e, onSuccess) {
            serviceController.networkStop();
            if (typeof onSuccess == "function") {
                onSuccess(e);
            }
        },
        ajaxError: function (xhr, status, error, onError) {
            serviceController.networkStop();
            // app.alert(xhr + status + error);
            if (typeof onError == "function") {
                onError(xhr, status, error);
            } else {
                window.onerror(xhr, status, error);
            }
        },
        serializeDate: function (val) {
            // format is:  /Date(1267695086938+0100)/
            //return moment(val).format();
            // return moment().format();
            return val;
            //return '/Date(' + val + ')/';
        },
        cleanJSONData: function (data) {
            //clean any possible nulls
            for (var p in data) {
                if (data[p] == 'null') {
                    data[p] = null;
                }
            }
        },
        connected: function () {
            return pgConnectCheck();
        },
        networkStart: function () {
            'use strict';
            if (desktopMode === false && typeof navigator.notification != "undefined") {
                navigator.notification.activityStart(translationController.get('keyLoading'), translationController.get('keyPleaseWait'));
            } else {
                return;
            }
        },
        networkStop: function () {
            'use strict';
            if (desktopMode === false && typeof navigator.notification != "undefined") {
                navigator.notification.activityStop();
            } else {
                return;
            }
        }
    };
})();

var serviceCalls = (function () {
    return {
        baseServiceCall: function (url, requestType, data, onSuccess, onFail) {
            function ajaxSuccess(e) {
                if (typeof onSuccess == 'function') {
                    onSuccess(e);
                }
            };
            function ajaxFail(e) {
                if (typeof onFail == 'function') {
                    onFail(e);
                }
            };


            if (requestType.toLowerCase() == 'get') {
                serviceController.ajaxGet(url, ajaxSuccess, ajaxFail);
            } else {
                //displayObject(data);
                serviceController.ajaxPost(url, data, ajaxSuccess, ajaxFail);
            }
        },
        getPatientFromAPI: function (patientId, pin, onSuccess, onFail) {
            var url = SERVER_URL + 'api/patient/login';
            serviceController.setAuthHeader(patientId, pin);
            this.baseServiceCall(url, 'GET', null, onSuccess, onFail);

            //patientId =  '10001001';
            //var pin = '1234';//'81DC9BDB52D04DC20036DBD8313ED055';
        },
        getQuestions: function (onSuccess, onFail) {
            //serviceController.setAuthHeader('9999', '1234');
            // alert(serviceController.getAuthHeader());
            var url = SERVER_URL + 'api/Diary/GetQuestions';
            this.baseServiceCall(url, 'GET', null, onSuccess, onFail);
        },
        getTranslations: function (onSuccess, onFail) {
            var url = SERVER_URL + 'api/Translations';
            this.baseServiceCall(url, 'GET', null, onSuccess, onFail);
        },
        transmitEntry: function (entryObject, onSuccess, onFail) {
            var url = SERVER_URL + 'api/Diary';
            this.baseServiceCall(url, 'POST', entryObject, onSuccess, onFail);
        },
        transmitPatient: function (patientObject, onSuccess, onFail) {
            var url = SERVER_URL + 'api/patient/ResetPin';
            this.baseServiceCall(url, 'POST', patientObject, onSuccess, onFail);
        },
        transmitReminder: function (reminders, onSuccess, onFail) {
            var url = SERVER_URL + 'api/patient/PostReminder';
            this.baseServiceCall(url, 'POST', reminders, onSuccess, onFail);
        }
    };
})();


//function ajaxCall(url, callback, error) {
//    var xhr;

//    if (typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
//    else {
//        var versions = ["MSXML2.XmlHttp.5.0",
//                        "MSXML2.XmlHttp.4.0",
//                        "MSXML2.XmlHttp.3.0",
//                        "MSXML2.XmlHttp.2.0",
//                        "Microsoft.XmlHttp"]

//        for (var i = 0, len = versions.length; i < len; i++) {
//            try {
//                xhr = new ActiveXObject(versions[i]);
//                break;
//            }
//            catch (e) { }
//        } // end for
//    }

//    xhr.onreadystatechange = ensureReadiness;

//    function ensureReadiness() {
//        if (xhr.readyState < 4) {
//            return;
//        }

//        if (xhr.status !== 200) {
//            return;
//        }

//        // all is well  
//        if (xhr.readyState === 4) {
//            callback(xhr);
//        }
//    }


//    xhr.open('GET', url, true);
//    xhr.withCredentials = true;
//    xhr.setRequestHeader('Origin', 'http://localhost');
//    xhr.setRequestHeader('Authorization', 'Basic MTAwMDEwMDE6MTIzNA==');
//    //xhr.setRequestHeader('Access-Control-Allow-Origin','*');

//    xhr.send('');
//}