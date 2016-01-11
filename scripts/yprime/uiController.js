/***********************
File: 			uiController.js
Date: 			10Nov2015
Created: 		J Osifchin
Description: 	control to handle UI html object creation
***************************/
var uiController = (function () {
    return {
        createControl: function (type, options) {
            var ctrl = document.createElement(type);
            for (var p in options) {
                ctrl.setAttribute(p, options[p]);
            }
            return ctrl;
        },
        createInputControl: function (id, options) {
            var input = this.createControl('input', options);// document.createElement('input');
            input.setAttribute('id', id);

            for (var p in options) {
                input.setAttribute(p, options[p]);
            }

            return input;
        },
        encodeHTML: function (str) {
            var html = str.replace('\n','<br/>');
            return html;
        }
    };
})();


/*


*/