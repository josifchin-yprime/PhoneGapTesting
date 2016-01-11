/***********************
File: 			patientController.js
Date: 			04Nov2015
Created: 		J Osifchin
Description: 	control for patient objects
***************************/
var patientController = (function () {
    return {
        login: function (patientId, pin, onSuccess, onFail, onError) {
            function fnLoggedIn(onLoginSuccess, onLoginError) {
                if (typeof onLoginSuccess == 'function') {
                    onLoginSuccess();
                }
            }

            if (patientId.length > 0 && pin.length > 0) {
                if (serviceController.connected()) {
                    this.loginAPI(patientId, pin, function () { fnLoggedIn(onSuccess, onError); }, onFail, onError);
                } else {
                    this.loginDB(patientId, pin, function () { fnLoggedIn(onSuccess, onError); }, onFail, onError);
                }
            } else {
                if (typeof onFail == 'function') {
                    onFail();
                }
                this.failedLoginHandler(xhr, status, error);
            }
        },
        loginAPI: function (patientId, pin, onSuccess, onFail, onError) {
            function onAPISuccess(e) {
                function setupReminders(onSuccess, onError) {
                    if (e.reminders != null && e.reminder.length > 0) {
                        //TODO: process the reminders in reminderController
                    }
                    if (typeof onSuccess == 'function') {
                        onSuccess();
                    }
                }


                //check the pin against the sent pin
                //login in the user
                //check against the db
                currentPatientObject = new Patient({
                    Id: e.Id,
                    EnrolledId: e.EnrolledId,
                    PatientNumber: e.EnrolledId, //TODO: this may not be correct!!!
                    Pin: e.Pin,
                    IsTempPin: e.IsTempPin,
                    PatientStatusTypeId: e.PatientStatusTypeId,
                    SecurityAnswer: e.SecurityAnswer,
                    LoginAttempts: e.LoginAttempts,
                    EnrolledDate: e.EnrolledDate,
                    IsTrainingComplete: e.IsTrainingComplete
                });
                currentSubjectNumber = patientId;

                currentPatientObject.insertUpdate(null, function () { setupReminders(onSuccess, onError); }, onError);
            };
            function onAPIFail(e) {
                patientController.failedLoginHandler();
                if (typeof onFail == 'function') {
                    onFail();
                }
            };

            serviceCalls.getPatientFromAPI(patientId, pin, onAPISuccess, onAPIFail);
        },
        loginDB: function (patientId, pin, onSuccess, onFail, onError) {
            //login against the patients table
            //var sql = 'SELECT * FROM patients WHERE Patient=? AND PIN=?';
            var sql = 'SELECT * FROM Patient WHERE PatientNumber=?';
            var pars = [patientId];//, pin];
            function callback(tx, results) {
                if ((results.length > 0 && (results[0]['Pin'] + '') == patientController.encryptMD5(pin)) || (results.length == 1 && results[0]['Pin'] == '1234')) {
                    //add the object
                    currentPatientObject = new Patient(results[0]);
                    currentSubjectNumber = patientId;
                    if (typeof onSuccess == 'function') {
                        onSuccess();
                    }
                } else {
                    if (typeof onFail == 'function') {
                        //update the login attempts
                        onFail();
                    } else {
                        patientController.failedLoginHandler();
                    }
                }
            };

            dbController.executeSql(sql, pars, callback, onError);

        },
        logout: function (onSuccess) {
            currentPatientObject = {};
            if (typeof onSuccess == 'function') {
                onSuccess();
            }
        },
        validPin: function (val) {
            return val.length >= 4;
        },
        validChangePIN: function (oldPIN, newPIN, confirmPIN) {
            //note this returns a message, if blank then valid
            //TODO: add extra logic
            var message = '';
            //if (oldPIN != this.PIN) {
            //    message += 'Invalid Old PIN.';
            //}

            if (newPIN != confirmPIN) {
                message += (message.length > 0 ? '<br/>' : '') + translationController.get('keyNewPINDoesNotMatchConfirmPIN');
            }

            return message;
        },
        getCurrentPatientIsTempPin: function () {
            return currentPatientObject.IsTempPin == true || currentPatientObject.IsTempPin == 'true';
        },
        checkForTemporaryPin: function (onSuccess, onError) {
            if (patientController.getCurrentPatientIsTempPin()) {
                //reset the pin
                screenController.changeScreen('EnterNewPIN', '');
            } else {
                if (typeof onSuccess == 'function') {
                    onSuccess();
                }
                //patientController.checkForReminderSetup(onSuccess, onError);
            }
        },
        checkForReminderSetup: function (onSuccess, onError) {
            var fn = function (cnt) {
                if (cnt == 0) {
                    var screenName = 'SelectReminderType';
                    var title = '';

                    screenController.changeScreen(screenName, title);
                } else {
                    if (typeof onSuccess == 'function') {
                        onSuccess();
                    }
                }
            };

            reminderController.getReminderCount(currentPatientObject.PatientNumber, fn, null);
        },
        checkForTrainingCompleted: function (onSuccess, onError) {
            if (!currentPatientObject.IsTrainingComplete) {
                function completeTrainingQuestionnaire(callback) {
                    //check for training
                    currentPatientObject.completeTraining(callback);
                }

                questionController.startQuestionnaire('Training', null, false, completeTrainingQuestionnaire);
            } else {
                if (typeof onSuccess == 'function') {
                    onSuccess();
                }
            }
        },
        failedLoginHandler: function (xhr, status, error) {
            app.alert(translationController.get('keyInvalidLogin'));
        },
        showInvalidPinMessage: function () {
            app.alert(translationController.get('keyInvalidPinMessage'));
        },
        validSecurityAnswer: function (securityAnswer, onSuccess, onFail, onError) {
            //call the service and get the pin
            var sql = 'SELECT * FROM Patient WHERE SecurityAnswer = ?';
            var pars = [patientController.encryptMD5(securityAnswer)];

            function securityAnswerCallback(tx, rows) {
                //should this be -== 1 ?? todo:
                if (rows.length > 0) {
                    currentPatientObject = new Patient(rows[0]);

                    if (typeof onSuccess == 'function') {
                        onSuccess();
                    }
                } else {
                    if (typeof onFail == 'function') {
                        onFail();
                    }
                }
            }

            dbController.executeSql(
                sql,
                pars,
                securityAnswerCallback);

        },
        transmitPatientInformation: function (onSuccess, onError) {
            var sql = "SELECT * FROM Patient WHERE [Transmitted] = 'false'";
            var pars = [];

            //check connectivity
            if (!serviceController.connected()) {
                if (typeof onSuccess == 'function') {
                    //TODO: double check that this is how it should be handled
                    onSuccess();
                }
            }

            function fnProcess(tx, rows) {
                if (rows.length > 0) {
                    var patients = [];
                    var patient;
                    var row;

                    for (var i = 0; i < rows.length; i++) {
                        row = rows[i];
                        patient = {
                            Id: row['Id'],
                            EnrolledId: row['PatientNumber'],
                            Pin: row['Pin'],
                            IsTempPin: row['IsTempPin'],
                            SecurityQuestion: row['SecurityQuestion'],
                            SecurityAnswer: row['SecurityAnswer'],
                            LoginAttempts: row['LoginAttempts'],
                            IsTrainingComplete: row['IsTrainingComplete'],
                            EnrolledDate: serviceController.serializeDate(row['EnrolledDate'])
                        };
                    }
                    //get the last one
                    patients.push(patient);
                    //displayObject(patients);
                    function fn(patients, onSuccess, onError) {
                        if (patients.length > 0) {
                            var patient = patients.pop();
                            serviceCalls.transmitPatient(
                                patient,
                                function () {
                                    patientController.setPatientAsTransmitted(patient.Id, function () { fn(patients, onSuccess, onError); }
                                );
                                },
                                onError);
                            //TODO: this may need to be more resilient and continue the transmit attempts after initial fail.
                        } else {
                            if (typeof onSuccess == 'function') {
                                onSuccess();
                            }
                        }
                    };
                    //send the entries
                    fn(patients, onSuccess, onError);
                } else {

                    if (typeof onSuccess == 'function') {
                        onSuccess();
                    }
                }
            };

            dbController.executeSql(sql, pars, fnProcess);
        },
        setPatientAsTransmitted: function (id, onSuccess, onError) {
            var sql = 'UPDATE Patient SET Transmitted=? WHERE Id=?';
            var pars = ['true', id];

            dbController.executeSql(sql, pars, onSuccess, onError);
        },
        encryptMD5: function (val) {
            return (CryptoJS.MD5(val) + '').toUpperCase()
            //return CryptoJS.MD5(val);
        }

    };
})();
